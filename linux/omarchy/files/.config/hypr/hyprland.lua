-- Learn how to configure Hyprland: https://wiki.hypr.land/Configuring/Start/

-- Omarchy's bootstrap keeps path setup out of this user config.
dofile((os.getenv("OMARCHY_PATH") or "/usr/share/omarchy") .. "/default/hypr/bootstrap.lua")

-- Disable all Omarchy default bindings. Add your own in hypr/bindings.lua.
-- omarchy_default_bindings = false
--
-- Or disable only bindings for Omarchy's preinstalled apps/web apps while
-- keeping core window-manager bindings:
-- omarchy_preinstalled_bindings = false

-- Load Omarchy defaults.
require("default.hypr.omarchy")

-- Put your personal overrides in these files. They're loaded after Omarchy's
-- defaults so package updates can improve the defaults without rewriting your
-- ~/.config/hypr files.
require("hypr.monitors")
require("hypr.input")
require("hypr.bindings")
require("hypr.looknfeel")
require("hypr.autostart")
require("hypr.window-chrome")

-- Toggle config flags dynamically.
require("default.hypr.toggles")

-- Add any other personal Hyprland configuration below.
-- o.window("qemu", { workspace = "5" })

-- RustDesk: keep incoming sessions alive without occupying a tile.
-- Closing the GUI window drops the remote connection, so park it on the
-- scratchpad (Super+S to peek, Super+Alt+S to send). Tray/server stay up.
o.window("rustdesk", {
  workspace = "special:scratchpad silent",
  no_initial_focus = true,
  focus_on_activate = false,
})

-- Prefer user wrappers (clickable gum confirm, click-to-dismiss Done) for
-- apps launched from Hyprland, including the floating update terminal.
do
  local path = os.getenv("PATH") or ""
  local local_bin = os.getenv("HOME") .. "/.local/bin"
  if not path:find(local_bin, 1, true) then
    hl.env("PATH", local_bin .. ":" .. path)
  end
end
