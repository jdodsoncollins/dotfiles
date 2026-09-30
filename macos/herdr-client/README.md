# Herdr mobile client

This directory preserves the local client patch for upstream Herdr 0.9.1,
commit `065ef9d6a531c49fb8bee7e818ef837065b21ee9`. It requires a custom build;
these features are not available in the stock binary.

## Behavior

- The mobile switcher starts with tabs in the current workspace, followed by
  connected agents that are blocked, working, or done.
- **More** reveals machines, idle or disconnected agents, other workspaces,
  and menu actions. The switcher still occupies the screen while open.
- **Toggle Explorer** is visible in the mobile switcher and desktop menu when
  the server advertises the plugin command described below.
- Hostname-scoped aliases prevent a client from connecting to itself through
  a saved SSH profile. The profile stays saved for use from other machines.
- The desktop navigation layout is unchanged.

## Configuration

The stowed `macos/herdr/.config/herdr/config.toml` includes:

```toml
[[keys.command]]
key = "prefix+shift+e"
type = "plugin_action"
command = "herdr-sidebar.open-sidebar"
description = "Toggle Explorer"
```

The stowed `~/.config/herdr/local-machine-aliases.toml` contains the client-only
mapping:

```toml
"Jeremy-RK2MN2" = ["rk2mn2", "jeremy-rk2mn2"]
```

The patched client reads this file next to its resolved `config.toml`. The stock
server does not read it, so shared config validation stays clean. Missing files
mean no filtering; invalid files produce a warning in the client log.

Hostname, saved profile label, and SSH target comparisons are case-insensitive
and exact. No DNS lookup or Tailnet connection is needed to hide the self-profile.
On another host, `rk2mn2` remains available and still requires Tailnet to connect.
Alias changes require a client reattach. The exact command description
`Toggle Explorer` identifies the advertised command used by the menu.

Disable automatic Explorer opening after installing the plugin:

```sh
node macos/herdr/sidebar-defaults.mjs
```

This changes only `auto_open` in the runtime state file and preserves the other
settings. It does not close an already-open pane. Hiding Explorer manually
affects desktop and phone because it is a shared pane.

## Build and install

Requires Git, Cargo/Rust, macOS build tools, and enough disk space for compilation.
From the dotfiles repository:

```sh
bash macos/herdr-client/install.sh
herdr server reload-config
```

The installer clones the pinned source into `~/Projects/herdr` if absent,
checks the base revision, applies `mobile-client.patch`, builds with the lockfile,
and atomically replaces `~/.local/bin/herdr`. Set `HERDR_SOURCE` to use another
checkout. It refuses another base revision or a conflicting patch.

Before first replacement it saves `~/.local/bin/herdr-stock-0.9.1`. The running
server and agents are left alone. Detach and reattach desktop and Moshi clients
to load the new client. The new client uses the existing protocol and existing
server command interface. There are no server-side changes in this patch.

An upstream `herdr update` can replace the patched binary. Reapply this installer
only to its pinned base; port the patch and rerun tests before changing versions.

## Verification

The patch includes regression tests for tabs-first ordering, More expansion,
selection, Explorer visibility/invocation, and hostname alias filtering without
modifying saved profiles.

```sh
cargo test --locked --manifest-path "$HOME/Projects/herdr/Cargo.toml" mobile
cargo test --locked --manifest-path "$HOME/Projects/herdr/Cargo.toml" local_machine_aliases
cargo test --locked --manifest-path "$HOME/Projects/herdr/Cargo.toml" --bin herdr client::shell
node --test macos/tests/session-dedupe.test.mjs
```

Verified: 19 mobile tests, 5 alias tests, 298 client-shell tests (2 manual profiling
tests ignored), 2 catalog-watcher tests, and 6 dedupe safety tests. Release build
passed on macOS ARM64. Phone touch behavior still needs a Moshi reattach and visual
confirmation; the tests do not replace that check.

## Rollback

```sh
install -m 755 "$HOME/.local/bin/herdr-stock-0.9.1" "$HOME/.local/bin/herdr.rollback"
mv "$HOME/.local/bin/herdr.rollback" "$HOME/.local/bin/herdr"
```

Reattach clients after restoring stock. Stock Herdr ignores the separate alias
file. The Explorer shortcut and disabled auto-open work with stock Herdr too.
No server restart is needed.
