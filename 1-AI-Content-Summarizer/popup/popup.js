/**
 * AI Content Summarizer - Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const summarizePageBtn = document.getElementById('summarizePageBtn');
  const openPanelBtn = document.getElementById('openPanelBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const configureApiBtn = document.getElementById('configureApiBtn');
  const viewAllBtn = document.getElementById('viewAllBtn');
  const statusIndicator = document.getElementById('statusIndicator');
  const historyList = document.getElementById('historyList');

  // Load settings and check API status
  await checkApiStatus();
  await loadHistory();
  setupOptionButtons();

  // Event Listeners
  summarizePageBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.runtime.sendMessage({ type: 'SUMMARIZE_PAGE' });
      window.close();
    }
  });

  openPanelBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  configureApiBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  viewAllBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Functions
  async function checkApiStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      const dot = statusIndicator.querySelector('.status-dot');
      const text = statusIndicator.querySelector('.status-text');
      
      if (response.hasApiKey) {
        dot.classList.add('connected');
        dot.classList.remove('disconnected');
        text.textContent = 'AI API Connected';
      } else {
        dot.classList.add('disconnected');
        dot.classList.remove('connected');
        text.textContent = 'Using Basic Mode';
      }
    } catch (error) {
      console.error('Failed to check API status:', error);
    }
  }

  async function loadHistory() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
      
      if (response.success && response.history.length > 0) {
        historyList.innerHTML = response.history.slice(0, 3).map((item, index) => `
          <div class="history-item" data-index="${index}">
            <div class="history-item-title">${item.title || item.url || 'Summary'}</div>
            <div class="history-item-meta">${formatDate(item.timestamp)}</div>
          </div>
        `).join('');

        historyList.querySelectorAll('.history-item').forEach(el => {
          el.addEventListener('click', () => {
            // Open history item
            chrome.runtime.openOptionsPage();
          });
        });
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  function setupOptionButtons() {
    document.querySelectorAll('.option-buttons').forEach(group => {
      group.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          group.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          const length = btn.dataset.length;
          const style = btn.dataset.style;
          
          if (length) {
            await chrome.runtime.sendMessage({
              type: 'UPDATE_SETTINGS',
              settings: { defaultLength: length }
            });
          }
          
          if (style) {
            await chrome.runtime.sendMessage({
              type: 'UPDATE_SETTINGS',
              settings: { defaultStyle: style }
            });
          }
        });
      });
    });
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }
});
