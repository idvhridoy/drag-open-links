'use strict';

/**
 * DragOpenLinks - Background Service Worker
 * Handles tab creation requests from the content script.
 * 
 * Features:
 * - Staggered tab opening to prevent browser freeze
 * - Configurable max tabs limit
 * - URL deduplication and validation
 * - Async response handling
 * - Error recovery
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG = {
  MAX_TABS_PER_DRAG: 500,
  STAGGER_DELAY_MS: 1000,
  BATCH_SIZE: 50
};

// ═══════════════════════════════════════════════════════════════════════════
// URL VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return true;
  } catch {
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// TAB OPENING LOGIC
// ═══════════════════════════════════════════════════════════════════════════

const openTabsStaggered = async (urls, openInBackground, senderTabId) => {
  const results = {
    opened: 0,
    failed: 0,
    skipped: 0
  };
  
  // Get current window to open tabs in same window
  let windowId;
  try {
    if (senderTabId) {
      const senderTab = await chrome.tabs.get(senderTabId);
      windowId = senderTab.windowId;
    }
  } catch (error) {
    console.warn('[DragOpenLinks] Failed to get sender tab, using current window:', error);
    try {
      // Fall back to current window
      const currentWindow = await chrome.windows.getCurrent();
      windowId = currentWindow.id;
    } catch (fallbackError) {
      console.error('[DragOpenLinks] Failed to get current window:', fallbackError);
      return results;
    }
  }
  
  // Process URLs in batches with stagger delay
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    
    if (!isValidUrl(url)) {
      results.skipped++;
      continue;
    }
    
    try {
      await chrome.tabs.create({
        url,
        active: !openInBackground && i === 0, // Only first tab is active if not background
        windowId
      });
      results.opened++;
      
      // Add delay between tabs to prevent browser freeze
      if (i < urls.length - 1 && (i + 1) % CONFIG.BATCH_SIZE === 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.STAGGER_DELAY_MS));
      }
    } catch (error) {
      console.error('[DragOpenLinks] Failed to open tab:', url, error);
      results.failed++;
      
      // If we're getting context invalidation errors, stop processing
      if (error.message?.includes('Extension context invalidated')) {
        console.error('[DragOpenLinks] Extension context invalidated, stopping tab creation');
        break;
      }
    }
  }
  
  return results;
};

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate message
  if (!message || message.type !== 'OPEN_LINKS') {
    return false;
  }
  
  const urls = Array.isArray(message.urls) ? message.urls : [];
  if (!urls.length) {
    sendResponse({ opened: 0, error: 'No URLs provided' });
    return false;
  }
  
  // Deduplicate and limit URLs
  const uniqueUrls = [...new Set(urls)].slice(0, CONFIG.MAX_TABS_PER_DRAG);
  const openInBackground = Boolean(message.openInBackground);
  const senderTabId = sender?.tab?.id;
  
  // Log action
  console.log(`[DragOpenLinks] Opening ${uniqueUrls.length} tabs (background: ${openInBackground})`);
  
  // Open tabs asynchronously
  openTabsStaggered(uniqueUrls, openInBackground, senderTabId)
    .then((results) => {
      console.log('[DragOpenLinks] Results:', results);
      sendResponse(results);
    })
    .catch((error) => {
      console.error('[DragOpenLinks] Error:', error);
      sendResponse({ opened: 0, error: error.message });
    });
  
  // Return true to indicate async response
  return true;
});

// ═══════════════════════════════════════════════════════════════════════════
// INSTALLATION & UPDATE HANDLING
// ═══════════════════════════════════════════════════════════════════════════

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[DragOpenLinks] Extension installed successfully!');
  } else if (details.reason === 'update') {
    console.log(`[DragOpenLinks] Extension updated to version ${chrome.runtime.getManifest().version}`);
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('[DragOpenLinks] Service worker started');
});
