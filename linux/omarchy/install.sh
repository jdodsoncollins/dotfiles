#!/usr/bin/env bash
# Copy this Omarchy overlay onto $HOME. Does not write secrets.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILES="$ROOT/files"
HOME="${HOME:?}"

if ! command -v omarchy >/dev/null 2>&1; then
  echo "omarchy CLI not found. Run this on an Omarchy install." >&2
  exit 1
fi

copy_tree() {
  local src="$1" dest="$2"
  mkdir -p "$(dirname "$dest")"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a "$src" "$dest"
  else
    cp -a "$src" "$dest"
  fi
}

echo "Copying Hyprland overlays"
mkdir -p "$HOME/.config/hypr"
cp -a "$FILES/.config/hypr/." "$HOME/.config/hypr/"

echo "Copying Omarchy shell, dock pins, hooks, jeremy.menu, bauhaus"
mkdir -p "$HOME/.config/omarchy/extensions" \
  "$HOME/.config/omarchy/hooks/theme-set.d" \
  "$HOME/.config/omarchy/plugins" \
  "$HOME/.config/omarchy/themes"
cp -a "$FILES/.config/omarchy/shell.json" "$HOME/.config/omarchy/shell.json"
cp -a "$FILES/.config/omarchy/dock-pinned.json" "$HOME/.config/omarchy/dock-pinned.json"
cp -a "$FILES/.config/omarchy/extensions/omarchy-menu.jsonc" "$HOME/.config/omarchy/extensions/omarchy-menu.jsonc"
cp -a "$FILES/.config/omarchy/hooks/theme-set.d/." "$HOME/.config/omarchy/hooks/theme-set.d/"
copy_tree "$FILES/.config/omarchy/plugins/jeremy.menu/" "$HOME/.config/omarchy/plugins/jeremy.menu/"
copy_tree "$FILES/.config/omarchy/themes/bauhaus/" "$HOME/.config/omarchy/themes/bauhaus/"

echo "Copying helper scripts"
mkdir -p "$HOME/.local/bin"
cp -a "$FILES/.local/bin/." "$HOME/.local/bin/"
chmod +x "$HOME/.local/bin/"omarchy-* "$HOME/.local/bin/grok-view-screen"

echo "Copying desktop entries"
mkdir -p "$HOME/.local/share/applications"
cp -a "$FILES/.local/share/applications/." "$HOME/.local/share/applications/"

echo "Installing user systemd units"
mkdir -p "$HOME/.config/systemd/user"
cp -a "$FILES/.config/systemd/user/." "$HOME/.config/systemd/user/"
systemctl --user daemon-reload
systemctl --user enable --now herdr-server.service 2>/dev/null || systemctl --user enable herdr-server.service
systemctl --user enable display-dpms.service
systemctl --user enable wayvnc.service

if [[ ! -f "$HOME/.config/wayvnc/config" ]]; then
  mkdir -p "$HOME/.config/wayvnc"
  cp "$FILES/.config/wayvnc/config.example" "$HOME/.config/wayvnc/config.example"
  echo "wayvnc: copied config.example. Set a password locally; do not commit it."
fi

echo "Installing third-party plugins"
while IFS= read -r url; do
  [[ "$url" =~ ^https:// ]] || continue
  omarchy plugin add "$url" --enable --yes || echo "plugin add failed: $url" >&2
done < "$ROOT/plugins.txt"

omarchy plugin enable jeremy.menu --section left --index 0 2>/dev/null || true
omarchy plugin enable omarchy.menu 2>/dev/null || true

echo "Overlaying rosakodu.dock patches (right-click Open / Minimize / Close)"
DOCK="$HOME/.config/omarchy/plugins/rosakodu.dock"
PATCH="$FILES/.config/omarchy/plugins/rosakodu.dock"
if [[ -d "$DOCK" ]]; then
  mkdir -p "$DOCK/components"
  cp -a "$PATCH/DockItem.qml" "$DOCK/DockItem.qml"
  cp -a "$PATCH/DockPanel.qml" "$DOCK/DockPanel.qml"
  cp -a "$PATCH/components/FolderMenu.qml" "$DOCK/components/FolderMenu.qml"
else
  echo "rosakodu.dock missing after plugin add; skip overlay" >&2
fi

if [[ -d "$HOME/.config/omarchy/themes/bauhaus" ]]; then
  omarchy theme set bauhaus 2>/dev/null || echo "Set theme manually: omarchy theme set bauhaus"
fi

if command -v hyprctl >/dev/null 2>&1; then
  hyprctl reload >/dev/null 2>&1 || true
  hyprctl configerrors 2>/dev/null || true
fi

echo "Omarchy overlay applied from $ROOT"
