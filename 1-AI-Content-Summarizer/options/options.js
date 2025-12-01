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
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  if (response.success) {
    document.getElementById('defaultLength').value = response.settings.defaultLength || 'medium';
    document.getElementById('defaultStyle').value = response.settings.defaultStyle || 'paragraph';
    document.getElementById('showFloatingButton').checked = response.settings.showFloatingButton !== false;
    document.getElementById('voiceEnabled').checked = response.settings.voiceEnabled || false;
    document.getElementById('apiProvider').value = response.settings.apiProvider || 'openai';
  }

  // Setting changes
  ['defaultLength', 'defaultStyle', 'apiProvider'].forEach(id => {
    document.getElementById(id).addEventListener('change', async (e) => {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: { [id]: e.target.value }
      });
    });
  });

  ['showFloatingButton', 'voiceEnabled'].forEach(id => {
    document.getElementById(id).addEventListener('change', async (e) => {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: { [id]: e.target.checked }
      });
    });
  });

  // API Key
  const apiKeyInput = document.getElementById('apiKey');
  const toggleBtn = document.getElementById('toggleApiKey');
  const saveBtn = document.getElementById('saveApiKey');
  const statusText = document.getElementById('apiStatus');

  toggleBtn.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      await chrome.runtime.sendMessage({ type: 'SET_API_KEY', apiKey });
      statusText.textContent = 'API key saved successfully!';
      statusText.className = 'status-text success';
      apiKeyInput.value = '';
    } else {
      statusText.textContent = 'Please enter a valid API key';
      statusText.className = 'status-text error';
    }
  });

  // History
  await loadHistory();

  document.getElementById('clearHistory').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all history?')) {
      await chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' });
      await loadHistory();
    }
  });

  async function loadHistory() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
    const list = document.getElementById('historyList');
    
    if (response.success && response.history.length > 0) {
      list.innerHTML = response.history.map((item, i) => `
        <div class="history-item">
          <div class="history-item-content">
            <div class="history-item-title">${item.title || item.url || 'Summary'}</div>
            <div class="history-item-meta">${new Date(item.timestamp).toLocaleString()}</div>
            <div class="history-item-summary">${item.summary.substring(0, 150)}...</div>
          </div>
        </div>
      `).join('');
    } else {
      list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">No history yet</p>';
    }
  }
});
