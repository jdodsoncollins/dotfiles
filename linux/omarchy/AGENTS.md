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

`files/.config/wayvnc/config.example` must keep `password=CHANGE_ME`.

Third-party plugins are listed in `plugins.txt` and installed at apply time.
The only plugin source in git is `jeremy.menu` (user-authored bar widget).

## Apply

```sh
cd ~/projects/dotfiles/linux/omarchy
./install.sh
```

After copying Hyprland files, `hyprctl reload` and `hyprctl configerrors`.
Shell layout hot-reloads from `shell.json`.
