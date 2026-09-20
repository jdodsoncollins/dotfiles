# Omarchy operational notes (2026-09-20)

Proved on this Dell AIO. Keep secrets on the machine (1Password / local env), never in this repo.

Current versions:

- Omarchy `4.0.4-1`
- Hyprland `0.56.2`
- OpenClaw distro package `/usr/bin/openclaw` = `2026.9.4-1`
- OpenClaw from mise Node `~/.local/bin/openclaw` = `2026.9.5`
- `xurl` `1.3.1` in `~/.local/bin`

## Do not edit `/usr/share/omarchy/`

User overlays live in `~/.config/hypr/` and `~/.config/omarchy/`. Package updates overwrite `/usr/share/omarchy/`.

## Hyprland 0.56 Lua

`hyprctl dispatch` is Lua-shorthand. Omarchy helpers use:

```sh
hyprctl dispatch "hl.dsp.focus({ window = \"address:$WINDOW_ADDRESS\" })"
hyprctl dispatch "hl.dsp.window.float({ window = \"address:$WINDOW_ADDRESS\", action = \"toggle\" })"
hyprctl dispatch "hl.dsp.window.fullscreen({ window = \"address:$WINDOW_ADDRESS\", mode = \"maximized\", action = \"toggle\" })"
hyprctl dispatch "hl.dsp.window.close({ window = \"address:$WINDOW_ADDRESS\" })"
```

`o.window({ ... })` has **no** `focus` field (`unknown field 'focus'`). Use `focus_on_activate` / `no_initial_focus`.

`window-chrome.lua` loads hyprbars on start (`hyprpm reload -n && hyprctl reload`) because cold start parses the file before the plugin exists.

### 1Password vs Herdr

Stock Omarchy rule is `o.window("^(1[p|P]assword)$", { no_screen_share = true })`. The live window class is `com.onepassword.OnePassword`, so that rule does **not** match.

Do **not** add `no_screen_share` on the real class if you remote with Herdr / VNC: the capture tile goes black and you cannot click Authorize. CLI prompts are **in-app**, not a hyprbars problem.

## 1Password CLI

Desktop app must be running and unlocked. Integration uses a user D-Bus/socket; do not wrap `op` in tmux.

- `op whoami` fails immediately if unsigned.
- `op vault list` is what triggers the in-app **Authorize CLI** prompt (often 60–120s).
- `notesPlain[file]=/path` is **not** “read this file into notes”. `[file]` is for attachments, so 1Password stores the **path string**. Write note bodies with `op item edit --template item.json` and stdin closed (`</dev/null`).

Setup codes and tokens go in the 1Password note **Omarchy** (vault **Private**, account **my.1password.com**), never git or Discord.

## xurl (X API)

Never commit `~/.xurl`. Never paste client secrets or setup URLs in chat.

X Developer Portal must match what `xurl auth oauth2` sends:

- App type **Confidential / Web App**, not Native/public (`xurl` sends the client secret; missing it is `unauthorized_client` / “Missing valid authorization header”).
- Callback **exactly** `http://127.0.0.1:8080/callback`. `localhost` ≠ `127.0.0.1`. Typos (`callbacck`) fail as “Something went wrong”.
- Enable **Request email from users** (and TOS/privacy URLs). `xurl` always requests `users.email`.
- Local `--app` name is a label; it does not have to match the portal display name.
- After rotating the client secret, update **that** `xurl` app entry (`xurl auth apps update NAME --client-id … --client-secret …`).

Remote: run `xurl auth oauth2 --app <name>` **on the machine** (listens on `127.0.0.1:8080`). Complete **Authorize app** in the machine browser. The agent browser cannot follow `127.0.0.1`.

## OpenClaw

Keep `~/.openclaw/` off this repo.

- Gateway stays `gateway.bind=loopback` (`127.0.0.1:18789`).
- Phone app pairing needs **Tailscale Serve** (tailnet only, not Funnel). `openclaw qr` fails with “Gateway is only bound to loopback” until Serve or `plugins.entries.device-pair.config.publicUrl` exists.
- `openclaw config set gateway.tailscale.mode serve` wants a Gateway restart. Do not restart the Gateway from an agent exec while Discord is using it; `tailscale serve --bg 18789` can proxy immediately (`https://<magicdns>/` → loopback).
- Setup codes are password-equivalent. Mint with `openclaw qr --setup-code-only --no-ascii --public-url https://<magicdns>` into 1Password, never chat.
- iPhone pairs as node `openclaw-ios` (role `node`, `approvedVia: bootstrap`). Operator TUI is a separate device.
- Chat: Discord **#openclaw**. Social posts: Discord Approve / Decline / Edit card, then `xurl` for X. Threads is intended; no official OpenClaw plugin yet (Graph API or signed-in Chromium).
- Prefer `~/.local/bin/openclaw` (2026.9.5) over `/usr/bin/openclaw` (2026.9.4) until the distro package catches up.

## Herdr

Primary remote path for this box. If a window must be clicked from the phone, do not mark it `no_screen_share`.
