/**
 * Privacy Shield Suite - Background Service Worker
 * Advanced privacy protection with tracking prevention
 */

let settings = {
  enabled: true,
  canvasProtection: true,
  webglProtection: true,
  audioProtection: true,
  uaSpoofing: false,
  timezoneRandom: false,
  blockGA: true,
  blockFB: true,
  blockAds: true
};

let stats = {
  trackersBlocked: 0,
  fingerprintsBlocked: 0,
  sitesProtected: 0
};

// Load settings and stats
chrome.storage.local.get(['settings', 'stats'], (data) => {
  if (data.settings) settings = { ...settings, ...data.settings };
  if (data.stats) stats = data.stats;
});

// Update badge
function updateBadge() {
  const count = stats.trackersBlocked;
  chrome.action.setBadgeText({ text: count > 0 ? (count > 999 ? '999+' : String(count)) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
}

// Message handler
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  switch (msg.type) {
    case 'GET_SETTINGS':
      respond({ success: true, settings, stats });
      break;
    case 'UPDATE_SETTINGS':
      settings = { ...settings, ...msg.settings };
      chrome.storage.local.set({ settings });
      respond({ success: true });
      break;
    case 'PROTECTION_ACTIVE':
      stats.sitesProtected++;
      chrome.storage.local.set({ stats });
      respond({ success: true });
      break;
    case 'TRACKER_BLOCKED':
      stats.trackersBlocked++;
      chrome.storage.local.set({ stats });
      updateBadge();
      respond({ success: true });
      break;
    case 'FINGERPRINT_BLOCKED':
      stats.fingerprintsBlocked++;
      chrome.storage.local.set({ stats });
      respond({ success: true });
      break;
    case 'GET_STATS':
      respond({ success: true, stats });
      break;
    case 'RESET_STATS':
      stats = { trackersBlocked: 0, fingerprintsBlocked: 0, sitesProtected: 0 };
      chrome.storage.local.set({ stats });
      updateBadge();
      respond({ success: true });
      break;
    default:
      respond({ success: false });
  }
  return true;
});

// Initialize
updateBadge();
