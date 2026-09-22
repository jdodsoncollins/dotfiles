# macOS dotfiles

Terminal configuration for macOS, managed with GNU stow. This tree is the
`macos/` directory of [jdodsoncollins/dotfiles](https://github.com/jdodsoncollins/dotfiles).
Linux/Omarchy configs live in `linux/omarchy/`.

Agent instructions: [`AGENTS.md`](AGENTS.md) and the repo-root [`../AGENTS.md`](../AGENTS.md) (secrets and never-commit list).

## Install

```sh
git clone git@github.com:jdodsoncollins/dotfiles.git ~/Projects/dotfiles
cd ~/Projects/dotfiles/macos
HOMEBREW_CASK_OPTS="--adopt" brew bundle --no-upgrade
./install.sh
```

`brew bundle` installs formulae, casks, Mac App Store apps, and VS Code
extensions. `--adopt` takes ownership of apps already sitting in
`/Applications` instead of downloading a second copy. `install.sh` symlinks
every package into `$HOME`, backing up any real file that would conflict to
`~/.dotfiles-backup/<timestamp>/`. Re-run it after adding a package.

## Layout

One directory per tool. Inside it, files sit at the path they occupy relative to `$HOME`:

```
ghostty/.config/ghostty/config  ->  ~/.config/ghostty/config
herdr/.config/herdr/config.toml ->  ~/.config/herdr/config.toml
tmux/.tmux.conf                 ->  ~/.tmux.conf
zsh/.zshrc                      ->  ~/.zshrc
git/.gitconfig                  ->  ~/.gitconfig
vscode/Library/Application Support/Code/User/settings.json
                                ->  ~/Library/Application Support/Code/User/settings.json
```

Adding a tool takes three edits: create the directory, add its name to `PACKAGES` in
`install.sh`, and allowlist it in the repo-root `.gitignore` under `macos/`.

## HerdR

The HerdR package holds `config.toml` (tokyo-night theme, agent sidebar rows,
keybinds) and the `last-reply` plugin at `.config/herdr/last-reply/`, stowed to
`~/.config/herdr/last-reply`. Agent rows omit the `machine` token because the
saved `rk2mn2` SSH profile points back to this Mac. Remove that saved profile
if the duplicate machine group is not needed.

### opencode + HerdR: one tab = one session

- Each opencode pane reports its root session to HerdR
  (`herdr integration install opencode`). Tabs reopen with
  `opencode --session <id>` after a Herdr server restart.
- `prefix+shift+o` opens a new tab running a fresh opencode session
  (`last-reply` plugin's `new-opencode-tab` action).
- On every agent status change, the `last-reply` plugin renames the pane's tab
  to the opencode session topic and stamps the `$last_reply` time shown beside
  the topic row. Manual tab renames are overwritten on the next status change;
  a fresh tab stays labeled `OpenCode` until its first prompt sets a topic.
- Quota gauges, model, context, and per-vendor icons come from the third-party
  `herdr-agent-usage` plugin, which is not vendored here:

  ```sh
  git clone https://github.com/levi-qiao/herdr-agent-usage.git ~/Projects/herdr-agent-usage
  cd ~/Projects/herdr-agent-usage && ./install.sh --agent opencode,claude,codex,cursor
  ```

- `prefix+shift+r` refreshes quotas, `prefix+shift+q` opens quota settings
  (both bound by `herdr-agent-usage`).

Fresh machine setup after `./install.sh` stows this package:

```sh
herdr integration install opencode claude codex cursor
herdr plugin link ~/.config/herdr/last-reply
```

Caveats: `herdr-agent-usage` regenerates `ui.sidebar.agents.rows` atomically
and replaces the stowed `config.toml` symlink with a real file. After
upgrading or reconfiguring it, re-add the `$last_reply` token to the topic
row, copy `~/.config/herdr/config.toml` over this package's copy, and re-run
`./install.sh` to re-stow. The icon font codepoint map lives in
`~/Library/Application Support/com.mitchellh.ghostty/config.ghostty`
(managed by `herdr-agent-usage`); reload Ghostty after its configure runs.

## Ghostty config path on macOS

Ghostty loads both `~/.config/ghostty/config` and
`~/Library/Application Support/com.mitchellh.ghostty/config`. The Application Support copy
wins where the two disagree, including an empty file. `install.sh` moves a leftover
Application Support `config` aside so the stowed copy is what Ghostty actually reads.

## Homebrew vs standalone

Prefer a Homebrew cask or formula over a website download. This Brewfile lists
casks for apps that were previously standalone on this Mac (`1password`,
`docker-desktop`, `cursor`, `zed`, `herdr`, `xcodes`, and others). After
`brew bundle`, remove the leftover binary in `~/.local/bin` if Homebrew now
ships the same tool.

`docker-desktop`, `google-chrome`, and `purevpn` need a real terminal with
sudo to finish adopting. Do not run `brew install --cask --adopt docker-desktop`
from a non-interactive session: if sudo fails, Homebrew rolls back by deleting
`/Applications/Docker.app`.

## Secrets

`.gitignore` denies everything and re-allows named paths, so `git add -A` cannot commit a
credential from an unlisted file. Nothing here should hold a token: `~/.config/gh/hosts.yml`,
`~/.aws`, `~/.ssh`, `~/.claude.json`, and VS Code `mcp.json` stay out of the repo.
