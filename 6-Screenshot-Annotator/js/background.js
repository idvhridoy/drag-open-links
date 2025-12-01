/**
 * Screenshot Annotator - Background Service Worker
 */

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'capture-screen') await captureScreen();
});

async function captureScreen() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    
    // Open editor in new tab
    const editorUrl = chrome.runtime.getURL('editor/editor.html');
    const newTab = await chrome.tabs.create({ url: editorUrl });
    
    // Store screenshot for editor
    await chrome.storage.local.set({ pendingScreenshot: dataUrl, sourceTab: tab.id });
  } catch (error) {
    console.error('Capture error:', error);
  }
}

async function downloadImage(dataUrl, filename) {
  const blob = await (await fetch(dataUrl)).blob();
  const url = URL.createObjectURL(blob);
  await chrome.downloads.download({ url, filename: filename || `screenshot-${Date.now()}.png`, saveAs: true });
  URL.revokeObjectURL(url);
}

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  (async () => {
    switch (msg.type) {
      case 'CAPTURE': await captureScreen(); respond({ success: true }); break;
      case 'DOWNLOAD': await downloadImage(msg.dataUrl, msg.filename); respond({ success: true }); break;
      case 'GET_SCREENSHOT':
        const data = await chrome.storage.local.get('pendingScreenshot');
        respond({ success: true, screenshot: data.pendingScreenshot });
        break;
      case 'COPY_TO_CLIPBOARD':
        // Copy is handled in content/editor
        respond({ success: true });
        break;
      default: respond({ success: false });
    }
  })();
  return true;
});
