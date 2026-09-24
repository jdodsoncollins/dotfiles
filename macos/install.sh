#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGES=(agents ghostty herdr tmux zsh git vscode rustdesk)
BACKUP_DIR="${DOTFILES_BACKUP:-$HOME/.dotfiles-backup/$(date +%Y%m%d-%H%M%S)}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "macos/install.sh is for macOS. On Omarchy use linux/omarchy/install.sh" >&2
  exit 1
fi

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required. Install it from https://brew.sh then re-run." >&2
  exit 1
fi

if ! command -v stow >/dev/null 2>&1; then
  echo "stow not found, installing it with Homebrew"
  brew install stow
fi

if [ ! -d "$HOME/.oh-my-zsh" ]; then
  echo "oh-my-zsh not found, cloning it"
  git clone --depth 1 https://github.com/ohmyzsh/ohmyzsh.git "$HOME/.oh-my-zsh"
fi

backup_conflicts() {
  local pkg="$1"
  local pkg_root="$REPO/$pkg"
  local file rel target

  while IFS= read -r -d '' file; do
    rel="${file#"$pkg_root"/}"
    target="$HOME/$rel"
    # Already stowed: a symlink, or the same inode reached through a folded
    # directory symlink (e.g. ~/.config/ghostty -> this package).
    if [ -L "$target" ] || { [ -e "$target" ] && [ "$file" -ef "$target" ]; }; then
      continue
    fi
    if [ -e "$target" ]; then
      mkdir -p "$BACKUP_DIR/$(dirname "$rel")"
      mv "$target" "$BACKUP_DIR/$rel"
      echo "backed up $target -> $BACKUP_DIR/$rel"
    fi
  done < <(find "$pkg_root" -type f -print0)
}

cd "$REPO"
for pkg in "${PACKAGES[@]}"; do
  backup_conflicts "$pkg"
done

stow --target="$HOME" --restow "${PACKAGES[@]}"
echo "stowed: ${PACKAGES[*]}"

# Ghostty on macOS reads the XDG path and the Application Support path, and the
# Application Support copy wins on conflict — including an empty file.
GHOSTTY_APP_SUPPORT="$HOME/Library/Application Support/com.mitchellh.ghostty"
GHOSTTY_APP_CONFIG="$GHOSTTY_APP_SUPPORT/config"
if [ -e "$GHOSTTY_APP_CONFIG" ] && [ ! -L "$GHOSTTY_APP_CONFIG" ]; then
  mkdir -p "$BACKUP_DIR/Library/Application Support/com.mitchellh.ghostty"
  mv "$GHOSTTY_APP_CONFIG" "$BACKUP_DIR/Library/Application Support/com.mitchellh.ghostty/config"
  echo "moved $GHOSTTY_APP_CONFIG aside so ~/.config/ghostty/config wins"
fi
if [ -d "$GHOSTTY_APP_SUPPORT" ] && [ -n "$(ls -A "$GHOSTTY_APP_SUPPORT" 2>/dev/null)" ]; then
  echo
  echo "warning: $GHOSTTY_APP_SUPPORT is not empty:"
  ls -1 "$GHOSTTY_APP_SUPPORT" | sed 's/^/  /'
  echo "Anything Ghostty reads there wins over ~/.config/ghostty/config."
fi
