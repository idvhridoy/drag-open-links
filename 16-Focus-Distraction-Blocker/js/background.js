// Focus Distraction Blocker - Background
let blockedSites = ['facebook.com', 'twitter.com', 'instagram.com', 'reddit.com', 'youtube.com'];
let isEnabled = true;
chrome.storage.local.get(['blockedSites', 'isEnabled'], d => {
  if (d.blockedSites) blockedSites = d.blockedSites;
  if (d.isEnabled !== undefined) isEnabled = d.isEnabled;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!isEnabled || !changeInfo.url) return;
  const url = new URL(changeInfo.url);
  if (blockedSites.some(site => url.hostname.includes(site))) {
    chrome.tabs.update(tabId, { url: chrome.runtime.getURL('blocked.html') });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg.type === 'GET_STATE') respond({ blockedSites, isEnabled });
  else if (msg.type === 'UPDATE_STATE') {
    if (msg.blockedSites) blockedSites = msg.blockedSites;
    if (msg.isEnabled !== undefined) isEnabled = msg.isEnabled;
    chrome.storage.local.set({ blockedSites, isEnabled });
    respond({ success: true });
  }
  return true;
});
