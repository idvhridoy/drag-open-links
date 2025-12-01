/**
 * Tab Workspace Manager - Background Service Worker
 */

const STORAGE_KEY = 'workspaces';
let workspaces = [];

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  workspaces = data[STORAGE_KEY] || [];
  if (workspaces.length === 0) {
    workspaces.push({ id: Date.now(), name: 'Default', color: '#3b82f6', tabs: [], createdAt: Date.now() });
    await saveWorkspaces();
  }
});

chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  workspaces = data[STORAGE_KEY] || [];
});

async function saveWorkspaces() {
  await chrome.storage.local.set({ [STORAGE_KEY]: workspaces });
}

async function getCurrentTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs.map(t => ({ url: t.url, title: t.title, favIconUrl: t.favIconUrl, pinned: t.pinned }));
}

async function createWorkspace(name, color = '#3b82f6') {
  const tabs = await getCurrentTabs();
  const workspace = { id: Date.now(), name, color, tabs, createdAt: Date.now(), lastUsed: Date.now() };
  workspaces.push(workspace);
  await saveWorkspaces();
  return workspace;
}

async function loadWorkspace(id) {
  const workspace = workspaces.find(w => w.id === id);
  if (!workspace) return false;
  
  // Close current tabs except pinned
  const currentTabs = await chrome.tabs.query({ currentWindow: true, pinned: false });
  await Promise.all(currentTabs.map(t => chrome.tabs.remove(t.id).catch(() => {})));
  
  // Open workspace tabs
  for (const tab of workspace.tabs) {
    try {
      await chrome.tabs.create({ url: tab.url, pinned: tab.pinned });
    } catch (e) {}
  }
  
  workspace.lastUsed = Date.now();
  await saveWorkspaces();
  return true;
}

async function updateWorkspace(id) {
  const workspace = workspaces.find(w => w.id === id);
  if (!workspace) return false;
  workspace.tabs = await getCurrentTabs();
  workspace.lastUsed = Date.now();
  await saveWorkspaces();
  return true;
}

async function deleteWorkspace(id) {
  workspaces = workspaces.filter(w => w.id !== id);
  await saveWorkspaces();
  return true;
}

async function renameWorkspace(id, name, color) {
  const workspace = workspaces.find(w => w.id === id);
  if (!workspace) return false;
  if (name) workspace.name = name;
  if (color) workspace.color = color;
  await saveWorkspaces();
  return true;
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-workspace') {
    await updateWorkspace(workspaces[0]?.id);
    chrome.action.setBadgeText({ text: '✓' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 1500);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  (async () => {
    switch (msg.type) {
      case 'GET_WORKSPACES': respond({ success: true, workspaces }); break;
      case 'CREATE_WORKSPACE': respond({ success: true, workspace: await createWorkspace(msg.name, msg.color) }); break;
      case 'LOAD_WORKSPACE': respond({ success: await loadWorkspace(msg.id) }); break;
      case 'UPDATE_WORKSPACE': respond({ success: await updateWorkspace(msg.id) }); break;
      case 'DELETE_WORKSPACE': respond({ success: await deleteWorkspace(msg.id) }); break;
      case 'RENAME_WORKSPACE': respond({ success: await renameWorkspace(msg.id, msg.name, msg.color) }); break;
      case 'GET_CURRENT_TABS': respond({ success: true, tabs: await getCurrentTabs() }); break;
      default: respond({ success: false });
    }
  })();
  return true;
});
