# Agent notes

Dotfiles for two machines. Clone lives at `~/projects/dotfiles` on Linux and
`~/Projects/dotfiles` on macOS.

- [`macos/`](macos/) — terminal config for macOS, GNU stow. Details: [`macos/AGENTS.md`](macos/AGENTS.md), [`macos/README.md`](macos/README.md).
- [`linux/omarchy/`](linux/omarchy/) — Omarchy (Arch + Hyprland) user config. Details: [`linux/omarchy/AGENTS.md`](linux/omarchy/AGENTS.md), [`linux/omarchy/README.md`](linux/omarchy/README.md).

Human install steps are in the README next to each tree. Root `README.md` is the map.

## Secrets — never commit

Nothing in this repository may hold a secret. If a file would not be safe on a
public GitHub repo, it does not belong here. Write examples with `CHANGE_ME`,
never live values.

Do not add, stage, or commit:

**Credentials and tokens**
- GitHub tokens (`gho_`, `ghp_`, `github_pat_`), `GH_TOKEN`, `gh auth` keyring dumps, `~/.config/gh/hosts.yml`
- API keys for OpenAI, Anthropic, xAI, Google, Vercel, Tailscale, or any other cloud
- 1Password session/account tokens, `op` config, recovered vault items
- Home Assistant long-lived access tokens, `.storage/`, `secrets.yaml`
- Plex `PlexOnlineToken`, `Preferences.xml`, library databases
- Wi-Fi PSKs, Tailscale auth keys, VPN profiles

**Keys and passwords**
- SSH private keys (`id_*` without `.pub`), `authorized_keys` copies of private material, `known_hosts` is optional but skip it
- GPG private keys, `*.kdbx`, `*.p12`, `*.pfx`
- wayvnc `password` file, live `config` with a real password, `rsa_key.pem`, `tls_key.pem`, `tls_cert.pem`
- RustDesk `RustDesk.toml` / `RustDesk2.toml` (passwords, unlock pin, ID material)
- `.env`, `.env.*`, `.netrc`, `credentials`, `credentials.json`

**Agent / editor auth**
- `~/.claude.json`, Cursor/VS Code `mcp.json` (tokens live there)
- Herdr `session.json` and logs
- Browser cookies, Chromium `Login Data`, libsecret / gnome-keyring dumps

**Machine dumps that often hide secrets**
- `/etc/shadow`, sudoers with passwords, docker config.json auths
- Plex Media Server data under `/var/lib/plex`
- Home Assistant config under `~/.config/homeassistant`
- Timestamped `.bak` copies of any of the above (RustDesk backups, Preferences.xml)

Public SSH keys (`.pub`) and host key *fingerprints* in documentation are fine.
A `config.example` with `password=CHANGE_ME` is fine. A real password is not.

The root `.gitignore` denies `*` and only re-allows named paths, then
re-denies credential filename shapes. A new path is invisible to `git add -A`
until it is allowlisted. Do not weaken that.

## Also never commit

These are not always “secrets” but they still do not belong in this repo:

- Third-party Omarchy plugin checkouts under `~/.config/omarchy/plugins/` (except the user-authored `jeremy.menu`). Install them with `omarchy plugin add` from [`linux/omarchy/plugins.txt`](linux/omarchy/plugins.txt).
- Nested `.git` directories from cloned plugins or themes
- Hyprland / shell `*.bak.*` backups
- Media files from `/mnt/media1` or `/mnt/media2`
- `node_modules/`, build artifacts, editor swap files
- Private repo contents copied out of other clones
- `/etc/fstab` as a live copy (UUIDs and mount options can be *described* in the Omarchy README)

## Layout rules

macOS packages stay under `macos/`. Omarchy files stay under `linux/omarchy/`.
Do not flatten the repo back into a single macOS-only tree.

When adding a file: put it in the correct OS directory, allowlist it in
`.gitignore` if needed, and keep secrets out.
