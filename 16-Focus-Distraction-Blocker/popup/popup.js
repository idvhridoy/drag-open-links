/**
 * Focus Distraction Blocker - Popup Script
 */
document.addEventListener('DOMContentLoaded', async () => {
  const elements = {
    enableToggle: document.getElementById('enableToggle'),
    siteInput: document.getElementById('siteInput'),
    addBtn: document.getElementById('addBtn'),
    sitesList: document.getElementById('sitesList'),
    blockedCount: document.getElementById('blockedCount'),
    optionsBtn: document.getElementById('optionsBtn')
  };

  let settings = { enabled: true, blockedSites: [] };

  async function loadSettings() {
    const data = await chrome.storage.local.get(['enabled', 'blockedSites', 'blockedCount']);
    settings.enabled = data.enabled !== false;
    settings.blockedSites = data.blockedSites || ['facebook.com', 'twitter.com', 'instagram.com', 'reddit.com', 'youtube.com'];
    
    elements.enableToggle.checked = settings.enabled;
    elements.blockedCount.textContent = data.blockedCount || 0;
    renderSites();
  }

  function renderSites() {
    elements.sitesList.innerHTML = settings.blockedSites.map(site => `
      <div class="site-item">
        <span class="site-name">${site}</span>
        <button class="remove-btn" data-site="${site}">×</button>
      </div>
    `).join('');
    
    elements.sitesList.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => removeSite(btn.dataset.site));
    });
  }

  async function saveSites() {
    await chrome.storage.local.set({ blockedSites: settings.blockedSites });
    chrome.runtime.sendMessage({ type: 'UPDATE_SITES', sites: settings.blockedSites });
  }

  function addSite() {
    const site = elements.siteInput.value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (site && !settings.blockedSites.includes(site)) {
      settings.blockedSites.push(site);
      saveSites();
      renderSites();
      elements.siteInput.value = '';
    }
  }

  function removeSite(site) {
    settings.blockedSites = settings.blockedSites.filter(s => s !== site);
    saveSites();
    renderSites();
  }

  elements.enableToggle?.addEventListener('change', async () => {
    settings.enabled = elements.enableToggle.checked;
    await chrome.storage.local.set({ enabled: settings.enabled });
    chrome.runtime.sendMessage({ type: 'TOGGLE_ENABLED', enabled: settings.enabled });
  });

  elements.addBtn?.addEventListener('click', addSite);
  elements.siteInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSite();
  });

  elements.optionsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  loadSettings();
});
