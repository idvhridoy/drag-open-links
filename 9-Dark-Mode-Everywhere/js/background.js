/**
 * Dark Mode Everywhere - Background Service Worker
 * Handles theme management, scheduling, and cross-tab synchronization
 */

// ============================================================================
// Constants & Configuration
// ============================================================================

const CONFIG = {
  STORAGE_KEYS: {
    GLOBAL_ENABLED: 'globalEnabled',
    CURRENT_THEME: 'currentTheme',
    SITE_SETTINGS: 'siteSettings',
    SCHEDULE: 'schedule',
    PREFERENCES: 'preferences',
    CUSTOM_THEMES: 'customThemes'
  },
  DEFAULT_SETTINGS: {
    globalEnabled: true,
    currentTheme: 'dark-default',
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    sepia: 0,
    dimImages: true,
    dimVideos: false,
    scheduleEnabled: false,
    scheduleStart: '20:00',
    scheduleEnd: '07:00',
    syncWithSystem: false,
    excludedSites: []
  },
  THEMES: {
    'dark-default': {
      name: 'Pure Dark',
      bgColor: '#1a1a1a',
      textColor: '#e8e8e8',
      linkColor: '#8ab4f8',
      accentColor: '#bb86fc'
    },
    'dark-blue': {
      name: 'Dark Blue',
      bgColor: '#0d1117',
      textColor: '#c9d1d9',
      linkColor: '#58a6ff',
      accentColor: '#79c0ff'
    },
    'dark-warm': {
      name: 'Dark Warm',
      bgColor: '#1c1917',
      textColor: '#e7e5e4',
      linkColor: '#fbbf24',
      accentColor: '#f59e0b'
    },
    'dark-amoled': {
      name: 'AMOLED Black',
      bgColor: '#000000',
      textColor: '#ffffff',
      linkColor: '#00d4ff',
      accentColor: '#ff6b9d'
    },
    'dark-sepia': {
      name: 'Dark Sepia',
      bgColor: '#1a1814',
      textColor: '#d4c5a9',
      linkColor: '#c9a962',
      accentColor: '#b89750'
    },
    'high-contrast': {
      name: 'High Contrast',
      bgColor: '#000000',
      textColor: '#ffffff',
      linkColor: '#ffff00',
      accentColor: '#00ff00'
    }
  }
};

// ============================================================================
// State Management
// ============================================================================

let state = {
  settings: { ...CONFIG.DEFAULT_SETTINGS },
  siteSettings: {},
  customThemes: {}
};

// ============================================================================
// Initialization
// ============================================================================

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[DarkMode] Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    await initializeDefaultSettings();
    await createContextMenus();
  } else if (details.reason === 'update') {
    await migrateSettings(details.previousVersion);
  }
  
  await loadSettings();
  await setupScheduleAlarms();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('[DarkMode] Browser started');
  await loadSettings();
  await setupScheduleAlarms();
  await checkSchedule();
});

// ============================================================================
// Settings Management
// ============================================================================

async function initializeDefaultSettings() {
  try {
    await chrome.storage.sync.set({
      [CONFIG.STORAGE_KEYS.GLOBAL_ENABLED]: CONFIG.DEFAULT_SETTINGS.globalEnabled,
      [CONFIG.STORAGE_KEYS.CURRENT_THEME]: CONFIG.DEFAULT_SETTINGS.currentTheme,
      [CONFIG.STORAGE_KEYS.PREFERENCES]: CONFIG.DEFAULT_SETTINGS,
      [CONFIG.STORAGE_KEYS.SITE_SETTINGS]: {},
      [CONFIG.STORAGE_KEYS.CUSTOM_THEMES]: {}
    });
    console.log('[DarkMode] Default settings initialized');
  } catch (error) {
    console.error('[DarkMode] Failed to initialize settings:', error);
  }
}

async function loadSettings() {
  try {
    const data = await chrome.storage.sync.get(null);
    state.settings = { ...CONFIG.DEFAULT_SETTINGS, ...data[CONFIG.STORAGE_KEYS.PREFERENCES] };
    state.settings.globalEnabled = data[CONFIG.STORAGE_KEYS.GLOBAL_ENABLED] ?? true;
    state.settings.currentTheme = data[CONFIG.STORAGE_KEYS.CURRENT_THEME] ?? 'dark-default';
    state.siteSettings = data[CONFIG.STORAGE_KEYS.SITE_SETTINGS] || {};
    state.customThemes = data[CONFIG.STORAGE_KEYS.CUSTOM_THEMES] || {};
    console.log('[DarkMode] Settings loaded:', state.settings);
  } catch (error) {
    console.error('[DarkMode] Failed to load settings:', error);
  }
}

async function saveSettings(newSettings) {
  try {
    state.settings = { ...state.settings, ...newSettings };
    await chrome.storage.sync.set({
      [CONFIG.STORAGE_KEYS.GLOBAL_ENABLED]: state.settings.globalEnabled,
      [CONFIG.STORAGE_KEYS.CURRENT_THEME]: state.settings.currentTheme,
      [CONFIG.STORAGE_KEYS.PREFERENCES]: state.settings
    });
    console.log('[DarkMode] Settings saved');
    return true;
  } catch (error) {
    console.error('[DarkMode] Failed to save settings:', error);
    return false;
  }
}

