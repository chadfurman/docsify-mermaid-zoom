# Changelog

## 1.2.0 (2026-04-13)

### Features
- **Click-to-focus interaction model**: Click a diagram to focus it. When focused, two-finger scroll pans the diagram and arrow keys navigate. ESC releases focus. Unfocused diagrams let scroll pass through to the page normally.
- **Visual focus indicator**: Focused diagrams get a teal outline ring so you know when a diagram is active.
- **Fullscreen auto-focus**: Entering fullscreen automatically focuses the diagram.
- **Debug mode**: Set `mermaidZoom: { debug: true }` in docsify config to enable `[mermaid-zoom]` console logs for troubleshooting.

### Fixes
- Arrow keys now pan the diagram (up/down/left/right) when focused instead of doing nothing.
- Scroll events no longer get trapped by the diagram container — they pass through to the page when unfocused.

## 1.1.0 (2026-04-13)

### Fixes
- **Zoom sensitivity reduced**: `zoomScaleSensitivity` changed from 0.3 to 0.15, zoom factors from 1.1/0.9 to 1.05/0.95. Zoom is now much more controllable.
- **Scroll passthrough**: Regular two-finger trackpad scroll passes through to the page. Only pinch-to-zoom (Ctrl+scroll) triggers diagram zoom.

## 1.0.0 (2026-04-13)

### Features
- Interactive mermaid diagrams for docsify with zoom, pan, resize, and fullscreen.
- Mouse wheel zoom (Ctrl+scroll / pinch-to-zoom) on any mermaid diagram.
- Click-and-drag to pan with grab/grabbing cursor.
- Resize handle (bottom-right corner) to adjust diagram height.
- Fullscreen mode (ESC to exit).
- Zoom controls (+, -, reset) in top-right corner.
- Auto-fit on load, resize, and page navigation.
- Configurable: min/max zoom, container height limits, render delay.
- CSS variable `--mermaid-zoom-accent` for theming.
- Graceful fallback if svg-pan-zoom fails.
