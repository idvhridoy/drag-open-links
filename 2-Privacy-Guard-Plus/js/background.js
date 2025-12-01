/**
 * Privacy Guard Plus - Background Service Worker
 * Handles tracker blocking, cookie management, and privacy protection
 */

// ============================================================================
// Tracker Database
// ============================================================================

const TRACKER_PATTERNS = {
  advertising: [
    '*://*.doubleclick.net/*', '*://*.googlesyndication.com/*', '*://*.googleadservices.com/*',
    '*://*.facebook.com/tr/*', '*://*.adnxs.com/*', '*://*.criteo.com/*', '*://*.taboola.com/*',
    '*://*.outbrain.com/*', '*://*.amazon-adsystem.com/*', '*://*.adsrvr.org/*'
  ],
  analytics: [
    '*://*.google-analytics.com/*', '*://*.googletagmanager.com/*', '*://*.hotjar.com/*',
    '*://*.mixpanel.com/*', '*://*.segment.com/*', '*://*.amplitude.com/*', '*://*.heap.io/*',
    '*://*.fullstory.com/*', '*://*.mouseflow.com/*', '*://*.crazyegg.com/*'
  ],
  social: [
    '*://*.facebook.com/plugins/*', '*://*.twitter.com/widgets/*', '*://*.linkedin.com/embed/*',
    '*://*.pinterest.com/widgets/*', '*://*.addthis.com/*', '*://*.sharethis.com/*'
  ],
  fingerprinting: [
    '*://*.fingerprintjs.com/*', '*://*.iovation.com/*', '*://*.threatmetrix.com/*'
  ],
  cryptominers: [
    '*://*.coinhive.com/*', '*://*.coin-hive.com/*', '*://*.crypto-loot.com/*'
  ]
};

// ============================================================================
// State Management
// ============================================================================

const CONFIG = {
  STORAGE_KEYS: {
    SETTINGS: 'settings',
    STATS: 'stats',
    WHITELIST: 'whitelist',
    BLOCKED_TODAY: 'blockedToday'
  }
};

let state = {
  settings: {
    enabled: true,
    blockTrackers: true,
    blockThirdPartyCookies: true,
    blockFingerprinting: true,
    blockCryptominers: true,
    showNotifications: true,
    autoCleanCookies: false,
    cleanInterval: 24
  },
  stats: {
    totalBlocked: 0,
    trackersBlocked: 0,
    cookiesBlocked: 0,
    fingerprintsBlocked: 0,
    sitesProtected: 0
  },
  whitelist: [],
  blockedToday: { count: 0, date: new Date().toDateString() },
  tabTrackers: new Map()
};

// ============================================================================
// Initialization
// ============================================================================

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[PrivacyGuard] Installed:', details.reason);
  await loadSettings();
  await setupBlockingRules();
  if (details.reason === 'install') {
    await initializeDefaultSettings();
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await loadSettings();
  await setupBlockingRules();
  resetDailyStats();
});

async function initializeDefaultSettings() {
  await chrome.storage.sync.set({
    [CONFIG.STORAGE_KEYS.SETTINGS]: state.settings,
    [CONFIG.STORAGE_KEYS.STATS]: state.stats,
    [CONFIG.STORAGE_KEYS.WHITELIST]: [],
    [CONFIG.STORAGE_KEYS.BLOCKED_TODAY]: state.blockedToday
  });
}

async function loadSettings() {
  try {
    const data = await chrome.storage.sync.get(null);
    state.settings = { ...state.settings, ...data[CONFIG.STORAGE_KEYS.SETTINGS] };
    state.stats = { ...state.stats, ...data[CONFIG.STORAGE_KEYS.STATS] };
    state.whitelist = data[CONFIG.STORAGE_KEYS.WHITELIST] || [];
    state.blockedToday = data[CONFIG.STORAGE_KEYS.BLOCKED_TODAY] || state.blockedToday;
  } catch (error) {
    console.error('[PrivacyGuard] Load settings error:', error);
  }
}

function resetDailyStats() {
  const today = new Date().toDateString();
  if (state.blockedToday.date !== today) {
    state.blockedToday = { count: 0, date: today };
    chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.BLOCKED_TODAY]: state.blockedToday });
  }
}

// ============================================================================
// Declarative Net Request Rules
// ============================================================================

async function setupBlockingRules() {
  if (!state.settings.enabled || !state.settings.blockTrackers) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: Array.from({ length: 1000 }, (_, i) => i + 1)
    });
    return;
  }

  const rules = [];
  let ruleId = 1;

  // Generate blocking rules for each tracker category
  Object.entries(TRACKER_PATTERNS).forEach(([category, patterns]) => {
    if (category === 'advertising' || 
        category === 'analytics' || 
        category === 'social' ||
        (category === 'fingerprinting' && state.settings.blockFingerprinting) ||
        (category === 'cryptominers' && state.settings.blockCryptominers)) {
      
      patterns.forEach(pattern => {
        const urlFilter = pattern.replace('*://', '||').replace('/*', '');
        rules.push({
          id: ruleId++,
          priority: 1,
          action: { type: 'block' },
          condition: {
            urlFilter,
            resourceTypes: ['script', 'image', 'xmlhttprequest', 'sub_frame', 'ping']
          }
        });
      });
    }
  });

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: Array.from({ length: 1000 }, (_, i) => i + 1),
      addRules: rules.slice(0, 100) // Limit to 100 rules for performance
    });
    console.log('[PrivacyGuard] Blocking rules updated:', rules.length);
  } catch (error) {
    console.error('[PrivacyGuard] Failed to update rules:', error);
  }
}

