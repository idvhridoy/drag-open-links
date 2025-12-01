/**
 * Privacy Shield Suite - Popup Script
 */
document.addEventListener('DOMContentLoaded', async () => {
  const elements = {
    masterToggle: document.getElementById('masterToggle'),
    canvasToggle: document.getElementById('canvasToggle'),
    webglToggle: document.getElementById('webglToggle'),
    audioToggle: document.getElementById('audioToggle'),
    trackersBlocked: document.getElementById('trackersBlocked'),
    fingerprintsBlocked: document.getElementById('fingerprintsBlocked'),
    sitesProtected: document.getElementById('sitesProtected'),
    optionsBtn: document.getElementById('optionsBtn')
  };

  // Load settings and stats
  async function loadData() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    if (response.success) {
      const { settings, stats } = response;
      elements.masterToggle.checked = settings.enabled !== false;
      elements.canvasToggle.checked = settings.canvasProtection !== false;
      elements.webglToggle.checked = settings.webglProtection !== false;
      elements.audioToggle.checked = settings.audioProtection !== false;
      
      elements.trackersBlocked.textContent = stats.trackersBlocked || 0;
      elements.fingerprintsBlocked.textContent = stats.fingerprintsBlocked || 0;
      elements.sitesProtected.textContent = stats.sitesProtected || 0;
    }
  }

  // Save settings
  async function saveSettings() {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: {
        enabled: elements.masterToggle.checked,
        canvasProtection: elements.canvasToggle.checked,
        webglProtection: elements.webglToggle.checked,
        audioProtection: elements.audioToggle.checked
      }
    });
  }

  // Event listeners
  [elements.masterToggle, elements.canvasToggle, elements.webglToggle, elements.audioToggle]
    .forEach(el => el?.addEventListener('change', saveSettings));

  elements.optionsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  loadData();
});
