/**
 * Screenshot Annotator - Popup Script
 */
document.addEventListener('DOMContentLoaded', async () => {
  const captureBtn = document.getElementById('captureBtn');
  const captureAreaBtn = document.getElementById('captureAreaBtn');
  const captureFullBtn = document.getElementById('captureFullBtn');
  const historyList = document.getElementById('historyList');
  const optionsBtn = document.getElementById('optionsBtn');

  // Capture visible area
  captureBtn?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      captureBtn.disabled = true;
      captureBtn.textContent = 'Capturing...';
      
      try {
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
        await saveScreenshot(dataUrl, tab.title);
        captureBtn.textContent = '✓ Captured!';
      } catch (e) {
        captureBtn.textContent = '✗ Failed';
      }
      
      setTimeout(() => {
        captureBtn.disabled = false;
        captureBtn.textContent = 'Capture Visible';
      }, 1500);
    }
  });

  // Capture with selection
  captureAreaBtn?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, { type: 'START_SELECTION' });
      window.close();
    }
  });

  // Capture full page
  captureFullBtn?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_FULL' });
      window.close();
    }
  });

  async function saveScreenshot(dataUrl, title) {
    const { screenshots = [] } = await chrome.storage.local.get('screenshots');
    screenshots.unshift({
      id: Date.now(),
      dataUrl,
      title,
      timestamp: new Date().toISOString()
    });
    await chrome.storage.local.set({ screenshots: screenshots.slice(0, 20) });
    loadHistory();
  }

  async function loadHistory() {
    const { screenshots = [] } = await chrome.storage.local.get('screenshots');
    historyList.innerHTML = screenshots.length ? screenshots.slice(0, 5).map(s => `
      <div class="history-item">
        <img src="${s.dataUrl}" alt="Screenshot">
        <span>${s.title?.substring(0, 20) || 'Screenshot'}</span>
      </div>
    `).join('') : '<div class="empty">No screenshots yet</div>';
  }

  optionsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  loadHistory();
});