// ============================================================================
// Request Monitoring
// ============================================================================

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!state.settings.enabled) return;
    
    const url = new URL(details.url);
    const initiator = details.initiator ? new URL(details.initiator).hostname : '';
    
    // Check if third-party request
    if (initiator && url.hostname !== initiator) {
      // Track blocked requests
      const category = categorizeRequest(url.hostname);
      if (category) {
        recordBlockedTracker(details.tabId, url.hostname, category);
      }
    }
  },
  { urls: ['<all_urls>'] }
);

function categorizeRequest(hostname) {
  for (const [category, patterns] of Object.entries(TRACKER_PATTERNS)) {
    for (const pattern of patterns) {
      const domain = pattern.match(/\*:\/\/\*?\.?([^/]+)/)?.[1];
      if (domain && hostname.includes(domain.replace('*', ''))) {
        return category;
      }
    }
  }
  return null;
}

function recordBlockedTracker(tabId, hostname, category) {
  if (!state.tabTrackers.has(tabId)) {
    state.tabTrackers.set(tabId, { trackers: [], count: 0 });
  }
  
  const tabData = state.tabTrackers.get(tabId);
  if (!tabData.trackers.includes(hostname)) {
    tabData.trackers.push(hostname);
    tabData.count++;
  }
  
  // Update stats
  state.stats.totalBlocked++;
  state.stats.trackersBlocked++;
  state.blockedToday.count++;
  
  // Update badge
  updateBadge(tabId);
  
  // Save periodically
  saveStats();
}

// ============================================================================
// Badge Management
// ============================================================================

function updateBadge(tabId) {
  const tabData = state.tabTrackers.get(tabId);
  const count = tabData?.count || 0;
  
  chrome.action.setBadgeText({ 
    text: count > 0 ? String(count) : '',
    tabId 
  });
  chrome.action.setBadgeBackgroundColor({ 
    color: state.settings.enabled ? '#22c55e' : '#6b7280',
    tabId 
  });
}

// ============================================================================
// Cookie Management
// ============================================================================

async function cleanTrackingCookies() {
  if (!state.settings.blockThirdPartyCookies) return;
  
  try {
    const cookies = await chrome.cookies.getAll({});
    let removed = 0;
    
    for (const cookie of cookies) {
      // Check if cookie is from a known tracker
      const isTracker = Object.values(TRACKER_PATTERNS)
        .flat()
        .some(pattern => {
          const domain = pattern.match(/\*:\/\/\*?\.?([^/]+)/)?.[1];
          return domain && cookie.domain.includes(domain.replace('*', ''));
        });
      
      if (isTracker) {
        await chrome.cookies.remove({
          url: `https://${cookie.domain}${cookie.path}`,
          name: cookie.name
        });
        removed++;
      }
    }
    
    state.stats.cookiesBlocked += removed;
    console.log('[PrivacyGuard] Removed tracking cookies:', removed);
    return removed;
  } catch (error) {
    console.error('[PrivacyGuard] Cookie cleanup error:', error);
    return 0;
  }
}

// Auto-clean cookies periodically
chrome.alarms.create('cleanCookies', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanCookies' && state.settings.autoCleanCookies) {
    cleanTrackingCookies();
  }
});

// ============================================================================
// Tab Events
// ============================================================================

chrome.tabs.onRemoved.addListener((tabId) => {
  state.tabTrackers.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    state.tabTrackers.set(tabId, { trackers: [], count: 0 });
    updateBadge(tabId);
  }
});

// ============================================================================
// Stats Management
// ============================================================================

let saveTimeout;
function saveStats() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await chrome.storage.sync.set({
      [CONFIG.STORAGE_KEYS.STATS]: state.stats,
      [CONFIG.STORAGE_KEYS.BLOCKED_TODAY]: state.blockedToday
    });
  }, 5000);
}

// ============================================================================
// Message Handling
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => sendResponse({ success: false, error: error.message }));
  return true;
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'GET_STATUS':
      const tabId = sender.tab?.id || message.tabId;
      const tabData = state.tabTrackers.get(tabId) || { trackers: [], count: 0 };
      return {
        success: true,
        enabled: state.settings.enabled,
        settings: state.settings,
        stats: state.stats,
        blockedToday: state.blockedToday.count,
        tabTrackers: tabData.trackers,
        tabCount: tabData.count
      };
    
    case 'UPDATE_SETTINGS':
      state.settings = { ...state.settings, ...message.settings };
      await chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.SETTINGS]: state.settings });
      await setupBlockingRules();
      return { success: true };
    
    case 'TOGGLE_PROTECTION':
      state.settings.enabled = !state.settings.enabled;
      await chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.SETTINGS]: state.settings });
      await setupBlockingRules();
      return { success: true, enabled: state.settings.enabled };
    
    case 'CLEAN_COOKIES':
      const removed = await cleanTrackingCookies();
      return { success: true, removed };
    
    case 'CLEAR_BROWSING_DATA':
      await chrome.browsingData.remove({}, {
        cookies: message.options?.cookies || false,
        cache: message.options?.cache || false,
        history: message.options?.history || false,
        localStorage: message.options?.localStorage || false
      });
      return { success: true };
    
    case 'ADD_WHITELIST':
      if (!state.whitelist.includes(message.hostname)) {
        state.whitelist.push(message.hostname);
        await chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.WHITELIST]: state.whitelist });
      }
      return { success: true };
    
    case 'REMOVE_WHITELIST':
      state.whitelist = state.whitelist.filter(h => h !== message.hostname);
      await chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.WHITELIST]: state.whitelist });
      return { success: true };
    
    case 'GET_WHITELIST':
      return { success: true, whitelist: state.whitelist };
    
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

// Initialize
loadSettings().then(() => {
  console.log('[PrivacyGuard] Background initialized');
});
