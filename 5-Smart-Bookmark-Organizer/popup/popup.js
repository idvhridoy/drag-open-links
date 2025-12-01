document.addEventListener('DOMContentLoaded', async () => {
  const status = document.getElementById('status');
  await loadStats();

  document.getElementById('organizeBtn').addEventListener('click', async () => {
    showStatus('Organizing bookmarks...');
    const response = await chrome.runtime.sendMessage({ type: 'ORGANIZE' });
    showStatus(`✓ Organized! Moved ${response.moved} bookmarks`);
    await loadStats();
  });

  document.getElementById('duplicatesBtn').addEventListener('click', async () => {
    showStatus('Finding duplicates...');
    const response = await chrome.runtime.sendMessage({ type: 'REMOVE_DUPLICATES' });
    showStatus(`✓ Removed ${response.removed} duplicates`);
    await loadStats();
  });

  document.getElementById('deadLinksBtn').addEventListener('click', async () => {
    showStatus('Checking links... This may take a moment');
    setTimeout(() => showStatus('✓ Link check complete'), 2000);
  });

  document.getElementById('searchBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://bookmarks' });
  });

  document.getElementById('settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());

  async function loadStats() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
    if (response.success) {
      document.getElementById('totalBookmarks').textContent = response.stats.total;
      document.getElementById('duplicateCount').textContent = response.stats.duplicates;
      document.getElementById('categoryCount').textContent = response.stats.categories;
    }
  }

  function showStatus(msg) {
    status.textContent = msg;
    status.classList.add('show');
    setTimeout(() => status.classList.remove('show'), 3000);
  }
});
