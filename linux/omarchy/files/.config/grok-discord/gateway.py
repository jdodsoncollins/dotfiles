#!/usr/bin/env python3
"""Discord gateway for local `grok` CLI. DMs and #grok (plus its threads)."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from pathlib import Path

import discord

DIR = Path.home() / ".config" / "grok-discord"
ENV_PATH = DIR / "bot.env"
SESSIONS_PATH = DIR / "sessions.json"
LOG_PATH = DIR / "gateway.log"
RULES_PATH = DIR / "rules.md"


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    if not ENV_PATH.exists():
        return out
    for line in ENV_PATH.read_text().splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k] = v.strip()
    return out


_BOOT = load_env()


def _boot_int(*keys: str, default: int) -> int:
    for key in keys:
        raw = _BOOT.get(key) or os.environ.get(key)
        if raw:
            return int(raw)
    return default


GROK_CHANNEL_ID = _boot_int(
    "DISCORD_GROK_CHANNEL_ID", "GROK_CHANNEL_ID", default=1551058582236168213
)
ALLOWED_USER_ID = _boot_int(
    "DISCORD_OWNER_ID", "ALLOWED_USER_ID", default=334167508539932672
)
GROK_BIN = Path.home() / ".local" / "bin" / "grok"
CWD = str(Path.home())
MAX_DISCORD = 1900
# Long agent jobs (installers, browser setup) regularly exceed 15 minutes.
GROK_TIMEOUT = int(os.environ.get("GROK_TIMEOUT", "14400"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_PATH),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("grok-discord")


def load_sessions() -> dict[str, str]:
    if not SESSIONS_PATH.exists():
        return {}
    try:
        return json.loads(SESSIONS_PATH.read_text())
    except json.JSONDecodeError:
        return {}


def save_sessions(data: dict[str, str]) -> None:
    SESSIONS_PATH.write_text(json.dumps(data, indent=2) + "\n")
    SESSIONS_PATH.chmod(0o600)


def session_key(message: discord.Message) -> str:
    return session_key_for(message.channel, message.author.id)


def session_key_for(channel: discord.abc.Messageable, author_id: int) -> str:
    if isinstance(channel, discord.DMChannel):
        return f"dm:{author_id}"
    if isinstance(channel, discord.Thread):
        return f"thread:{channel.id}"
    return f"channel:{getattr(channel, 'id', author_id)}"


def allowed_channel(message: discord.Message) -> bool:
    ch = message.channel
    if isinstance(ch, discord.DMChannel):
        return True
    if isinstance(ch, discord.Thread):
        parent = ch.parent_id
        return parent == GROK_CHANNEL_ID
    return getattr(ch, "id", None) == GROK_CHANNEL_ID


def thread_title(content: str) -> str:
    text = re.sub(r"<@!?\d+>", "", content)
    text = " ".join(text.split())
    if not text:
        text = "Grok"
    return text[:90]


def chunk(text: str) -> list[str]:
    text = text.strip() or "(empty reply)"
    parts: list[str] = []
    while text:
        parts.append(text[:MAX_DISCORD])
        text = text[MAX_DISCORD:]
    return parts


def assistant_text(obj: dict) -> str:
    msg = obj.get("message") or {}
    parts = msg.get("content") or []
    texts: list[str] = []
    if isinstance(parts, list):
        for part in parts:
            if isinstance(part, dict) and part.get("type") == "text":
                t = (part.get("text") or "").strip()
                if t:
                    texts.append(t)
    return "\n".join(texts)


async def run_grok(
    prompt: str,
    resume: str | None,
    on_text=None,
) -> tuple[str, str | None]:
    """Stream assistant text as Grok writes it so Discord is not stuck on typing."""
    cmd = [
        str(GROK_BIN),
        "-p",
        prompt,
        "--output-format",
        "streaming-messages-json",
        "--always-approve",
        "--cwd",
        CWD,
        "--no-auto-update",
    ]
    if RULES_PATH.exists():
        cmd.extend(["--rules", RULES_PATH.read_text()])
    if resume:
        cmd.extend(["--resume", resume])
    env = os.environ.copy()
    env.setdefault("HOME", str(Path.home()))
    env.setdefault("GROK_HOME", str(Path.home() / ".grok"))
    path = env.get("PATH", "")
    local = str(Path.home() / ".local" / "bin")
    if local not in path.split(":"):
        env["PATH"] = local + ":" + path

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env,
        cwd=CWD,
    )

    session_id = resume
    posted: list[str] = []
    stderr_chunks: list[bytes] = []

    async def read_stderr() -> None:
        assert proc.stderr is not None
        stderr_chunks.append(await proc.stderr.read())

    async def handle_obj(obj: dict) -> None:
        nonlocal session_id
        kind = obj.get("type")
        if obj.get("session_id"):
            session_id = obj["session_id"]
        if kind == "assistant":
            text = assistant_text(obj)
            if text:
                posted.append(text)
                log.info("streamed assistant text (%s chars)", len(text))
                if on_text:
                    await on_text(text)
        elif kind == "result":
            result = obj.get("result")
            if isinstance(result, str) and result.strip() and not posted:
                posted.append(result.strip())
                if on_text:
                    await on_text(result.strip())

    async def read_stdout() -> None:
        assert proc.stdout is not None
        buf = b""
        while True:
            chunk_b = await proc.stdout.read(4096)
            if not chunk_b:
                break
            buf += chunk_b
            while b"\n" in buf:
                raw, buf = buf.split(b"\n", 1)
                line = raw.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    log.warning("bad grok ndjson: %s", line[:200])
                    continue
                if isinstance(obj, dict):
                    await handle_obj(obj)
        if buf.strip():
            try:
                obj = json.loads(buf)
                if isinstance(obj, dict):
                    await handle_obj(obj)
            except json.JSONDecodeError:
                log.warning("trailing grok stdout: %s", buf[:200])

    try:
        await asyncio.wait_for(
            asyncio.gather(read_stdout(), read_stderr(), proc.wait()),
            timeout=GROK_TIMEOUT,
        )
    except asyncio.TimeoutError:
        proc.kill()
        await proc.communicate()
        mins = max(1, int(GROK_TIMEOUT) // 60)
        return (f"Grok timed out after {mins} minutes.", session_id)

    err = b"".join(stderr_chunks).decode("utf-8", errors="replace").strip()
    if proc.returncode not in (0, None) and not posted:
        log.error("grok failed rc=%s err=%s", proc.returncode, err[-1500:])
        return (f"Grok failed (exit {proc.returncode}).", session_id)
    return ("\n\n".join(posted) or "(empty reply)", session_id)


class Gateway(discord.Client):
    def __init__(self) -> None:
        intents = discord.Intents.default()
        intents.message_content = True
        intents.dm_messages = True
        intents.guild_messages = True
        intents.guilds = True
        super().__init__(intents=intents)
        self.sessions = load_sessions()
        self._locks: dict[str, asyncio.Lock] = {}

    def lock_for(self, key: str) -> asyncio.Lock:
        lock = self._locks.get(key)
        if lock is None:
            lock = asyncio.Lock()
            self._locks[key] = lock
        return lock

    async def on_ready(self) -> None:
        log.info("logged in as %s id=%s", self.user, self.user.id if self.user else None)
        for guild in self.guilds:
            for thread in guild.threads:
                if thread.parent_id == GROK_CHANNEL_ID:
                    await self._join_thread(thread)
        await self._catch_up()

    async def _catch_up(self) -> None:
        """Process the newest unanswered #grok message after a restart."""
        try:
            channel = self.get_channel(GROK_CHANNEL_ID) or await self.fetch_channel(
                GROK_CHANNEL_ID
            )
        except discord.HTTPException as e:
            log.warning("catch-up fetch channel failed: %s", e)
            return
        if not isinstance(channel, discord.TextChannel):
            return

        newest_user: discord.Message | None = None
        newest_bot_ts = None
        try:
            async for m in channel.history(limit=50):
                if m.author.bot and newest_bot_ts is None:
                    newest_bot_ts = m.created_at
                if (
                    not m.author.bot
                    and m.author.id == ALLOWED_USER_ID
                    and newest_user is None
                ):
                    newest_user = m
                if newest_user is not None and newest_bot_ts is not None:
                    break
        except discord.HTTPException as e:
            log.warning("catch-up history failed: %s", e)
            return

        if newest_user is None:
            return
        if getattr(newest_user, "thread", None):
            log.info("catch-up skip %s: already has a thread", newest_user.id)
            return
        if newest_bot_ts is not None and newest_user.created_at <= newest_bot_ts:
            return
        log.info("catch-up handling message %s", newest_user.id)
        await self._handle_message(newest_user)

    async def on_thread_create(self, thread: discord.Thread) -> None:
        if thread.parent_id == GROK_CHANNEL_ID:
            await self._join_thread(thread)

    async def _join_thread(self, thread: discord.Thread) -> None:
        try:
            await thread.join()
            log.info("joined thread %s %s", thread.id, thread.name)
        except discord.HTTPException as e:
            log.warning("thread join %s failed: %s", thread.id, e)

    async def _open_work_thread(self, message: discord.Message) -> discord.abc.Messageable:
        """New work in #grok gets its own thread so the channel stays an inbox."""
        existing = getattr(message, "thread", None)
        if isinstance(existing, discord.Thread):
            await self._join_thread(existing)
            return existing
        try:
            thread = await message.create_thread(
                name=thread_title(message.content or ""),
                auto_archive_duration=1440,
            )
            await self._join_thread(thread)
            log.info("opened work thread %s for message %s", thread.id, message.id)
            return thread
        except discord.HTTPException as e:
            log.warning("create_thread failed for %s: %s", message.id, e)
            return message.channel

    async def _send(self, channel: discord.abc.Messageable, text: str) -> None:
        if isinstance(channel, discord.Thread):
            await self._join_thread(channel)
        try:
            await channel.send(text)
        except discord.Forbidden as e:
            log.error("403 sending to %s: %s", getattr(channel, "id", channel), e)
            raise
        except discord.HTTPException as e:
            log.error("HTTP %s sending to %s: %s", e.status, getattr(channel, "id", channel), e)
            raise

    async def on_message(self, message: discord.Message) -> None:
        await self._handle_message(message)

    async def _handle_message(self, message: discord.Message) -> None:
        if message.author.bot:
            return
        if message.author.id != ALLOWED_USER_ID:
            return
        if not allowed_channel(message):
            return
        content = (message.content or "").strip()
        if not content:
            return

        dest: discord.abc.Messageable = message.channel
        if isinstance(message.channel, discord.Thread):
            await self._join_thread(message.channel)
        elif getattr(message.channel, "id", None) == GROK_CHANNEL_ID:
            dest = await self._open_work_thread(message)

        key = session_key_for(dest, message.author.id)
        async with self.lock_for(key):
            if re.fullmatch(r"/new", content, re.I):
                self.sessions.pop(key, None)
                save_sessions(self.sessions)
                await self._send(dest, "New Grok session for this thread/channel.")
                return

            resume = self.sessions.get(key)
            typing_task = asyncio.create_task(self._keep_typing(dest))
            heartbeat = asyncio.create_task(self._heartbeat(dest))
            streamed = False

            async def on_text(text: str) -> None:
                nonlocal streamed
                streamed = True
                heartbeat.cancel()
                for part in chunk(text):
                    await self._send(dest, part)

            try:
                text, session_id = await run_grok(content, resume, on_text=on_text)
            finally:
                typing_task.cancel()
                heartbeat.cancel()
                for task in (typing_task, heartbeat):
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass

            if session_id:
                self.sessions[key] = session_id
                save_sessions(self.sessions)

            try:
                if not streamed:
                    for part in chunk(text):
                        await self._send(dest, part)
            except discord.Forbidden:
                try:
                    await message.author.send(
                        "I got Discord 403 in that thread (not a member). "
                        "Mention @Grok once in the thread, or start a new thread in #grok."
                    )
                except discord.HTTPException:
                    log.error("could not DM 403 hint")

    async def _keep_typing(self, channel: discord.abc.Messageable) -> None:
        try:
            while True:
                async with channel.typing():
                    await asyncio.sleep(8)
        except asyncio.CancelledError:
            return
        except discord.HTTPException:
            return

    async def _heartbeat(self, channel: discord.abc.Messageable) -> None:
        """If Grok is silent too long, say so instead of leaving only a typing indicator."""
        try:
            await asyncio.sleep(90)
            await self._send(
                channel,
                "Still working. If this is a captcha, login, or 2FA, finish that in the browser — "
                "I'll post here as soon as I need you or when the job finishes.",
            )
            while True:
                await asyncio.sleep(180)
                await self._send(channel, "Still working.")
        except asyncio.CancelledError:
            return
        except discord.HTTPException:
            return


def main() -> None:
    env = load_env()
    token = env.get("DISCORD_BOT_TOKEN")
    if not token:
        raise SystemExit(f"missing DISCORD_BOT_TOKEN in {ENV_PATH}")
    client = Gateway()
    client.run(token, log_handler=None)


if __name__ == "__main__":
    main()
