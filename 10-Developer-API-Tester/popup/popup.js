/**
 * Developer API Tester - Popup Script
 * REST API testing interface
 */
document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    method: document.getElementById('method'),
    url: document.getElementById('url'),
    headers: document.getElementById('headers'),
    body: document.getElementById('body'),
    sendBtn: document.getElementById('sendBtn'),
    response: document.getElementById('response'),
    status: document.getElementById('status'),
    time: document.getElementById('time'),
    size: document.getElementById('size'),
    historyList: document.getElementById('historyList')
  };

  let history = [];

  // Load history
  chrome.storage.local.get('apiHistory', (data) => {
    history = data.apiHistory || [];
    renderHistory();
  });

  // Send request
  elements.sendBtn?.addEventListener('click', async () => {
    const method = elements.method?.value || 'GET';
    const url = elements.url?.value?.trim();
    
    if (!url) {
      showError('Please enter a URL');
      return;
    }

    elements.sendBtn.disabled = true;
    elements.sendBtn.textContent = 'Sending...';
    
    const startTime = performance.now();
    
    try {
      const options = { method, headers: {} };
      
      // Parse headers
      if (elements.headers?.value) {
        try {
          options.headers = JSON.parse(elements.headers.value);
        } catch {
          elements.headers.value.split('\n').forEach(line => {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value) options.headers[key] = value;
          });
        }
      }
      
      // Add body for non-GET requests
      if (method !== 'GET' && elements.body?.value) {
        options.body = elements.body.value;
        if (!options.headers['Content-Type']) {
          options.headers['Content-Type'] = 'application/json';
        }
      }
      
      const response = await fetch(url, options);
      const endTime = performance.now();
      const text = await response.text();
      
      let formattedResponse;
      try {
        formattedResponse = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        formattedResponse = text;
      }
      
      elements.response.textContent = formattedResponse;
      elements.status.textContent = `${response.status} ${response.statusText}`;
      elements.status.className = `status ${response.ok ? 'success' : 'error'}`;
      elements.time.textContent = `${Math.round(endTime - startTime)}ms`;
      elements.size.textContent = `${(text.length / 1024).toFixed(2)} KB`;
      
      // Save to history
      addToHistory({ method, url, status: response.status, time: Math.round(endTime - startTime) });
      
    } catch (error) {
      elements.response.textContent = `Error: ${error.message}`;
      elements.status.textContent = 'Error';
      elements.status.className = 'status error';
    }
    
    elements.sendBtn.disabled = false;
    elements.sendBtn.textContent = 'Send';
  });

  function addToHistory(item) {
    history.unshift({ ...item, timestamp: Date.now() });
    history = history.slice(0, 20);
    chrome.storage.local.set({ apiHistory: history });
    renderHistory();
  }

  function renderHistory() {
    if (!elements.historyList) return;
    elements.historyList.innerHTML = history.map(h => `
      <div class="history-item" data-url="${h.url}" data-method="${h.method}">
        <span class="method ${h.method.toLowerCase()}">${h.method}</span>
        <span class="url">${h.url.substring(0, 40)}${h.url.length > 40 ? '...' : ''}</span>
        <span class="status-badge ${h.status < 400 ? 'success' : 'error'}">${h.status}</span>
      </div>
    `).join('');
    
    elements.historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        elements.url.value = item.dataset.url;
        elements.method.value = item.dataset.method;
      });
    });
  }

  function showError(msg) {
    elements.response.textContent = msg;
    elements.status.textContent = 'Error';
    elements.status.className = 'status error';
  }
});
