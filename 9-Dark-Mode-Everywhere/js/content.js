/**
 * Dark Mode Everywhere - Content Script
 * Handles DOM manipulation, style injection, and real-time content adaptation
 */

(() => {
  'use strict';

  // ============================================================================
  // Constants & Configuration
  // ============================================================================

  const CONFIG = {
    STYLE_ID: 'dark-mode-everywhere-styles',
    FILTER_ID: 'dark-mode-everywhere-filter',
    OBSERVER_OPTIONS: {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'bgcolor', 'color']
    },
    DEBOUNCE_DELAY: 100,
    TRANSITION_DURATION: 200
  };

  // ============================================================================
  // State
  // ============================================================================

  let state = {
    enabled: false,
    theme: null,
    filters: null,
    dimImages: true,
    dimVideos: false,
    styleElement: null,
    filterElement: null,
    observer: null,
    initialized: false
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  };

  const getHostname = () => {
    try {
      return window.location.hostname;
    } catch {
      return '';
    }
  };

  const isValidColor = (color) => {
    if (!color) return false;
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const getLuminance = (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const isLightColor = (color) => {
    const rgb = hexToRgb(color);
    if (!rgb) return true;
    return getLuminance(rgb.r, rgb.g, rgb.b) > 0.5;
  };

  // ============================================================================
  // Style Generation
  // ============================================================================

  const generateDarkModeCSS = (theme, filters, dimImages, dimVideos) => {
    const { bgColor, textColor, linkColor, accentColor } = theme;
    const { brightness, contrast, grayscale, sepia } = filters;
    
    const filterValue = `brightness(${brightness}) contrast(${contrast}) grayscale(${grayscale}) sepia(${sepia})`;
    const imageFilter = dimImages ? 'brightness(0.8) contrast(1.1)' : 'none';
    const videoFilter = dimVideos ? 'brightness(0.9)' : 'none';
    
    return `
      /* Dark Mode Everywhere - Generated Styles */
      
      /* Root variables */
      :root {
        --dme-bg-color: ${bgColor} !important;
        --dme-text-color: ${textColor} !important;
        --dme-link-color: ${linkColor} !important;
        --dme-accent-color: ${accentColor} !important;
        --dme-border-color: ${adjustColor(bgColor, 30)} !important;
        --dme-hover-color: ${adjustColor(bgColor, 20)} !important;
        --dme-input-bg: ${adjustColor(bgColor, 10)} !important;
        --dme-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
        color-scheme: dark !important;
      }
      
      /* Base styles */
      html {
        background-color: var(--dme-bg-color) !important;
        color: var(--dme-text-color) !important;
        filter: ${filterValue} !important;
      }
      
      body {
        background-color: var(--dme-bg-color) !important;
        color: var(--dme-text-color) !important;
      }
      
      /* Text elements */
      h1, h2, h3, h4, h5, h6,
      p, span, div, section, article, main, aside, header, footer, nav,
      li, ul, ol, dl, dt, dd,
      label, legend, figcaption, caption,
      td, th, tr, tbody, thead, tfoot,
      blockquote, pre, code, cite, q,
      small, strong, em, b, i, u, s, mark,
      time, address, abbr, acronym, dfn, kbd, samp, var {
        color: var(--dme-text-color) !important;
        background-color: transparent !important;
        border-color: var(--dme-border-color) !important;
      }
      
      /* Links */
      a, a:link, a:visited {
        color: var(--dme-link-color) !important;
      }
      
      a:hover, a:focus, a:active {
        color: var(--dme-accent-color) !important;
      }
      
      /* Form elements */
      input, textarea, select, button {
        background-color: var(--dme-input-bg) !important;
        color: var(--dme-text-color) !important;
        border-color: var(--dme-border-color) !important;
      }
      
      input::placeholder, textarea::placeholder {
        color: ${adjustColor(textColor, -40)} !important;
        opacity: 0.7 !important;
      }
      
      input:focus, textarea:focus, select:focus {
        border-color: var(--dme-accent-color) !important;
        outline-color: var(--dme-accent-color) !important;
      }
      
      button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"] {
        background-color: var(--dme-hover-color) !important;
        color: var(--dme-text-color) !important;
        border-color: var(--dme-border-color) !important;
      }
      
      button:hover, [role="button"]:hover {
        background-color: var(--dme-accent-color) !important;
        color: ${bgColor} !important;
      }
      
      /* Tables */
      table {
        background-color: var(--dme-bg-color) !important;
        border-color: var(--dme-border-color) !important;
      }
      
      th {
        background-color: var(--dme-hover-color) !important;
      }
      
      tr:nth-child(even) {
        background-color: ${adjustColor(bgColor, 5)} !important;
      }
      
      tr:hover {
        background-color: var(--dme-hover-color) !important;
      }
      
      /* Cards and containers */
      [class*="card"], [class*="Card"],
      [class*="panel"], [class*="Panel"],
      [class*="box"], [class*="Box"],
      [class*="modal"], [class*="Modal"],
      [class*="dialog"], [class*="Dialog"],
      [class*="popup"], [class*="Popup"],
      [class*="dropdown"], [class*="Dropdown"],
      [class*="menu"], [class*="Menu"] {
        background-color: ${adjustColor(bgColor, 8)} !important;
        border-color: var(--dme-border-color) !important;
        box-shadow: var(--dme-shadow) !important;
      }
      
      /* Navigation */
      [class*="nav"], [class*="Nav"],
      [class*="header"], [class*="Header"],
      [class*="footer"], [class*="Footer"],
      [class*="sidebar"], [class*="Sidebar"],
      [class*="toolbar"], [class*="Toolbar"] {
        background-color: ${adjustColor(bgColor, 5)} !important;
        border-color: var(--dme-border-color) !important;
      }
      
      /* Code blocks */
      pre, code, [class*="code"], [class*="Code"] {
        background-color: ${adjustColor(bgColor, -5)} !important;
        color: ${adjustColor(textColor, 10)} !important;
        border-color: var(--dme-border-color) !important;
      }
      
      /* Scrollbars */
      ::-webkit-scrollbar {
        width: 12px !important;
        height: 12px !important;
      }
      
      ::-webkit-scrollbar-track {
        background: var(--dme-bg-color) !important;
      }
      
      ::-webkit-scrollbar-thumb {
        background: var(--dme-border-color) !important;
        border-radius: 6px !important;
        border: 2px solid var(--dme-bg-color) !important;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: var(--dme-accent-color) !important;
      }
      
      /* Selection */
      ::selection {
        background-color: var(--dme-accent-color) !important;
        color: ${bgColor} !important;
      }
      
      /* Images */
      img, svg, picture, canvas, [class*="image"], [class*="Image"], [class*="img"], [class*="Img"] {
        filter: ${imageFilter} !important;
      }
      
      /* Videos */
      video, iframe[src*="youtube"], iframe[src*="vimeo"], [class*="video"], [class*="Video"] {
        filter: ${videoFilter} !important;
      }
      
      /* Iframes - be careful with these */
      iframe:not([src*="youtube"]):not([src*="vimeo"]) {
        background-color: var(--dme-bg-color) !important;
      }
      
      /* Override inline styles */
      [style*="background-color: rgb(255, 255, 255)"],
      [style*="background-color: #fff"],
      [style*="background-color: #ffffff"],
      [style*="background-color: white"],
      [style*="background: rgb(255, 255, 255)"],
      [style*="background: #fff"],
      [style*="background: #ffffff"],
      [style*="background: white"] {
        background-color: var(--dme-bg-color) !important;
      }
      
      [style*="color: rgb(0, 0, 0)"],
      [style*="color: #000"],
      [style*="color: #000000"],
      [style*="color: black"] {
        color: var(--dme-text-color) !important;
      }
      
      /* Fix common issues */
      [bgcolor], [style*="bgcolor"] {
        background-color: var(--dme-bg-color) !important;
      }
      
      /* Shadows and overlays */
      [class*="overlay"], [class*="Overlay"],
      [class*="backdrop"], [class*="Backdrop"] {
        background-color: rgba(0, 0, 0, 0.7) !important;
      }
      
      /* Tooltips */
      [class*="tooltip"], [class*="Tooltip"],
      [role="tooltip"] {
        background-color: ${adjustColor(bgColor, 15)} !important;
        color: var(--dme-text-color) !important;
        border-color: var(--dme-border-color) !important;
      }
      
      /* Badges and tags */
      [class*="badge"], [class*="Badge"],
      [class*="tag"], [class*="Tag"],
      [class*="chip"], [class*="Chip"] {
        background-color: var(--dme-accent-color) !important;
        color: ${bgColor} !important;
      }
      
      /* Progress bars */
      progress, [class*="progress"], [class*="Progress"] {
        background-color: var(--dme-border-color) !important;
      }
      
      progress::-webkit-progress-bar {
        background-color: var(--dme-border-color) !important;
      }
      
      progress::-webkit-progress-value {
        background-color: var(--dme-accent-color) !important;
      }
      
      /* Horizontal rules */
      hr {
        border-color: var(--dme-border-color) !important;
        background-color: var(--dme-border-color) !important;
      }
      
      /* Blockquotes */
      blockquote {
        border-left-color: var(--dme-accent-color) !important;
        background-color: ${adjustColor(bgColor, 5)} !important;
      }
      
      /* Alerts and notifications */
      [class*="alert"], [class*="Alert"],
      [class*="notification"], [class*="Notification"],
      [class*="toast"], [class*="Toast"],
      [class*="snackbar"], [class*="Snackbar"] {
        background-color: ${adjustColor(bgColor, 10)} !important;
        border-color: var(--dme-border-color) !important;
        color: var(--dme-text-color) !important;
      }
      
      /* Lists */
      ul, ol {
        list-style-position: inside !important;
      }
      
      /* Definition lists */
      dt {
        font-weight: bold !important;
        color: var(--dme-accent-color) !important;
      }
      
      /* Fix SVG colors */
      svg text, svg tspan {
        fill: var(--dme-text-color) !important;
      }
      
      svg path[fill="#000"], svg path[fill="#000000"], svg path[fill="black"] {
        fill: var(--dme-text-color) !important;
      }
      
      svg rect[fill="#fff"], svg rect[fill="#ffffff"], svg rect[fill="white"] {
        fill: var(--dme-bg-color) !important;
      }
      
      /* Disabled states */
      [disabled], :disabled, [aria-disabled="true"] {
        opacity: 0.5 !important;
      }
      
      /* Loading states */
      [class*="loading"], [class*="Loading"],
      [class*="spinner"], [class*="Spinner"],
      [class*="skeleton"], [class*="Skeleton"] {
        background-color: var(--dme-border-color) !important;
      }
      
      /* Focus visible */
      :focus-visible {
        outline: 2px solid var(--dme-accent-color) !important;
        outline-offset: 2px !important;
      }
      
      /* Smooth transitions */
      * {
        transition: background-color ${CONFIG.TRANSITION_DURATION}ms ease,
                    color ${CONFIG.TRANSITION_DURATION}ms ease,
                    border-color ${CONFIG.TRANSITION_DURATION}ms ease !important;
      }
      
      /* Preserve certain elements */
      [data-dme-preserve="true"],
      [class*="syntax-highlight"],
      [class*="highlight"],
      .hljs, .prism, .shiki {
        filter: none !important;
      }
    `;
  };

  const adjustColor = (hexColor, amount) => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return hexColor;
    
    const adjust = (value) => {
      const newValue = value + amount;
      return Math.max(0, Math.min(255, newValue));
    };
    
    return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
  };

  // ============================================================================
  // Style Injection
  // ============================================================================

  const injectStyles = () => {
    if (!state.enabled || !state.theme) {
      removeStyles();
      return;
    }
    
    const css = generateDarkModeCSS(
      state.theme,
      state.filters,
      state.dimImages,
      state.dimVideos
    );
    
    if (!state.styleElement) {
      state.styleElement = document.createElement('style');
      state.styleElement.id = CONFIG.STYLE_ID;
      state.styleElement.setAttribute('data-dark-mode', 'true');
    }
    
    state.styleElement.textContent = css;
    
    // Insert at the beginning of head for highest priority
    const head = document.head || document.documentElement;
    if (head && !document.getElementById(CONFIG.STYLE_ID)) {
      head.insertBefore(state.styleElement, head.firstChild);
    }
    
    // Add class to html for detection
    document.documentElement.classList.add('dark-mode-everywhere');
    document.documentElement.setAttribute('data-theme', 'dark');
  };

  const removeStyles = () => {
    const existingStyle = document.getElementById(CONFIG.STYLE_ID);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    state.styleElement = null;
    document.documentElement.classList.remove('dark-mode-everywhere');
    document.documentElement.removeAttribute('data-theme');
  };

  // ============================================================================
  // DOM Observer
  // ============================================================================

  const setupObserver = () => {
    if (state.observer) {
      state.observer.disconnect();
    }
    
    const handleMutations = debounce((mutations) => {
      if (!state.enabled) return;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              processElement(node);
            }
          });
        } else if (mutation.type === 'attributes') {
          processElement(mutation.target);
        }
      }
    }, CONFIG.DEBOUNCE_DELAY);
    
    state.observer = new MutationObserver(handleMutations);
    state.observer.observe(document.documentElement, CONFIG.OBSERVER_OPTIONS);
  };

  const processElement = (element) => {
    if (!element || !element.style) return;
    
    // Handle inline background colors
    const bgColor = element.style.backgroundColor || element.getAttribute('bgcolor');
    if (bgColor && isLightColor(bgColor)) {
      // Don't override, let CSS handle it
    }
    
    // Handle dynamically added iframes
    if (element.tagName === 'IFRAME') {
      handleIframe(element);
    }
  };

  const handleIframe = (iframe) => {
    // Skip cross-origin iframes
    try {
      if (iframe.contentDocument) {
        // Same-origin iframe, we could inject styles
        // But for safety, we'll skip for now
      }
    } catch (e) {
      // Cross-origin, can't access
    }
  };

  // ============================================================================
  // Message Handling
  // ============================================================================

  const handleMessage = (message, sender, sendResponse) => {
    console.log('[DarkMode Content] Received message:', message.type);
    
    switch (message.type) {
      case 'UPDATE_THEME':
        state.enabled = message.enabled;
        state.theme = message.theme;
        state.filters = message.filters;
        state.dimImages = message.dimImages;
        state.dimVideos = message.dimVideos;
        injectStyles();
        sendResponse({ success: true });
        break;
      
      case 'GET_STATUS':
        sendResponse({
          enabled: state.enabled,
          theme: state.theme,
          hostname: getHostname()
        });
        break;
      
      case 'TOGGLE':
        state.enabled = !state.enabled;
        injectStyles();
        sendResponse({ success: true, enabled: state.enabled });
        break;
      
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
    return true;
  });

  // ============================================================================
  // Initialization
  // ============================================================================

  const initialize = async () => {
    if (state.initialized) return;
    state.initialized = true;
    
    console.log('[DarkMode Content] Initializing...');
    
    try {
      const hostname = getHostname();
      const response = await chrome.runtime.sendMessage({
        type: 'GET_SITE_SETTINGS',
        hostname
      });
      
      if (response.success) {
        state.enabled = response.enabled;
        state.theme = response.theme;
        state.filters = response.filters;
        state.dimImages = response.dimImages;
        state.dimVideos = response.dimVideos;
        
        injectStyles();
        setupObserver();
        
        console.log('[DarkMode Content] Initialized:', state.enabled ? 'enabled' : 'disabled');
      }
    } catch (error) {
      console.error('[DarkMode Content] Initialization error:', error);
    }
  };

  // ============================================================================
  // Early Injection (before DOM ready)
  // ============================================================================

  // Apply basic dark background immediately to prevent flash
  const earlyDark = () => {
    const style = document.createElement('style');
    style.id = 'dark-mode-early';
    style.textContent = `
      html, body {
        background-color: #1a1a1a !important;
        color: #e8e8e8 !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
    
    // Remove after proper styles are loaded
    setTimeout(() => {
      const early = document.getElementById('dark-mode-early');
      if (early && state.styleElement) {
        early.remove();
      }
    }, 500);
  };

  // ============================================================================
  // Start
  // ============================================================================

  // Check if we should apply early dark mode
  if (document.readyState === 'loading') {
    // Apply early dark to prevent white flash
    // We'll verify settings and potentially remove it later
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Also try to initialize as soon as possible
  initialize();
})();
