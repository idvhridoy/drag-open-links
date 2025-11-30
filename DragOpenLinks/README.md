# Drag Open Links

A professional Chrome extension that lets you open multiple links by drawing a selection rectangle with your mouse.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Chrome](https://img.shields.io/badge/chrome-MV3-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

## Features

- **🖱️ Drag Selection** - Hold left mouse button and drag to select multiple links
- **📂 Batch Open** - All selected links open in new tabs automatically
- **⏱️ Delayed Opening** - Links open after a configurable delay (default 1.2s)
- **🎯 Visual Feedback** - Beautiful selection overlay and link highlighting
- **📊 Counter Badge** - Real-time count of selected links follows your cursor
- **🔔 Toast Notifications** - Clear feedback on actions
- **⌨️ Keyboard Support** - Press Escape to cancel selection
- **🔧 Configurable** - Customize max tabs, delay, and UI elements
- **📜 Auto-Scroll** - Automatically scrolls when dragging near edges
- **🚀 Staggered Opening** - Prevents browser freeze when opening many tabs
- **🔒 Safe** - Only opens http/https URLs, filters invalid links

## Installation

### From Source (Developer Mode)

1. **Download or clone** this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `DragOpenLinks` folder
6. The extension icon will appear in your toolbar

### From Chrome Web Store

*Coming soon*

## Usage

### Basic Usage

1. Navigate to any webpage with multiple links
2. **Hold the left mouse button** on an empty area
3. **Drag** to draw a selection rectangle over the links you want to open
4. **Release** the mouse button
5. After a short delay, all selected links will open in new tabs

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Cancel current selection or pending tab opening |
| `Shift` (while releasing) | Open tabs in background |

### Tips

- The extension works best when you start dragging from an empty area (not on a link)
- A counter badge shows how many links you've selected
- Hold `Shift` when releasing to open tabs in background without switching to them
- Press `Escape` at any time to cancel the selection
- Links are deduplicated - same URL won't open twice

## Settings

Click the extension icon to access settings:

| Setting | Description | Default |
|---------|-------------|---------|
| Max tabs per drag | Maximum number of tabs to open | 50 |
| Open delay | Delay before opening tabs (ms) | 1200 |
| Show toast notifications | Display status messages | On |
| Show link counter badge | Display selection count | On |

## File Structure

```
DragOpenLinks/
├── manifest.json      # Extension manifest (MV3)
├── background.js      # Service worker for tab creation
├── content.js         # Main content script (drag logic)
├── content.css        # Styles for overlay and highlights
├── popup.html         # Settings popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup logic and storage
├── README.md          # This file
└── icons/
    ├── icon16.png     # Toolbar icon
    ├── icon48.png     # Extension page icon
    └── icon128.png    # Chrome Web Store icon
```

## Technical Details

### Manifest Version
This extension uses **Manifest V3** (MV3), the latest Chrome extension platform.

### Permissions
- `tabs` - Required to create new tabs
- `storage` - Required to save user settings
- `<all_urls>` - Required for content script injection on all pages

### Browser Compatibility
- Chrome 88+ (MV3 support)
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers

## Troubleshooting

### Extension not working on a page
- Some pages (like `chrome://` URLs) don't allow extensions
- Try refreshing the page after installing
- Check if the extension is enabled in `chrome://extensions/`

### Tabs not opening
- Check browser popup blocker settings
- Ensure the extension has necessary permissions
- Look for errors in the extension's service worker console

### Selection gets stuck
- Press `Escape` to cancel
- The extension prevents native drag behavior, but some complex pages may interfere

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/user/drag-open-links.git
cd drag-open-links

# Load in Chrome as unpacked extension
# No build step required - pure JavaScript
```

### Testing

1. Load the unpacked extension
2. Navigate to a page with many links (e.g., Google search results, Reddit)
3. Test drag selection, keyboard shortcuts, and settings

## Changelog

### v1.0.0
- Initial release
- Drag-to-select functionality
- Configurable settings popup
- Toast notifications
- Counter badge
- Auto-scroll support
- Staggered tab opening

## License

MIT License - feel free to use and modify.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Made with ❤️ for productivity**
