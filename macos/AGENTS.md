# Agent notes

macOS packages for this machine. Clone lives at `~/Projects/dotfiles`; this
directory is `macos/`. Human install steps are in `README.md`.

Secrets and the global never-commit list: [`../AGENTS.md`](../AGENTS.md). Do
not commit tokens, private keys, `.env`, `mcp.json`, `hosts.yml`, or
`session.json`.

## Layout

GNU stow. One directory per tool; files inside it sit at the path they occupy relative to `$HOME`. Current packages: `ghostty`, `tmux`, `zsh`, `git`, `vscode`.

Adding a package takes three edits:

1. Create the directory with the `$HOME`-relative tree
2. Append the name to `PACKAGES` in `install.sh`
3. Allowlist it in the repo-root `.gitignore` (`!macos/` already covers this tree)

Then run `./install.sh`. Do not use `stow --adopt`; the script backs up real files to `~/.dotfiles-backup/<timestamp>/` and skips already-stowed inodes (a directory symlink like `~/.config/ghostty` makes the inner file look like a regular file).

## Gitignore

The root `.gitignore` denies `*` and re-allows named paths. A new file is invisible to `git add -A` until it is listed. After the allowlist, credential shapes are re-denied (`*.pem`, `**/hosts.yml`, `**/.netrc`, `**/mcp.json`, …).

## Secrets

Nothing here holds a token. Stay out of the repo: `~/.ssh`, `~/.aws`, `~/.config/gh/hosts.yml`, `~/.claude.json`, VS Code `mcp.json`, herdr `session.json` / logs.

## Homebrew

Prefer a brew formula or cask over a website download. After installing a brew copy, remove the shadowed binary from `~/.local/bin` (leftovers from this machine are in `~/.local/bin/standalone-backup/`).

- List intentional leaves, casks, and `mas` apps. Do not dump brew dependencies (`qt`, `guile`, `zlib`, …).
- Tailscale is the Mac App Store app, not `tailscale-app`.
- Google Gemini is `google-gemini`, not `gemini` (MacPaw).
- Formula `grok` is an unrelated deprecated regex tool, not xAI Grok.
- `asdf` is installed but unused; nvm is the Node manager.
- Do not restore the old Datadog taps / `pup` Brewfile. That dump was a different machine.

`docker-desktop`, `google-chrome`, and `purevpn` need a real terminal with sudo to adopt. Never `brew install --cask --adopt docker-desktop` from a non-interactive session: if sudo fails, Homebrew deletes `/Applications/Docker.app` on rollback.

## Ghostty

macOS reads `~/.config/ghostty/config` and `~/Library/Application Support/com.mitchellh.ghostty/config`. The Application Support copy wins, including an empty file. `install.sh` moves a leftover non-symlink aside. Ghostty starts `herdr` on the first surface only (`initial-command`); do not also `brew services start herdr`.
