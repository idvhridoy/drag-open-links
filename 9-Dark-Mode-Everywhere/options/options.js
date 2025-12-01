/**
 * Dark Mode Everywhere - Options Page Script
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
  };

  // ============================================================================
  // State
  // ============================================================================

  let state = {
    settings: null,
    themes: {},
    siteSettings: {},
    customThemes: {}
  };

  // ============================================================================
  // Initialization
  // ============================================================================

  document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    setupNavigation();
    setupEventListeners();
    renderUI();
  });

  async function loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      
      if (response.success) {
        state.settings = response.settings;
        state.themes = response.themes;
        state.siteSettings = response.siteSettings;
      }
    } catch (error) {
      console.error('[DarkMode Options] Failed to load settings:', error);
    }
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetSection = item.dataset.section;
        
        // Update nav active state
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Update section visibility
        sections.forEach(section => {
          section.classList.toggle('active', section.id === targetSection);
        });
        
        // Update URL hash
        history.pushState(null, '', `#${targetSection}`);
      });
    });
    
    // Handle initial hash
    const hash = window.location.hash.slice(1);
    if (hash) {
      const navItem = document.querySelector(`[data-section="${hash}"]`);
      if (navItem) {
        navItem.click();
      }
    }
  }

  // ============================================================================
  // Event Listeners
  // ============================================================================

  function setupEventListeners() {
    // General settings
    document.getElementById('globalEnabled').addEventListener('change', handleSettingChange);
    document.getElementById('syncWithSystem').addEventListener('change', handleSettingChange);
    document.getElementById('dimImages').addEventListener('change', handleSettingChange);
    document.getElementById('dimVideos').addEventListener('change', handleSettingChange);
    
    // Sliders
    setupSlider('brightness');
    setupSlider('contrast');
    setupSlider('grayscale');
    setupSlider('sepia');
    
    // Schedule
    document.getElementById('scheduleEnabled').addEventListener('change', handleScheduleToggle);
    document.getElementById('scheduleStartTime').addEventListener('change', handleScheduleChange);
    document.getElementById('scheduleEndTime').addEventListener('change', handleScheduleChange);
    
    // Accessibility
    document.getElementById('highContrast').addEventListener('change', handleSettingChange);
    document.getElementById('colorBlindMode').addEventListener('change', handleSettingChange);
    document.getElementById('reduceMotion').addEventListener('change', handleSettingChange);
    
    // Custom theme
    document.getElementById('customBgColor').addEventListener('input', updateCustomThemePreview);
    document.getElementById('customTextColor').addEventListener('input', updateCustomThemePreview);
    document.getElementById('customLinkColor').addEventListener('input', updateCustomThemePreview);
    document.getElementById('customAccentColor').addEventListener('input', updateCustomThemePreview);
    document.getElementById('saveCustomTheme').addEventListener('click', saveCustomTheme);
    
    // Sites
    document.getElementById('addExcludedSite').addEventListener('click', addExcludedSite);
    document.getElementById('newExcludedSite').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addExcludedSite();
    });
  }

  function setupSlider(name) {
    const slider = document.getElementById(name);
    const value = document.getElementById(`${name}Value`);
    
    slider.addEventListener('input', () => {
      value.textContent = `${slider.value}%`;
    });
    
    slider.addEventListener('change', async () => {
      await updateSettings({ [name]: parseInt(slider.value) });
    });
  }

  // ============================================================================
  // Settings Handlers
  // ============================================================================

  async function handleSettingChange(e) {
    const { id, checked, value, type } = e.target;
    const settingValue = type === 'checkbox' ? checked : value;
    
    await updateSettings({ [id]: settingValue });
  }

  async function handleScheduleToggle(e) {
    const enabled = e.target.checked;
    const scheduleGroup = document.getElementById('scheduleGroup');
    scheduleGroup.classList.toggle('active', enabled);
    
    await updateSettings({ scheduleEnabled: enabled });
  }

  async function handleScheduleChange() {
    const startTime = document.getElementById('scheduleStartTime').value;
    const endTime = document.getElementById('scheduleEndTime').value;
    
    await updateSettings({
      scheduleStart: startTime,
      scheduleEnd: endTime
    });
    
    updateScheduleVisual();
  }

  async function updateSettings(settings) {
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings
      });
      
      state.settings = { ...state.settings, ...settings };
    } catch (error) {
      console.error('[DarkMode Options] Failed to update settings:', error);
    }
  }

  // ============================================================================
  // Render UI
  // ============================================================================

  function renderUI() {
    if (!state.settings) return;
    
    // General settings
    document.getElementById('globalEnabled').checked = state.settings.globalEnabled;
    document.getElementById('syncWithSystem').checked = state.settings.syncWithSystem;
    document.getElementById('dimImages').checked = state.settings.dimImages ?? true;
    document.getElementById('dimVideos').checked = state.settings.dimVideos ?? false;
    
    // Sliders
    setSliderValue('brightness', state.settings.brightness || 100);
    setSliderValue('contrast', state.settings.contrast || 100);
    setSliderValue('grayscale', state.settings.grayscale || 0);
    setSliderValue('sepia', state.settings.sepia || 0);
    
    // Schedule
    document.getElementById('scheduleEnabled').checked = state.settings.scheduleEnabled;
    document.getElementById('scheduleStartTime').value = state.settings.scheduleStart || '20:00';
    document.getElementById('scheduleEndTime').value = state.settings.scheduleEnd || '07:00';
    document.getElementById('scheduleGroup').classList.toggle('active', state.settings.scheduleEnabled);
    updateScheduleVisual();
    
    // Accessibility
    document.getElementById('highContrast').checked = state.settings.highContrast;
    document.getElementById('colorBlindMode').value = state.settings.colorBlindMode || 'none';
    document.getElementById('reduceMotion').checked = state.settings.reduceMotion;
    
    // Themes
    renderThemes();
    
    // Sites
    renderExcludedSites();
    renderSiteOverrides();
    
    // Custom theme preview
    updateCustomThemePreview();
  }

  function setSliderValue(name, value) {
    const slider = document.getElementById(name);
    const display = document.getElementById(`${name}Value`);
    slider.value = value;
    display.textContent = `${value}%`;
  }

  // ============================================================================
  // Themes
  // ============================================================================

  function renderThemes() {
    const gallery = document.getElementById('themeGallery');
    gallery.innerHTML = '';
    
    const allThemes = { ...THEMES, ...state.themes };
    
    for (const [id, theme] of Object.entries(allThemes)) {
      const card = createThemeCard(id, theme);
      gallery.appendChild(card);
    }
  }

  function createThemeCard(id, theme) {
    const card = document.createElement('div');
    card.className = `theme-card${state.settings.currentTheme === id ? ' active' : ''}`;
    card.dataset.themeId = id;
    
    const preview = document.createElement('div');
    preview.className = 'theme-preview';
    preview.style.backgroundColor = theme.bgColor;
    preview.style.color = theme.textColor;
    preview.textContent = 'Aa';
    
    const name = document.createElement('span');
    name.className = 'theme-name';
    name.textContent = theme.name;
    
    card.appendChild(preview);
    card.appendChild(name);
    
    card.addEventListener('click', () => selectTheme(id));
    
    return card;
  }

  async function selectTheme(themeId) {
    try {
      await chrome.runtime.sendMessage({
        type: 'SET_THEME',
        themeId
      });
      
      state.settings.currentTheme = themeId;
      
      document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('active', card.dataset.themeId === themeId);
      });
    } catch (error) {
      console.error('[DarkMode Options] Failed to set theme:', error);
    }
  }

  // ============================================================================
  // Custom Theme
  // ============================================================================

  function updateCustomThemePreview() {
    const bgColor = document.getElementById('customBgColor').value;
    const textColor = document.getElementById('customTextColor').value;
    const linkColor = document.getElementById('customLinkColor').value;
    const accentColor = document.getElementById('customAccentColor').value;
    
    const preview = document.getElementById('customThemePreview');
    const content = preview.querySelector('.preview-content');
    const btn = preview.querySelector('.preview-btn');
    
    content.style.backgroundColor = bgColor;
    content.style.color = textColor;
    
    const link = content.querySelector('a');
    if (link) link.style.color = linkColor;
    
    btn.style.backgroundColor = accentColor;
    btn.style.color = bgColor;
  }

  async function saveCustomTheme() {
    const name = document.getElementById('customThemeName').value.trim();
    
    if (!name) {
      alert('Please enter a theme name');
      return;
    }
    
    const themeId = `custom-${Date.now()}`;
    const theme = {
      id: themeId,
      name,
      bgColor: document.getElementById('customBgColor').value,
      textColor: document.getElementById('customTextColor').value,
      linkColor: document.getElementById('customLinkColor').value,
      accentColor: document.getElementById('customAccentColor').value
    };
    
    try {
      await chrome.runtime.sendMessage({
        type: 'ADD_CUSTOM_THEME',
        theme
      });
      
      state.themes[themeId] = theme;
      renderThemes();
      
      // Clear form
      document.getElementById('customThemeName').value = '';
      
      alert('Theme saved successfully!');
    } catch (error) {
      console.error('[DarkMode Options] Failed to save custom theme:', error);
      alert('Failed to save theme');
    }
  }

  // ============================================================================
  // Schedule Visual
  // ============================================================================

  function updateScheduleVisual() {
    const startTime = document.getElementById('scheduleStartTime').value;
    const endTime = document.getElementById('scheduleEndTime').value;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startPercent = ((startHour * 60 + startMin) / (24 * 60)) * 100;
    const endPercent = ((endHour * 60 + endMin) / (24 * 60)) * 100;
    
    const activeBar = document.getElementById('scheduleActiveBar');
    
    if (startPercent < endPercent) {
      activeBar.style.left = `${startPercent}%`;
      activeBar.style.width = `${endPercent - startPercent}%`;
    } else {
      // Overnight schedule
      activeBar.style.left = `${startPercent}%`;
      activeBar.style.width = `${100 - startPercent + endPercent}%`;
    }
  }

  // ============================================================================
  // Excluded Sites
  // ============================================================================

  function renderExcludedSites() {
    const list = document.getElementById('excludedSitesList');
    const sites = state.settings.excludedSites || [];
    
    if (sites.length === 0) {
      list.innerHTML = '<div class="empty-message">No excluded sites</div>';
      return;
    }
    
    list.innerHTML = sites.map(site => `
      <div class="site-item" data-site="${site}">
        <span class="site-name">${site}</span>
        <button class="btn-remove" title="Remove">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `).join('');
    
    // Add remove handlers
    list.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const site = btn.closest('.site-item').dataset.site;
        removeExcludedSite(site);
      });
    });
  }

  async function addExcludedSite() {
    const input = document.getElementById('newExcludedSite');
    const site = input.value.trim().toLowerCase();
    
    if (!site) return;
    
    // Basic validation
    if (!site.includes('.')) {
      alert('Please enter a valid domain (e.g., example.com)');
      return;
    }
    
    try {
      await chrome.runtime.sendMessage({
        type: 'EXCLUDE_SITE',
        hostname: site
      });
      
      if (!state.settings.excludedSites) {
        state.settings.excludedSites = [];
      }
      state.settings.excludedSites.push(site);
      
      input.value = '';
      renderExcludedSites();
    } catch (error) {
      console.error('[DarkMode Options] Failed to add excluded site:', error);
    }
  }

  async function removeExcludedSite(site) {
    try {
      await chrome.runtime.sendMessage({
        type: 'INCLUDE_SITE',
        hostname: site
      });
      
      state.settings.excludedSites = state.settings.excludedSites.filter(s => s !== site);
      renderExcludedSites();
    } catch (error) {
      console.error('[DarkMode Options] Failed to remove excluded site:', error);
    }
  }

  // ============================================================================
  // Site Overrides
  // ============================================================================

  function renderSiteOverrides() {
    const list = document.getElementById('siteOverridesList');
    const sites = Object.entries(state.siteSettings);
    
    if (sites.length === 0) {
      list.innerHTML = '<div class="empty-message">No site-specific settings</div>';
      return;
    }
    
    list.innerHTML = sites.map(([site, settings]) => `
      <div class="site-item" data-site="${site}">
        <span class="site-name">${site}</span>
        <span class="site-status">${settings.enabled ? 'Enabled' : 'Disabled'}</span>
      </div>
    `).join('');
  }
})();
