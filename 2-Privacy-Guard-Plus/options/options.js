document.addEventListener('DOMContentLoaded', async () => {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      item.classList.add('active');
      document.getElementById(item.dataset.section).classList.add('active');
    });
  });

  // Load settings
  const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
  if (response.success) {
    document.getElementById('enabled').checked = response.enabled;
    document.getElementById('blockTrackers').checked = response.settings.blockTrackers;
    document.getElementById('blockFingerprinting').checked = response.settings.blockFingerprinting;
    document.getElementById('blockCryptominers').checked = response.settings.blockCryptominers;
    document.getElementById('blockThirdPartyCookies').checked = response.settings.blockThirdPartyCookies;
    document.getElementById('autoCleanCookies').checked = response.settings.autoCleanCookies;
    
    document.getElementById('statTotal').textContent = response.stats.totalBlocked || 0;
    document.getElementById('statTrackers').textContent = response.stats.trackersBlocked || 0;
    document.getElementById('statCookies').textContent = response.stats.cookiesBlocked || 0;
    document.getElementById('statFingerprints').textContent = response.stats.fingerprintsBlocked || 0;
  }

  // Settings change handlers
  const settingIds = ['enabled', 'blockTrackers', 'blockFingerprinting', 'blockCryptominers', 'blockThirdPartyCookies', 'autoCleanCookies'];
  settingIds.forEach(id => {
    document.getElementById(id).addEventListener('change', async (e) => {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: { [id]: e.target.checked }
      });
    });
  });

  // Clean cookies
  document.getElementById('cleanNowBtn').addEventListener('click', async () => {
    const btn = document.getElementById('cleanNowBtn');
    btn.textContent = 'Cleaning...';
    const response = await chrome.runtime.sendMessage({ type: 'CLEAN_COOKIES' });
    btn.textContent = `Removed ${response.removed} cookies`;
    setTimeout(() => btn.textContent = 'Clean Cookies', 3000);
  });

  // Whitelist
  await loadWhitelist();
  
  document.getElementById('addSiteBtn').addEventListener('click', async () => {
    const input = document.getElementById('newSite');
    const site = input.value.trim();
    if (site) {
      await chrome.runtime.sendMessage({ type: 'ADD_WHITELIST', hostname: site });
      input.value = '';
      await loadWhitelist();
    }
  });

  async function loadWhitelist() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_WHITELIST' });
    const container = document.getElementById('whitelistItems');
    if (response.whitelist && response.whitelist.length > 0) {
      container.innerHTML = response.whitelist.map(site => `
        <div class="whitelist-item">
          <span>${site}</span>
          <button class="btn-danger" data-site="${site}">Remove</button>
        </div>
      `).join('');
      container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', async () => {
          await chrome.runtime.sendMessage({ type: 'REMOVE_WHITELIST', hostname: btn.dataset.site });
          await loadWhitelist();
        });
      });
    } else {
      container.innerHTML = '<p style="color: var(--text-muted);">No whitelisted sites</p>';
    }
  }

  // Reset stats
  document.getElementById('resetStatsBtn').addEventListener('click', async () => {
    if (confirm('Reset all statistics?')) {
      await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: { stats: { totalBlocked: 0, trackersBlocked: 0, cookiesBlocked: 0, fingerprintsBlocked: 0 }}});
      location.reload();
    }
  });
});
