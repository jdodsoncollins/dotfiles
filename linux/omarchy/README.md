# Omarchy Linux dotfiles

User config for the Omarchy desktop on this Dell AIO (Hyprland 0.56, Omarchy 4).
These are **overrides** in `~/.config/` and `~/.local/bin/`. Packaged Omarchy
under `/usr/share/omarchy/` is never edited.

Agent rules: [`AGENTS.md`](AGENTS.md) and the repo-root [`AGENTS.md`](../../AGENTS.md).

## Apply on a new Omarchy install

```sh
git clone https://github.com/jdodsoncollins/dotfiles.git ~/projects/dotfiles
cd ~/projects/dotfiles/linux/omarchy
./install.sh
```

`install.sh` will:

1. Copy Hyprland overlays, `shell.json`, dock pins, `jeremy.menu`, Bauhaus theme, hooks, and helper scripts
2. Install third-party plugins from [`plugins.txt`](plugins.txt)
3. Enable user systemd units (wayvnc, herdr-server, display-dpms)
4. Set the Bauhaus theme

It does **not** copy secrets. Create `~/.config/wayvnc/config` from
`files/.config/wayvnc/config.example` and put the password only on the machine.

Then: `hyprctl reload` and reopen or restart the shell if the bar looks stale
(`omarchy restart shell`).

## Layout

```
files/.config/hypr/           Hyprland user overlays
files/.config/omarchy/        shell.json, dock pins, jeremy.menu, bauhaus, hooks
files/.config/systemd/user/   wayvnc, herdr-server, display-dpms
files/.config/wayvnc/         config.example only (no live password)
files/.local/bin/             helper scripts
plugins.txt                   third-party plugin git URLs
install.sh                    apply this tree onto $HOME
```

### Hyprland (`~/.config/hypr/`)

| File | What it does |
|------|----------------|
| `hyprland.lua` | Loads Omarchy defaults plus personal files; parks RustDesk on the scratchpad; prepends `~/.local/bin` to PATH |
| `autostart.lua` | Headless display helper, starts wayvnc + Herdr TUI; does not open the RustDesk GUI |
| `bindings.lua` | Alt+drag move/resize; Ctrl+right-click window menu |
| `looknfeel.lua` | Mouse resize on tiled borders (28px grab) |
| `input.lua` | Personal input overrides (mostly stock comments) |
| `window-chrome.lua` | Optional hyprbars titlebar (close / ☰) if the plugin is loaded — do not run `hyprpm` unless asked |

### Bar and dock (`shell.json`, `dock-pinned.json`)

- Status bar (menubar) on **top**
- `rosakodu.dock` sits on the **opposite** edge, so the dock is on the **bottom**
- Left: `jeremy.menu` (apps-grid icon) + workspaces
- Center: indicators, clock, keyboard, weather, stock `omarchy.menu`, updates
- Right: agents, tray, Home Assistant, Herdr, dock settings, omaplug, activity monitor, Tailscale, BT, network, audio, monitors, power, notification center
- Idle lock/screensaver set very high (stay awake; display blanks via `display-dpms` instead)
- Dock pins: Omarchy menu, Chromium, foot, Nautilus, nvim, Herdr, 1Password

`jeremy.menu` is a bar-widget-only clone so the stock Apps menu keeps working.
It is the only plugin whose source is stored here.

### Theme

Bauhaus (`mwaltzer/omarchy-bauhaus-theme`) plus a generated `colors.toml` for
window chrome. `hooks/theme-set.d/window-chrome` reloads Hyprland on theme
change; `omazed` keeps Zed in sync.

### Helper scripts (`~/.local/bin/`)

| Script | Role |
|--------|------|
| `omarchy-wayvnc` | Starts wayvnc on localhost, LAN, and Tailscale (needs a local config) |
| `omarchy-window-menu` | Clickable close / float / pin / maximize menu |
| `omarchy-display-dpms` | Blank the panel after 10 minutes idle; do not suspend |
| `omarchy-ensure-display` | Create a headless Hyprland output if every monitor is gone (RustDesk) |
| `omarchy-show-done` | Click-to-dismiss “Done!” in the floating update terminal |

### systemd user units

- `wayvnc.service` — Screens / Tailscale VNC (`:5900`)
- `herdr-server.service` — Herdr backend
- `display-dpms.service` — idle blanking

### Plugins (installed from git, not vendored)

See `plugins.txt`. `burninc0de.dock` was tried and disabled; do not re-enable
alongside `rosakodu.dock`.

## Machine notes (not in this tree)

Documented so a rebuild is possible; none of this is copied by `install.sh`.

- **SSH:** key-only (`PasswordAuthentication no`). Public keys in
  `~/.ssh/authorized_keys`. Never commit private keys.
- **Tailscale:** MagicDNS `omarchy.tailbaf7e.ts.net`, IP `100.86.54.54`
- **LAN:** `192.168.1.87`
- **Media:** NTFS USB drives `/mnt/media1` and `/mnt/media2`
  (`uid=jeremy,gid=media,umask=002,windows_names,noatime,big_writes,nofail`)
- **Plex:** `plex-media-server` on `:32400`, libraries Movies + TV Shows each
  spanning both drives (do not add the same folders twice)
- **RustDesk:** ID/password live only in `~/.config/rustdesk/`
- **VNC:** Edovia Screens, auth **User (RSA-AES)**, username `jeremy`,
  8-character file password in `~/.config/wayvnc/`
- **Home Assistant:** Docker host-network `:8123`, config in
  `~/.config/homeassistant` — tokens stay in the plugin/keyring

## Secrets

No live passwords, tokens, or private keys. If you need a new secret, put it
on the machine only. See [`AGENTS.md`](AGENTS.md).
