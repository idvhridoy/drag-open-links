/**
 * Video Downloader Helper - Background Service Worker
 */

const videoUrls = new Map();

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url.toLowerCase();
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.m3u8') || 
        url.includes('video') || url.includes('stream')) {
      const tabVideos = videoUrls.get(details.tabId) || [];
      if (!tabVideos.find(v => v.url === details.url)) {
        tabVideos.push({ url: details.url, type: getVideoType(url), size: 'Unknown', timestamp: Date.now() });
        videoUrls.set(details.tabId, tabVideos);
        updateBadge(details.tabId);
      }
    }
  },
  { urls: ["<all_urls>"] }
);

function getVideoType(url) {
  if (url.includes('.mp4')) return 'MP4';
  if (url.includes('.webm')) return 'WebM';
  if (url.includes('.m3u8')) return 'HLS';
  if (url.includes('.flv')) return 'FLV';
  return 'Video';
}

function updateBadge(tabId) {
  const videos = videoUrls.get(tabId) || [];
  chrome.action.setBadgeText({ text: videos.length > 0 ? String(videos.length) : '', tabId });
  chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId });
}

chrome.tabs.onRemoved.addListener((tabId) => videoUrls.delete(tabId));
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    videoUrls.set(tabId, []);
    updateBadge(tabId);
  }
});

async function downloadVideo(url, filename) {
  try {
    await chrome.downloads.download({ url, filename: filename || `video-${Date.now()}.mp4`, saveAs: true });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  (async () => {
    switch (msg.type) {
      case 'GET_VIDEOS':
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        respond({ success: true, videos: videoUrls.get(tab.id) || [] });
        break;
      case 'DOWNLOAD': respond(await downloadVideo(msg.url, msg.filename)); break;
      case 'ADD_VIDEO':
        const tabVideos = videoUrls.get(sender.tab.id) || [];
        if (!tabVideos.find(v => v.url === msg.video.url)) {
          tabVideos.push(msg.video);
          videoUrls.set(sender.tab.id, tabVideos);
          updateBadge(sender.tab.id);
        }
        respond({ success: true });
        break;
      default: respond({ success: false });
    }
  })();
  return true;
});
