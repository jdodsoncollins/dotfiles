# dotfiles

Configs for two machines, split by OS:

| Path | Machine | How to apply |
|------|---------|----------------|
| [`macos/`](macos/) | macOS terminal (stow) | [`macos/README.md`](macos/README.md) |
| [`linux/omarchy/`](linux/omarchy/) | Omarchy Linux (Hyprland) | [`linux/omarchy/README.md`](linux/omarchy/README.md) |

Agent rules, including **what must never be committed**: [`AGENTS.md`](AGENTS.md).

## Clone

```sh
# Linux (this Omarchy box)
git clone https://github.com/jdodsoncollins/dotfiles.git ~/projects/dotfiles

# macOS
git clone git@github.com:jdodsoncollins/dotfiles.git ~/Projects/dotfiles
```

Then follow the README inside `macos/` or `linux/omarchy/`. Do not run
`macos/install.sh` on Linux or `linux/omarchy/install.sh` on macOS.
