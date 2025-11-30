'use strict';

/**
 * DragOpenLinks - Simple Drag Selection Extension
 */

(function() {
  console.log('[DragOpenLinks] Loading script...');
  
  // State
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let overlay = null;
  let selectedUrls = [];

  // Create selection overlay
  function getOverlay() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        border: 2px solid #4285f4;
        background: rgba(66, 133, 244, 0.15);
        pointer-events: none;
        z-index: 2147483647;
        display: none;
        box-sizing: border-box;
      `;
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  // Check if URL is valid
  function isValidUrl(url) {
    if (!url) return false;
    if (url.startsWith('javascript:')) return false;
    if (url.startsWith('#')) return false;
    if (url === 'about:blank') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  }

  // Find all links in selection rectangle
  function findLinksInRect(rect) {
    const links = document.querySelectorAll('a[href]');
    const found = [];
    const seen = new Set();
    
    links.forEach(link => {
      const linkRect = link.getBoundingClientRect();
      
      if (linkRect.left < rect.right &&
          linkRect.right > rect.left &&
          linkRect.top < rect.bottom &&
          linkRect.bottom > rect.top) {
        
        const url = link.href;
        if (isValidUrl(url) && !seen.has(url)) {
          seen.add(url);
          found.push(url);
          link.style.outline = '2px solid #4285f4';
          link.style.outlineOffset = '2px';
        }
      }
    });
    
    return found;
  }

  // Clear highlights
  function clearHighlights() {
    document.querySelectorAll('a[href]').forEach(link => {
      link.style.outline = '';
      link.style.outlineOffset = '';
    });
  }

  // Mouse down
  function onMouseDown(e) {
    if (e.button !== 0) return;
    
    const tag = e.target.tagName.toUpperCase();
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    
    console.log('[DragOpenLinks] Mouse down');
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    selectedUrls = [];
    
    getOverlay();
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // Mouse move
  function onMouseMove(e) {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    if (width < 5 && height < 5) return;
    
    e.preventDefault();
    
    overlay.style.display = 'block';
    overlay.style.left = left + 'px';
    overlay.style.top = top + 'px';
    overlay.style.width = width + 'px';
    overlay.style.height = height + 'px';
    
    clearHighlights();
    selectedUrls = findLinksInRect({ left, top, right: left + width, bottom: top + height });
    
    console.log('[DragOpenLinks] Found', selectedUrls.length, 'links');
  }

  // Mouse up
  function onMouseUp(e) {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    if (!isDragging) return;
    isDragging = false;
    
    console.log('[DragOpenLinks] Mouse up, selected:', selectedUrls.length);
    
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    clearHighlights();
    
    if (selectedUrls.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('[DragOpenLinks] Opening links:', selectedUrls);
      
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        try {
          chrome.runtime.sendMessage({
            type: 'OPEN_LINKS',
            urls: selectedUrls,
            openInBackground: e.shiftKey
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('[DragOpenLinks] Error:', chrome.runtime.lastError);
              selectedUrls.forEach((url, i) => {
                setTimeout(() => window.open(url, '_blank'), i * 100);
              });
            } else {
              console.log('[DragOpenLinks] Opened:', response);
            }
          });
        } catch (err) {
          console.error('[DragOpenLinks] Send failed:', err);
          selectedUrls.forEach((url, i) => {
            setTimeout(() => window.open(url, '_blank'), i * 100);
          });
        }
      } else {
        selectedUrls.forEach((url, i) => {
          setTimeout(() => window.open(url, '_blank'), i * 100);
        });
      }
    }
    
    selectedUrls = [];
  }

  // Initialize
  function init() {
    console.log('[DragOpenLinks] Initializing...');
    document.addEventListener('mousedown', onMouseDown, true);
    console.log('[DragOpenLinks] Ready! Hold left mouse and drag to select links.');
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
