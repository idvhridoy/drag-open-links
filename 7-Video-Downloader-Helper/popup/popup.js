/**
 * Video Downloader Helper - Popup Script
 */
document.addEventListener('DOMContentLoaded', async () => {
  const videosList = document.getElementById('videosList');
  const refreshBtn = document.getElementById('refreshBtn');
  const videosCount = document.getElementById('videosCount');

  async function loadVideos() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_VIDEOS' });
      const videos = response?.videos || [];
      
      videosCount.textContent = videos.length;
      
      if (videos.length === 0) {
        videosList.innerHTML = '<div class="empty">🎬 No videos detected on this page</div>';
        return;
      }
      
      videosList.innerHTML = videos.map((v, i) => `
        <div class="video-item">
          <div class="video-info">
            <span class="video-name">Video ${i + 1}</span>
            <span class="video-url">${v.src?.substring(0, 40) || 'Unknown source'}...</span>
          </div>
          <button class="download-btn" data-url="${v.src}">Download</button>
        </div>
      `).join('');
      
      videosList.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const url = btn.dataset.url;
          if (url && url.startsWith('http')) {
            btn.textContent = 'Downloading...';
            try {
              await chrome.downloads.download({ url });
              btn.textContent = '✓ Done';
            } catch {
              btn.textContent = '✗ Failed';
            }
          } else {
            btn.textContent = '✗ Invalid URL';
          }
        });
      });
    } catch {
      videosList.innerHTML = '<div class="empty">Unable to detect videos on this page</div>';
    }
  }

  refreshBtn?.addEventListener('click', () => {
    refreshBtn.textContent = 'Scanning...';
    loadVideos().then(() => {
      refreshBtn.textContent = 'Refresh';
    });
  });

  loadVideos();
});