async function saveSiteSettings(hostname, settings) {
  try {
    state.siteSettings[hostname] = settings;
    await chrome.storage.sync.set({
      [CONFIG.STORAGE_KEYS.SITE_SETTINGS]: state.siteSettings
    });
    console.log('[DarkMode] Site settings saved for:', hostname);
    return true;
  } catch (error) {
    console.error('[DarkMode] Failed to save site settings:', error);
    return false;
  }
}

async function migrateSettings(previousVersion) {
  console.log('[DarkMode] Migrating from version:', previousVersion);
  // Add migration logic for future versions
}

// ============================================================================
// Context Menus
// ============================================================================

async function createContextMenus() {
  try {
    await chrome.contextMenus.removeAll();
    
    chrome.contextMenus.create({
      id: 'toggle-dark-mode',
      title: 'Toggle Dark Mode',
      contexts: ['all']
    });
    
    chrome.contextMenus.create({
      id: 'toggle-site',
      title: 'Toggle for this site',
      contexts: ['all']
    });
    
    chrome.contextMenus.create({
      id: 'separator1',
      type: 'separator',
      contexts: ['all']
    });
    
    chrome.contextMenus.create({
      id: 'open-options',
      title: 'Settings',
      contexts: ['all']
    });
    
    console.log('[DarkMode] Context menus created');
  } catch (error) {
    console.error('[DarkMode] Failed to create context menus:', error);
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'toggle-dark-mode':
      await toggleGlobalDarkMode();
      break;
    case 'toggle-site':
      if (tab?.url) {
        const hostname = new URL(tab.url).hostname;
        await toggleSiteDarkMode(hostname, tab.id);
      }
      break;
    case 'open-options':
      chrome.runtime.openOptionsPage();
      break;
  }
});

// ============================================================================
// Dark Mode Control
// ============================================================================

async function toggleGlobalDarkMode() {
  state.settings.globalEnabled = !state.settings.globalEnabled;
  await saveSettings({ globalEnabled: state.settings.globalEnabled });
  await notifyAllTabs();
  await updateBadge();
}

async function toggleSiteDarkMode(hostname, tabId) {
  const currentSetting = state.siteSettings[hostname];
  const newSetting = {
    enabled: currentSetting ? !currentSetting.enabled : false,
    theme: currentSetting?.theme || state.settings.currentTheme
  };
  
  await saveSiteSettings(hostname, newSetting);
  
  if (tabId) {
    await notifyTab(tabId);
  }
}

async function setTheme(themeId) {
  state.settings.currentTheme = themeId;
  await saveSettings({ currentTheme: themeId });
  await notifyAllTabs();
}

function getThemeCSS(themeId) {
  const theme = CONFIG.THEMES[themeId] || state.customThemes[themeId] || CONFIG.THEMES['dark-default'];
  return theme;
}

function generateThemeStyles(themeId, settings) {
  const theme = getThemeCSS(themeId);
  const brightness = settings.brightness || 100;
  const contrast = settings.contrast || 100;
  const grayscale = settings.grayscale || 0;
  const sepia = settings.sepia || 0;
  
  return {
    theme,
    filters: {
      brightness: brightness / 100,
      contrast: contrast / 100,
      grayscale: grayscale / 100,
      sepia: sepia / 100
    },
    dimImages: settings.dimImages ?? true,
    dimVideos: settings.dimVideos ?? false
  };
}

// ============================================================================
// Tab Communication
// ============================================================================

async function notifyAllTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        await notifyTab(tab.id);
      }
    }
  } catch (error) {
    console.error('[DarkMode] Failed to notify tabs:', error);
  }
}

async function notifyTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }
    
    const hostname = new URL(tab.url).hostname;
    const siteSettings = state.siteSettings[hostname];
    const isExcluded = state.settings.excludedSites?.includes(hostname);
    
    let enabled = state.settings.globalEnabled;
    let themeId = state.settings.currentTheme;
    
    if (siteSettings) {
      enabled = siteSettings.enabled;
      themeId = siteSettings.theme || themeId;
    }
    
    if (isExcluded) {
      enabled = false;
    }
    
    const themeStyles = generateThemeStyles(themeId, state.settings);
    
    await chrome.tabs.sendMessage(tabId, {
      type: 'UPDATE_THEME',
      enabled,
      themeId,
      ...themeStyles
    });
  } catch (error) {
    // Tab might not have content script loaded
    console.debug('[DarkMode] Could not notify tab:', tabId, error.message);
  }
}

// ============================================================================
// Scheduling
// ============================================================================

async function setupScheduleAlarms() {
  await chrome.alarms.clearAll();
  
  if (state.settings.scheduleEnabled) {
    // Check every minute for schedule changes
    chrome.alarms.create('check-schedule', { periodInMinutes: 1 });
    console.log('[DarkMode] Schedule alarm created');
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'check-schedule') {
    await checkSchedule();
  }
});

