-- Persistent window chrome for mouse/phone control.
-- Official hyprbars plugin: titlebar with a ☰ menu and × close, Tokyo Night-aware.

local function is_theme_color(value)
  if type(value) ~= "string" then
    return false
  end
  local hex = value:match("^#([%x]+)$")
  if hex ~= nil then
    return #hex == 6 or #hex == 8
  end
  return false
end

local function load_theme_colors()
  local palette = {}
  local home = os.getenv("HOME") or ""
  local colors = io.open(home .. "/.local/state/omarchy/current/theme/colors.toml", "r")
  if colors ~= nil then
    for line in colors:lines() do
      local key, value = line:match("^%s*([%w_%-]+)%s*=%s*[\"']([^\"']+)[\"']")
      if key ~= nil then
        palette[key] = value
      end
    end
    colors:close()
  end

  local background = (is_theme_color(palette.lighter_background) and palette.lighter_background)
    or (is_theme_color(palette.background) and palette.background)
    or "#24283b"
  local foreground = (is_theme_color(palette.bright_foreground) and palette.bright_foreground)
    or (is_theme_color(palette.foreground) and palette.foreground)
    or "#c0caf5"
  local close_bg = (is_theme_color(palette.red) and palette.red) or "#f7768e"
  local menu_bg = (is_theme_color(palette.blue) and palette.blue) or "#7aa2f7"

  return {
    background = background,
    foreground = foreground,
    close_bg = close_bg,
    menu_bg = menu_bg,
  }
end

local theme = load_theme_colors()
local menu_cmd = (os.getenv("HOME") or "") .. "/.local/bin/omarchy-window-menu"

-- Plugin keys are only valid after hyprbars is loaded by hyprpm.
-- Cold start parses this file before plugins load, so pull hyprbars in and
-- re-read config once. After that, hl.plugin.hyprbars is present.
if hl.plugin == nil or hl.plugin.hyprbars == nil then
  o.exec_on_start("hyprpm reload -n && hyprctl reload")
else
  hl.config({
    plugin = {
      hyprbars = {
        enabled = true,
        bar_height = 28,
        bar_title_enabled = true,
        bar_text_align = "left",
        bar_text_font = "JetBrainsMono Nerd Font",
        bar_text_size = 11,
        bar_buttons_alignment = "right",
        bar_part_of_window = true,
        bar_precedence_over_border = true,
        bar_padding = 8,
        bar_button_padding = 8,
        icon_on_hover = false,
        bar_color = theme.background,
        ["col.text"] = theme.foreground,
        inactive_button_color = theme.background,
        on_double_click = "hyprctl dispatch 'hl.dsp.window.fullscreen({ mode = \"maximized\", action = \"toggle\" })'",
      },
    },
  })

  -- Buttons are laid out right-to-left: first added sits at the far right.
  hl.plugin.hyprbars.add_button({
    bg_color = theme.close_bg,
    fg_color = theme.background,
    size = 18,
    icon = "×",
    action = "hyprctl dispatch 'hl.dsp.window.close()'",
  })
  hl.plugin.hyprbars.add_button({
    bg_color = theme.menu_bg,
    fg_color = theme.background,
    size = 18,
    icon = "☰",
    action = menu_cmd,
  })

  o.window({ class = "org.omarchy.screensaver" }, { ["hyprbars:no_bar"] = true })
end
