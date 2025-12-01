document.addEventListener('DOMContentLoaded', async () => {
  const mainToggle = document.getElementById('mainToggle');
  const statusCard = document.getElementById('statusCard');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');
  const blockedToday = document.getElementById('blockedToday');
  const totalBlocked = document.getElementById('totalBlocked');
  const pageTrackers = document.getElementById('pageTrackers');
  const trackersList = document.getElementById('trackersList');
  const cleanCookiesBtn = document.getElementById('cleanCookiesBtn');
  const whitelistBtn = document.getElementById('whitelistBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const hostname = document.getElementById('hostname');

  let currentHostname = '';

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    try {
      currentHostname = new URL(tab.url).hostname;
      hostname.textContent = currentHostname;
    } catch (e) {}
  }

  // Load status
  await loadStatus();

  // Event listeners
  mainToggle.addEventListener('change', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'TOGGLE_PROTECTION' });
    updateUI(response.enabled);
  });

  cleanCookiesBtn.addEventListener('click', async () => {
    cleanCookiesBtn.disabled = true;
    cleanCookiesBtn.textContent = 'Cleaning...';
    const response = await chrome.runtime.sendMessage({ type: 'CLEAN_COOKIES' });
    cleanCookiesBtn.textContent = `Removed ${response.removed} cookies`;
    setTimeout(() => {
      cleanCookiesBtn.disabled = false;
      cleanCookiesBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Clean Cookies`;
    }, 2000);
  });

  whitelistBtn.addEventListener('click', async () => {
    if (!currentHostname) return;
    await chrome.runtime.sendMessage({ type: 'ADD_WHITELIST', hostname: currentHostname });
    whitelistBtn.textContent = 'Added!';
    setTimeout(() => {
      whitelistBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/></svg> Whitelist Site`;
    }, 2000);
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  async function loadStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS', tabId: tab?.id });
      
      if (response.success) {
        mainToggle.checked = response.enabled;
        updateUI(response.enabled);
        
        blockedToday.textContent = response.blockedToday || 0;
        totalBlocked.textContent = formatNumber(response.stats.totalBlocked || 0);
        pageTrackers.textContent = response.tabCount || 0;
        
        if (response.tabTrackers && response.tabTrackers.length > 0) {
          trackersList.innerHTML = response.tabTrackers.map(t => 
            `<div class="tracker-item">${t}</div>`
          ).join('');
        }
      }
    } catch (error) {
      console.error('Load status error:', error);
    }
  }

  function updateUI(enabled) {
    if (enabled) {
      statusCard.classList.remove('disabled');
      statusTitle.textContent = 'Protected';
      statusDesc.textContent = 'Your browsing is secure';
    } else {
      statusCard.classList.add('disabled');
      statusTitle.textContent = 'Disabled';
      statusDesc.textContent = 'Protection is turned off';
    }
  }

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }
});
