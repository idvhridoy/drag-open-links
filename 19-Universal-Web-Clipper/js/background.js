// Universal Web Clipper - Background
chrome.contextMenus.create({ id: 'clip-selection', title: 'Clip Selection', contexts: ['selection'] });
chrome.contextMenus.create({ id: 'clip-page', title: 'Clip Page', contexts: ['page'] });

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { clips = [] } = await chrome.storage.local.get('clips');
  const clip = {
    id: Date.now().toString(),
    type: info.menuItemId === 'clip-selection' ? 'selection' : 'page',
    content: info.selectionText || tab.title,
    url: tab.url,
    title: tab.title,
    timestamp: new Date().toISOString()
  };
  await chrome.storage.local.set({ clips: [clip, ...clips].slice(0, 100) });
});

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg.type === 'GET_CLIPS') chrome.storage.local.get('clips', d => respond({ clips: d.clips || [] }));
  else if (msg.type === 'DELETE_CLIP') {
    chrome.storage.local.get('clips', async d => {
      await chrome.storage.local.set({ clips: (d.clips || []).filter(c => c.id !== msg.id) });
      respond({ success: true });
    });
  }
  return true;
});
