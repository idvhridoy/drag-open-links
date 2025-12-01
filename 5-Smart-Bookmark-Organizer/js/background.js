/**
 * Smart Bookmark Organizer - Background Service Worker
 */

const CATEGORIES = {
  'news': ['news', 'cnn', 'bbc', 'nytimes', 'reuters', 'guardian'],
  'social': ['facebook', 'twitter', 'instagram', 'linkedin', 'reddit', 'tiktok'],
  'video': ['youtube', 'vimeo', 'netflix', 'twitch', 'dailymotion'],
  'shopping': ['amazon', 'ebay', 'walmart', 'etsy', 'aliexpress'],
  'dev': ['github', 'stackoverflow', 'codepen', 'gitlab', 'npm', 'dev.to'],
  'learning': ['coursera', 'udemy', 'khan', 'edx', 'skillshare'],
  'work': ['docs.google', 'notion', 'trello', 'slack', 'asana', 'jira']
};

async function getAllBookmarks() {
  return new Promise((resolve) => chrome.bookmarks.getTree(resolve));
}

async function flattenBookmarks(nodes, result = []) {
  for (const node of nodes) {
    if (node.url) result.push({ id: node.id, title: node.title, url: node.url, parentId: node.parentId });
    if (node.children) await flattenBookmarks(node.children, result);
  }
  return result;
}

async function findDuplicates() {
  const tree = await getAllBookmarks();
  const bookmarks = await flattenBookmarks(tree);
  const urlMap = new Map();
  const duplicates = [];
  
  bookmarks.forEach(b => {
    const key = b.url.replace(/https?:\/\/(www\.)?/, '').split('?')[0];
    if (urlMap.has(key)) {
      duplicates.push({ original: urlMap.get(key), duplicate: b });
    } else {
      urlMap.set(key, b);
    }
  });
  return duplicates;
}

async function categorizeBookmark(url) {
  const hostname = new URL(url).hostname.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(k => hostname.includes(k))) return category;
  }
  return 'other';
}

async function organizeBookmarks() {
  const tree = await getAllBookmarks();
  const bookmarks = await flattenBookmarks(tree);
  const organized = { results: [], moved: 0 };
  
  // Create category folders if they don't exist
  const rootId = tree[0].children[1].id; // Other bookmarks
  const folders = {};
  
  for (const category of Object.keys(CATEGORIES)) {
    try {
      const folder = await chrome.bookmarks.create({ parentId: rootId, title: `📁 ${category.charAt(0).toUpperCase() + category.slice(1)}` });
      folders[category] = folder.id;
    } catch (e) {}
  }
  
  // Move bookmarks to appropriate folders
  for (const b of bookmarks) {
    try {
      const category = await categorizeBookmark(b.url);
      if (folders[category]) {
        await chrome.bookmarks.move(b.id, { parentId: folders[category] });
        organized.moved++;
      }
    } catch (e) {}
  }
  
  return organized;
}

async function removeDuplicates() {
  const duplicates = await findDuplicates();
  for (const { duplicate } of duplicates) {
    try { await chrome.bookmarks.remove(duplicate.id); } catch (e) {}
  }
  return { removed: duplicates.length };
}

async function checkDeadLinks(bookmarks) {
  const dead = [];
  for (const b of bookmarks.slice(0, 20)) { // Limit for performance
    try {
      const response = await fetch(b.url, { method: 'HEAD', mode: 'no-cors' });
      // Can't fully check due to CORS, just verify it doesn't throw
    } catch (e) {
      dead.push(b);
    }
  }
  return dead;
}

async function getStats() {
  const tree = await getAllBookmarks();
  const bookmarks = await flattenBookmarks(tree);
  const duplicates = await findDuplicates();
  return {
    total: bookmarks.length,
    duplicates: duplicates.length,
    categories: Object.keys(CATEGORIES).length
  };
}

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  (async () => {
    switch (msg.type) {
      case 'GET_STATS': respond({ success: true, stats: await getStats() }); break;
      case 'FIND_DUPLICATES': respond({ success: true, duplicates: await findDuplicates() }); break;
      case 'REMOVE_DUPLICATES': respond({ success: true, ...await removeDuplicates() }); break;
      case 'ORGANIZE': respond({ success: true, ...await organizeBookmarks() }); break;
      case 'GET_BOOKMARKS': respond({ success: true, bookmarks: await flattenBookmarks(await getAllBookmarks()) }); break;
      default: respond({ success: false });
    }
  })();
  return true;
});
