'use strict';

/**
 * DragOpenLinks - Simplified Debug Version
 * This is a minimal version to test if drag selection works
 */

(function() {
  console.log('[DragOpenLinks] Script loaded!');

  // Simple state
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let overlay = null;

  // Create overlay element
  function createOverlay() {
    if (overlay) return overlay;
    
    overlay = document.createElement('div');
    overlay.id = 'dol-overlay';
    overlay.style.cssText = `
      position: fixed;
      border: 2px dashed #007bff;
      background: rgba(0, 123, 255, 0.1);
      pointer-events: none;
      z-index: 999999;
      display: none;
    `;
    document.body.appendChild(overlay);
    console.log('[DragOpenLinks] Overlay created');
    return overlay;
  }

  // Mouse down handler
  function onMouseDown(e) {
    // Only handle left click
    if (e.button !== 0) return;
    
    // Ignore form elements
    const tag = e.target.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    
    console.log('[DragOpenLinks] Mouse down at:', e.clientX, e.clientY);
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    createOverlay();
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // Mouse move handler
  function onMouseMove(e) {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    // Calculate rectangle
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    // Only show if dragged more than 5px
    if (width > 5 || height > 5) {
      overlay.style.display = 'block';
      overlay.style.left = left + 'px';
      overlay.style.top = top + 'px';
      overlay.style.width = width + 'px';
      overlay.style.height = height + 'px';
      
      // Prevent text selection
      e.preventDefault();
    }
  }

  // Mouse up handler
  function onMouseUp(e) {
    if (!isDragging) return;
    
    console.log('[DragOpenLinks] Mouse up - drag ended');
    
    isDragging = false;
    
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    // Find links in selection area
    const rect = {
      left: Math.min(startX, e.clientX),
      top: Math.min(startY, e.clientY),
      right: Math.max(startX, e.clientX),
      bottom: Math.max(startY, e.clientY)
    };
    
    const links = document.querySelectorAll('a[href]');
    const selectedUrls = [];
    
    links.forEach(link => {
      const linkRect = link.getBoundingClientRect();
      if (
        linkRect.left < rect.right &&
        linkRect.right > rect.left &&
        linkRect.top < rect.bottom &&
        linkRect.bottom > rect.top
      ) {
        if (link.href && !link.href.startsWith('javascript:')) {
          selectedUrls.push(link.href);
        }
      }
    });
    
    console.log('[DragOpenLinks] Found links:', selectedUrls.length);
    
    if (selectedUrls.length > 0) {
      // Remove duplicates
      const uniqueUrls = [...new Set(selectedUrls)];
      console.log('[DragOpenLinks] Opening links:', uniqueUrls);
      
      // Open links
      uniqueUrls.forEach((url, i) => {
        setTimeout(() => {
          window.open(url, '_blank');
        }, i * 100);
      });
    }
  }

  // Initialize
  function init() {
    console.log('[DragOpenLinks] Initializing...');
    document.addEventListener('mousedown', onMouseDown, true);
    console.log('[DragOpenLinks] ✅ Ready! Hold left mouse button and drag to select links.');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