async function checkSchedule() {
  if (!state.settings.scheduleEnabled) return;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = state.settings.scheduleStart.split(':').map(Number);
  const [endHour, endMin] = state.settings.scheduleEnd.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  let shouldBeEnabled;
  
  if (startTime < endTime) {
    // Same day schedule (e.g., 09:00 - 17:00)
    shouldBeEnabled = currentTime >= startTime && currentTime < endTime;
  } else {
    // Overnight schedule (e.g., 20:00 - 07:00)
    shouldBeEnabled = currentTime >= startTime || currentTime < endTime;
  }
  
  if (state.settings.globalEnabled !== shouldBeEnabled) {
    state.settings.globalEnabled = shouldBeEnabled;
    await saveSettings({ globalEnabled: shouldBeEnabled });
    await notifyAllTabs();
    await updateBadge();
  }
}

// ============================================================================
// Badge Management
// ============================================================================

async function updateBadge() {
  const text = state.settings.globalEnabled ? 'ON' : 'OFF';
  const color = state.settings.globalEnabled ? '#4CAF50' : '#757575';
  
  try {
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color });
  } catch (error) {
    console.error('[DarkMode] Failed to update badge:', error);
  }
}

// ============================================================================
// Message Handling
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('[DarkMode] Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    });
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  console.log('[DarkMode] Received message:', message.type);
  
  switch (message.type) {
    case 'GET_SETTINGS':
      return {
        success: true,
        settings: state.settings,
        themes: { ...CONFIG.THEMES, ...state.customThemes },
        siteSettings: state.siteSettings
      };
    
    case 'GET_SITE_SETTINGS':
      const hostname = message.hostname;
      const siteConfig = state.siteSettings[hostname];
      const isExcluded = state.settings.excludedSites?.includes(hostname);
      
      return {
        success: true,
        enabled: isExcluded ? false : (siteConfig?.enabled ?? state.settings.globalEnabled),
        theme: siteConfig?.theme || state.settings.currentTheme,
        ...generateThemeStyles(siteConfig?.theme || state.settings.currentTheme, state.settings)
      };
    
    case 'UPDATE_SETTINGS':
      const saved = await saveSettings(message.settings);
      if (saved) {
        await notifyAllTabs();
        await updateBadge();
        if (message.settings.scheduleEnabled !== undefined) {
          await setupScheduleAlarms();
        }
      }
      return { success: saved };
    
    case 'TOGGLE_GLOBAL':
      await toggleGlobalDarkMode();
      return { success: true, enabled: state.settings.globalEnabled };
    
    case 'TOGGLE_SITE':
      await toggleSiteDarkMode(message.hostname, sender.tab?.id);
      return { success: true };
    
    case 'SET_THEME':
      await setTheme(message.themeId);
      return { success: true };
    
    case 'SAVE_SITE_SETTINGS':
      await saveSiteSettings(message.hostname, message.settings);
      if (sender.tab?.id) {
        await notifyTab(sender.tab.id);
      }
      return { success: true };
    
    case 'ADD_CUSTOM_THEME':
      state.customThemes[message.theme.id] = message.theme;
      await chrome.storage.sync.set({
        [CONFIG.STORAGE_KEYS.CUSTOM_THEMES]: state.customThemes
      });
      return { success: true };
    
    case 'DELETE_CUSTOM_THEME':
      delete state.customThemes[message.themeId];
      await chrome.storage.sync.set({
        [CONFIG.STORAGE_KEYS.CUSTOM_THEMES]: state.customThemes
      });
      return { success: true };
    
    case 'EXCLUDE_SITE':
      if (!state.settings.excludedSites) {
        state.settings.excludedSites = [];
      }
      if (!state.settings.excludedSites.includes(message.hostname)) {
        state.settings.excludedSites.push(message.hostname);
        await saveSettings({ excludedSites: state.settings.excludedSites });
        await notifyAllTabs();
      }
      return { success: true };
    
    case 'INCLUDE_SITE':
      if (state.settings.excludedSites) {
        state.settings.excludedSites = state.settings.excludedSites.filter(
          h => h !== message.hostname
        );
        await saveSettings({ excludedSites: state.settings.excludedSites });
        await notifyAllTabs();
      }
      return { success: true };
    
    case 'GET_THEME_CSS':
      return {
        success: true,
        ...generateThemeStyles(message.themeId || state.settings.currentTheme, state.settings)
      };
    
    default:
      console.warn('[DarkMode] Unknown message type:', message.type);
      return { success: false, error: 'Unknown message type' };
  }
}

// ============================================================================
// Tab Events
// ============================================================================

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await notifyTab(tabId);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await notifyTab(activeInfo.tabId);
});

// ============================================================================
// Storage Change Listener
// ============================================================================

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    console.log('[DarkMode] Storage changed:', changes);
    loadSettings(); // Reload settings when they change
  }
});

// ============================================================================
// Initialize on Load
// ============================================================================

(async () => {
  await loadSettings();
  await updateBadge();
  await setupScheduleAlarms();
  console.log('[DarkMode] Background service worker initialized');
})();
