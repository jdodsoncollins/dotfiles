# RustDesk self-hosted server

This Mac hosts RustDesk Server OSS 1.1.16. Homebrew provides the Rust compiler and
RustDesk GUI client, but does not provide a `rustdesk-server` formula. The server
binaries were compiled from the official `rustdesk/rustdesk-server` `1.1.16` tag.

## Runtime layout

- Server binaries: `~/Library/Application Support/RustDesk Server/bin/`
- Server data, Ed25519 key pair, and SQLite database:
  `~/Library/Application Support/RustDesk Server/data/`
- Server logs: `~/Library/Application Support/RustDesk Server/logs/`
- Server and endpoint LaunchAgents:
  `~/Library/LaunchAgents/com.rustdesk.{hbbs,hbbr,endpoint}.plist`
- RustDesk client settings: `~/Library/Preferences/com.carriez.RustDesk/`

The private key at `data/id_ed25519` and the client password must never enter this
repository. Retrieve the client configuration key with:

```sh
rustdesk-selfhost public-key
```

## Architecture

`hbbs` provides device ID registration and rendezvous. `hbbr` provides the relay.
Both run on this Mac and share a generated Ed25519 key pair.

`com.rustdesk.endpoint` starts `/Applications/RustDesk.app/Contents/MacOS/RustDesk
--server` at login. It keeps this Mac registered after the GUI window is closed. It is
a per-user LaunchAgent, so it does not provide remote access before the first macOS
login after a boot or after a full logout.

`hbbs` has `ALWAYS_USE_RELAY=Y`. RustDesk direct peer-to-peer sessions are disabled,
and desktop traffic goes through this Mac's `hbbr` listener on TCP 21117.

## Client configuration

For Tailnet-only access, configure both the controlled Mac and the connecting device
with this Mac's current Tailscale address:

```text
ID Server:    100.107.127.64:21116
Relay Server: 100.107.127.64:21117
Key:          output of rustdesk-selfhost public-key
```

The phone and this Mac must be in the same Tailnet, or the Tailnet policy must grant
the phone access to the server. The current policy's `autogroup:self:*` rule already
allows the owner's iPhone to reach this owner-managed Mac.

The Mac's RustDesk ID is `122624309`. Treat the permanent RustDesk password as a
credential and store it outside this repository.

## Operations

```sh
rustdesk-selfhost status
rustdesk-selfhost public-key
rustdesk-selfhost logs hbbs
rustdesk-selfhost restart
```

`restart` briefly interrupts device rendezvous and active sessions reconnect through
the local relay. It restarts both server services and the persistent endpoint.

## Rebuilding a server release

Use a new release tag only after reviewing its release notes. Preserve the `data/`
directory so the server key and registered-device database remain unchanged.

```sh
brew install rust
build_dir="$(mktemp -d)"
git clone --depth 1 --branch 1.1.16 https://github.com/rustdesk/rustdesk-server.git "$build_dir"
git -C "$build_dir" submodule update --init --recursive
cd "$build_dir"
"$(brew --prefix rust)/bin/cargo" build --release
install -m 755 target/release/hbbs "$HOME/Library/Application Support/RustDesk Server/bin/hbbs"
install -m 755 target/release/hbbr "$HOME/Library/Application Support/RustDesk Server/bin/hbbr"
rustdesk-selfhost restart
rm -rf "$build_dir"
```

Grant RustDesk Screen Recording and Accessibility in macOS Privacy & Security. Grant
Input Monitoring if keyboard or mouse control does not work. A permanent password is
also required for unattended access.
