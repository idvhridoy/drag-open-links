// Auto Flow - Popup Script
document.addEventListener('DOMContentLoaded', async () => {
  const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
  
  // Update UI with state
  document.getElementById('queueCount').textContent = state.queue.length;
  updateSettings(state.settings);
  updateStatus(state.isProcessing);
  loadHistory();
  loadFailed();
  
  // Tab navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
  
  // File import
  document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const text = await file.text();
      document.getElementById('prompts').value = text;
    }
  });
  
  // Add to queue
  document.getElementById('addQueue').addEventListener('click', async () => {
    const text = document.getElementById('prompts').value.trim();
    if (!text) return;
    
    let prompts;
    try {
      prompts = JSON.parse(text);
      if (!Array.isArray(prompts)) prompts = [prompts];
    } catch {
      prompts = text.split('\n').filter(p => p.trim());
    }
    
    const response = await chrome.runtime.sendMessage({ type: 'ADD_TO_QUEUE', prompts });
    document.getElementById('queueCount').textContent = response.queueLength;
    document.getElementById('prompts').value = '';
  });
  
  // Start queue
  document.getElementById('startQueue').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'START_QUEUE' });
    updateStatus(true);
  });
  
  // Stop queue
  document.getElementById('stopQueue').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'STOP_QUEUE' });
    updateStatus(false);
  });
  
  // Settings changes
  ['videosPerTask', 'model', 'aspectRatio', 'startPosition', 'waitTimeMin', 'waitTimeMax', 'autoDownload', 'language'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('change', () => saveSettings());
  });
  
  // Clear log
  document.getElementById('clearLog').addEventListener('click', async () => {
    await chrome.storage.local.set({ history: [] });
    loadHistory();
  });
  
  // Copy failed
  document.getElementById('copyFailed').addEventListener('click', async () => {
    const { failed } = await chrome.runtime.sendMessage({ type: 'GET_FAILED' });
    const text = failed.map(f => f.prompt).join('\n');
    navigator.clipboard.writeText(text);
  });
});

function updateSettings(settings) {
  document.getElementById('videosPerTask').value = settings.videosPerTask || 1;
  document.getElementById('model').value = settings.model || 'default';
  document.getElementById('aspectRatio').value = settings.aspectRatio || '16:9';
  document.getElementById('startPosition').value = settings.startPosition || 1;
  document.getElementById('waitTimeMin').value = settings.waitTimeMin || 30;
  document.getElementById('waitTimeMax').value = settings.waitTimeMax || 60;
  document.getElementById('autoDownload').checked = settings.autoDownload !== false;
  document.getElementById('language').value = settings.language || 'en';
}

async function saveSettings() {
  const settings = {
    videosPerTask: parseInt(document.getElementById('videosPerTask').value),
    model: document.getElementById('model').value,
    aspectRatio: document.getElementById('aspectRatio').value,
    startPosition: parseInt(document.getElementById('startPosition').value),
    waitTimeMin: parseInt(document.getElementById('waitTimeMin').value),
    waitTimeMax: parseInt(document.getElementById('waitTimeMax').value),
    autoDownload: document.getElementById('autoDownload').checked,
    language: document.getElementById('language').value
  };
  await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings });
}

function updateStatus(isProcessing) {
  document.getElementById('statusText').textContent = isProcessing ? 'Processing...' : 'Ready';
  document.getElementById('startQueue').style.display = isProcessing ? 'none' : 'flex';
  document.getElementById('stopQueue').style.display = isProcessing ? 'flex' : 'none';
}

async function loadHistory() {
  const { history } = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
  const container = document.getElementById('logContainer');
  container.innerHTML = (history || []).slice(0, 50).map(h => 
    `<div class="log-entry ${h.level}">[${new Date(h.timestamp).toLocaleTimeString()}] ${h.message}</div>`
  ).join('') || '<div class="log-entry info">No activity yet</div>';
}

async function loadFailed() {
  const { failed } = await chrome.runtime.sendMessage({ type: 'GET_FAILED' });
  document.querySelector('#failedCount span:nth-child(2)').textContent = `${(failed || []).length} Failed Tasks`;
}
