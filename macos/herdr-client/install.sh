#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE="${HERDR_SOURCE:-$HOME/Projects/herdr}"
BASE="065ef9d6a531c49fb8bee7e818ef837065b21ee9"
BIN="$HOME/.local/bin"

if [[ ! -d "$SOURCE" ]]; then
  git clone --depth 1 --branch v0.9.1 https://github.com/herdrdev/herdr.git "$SOURCE"
fi
if [[ "$(git -C "$SOURCE" rev-parse HEAD)" != "$BASE" ]]; then
  printf 'Expected Herdr v0.9.1 at %s; leaving checkout untouched.\n' "$BASE" >&2
  exit 1
fi
if git -C "$SOURCE" apply --reverse --check "$ROOT/mobile-client.patch" 2>/dev/null; then
  printf 'Mobile client patch is already applied.\n'
else
  git -C "$SOURCE" apply --check "$ROOT/mobile-client.patch"
  git -C "$SOURCE" apply "$ROOT/mobile-client.patch"
fi
cargo build --release --locked --manifest-path "$SOURCE/Cargo.toml"
mkdir -p "$BIN"
if [[ ! -e "$BIN/herdr-stock-0.9.1" && -f "$BIN/herdr" ]]; then
  cp -p "$BIN/herdr" "$BIN/herdr-stock-0.9.1"
fi
install -m 755 "$SOURCE/target/release/herdr" "$BIN/herdr.new"
mv "$BIN/herdr.new" "$BIN/herdr"
printf 'Installed patched client. Reattach desktop/Moshi clients; do not restart the server.\n'
