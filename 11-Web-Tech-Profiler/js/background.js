/**
 * Web Tech Profiler - Background Service Worker
 */

const techData = new Map();

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg.type === 'TECH_DETECTED') {
    techData.set(sender.tab.id, msg.technologies);
    const count = msg.technologies.length;
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '', tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#8b5cf6', tabId: sender.tab.id });
    respond({ success: true });
  } else if (msg.type === 'GET_TECH') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      respond({ success: true, technologies: techData.get(tabs[0]?.id) || [] });
    });
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => techData.delete(tabId));
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') techData.delete(tabId);
});
