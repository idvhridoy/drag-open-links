/**
 * Video Downloader Helper - Content Script
 */
(() => {
  const detectVideos = () => {
    const videos = [];
    // HTML5 video elements
    document.querySelectorAll('video').forEach(v => {
      if (v.src) videos.push({ url: v.src, type: 'HTML5', size: 'Unknown' });
      v.querySelectorAll('source').forEach(s => {
        if (s.src) videos.push({ url: s.src, type: s.type || 'Video', size: 'Unknown' });
      });
    });
    // Send to background
    videos.forEach(video => {
      chrome.runtime.sendMessage({ type: 'ADD_VIDEO', video }).catch(() => {});
    });
  };

  // Detect on load and mutations
  detectVideos();
  new MutationObserver(detectVideos).observe(document.body, { childList: true, subtree: true });
})();
