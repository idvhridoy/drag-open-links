'use strict';

/**
 * DragOpenLinks - Popup Script
 * Handles settings UI and storage
 */

// Default settings
const DEFAULTS = {
  maxTabs: 50,
  openDelay: 1200,
  showToast: true,
  showCounter: true
};

// DOM Elements
const elements = {
  maxTabs: document.getElementById('maxTabs'),
  openDelay: document.getElementById('openDelay'),
  showToast: document.getElementById('showToast'),
  showCounter: document.getElementById('showCounter'),
  saveBtn: document.getElementById('saveBtn'),
  resetBtn: document.getElementById('resetBtn')
};

// Toast notification
const showToast = (message) => {
  let toast = document.querySelector('.toast');
  
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.classList.add('visible');
  
  setTimeout(() => {
    toast.classList.remove('visible');
  }, 2000);
};

// Helper to check if chrome runtime is available
const isChromeRuntimeAvailable = () => {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
};

// Load settings from storage
const loadSettings = async () => {
  try {
    if (!isChromeRuntimeAvailable()) {
      console.warn('Chrome runtime not available, using defaults');
      Object.assign(elements, {
        maxTabs: { value: DEFAULTS.maxTabs },
        openDelay: { value: DEFAULTS.openDelay },
        showToast: { checked: DEFAULTS.showToast },
        showCounter: { checked: DEFAULTS.showCounter }
      });
      return;
    }
    
    const result = await chrome.storage.sync.get(DEFAULTS);
    
    elements.maxTabs.value = result.maxTabs;
    elements.openDelay.value = result.openDelay;
    elements.showToast.checked = result.showToast;
    elements.showCounter.checked = result.showCounter;
  } catch (error) {
    console.error('Failed to load settings:', error);
    // Use defaults on error
    elements.maxTabs.value = DEFAULTS.maxTabs;
    elements.openDelay.value = DEFAULTS.openDelay;
    elements.showToast.checked = DEFAULTS.showToast;
    elements.showCounter.checked = DEFAULTS.showCounter;
  }
};

// Save settings to storage
const saveSettings = async () => {
  if (!isChromeRuntimeAvailable()) {
    console.error('Chrome runtime not available, cannot save settings');
    showToast('Extension error. Please reload the extension.');
    return;
  }
  
  const settings = {
    maxTabs: Math.min(100, Math.max(1, parseInt(elements.maxTabs.value, 10) || DEFAULTS.maxTabs)),
    openDelay: Math.min(5000, Math.max(0, parseInt(elements.openDelay.value, 10) || DEFAULTS.openDelay)),
    showToast: elements.showToast.checked,
    showCounter: elements.showCounter.checked
  };
  
  try {
    await chrome.storage.sync.set(settings);
    
    // Notify content scripts of settings change
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          settings
        });
      } catch {
        // Tab might not have content script loaded
      }
    }
    
    showToast('Settings saved!');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showToast('Failed to save settings');
  }
};

// Reset to defaults
const resetSettings = async () => {
  if (!isChromeRuntimeAvailable()) {
    console.error('Chrome runtime not available, cannot reset settings');
    showToast('Extension error. Please reload the extension.');
    return;
  }
  
  try {
    await chrome.storage.sync.set(DEFAULTS);
    
    elements.maxTabs.value = DEFAULTS.maxTabs;
    elements.openDelay.value = DEFAULTS.openDelay;
    elements.showToast.checked = DEFAULTS.showToast;
    elements.showCounter.checked = DEFAULTS.showCounter;
    
    showToast('Settings reset to defaults');
  } catch (error) {
    console.error('Failed to reset settings:', error);
    showToast('Failed to reset settings');
  }
};

// Event listeners
elements.saveBtn.addEventListener('click', saveSettings);
elements.resetBtn.addEventListener('click', resetSettings);

// Load settings on popup open
document.addEventListener('DOMContentLoaded', loadSettings);

// Update version from manifest
const updateVersion = () => {
  try {
    if (isChromeRuntimeAvailable()) {
      const version = chrome.runtime.getManifest().version;
      
      // Update header version
      const versionEl = document.querySelector('.version');
      if (versionEl) {
        versionEl.textContent = `v${version}`;
      }
      
      // Update footer version
      const footerVersionEl = document.getElementById('version');
      if (footerVersionEl) {
        footerVersionEl.textContent = version;
      }
    }
  } catch (error) {
    console.error('Failed to get version:', error);
  }
};

updateVersion();
