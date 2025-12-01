/**
 * Dark Mode Everywhere - Popup Script
 * Handles popup UI interactions and settings management
 */

(() => {
  'use strict';

  // ============================================================================
  // Constants
  // ============================================================================

  const THEMES = {
    'dark-default': {
      name: 'Pure Dark',
      bgColor: '#1a1a1a',
      textColor: '#e8e8e8'
    },
    'dark-blue': {
      name: 'Dark Blue',
      bgColor: '#0d1117',
      textColor: '#c9d1d9'
    },
    'dark-warm': {
      name: 'Dark Warm',
      bgColor: '#1c1917',
      textColor: '#e7e5e4'
    },
    'dark-amoled': {
      name: 'AMOLED',
      bgColor: '#000000',
      textColor: '#ffffff'
    },
    'dark-sepia': {
      name: 'Sepia',
      bgColor: '#1a1814',
      textColor: '#d4c5a9'
    },
    'high-contrast': {
      name: 'High Contrast',
      bgColor: '#000000',
      textColor: '#ffff00'
    }
  };

  // ============================================================================
  // State
  // ============================================================================

  let state = {
    settings: null,
    themes: {},
    siteSettings: {},
    currentHostname: '',
    currentTab: null
  };

  // ============================================================================
  // DOM Elements
  // ============================================================================

  const elements = {
    globalToggle: null,
    siteInfo: null,
    toggleSiteBtn: null,
    toggleSiteText: null,
    excludeSiteBtn: null,
    themeGrid: null,
    brightnessSlider: null,
    brightnessValue: null,
    contrastSlider: null,
    contrastValue: null,
    dimImagesCheck: null,
    dimVideosCheck: null,
    scheduleToggle: null,
    scheduleTimes: null,
    scheduleStart: null,
    scheduleEnd: null,
    optionsBtn: null
  };

  // ============================================================================
  // Initialization
  // ============================================================================

  document.addEventListener('DOMContentLoaded', async () => {
    cacheElements();
    await initialize();
    setupEventListeners();
  });

  function cacheElements() {
    elements.globalToggle = document.getElementById('globalToggle');
    elements.siteInfo = document.getElementById('siteInfo');
    elements.toggleSiteBtn = document.getElementById('toggleSiteBtn');
    elements.toggleSiteText = document.getElementById('toggleSiteText');
    elements.excludeSiteBtn = document.getElementById('excludeSiteBtn');
    elements.themeGrid = document.getElementById('themeGrid');
    elements.brightnessSlider = document.getElementById('brightnessSlider');
    elements.brightnessValue = document.getElementById('brightnessValue');
    elements.contrastSlider = document.getElementById('contrastSlider');
    elements.contrastValue = document.getElementById('contrastValue');
    elements.dimImagesCheck = document.getElementById('dimImagesCheck');
    elements.dimVideosCheck = document.getElementById('dimVideosCheck');
    elements.scheduleToggle = document.getElementById('scheduleToggle');
    elements.scheduleTimes = document.getElementById('scheduleTimes');
    elements.scheduleStart = document.getElementById('scheduleStart');
    elements.scheduleEnd = document.getElementById('scheduleEnd');
    elements.optionsBtn = document.getElementById('optionsBtn');
  }

  async function initialize() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      state.currentTab = tab;
      
      if (tab?.url) {
        try {
          const url = new URL(tab.url);
          state.currentHostname = url.hostname;
        } catch {
          state.currentHostname = '';
        }
      }
      
      // Get settings from background
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      
      if (response.success) {
        state.settings = response.settings;
        state.themes = { ...THEMES, ...response.themes };
        state.siteSettings = response.siteSettings;
        
        updateUI();
        renderThemes();
      } else {
        showError('Failed to load settings');
      }
    } catch (error) {
      console.error('[DarkMode Popup] Initialization error:', error);
      showError('Failed to connect to extension');
    }
  }

  // ============================================================================
  // UI Updates
  // ============================================================================

  function updateUI() {
    if (!state.settings) return;
    
    // Global toggle
    elements.globalToggle.checked = state.settings.globalEnabled;
    
    // Site info
    updateSiteInfo();
    
    // Sliders
    elements.brightnessSlider.value = state.settings.brightness || 100;
    elements.brightnessValue.textContent = `${state.settings.brightness || 100}%`;
    
    elements.contrastSlider.value = state.settings.contrast || 100;
    elements.contrastValue.textContent = `${state.settings.contrast || 100}%`;
    
    // Checkboxes
    elements.dimImagesCheck.checked = state.settings.dimImages ?? true;
    elements.dimVideosCheck.checked = state.settings.dimVideos ?? false;
    
    // Schedule
    elements.scheduleToggle.checked = state.settings.scheduleEnabled ?? false;
    elements.scheduleStart.value = state.settings.scheduleStart || '20:00';
    elements.scheduleEnd.value = state.settings.scheduleEnd || '07:00';
    updateScheduleUI();
  }

  function updateSiteInfo() {
    if (!state.currentHostname) {
      elements.siteInfo.textContent = 'No website detected';
      elements.siteInfo.classList.add('disabled');
      elements.toggleSiteBtn.disabled = true;
      elements.excludeSiteBtn.disabled = true;
      return;
    }
    
    const siteConfig = state.siteSettings[state.currentHostname];
    const isExcluded = state.settings.excludedSites?.includes(state.currentHostname);
    const isEnabled = isExcluded ? false : (siteConfig?.enabled ?? state.settings.globalEnabled);
    
    elements.siteInfo.textContent = `${state.currentHostname} - ${isEnabled ? 'Dark mode active' : 'Light mode'}`;
    elements.siteInfo.classList.toggle('disabled', !isEnabled);
    
    elements.toggleSiteText.textContent = isEnabled ? 'Disable for this site' : 'Enable for this site';
    elements.excludeSiteBtn.title = isExcluded ? 'Include this site' : 'Exclude this site';
  }

  function renderThemes() {
    elements.themeGrid.innerHTML = '';
    
    const allThemes = { ...THEMES, ...state.themes };
    
    for (const [id, theme] of Object.entries(allThemes)) {
      const themeEl = createThemeElement(id, theme);
      elements.themeGrid.appendChild(themeEl);
    }
  }

  function createThemeElement(id, theme) {
    const div = document.createElement('div');
    div.className = `theme-option${state.settings.currentTheme === id ? ' active' : ''}`;
    div.dataset.themeId = id;
    
    const preview = document.createElement('div');
    preview.className = 'theme-preview';
    preview.style.backgroundColor = theme.bgColor;
    preview.style.color = theme.textColor;
    preview.textContent = 'Aa';
    
    const name = document.createElement('span');
    name.className = 'theme-name';
    name.textContent = theme.name;
    
    div.appendChild(preview);
    div.appendChild(name);
    
    div.addEventListener('click', () => selectTheme(id));
    
    return div;
  }

  function updateScheduleUI() {
    const isEnabled = elements.scheduleToggle.checked;
    elements.scheduleTimes.classList.toggle('active', isEnabled);
  }

  function showError(message) {
    const container = document.querySelector('.popup-container');
    container.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
        <button class="btn" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  function setupEventListeners() {
    // Global toggle
    elements.globalToggle.addEventListener('change', handleGlobalToggle);
    
    // Site controls
    elements.toggleSiteBtn.addEventListener('click', handleToggleSite);
    elements.excludeSiteBtn.addEventListener('click', handleExcludeSite);
    
    // Sliders
    elements.brightnessSlider.addEventListener('input', handleBrightnessChange);
    elements.brightnessSlider.addEventListener('change', saveSliderSettings);
    
    elements.contrastSlider.addEventListener('input', handleContrastChange);
    elements.contrastSlider.addEventListener('change', saveSliderSettings);
    
    // Checkboxes
    elements.dimImagesCheck.addEventListener('change', handleDimImagesChange);
    elements.dimVideosCheck.addEventListener('change', handleDimVideosChange);
    
    // Schedule
    elements.scheduleToggle.addEventListener('change', handleScheduleToggle);
    elements.scheduleStart.addEventListener('change', handleScheduleTimeChange);
    elements.scheduleEnd.addEventListener('change', handleScheduleTimeChange);
    
    // Options
    elements.optionsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  async function handleGlobalToggle() {
    const enabled = elements.globalToggle.checked;
    
    try {
      await chrome.runtime.sendMessage({ type: 'TOGGLE_GLOBAL' });
      state.settings.globalEnabled = enabled;
      updateSiteInfo();
    } catch (error) {
      console.error('[DarkMode Popup] Toggle error:', error);
      elements.globalToggle.checked = !enabled; // Revert
    }
  }

  async function handleToggleSite() {
    if (!state.currentHostname) return;
    
    try {
      await chrome.runtime.sendMessage({
        type: 'TOGGLE_SITE',
        hostname: state.currentHostname
      });
      
      // Refresh settings
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response.success) {
        state.siteSettings = response.siteSettings;
        updateSiteInfo();
      }
    } catch (error) {
      console.error('[DarkMode Popup] Toggle site error:', error);
    }
  }

  async function handleExcludeSite() {
    if (!state.currentHostname) return;
    
    const isExcluded = state.settings.excludedSites?.includes(state.currentHostname);
    
    try {
      await chrome.runtime.sendMessage({
        type: isExcluded ? 'INCLUDE_SITE' : 'EXCLUDE_SITE',
        hostname: state.currentHostname
      });
      
      // Update local state
      if (isExcluded) {
        state.settings.excludedSites = state.settings.excludedSites.filter(
          h => h !== state.currentHostname
        );
      } else {
        if (!state.settings.excludedSites) {
          state.settings.excludedSites = [];
        }
        state.settings.excludedSites.push(state.currentHostname);
      }
      
      updateSiteInfo();
    } catch (error) {
      console.error('[DarkMode Popup] Exclude site error:', error);
    }
  }

  async function selectTheme(themeId) {
    try {
      await chrome.runtime.sendMessage({
        type: 'SET_THEME',
        themeId
      });
      
      state.settings.currentTheme = themeId;
      
      // Update active state
      document.querySelectorAll('.theme-option').forEach(el => {
        el.classList.toggle('active', el.dataset.themeId === themeId);
      });
    } catch (error) {
      console.error('[DarkMode Popup] Set theme error:', error);
    }
  }

  function handleBrightnessChange(e) {
    elements.brightnessValue.textContent = `${e.target.value}%`;
  }

  function handleContrastChange(e) {
    elements.contrastValue.textContent = `${e.target.value}%`;
  }

  async function saveSliderSettings() {
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: {
          brightness: parseInt(elements.brightnessSlider.value),
          contrast: parseInt(elements.contrastSlider.value)
        }
      });
    } catch (error) {
      console.error('[DarkMode Popup] Save slider settings error:', error);
    }
  }

  async function handleDimImagesChange() {
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: {
          dimImages: elements.dimImagesCheck.checked
        }
      });
    } catch (error) {
      console.error('[DarkMode Popup] Dim images error:', error);
    }
  }

  async function handleDimVideosChange() {
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: {
          dimVideos: elements.dimVideosCheck.checked
        }
      });
    } catch (error) {
      console.error('[DarkMode Popup] Dim videos error:', error);
    }
  }

  async function handleScheduleToggle() {
    const enabled = elements.scheduleToggle.checked;
    updateScheduleUI();
    
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: {
          scheduleEnabled: enabled
        }
      });
    } catch (error) {
      console.error('[DarkMode Popup] Schedule toggle error:', error);
    }
  }

  async function handleScheduleTimeChange() {
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: {
          scheduleStart: elements.scheduleStart.value,
          scheduleEnd: elements.scheduleEnd.value
        }
      });
    } catch (error) {
      console.error('[DarkMode Popup] Schedule time error:', error);
    }
  }

  // ============================================================================
  // Keyboard Navigation
  // ============================================================================

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.close();
    }
  });
})();
