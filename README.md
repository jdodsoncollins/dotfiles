# dotfiles

Terminal configuration for macOS, managed with GNU stow.

## Install

```sh
git clone git@github.com:jdodsoncollins/dotfiles.git ~/Projects/dotfiles
cd ~/Projects/dotfiles
brew bundle
./install.sh
```

`install.sh` symlinks every package into `$HOME`. Re-run it after adding one.

## Layout

One directory per tool. Inside it, files sit at the path they occupy relative to `$HOME`:

```
ghostty/.config/ghostty/config  ->  ~/.config/ghostty/config
tmux/.tmux.conf                 ->  ~/.tmux.conf
```

Adding a tool takes three edits: create the directory, add its name to `PACKAGES` in
`install.sh`, and add it to the allowlist in `.gitignore`.

## Ghostty config path on macOS

Ghostty loads both `~/.config/ghostty/config` and
`~/Library/Application Support/com.mitchellh.ghostty/config`. The Application Support copy
wins where the two disagree. If you kept your config there before, delete it after stowing
or it will keep overriding this repo.

## Secrets

`.gitignore` denies everything and re-allows named paths, so `git add -A` cannot commit a
credential from an unlisted file. Nothing here should hold a token: `~/.config/gh/hosts.yml`,
`~/.aws`, `~/.ssh`, and `~/.claude.json` stay out of the repo.
