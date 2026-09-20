# Agent notes — Omarchy Linux

User config for Omarchy (Arch + Hyprland). Parent rules:
[`../../AGENTS.md`](../../AGENTS.md). Human steps: [`README.md`](README.md).

Edit files under `files/` so they match `$HOME`-relative paths. `install.sh`
copies them onto a machine. Do not edit `/usr/share/omarchy/`.

## Never commit (this tree)

Follow the root deny list. In particular never add:

- `~/.config/wayvnc/config` (live password), `password`, `*.pem`
- `~/.config/rustdesk/*.toml`
- Plex `Preferences.xml` / library DBs
- Home Assistant `.storage/` or tokens
- SSH private keys created for other devices (`~/.ssh/id_ed25519_mac`, etc.)
- Full git checkouts of third-party plugins (`rosakodu.dock`, `hass`, …)
- `shell.json.bak.*`, `*.lua.bak.*`
- Live `autostart.lua` / systemd units if they hardcode `/home/jeremy`. Keep the portable `$HOME` / `%h` copies in this tree.
- `~/.config/grok-discord/bot.env`, `sessions.json`, `gateway.log`, `venv/`
- `~/.openclaw/` (OpenClaw chats, Discord/xAI tokens, browser profile)
- `~/.config/openclaw-discord/bot.env` and one-shot Playwright helpers

`files/.config/wayvnc/config.example` must keep `password=CHANGE_ME`.

Third-party plugins are listed in `plugins.txt` and installed at apply time.
The only plugin whose full source is in git is `jeremy.menu` (user-authored
bar widget). Overlay patches for `rosakodu.dock` (`DockItem.qml`,
`DockPanel.qml`, `components/FolderMenu.qml`) are stored so `install.sh` can
re-apply them after `omarchy plugin add`. Do not vendor the rest of that repo.

Keep helper paths portable: `os.getenv("HOME")` in Lua, `%h` in systemd units.
Do not snapshot live files that hardcode `/home/jeremy`.

## Apply

```sh
cd ~/projects/dotfiles/linux/omarchy
./install.sh
```

After copying Hyprland files, `hyprctl reload` and `hyprctl configerrors`.
Shell layout hot-reloads from `shell.json`.
