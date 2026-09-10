-- Extra autostart processes.
-- o.launch_on_start("my-service")

-- Keep a framebuffer if every physical monitor is gone (RustDesk / unattended).
o.exec_on_start((os.getenv("HOME") or "") .. "/.local/bin/omarchy-ensure-display")

-- RustDesk --service already starts --server and --tray. Do not open the
-- main GUI on login: closing that window ends incoming remote sessions.

-- VNC for Screens / Tailscale (wayvnc). Restarted by the user systemd unit.
o.exec_on_start("systemctl --user start wayvnc.service")

-- Herdr TUI attaches to the user-level herdr server started at login.
o.exec_on_start("omarchy-launch-terminal-herdr")
