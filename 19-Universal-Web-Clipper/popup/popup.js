/**
 * Universal Web Clipper - Popup Script
 */
document.addEventListener('DOMContentLoaded', async () => {
  const clipPageBtn = document.getElementById('clipPage');
  const clipsList = document.getElementById('clipsList');

  async function load() {
    const { clips = [] } = await chrome.storage.local.get('clips');
    
    if (!clips.length) { 
      clipsList.innerHTML = '<div class="empty">📎 No clips yet. Right-click to clip!</div>'; 
      return; 
    }
    
    clipsList.innerHTML = clips.map(c => `
      <div class="clip">
        <div class="clip-header">
          <span class="clip-title">${c.title}</span>
          <span class="clip-type">${c.type}</span>
        </div>
        <div class="clip-content">${c.content?.substring(0, 100) || ''}</div>
        <div class="clip-footer">
          <span>${new Date(c.timestamp).toLocaleDateString()}</span>
          <button class="delete-btn" data-id="${c.id}">×</button>
        </div>
      </div>
    `).join('');
    
    clipsList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = async () => { 
        const { clips } = await chrome.storage.local.get('clips');
        await chrome.storage.local.set({ clips: clips.filter(c => c.id !== btn.dataset.id) }); 
        load(); 
      };
    });
  }

  clipPageBtn?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const { clips = [] } = await chrome.storage.local.get('clips');
    
    clips.unshift({ 
      id: Date.now().toString(), 
      type: 'page', 
      content: tab.title, 
      url: tab.url, 
      title: tab.title, 
      timestamp: new Date().toISOString() 
    });
    
    await chrome.storage.local.set({ clips: clips.slice(0, 100) });
    load();
  });

  load();
});
