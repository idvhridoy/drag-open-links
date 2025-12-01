/**
 * Smart NewTab Dashboard - Popup Script
 */
document.addEventListener('DOMContentLoaded', async () => {
  const elements = {
    clockToggle: document.getElementById('clockToggle'),
    searchToggle: document.getElementById('searchToggle'),
    quotesToggle: document.getElementById('quotesToggle'),
    linksToggle: document.getElementById('linksToggle'),
    notesToggle: document.getElementById('notesToggle'),
    openNewTab: document.getElementById('openNewTab'),
    optionsBtn: document.getElementById('optionsBtn')
  };

  // Load settings
  async function loadSettings() {
    const { dashboardSettings = {} } = await chrome.storage.local.get('dashboardSettings');
    elements.clockToggle.checked = dashboardSettings.showClock !== false;
    elements.searchToggle.checked = dashboardSettings.showSearch !== false;
    elements.quotesToggle.checked = dashboardSettings.showQuotes !== false;
    elements.linksToggle.checked = dashboardSettings.showLinks !== false;
    elements.notesToggle.checked = dashboardSettings.showNotes !== false;
  }

  // Save settings
  async function saveSettings() {
    const settings = {
      showClock: elements.clockToggle.checked,
      showSearch: elements.searchToggle.checked,
      showQuotes: elements.quotesToggle.checked,
      showLinks: elements.linksToggle.checked,
      showNotes: elements.notesToggle.checked
    };
    await chrome.storage.local.set({ dashboardSettings: settings });
  }

  // Event listeners
  [elements.clockToggle, elements.searchToggle, elements.quotesToggle, 
   elements.linksToggle, elements.notesToggle].forEach(el => {
    el?.addEventListener('change', saveSettings);
  });

  elements.openNewTab?.addEventListener('click', () => {
    chrome.tabs.create({});
  });

  elements.optionsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  loadSettings();
});
