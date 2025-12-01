/**
 * Auto Flow - Background Service Worker
 * Automation for VEO AI video generation
 */

let queue = [];
let isProcessing = false;
let currentTaskIndex = 0;
let settings = {
  videosPerTask: 1,
  model: 'default',
  aspectRatio: '16:9',
  startPosition: 1,
  waitTimeMin: 30,
  waitTimeMax: 60,
  language: 'en',
  autoDownload: true,
  downloadFolder: 'Auto-Flow'
};

// Load state from storage
chrome.storage.local.get(['queue', 'settings', 'history', 'failedTasks'], (data) => {
  if (data.queue) queue = data.queue;
  if (data.settings) settings = { ...settings, ...data.settings };
});

// Message handler
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  switch (msg.type) {
    case 'GET_STATE':
      respond({ queue, isProcessing, currentTaskIndex, settings });
      break;
    case 'ADD_TO_QUEUE':
      queue.push(...msg.prompts.map((p, i) => ({ id: Date.now() + i, prompt: p, status: 'pending' })));
      chrome.storage.local.set({ queue });
      respond({ success: true, queueLength: queue.length });
      break;
    case 'CLEAR_QUEUE':
      queue = [];
      chrome.storage.local.set({ queue });
      respond({ success: true });
      break;
    case 'REMOVE_FROM_QUEUE':
      queue = queue.filter(t => t.id !== msg.id);
      chrome.storage.local.set({ queue });
      respond({ success: true });
      break;
    case 'START_QUEUE':
      startProcessing();
      respond({ success: true });
      break;
    case 'STOP_QUEUE':
      stopProcessing();
      respond({ success: true });
      break;
    case 'UPDATE_SETTINGS':
      settings = { ...settings, ...msg.settings };
      chrome.storage.local.set({ settings });
      respond({ success: true });
      break;
    case 'LOG_EVENT':
      logEvent(msg.event, msg.level);
      respond({ success: true });
      break;
    case 'GET_HISTORY':
      chrome.storage.local.get('history', d => respond({ history: d.history || [] }));
      return true;
    case 'GET_FAILED':
      chrome.storage.local.get('failedTasks', d => respond({ failed: d.failedTasks || [] }));
      return true;
    default:
      respond({ success: false });
  }
  return true;
});

async function startProcessing() {
  if (isProcessing) return;
  isProcessing = true;
  currentTaskIndex = settings.startPosition - 1;
  logEvent('Queue processing started', 'info');
  
  while (isProcessing && currentTaskIndex < queue.length) {
    const task = queue[currentTaskIndex];
    task.status = 'processing';
    chrome.storage.local.set({ queue });
    
    try {
      // Send to content script
      const tabs = await chrome.tabs.query({ url: ['https://labs.google/*', 'https://veo.google.com/*'] });
      if (tabs.length === 0) {
        logEvent('No VEO AI tab found. Please open VEO AI.', 'error');
        stopProcessing();
        break;
      }
      
      await chrome.tabs.sendMessage(tabs[0].id, { type: 'PROCESS_PROMPT', prompt: task.prompt, settings });
      task.status = 'completed';
      logEvent(`Completed: ${task.prompt.substring(0, 50)}...`, 'success');
      
      // Wait before next task
      const waitTime = Math.random() * (settings.waitTimeMax - settings.waitTimeMin) + settings.waitTimeMin;
      await new Promise(r => setTimeout(r, waitTime * 1000));
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      logEvent(`Failed: ${task.prompt.substring(0, 50)}... - ${error.message}`, 'error');
      await addFailedTask(task);
    }
    
    currentTaskIndex++;
    chrome.storage.local.set({ queue });
  }
  
  isProcessing = false;
  logEvent('Queue processing completed', 'info');
}

function stopProcessing() {
  isProcessing = false;
  logEvent('Queue processing stopped', 'warning');
}

async function logEvent(message, level = 'info') {
  const { history = [] } = await chrome.storage.local.get('history');
  history.unshift({ timestamp: new Date().toISOString(), message, level });
  await chrome.storage.local.set({ history: history.slice(0, 500) });
  
  if (level === 'error') {
    chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon128.png', title: 'Auto Flow', message });
  }
}

async function addFailedTask(task) {
  const { failedTasks = [] } = await chrome.storage.local.get('failedTasks');
  failedTasks.push({ ...task, failedAt: new Date().toISOString() });
  await chrome.storage.local.set({ failedTasks });
}
