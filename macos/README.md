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

The HerdR package configures its local UI theme and sidebar layout. It omits the
`machine` token from agent rows because the saved `rk2mn2` SSH profile points back
to this Mac. Remove that saved profile if the duplicate machine group is not needed.

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
