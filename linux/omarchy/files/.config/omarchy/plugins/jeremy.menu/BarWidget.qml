import QtQuick
import qs.Ui

BarWidget {
  id: root
  moduleName: "omarchy.menu"

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  WidgetButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    // Apps-grid glyph (same icon the Super+Space menu uses for Apps).
    // Easier to spot than the one-glyph Omarchy logo font.
    text: "󰀻"
    tooltipText: "Menu  Super+Space"
    fontSize: 16
    horizontalMargin: 10
    onPressed: function(button) {
      if (!root.bar) return
      if (button === Qt.RightButton) root.bar.run("xdg-terminal-exec")
      else root.bar.run("omarchy-shell shell toggle omarchy.menu '{\"menu\":\"root\"}'")
    }
  }
}
