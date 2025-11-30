# Contributing to Drag Open Links

First off, thank you for considering contributing to Drag Open Links! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming environment. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When reporting a bug, include:**
- Clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Browser version and OS
- Screenshots if applicable
- Console errors (if any)

### 💡 Suggesting Features

Feature suggestions are welcome! Please:
- Check if the feature has already been suggested
- Provide a clear use case
- Explain how it would benefit users

### 🔧 Contributing Code

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Development Setup

### Prerequisites

- Google Chrome or Chromium-based browser
- Text editor (VS Code recommended)
- Git

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/drag-open-links.git
cd drag-open-links

# Create a branch for your feature
git checkout -b feature/your-feature-name
```

### Loading the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the project folder

### Testing Changes

After making changes:
1. Go to `chrome://extensions/`
2. Click the refresh icon on the extension
3. Reload any test pages
4. Test your changes thoroughly

## Pull Request Process

1. **Update Documentation**: Update README.md if needed
2. **Follow Style Guide**: Ensure code follows our style guidelines
3. **Test Thoroughly**: Test on multiple websites
4. **Write Clear Commits**: Use descriptive commit messages
5. **Reference Issues**: Link to related issues

### Commit Message Format

```
type: short description

Longer description if needed.

Fixes #123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## Style Guide

### JavaScript

- Use ES6+ features
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused
- Use `const` and `let`, never `var`

```javascript
// Good
const openSelectedLinks = (urls) => {
  urls.forEach(url => window.open(url, '_blank'));
};

// Bad
function open(u) {
  for (var i = 0; i < u.length; i++) {
    window.open(u[i]);
  }
}
```

### CSS

- Use meaningful class names
- Prefix classes with `dol-` for the extension
- Use CSS variables for colors
- Keep selectors specific

```css
/* Good */
.dol-selection-overlay {
  position: fixed;
  border: 2px solid var(--primary-color);
}

/* Bad */
.overlay {
  position: fixed;
  border: 2px solid blue;
}
```

### File Structure

```
DragOpenLinks/
├── manifest.json       # Extension manifest
├── background.js       # Service worker
├── content.js          # Content script
├── content.css         # Content styles
├── popup.html          # Popup UI
├── popup.css           # Popup styles
├── popup.js            # Popup logic
├── icons/              # Extension icons
├── README.md           # Documentation
├── PRIVACY.md          # Privacy policy
├── LICENSE             # MIT license
├── CHANGELOG.md        # Version history
└── CONTRIBUTING.md     # This file
```

## Questions?

Feel free to open an issue with your question or contact the maintainer:

- GitHub: [@idvhridoy](https://github.com/idvhridoy)

---

Thank you for contributing! ❤️
