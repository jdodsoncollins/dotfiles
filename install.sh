#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGES=(ghostty tmux)

if ! command -v stow >/dev/null 2>&1; then
  echo "stow not found, installing it with Homebrew"
  brew install stow
fi

cd "$REPO"
stow --target="$HOME" --restow "${PACKAGES[@]}"
echo "stowed: ${PACKAGES[*]}"

# Ghostty on macOS reads the XDG path and the Application Support path, and the
# Application Support copy wins on conflict. A leftover file there overrides the
# symlink this script just made.
GHOSTTY_APP_SUPPORT="$HOME/Library/Application Support/com.mitchellh.ghostty"
if [ -d "$GHOSTTY_APP_SUPPORT" ] && [ -n "$(ls -A "$GHOSTTY_APP_SUPPORT" 2>/dev/null)" ]; then
  echo
  echo "warning: $GHOSTTY_APP_SUPPORT is not empty:"
  ls -1 "$GHOSTTY_APP_SUPPORT" | sed 's/^/  /'
  echo "Anything Ghostty reads there wins over ~/.config/ghostty/config. Move it aside."
fi
