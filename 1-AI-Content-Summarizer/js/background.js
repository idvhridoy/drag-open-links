/**
 * AI Content Summarizer - Background Service Worker
 * Handles API communication, text processing, and summary generation
 */

// ============================================================================
// Constants & Configuration
// ============================================================================

const CONFIG = {
  STORAGE_KEYS: {
    API_KEY: 'apiKey',
    API_PROVIDER: 'apiProvider',
    SETTINGS: 'settings',
    HISTORY: 'summaryHistory',
    TEMPLATES: 'customTemplates'
  },
  DEFAULT_SETTINGS: {
    apiProvider: 'openai',
    defaultLength: 'medium',
    defaultStyle: 'paragraph',
    language: 'en',
    autoSummarize: false,
    showFloatingButton: true,
    voiceEnabled: false,
    voiceSpeed: 1.0
  },
  SUMMARY_LENGTHS: {
    brief: 0.25,
    medium: 0.50,
    detailed: 0.75
  },
  SUMMARY_STYLES: {
    paragraph: 'Write a flowing paragraph summary',
    bullets: 'Write a bullet-point summary with key points',
    executive: 'Write an executive summary with key findings, implications, and recommendations'
  },
  MAX_HISTORY: 100,
  API_ENDPOINTS: {
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages'
  }
};

// ============================================================================
// State Management
// ============================================================================

let state = {
  settings: { ...CONFIG.DEFAULT_SETTINGS },
  apiKey: '',
  history: [],
  processing: new Map()
};

// ============================================================================
// Initialization
// ============================================================================

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[AISummarizer] Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    await initializeDefaultSettings();
    await createContextMenus();
  }
  
  await loadSettings();
});

chrome.runtime.onStartup.addListener(async () => {
  await loadSettings();
  await createContextMenus();
});

async function initializeDefaultSettings() {
  await chrome.storage.sync.set({
    [CONFIG.STORAGE_KEYS.SETTINGS]: CONFIG.DEFAULT_SETTINGS,
    [CONFIG.STORAGE_KEYS.HISTORY]: [],
    [CONFIG.STORAGE_KEYS.TEMPLATES]: []
  });
}

async function loadSettings() {
  try {
    const data = await chrome.storage.sync.get(null);
    state.settings = { ...CONFIG.DEFAULT_SETTINGS, ...data[CONFIG.STORAGE_KEYS.SETTINGS] };
    state.apiKey = data[CONFIG.STORAGE_KEYS.API_KEY] || '';
    state.history = data[CONFIG.STORAGE_KEYS.HISTORY] || [];
  } catch (error) {
    console.error('[AISummarizer] Failed to load settings:', error);
  }
}

// ============================================================================
// Context Menus
// ============================================================================

async function createContextMenus() {
  await chrome.contextMenus.removeAll();
  
  chrome.contextMenus.create({
    id: 'summarize-selection',
    title: 'Summarize Selected Text',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'summarize-page',
    title: 'Summarize This Page',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'summarize-link',
    title: 'Summarize Linked Page',
    contexts: ['link']
  });
  
  chrome.contextMenus.create({
    id: 'separator',
    type: 'separator',
    contexts: ['selection', 'page']
  });
  
  chrome.contextMenus.create({
    id: 'summary-brief',
    title: 'Quick Summary (Brief)',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'summary-detailed',
    title: 'Detailed Summary',
    contexts: ['selection']
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'summarize-selection':
    case 'summary-brief':
    case 'summary-detailed':
      const length = info.menuItemId === 'summary-brief' ? 'brief' : 
                     info.menuItemId === 'summary-detailed' ? 'detailed' : 'medium';
      await handleSelectionSummary(tab.id, info.selectionText, length);
      break;
    case 'summarize-page':
      await handlePageSummary(tab.id);
      break;
    case 'summarize-link':
      await handleLinkSummary(tab.id, info.linkUrl);
      break;
  }
});

// ============================================================================
// Keyboard Commands
// ============================================================================

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  
  switch (command) {
    case 'summarize-page':
      await handlePageSummary(tab.id);
      break;
    case 'summarize-selection':
      await requestSelectionFromTab(tab.id);
      break;
  }
});

// ============================================================================
// Summary Handlers
// ============================================================================

async function handleSelectionSummary(tabId, text, length = 'medium') {
  if (!text || text.length < 50) {
    await notifyTab(tabId, 'error', 'Please select more text (minimum 50 characters)');
    return;
  }
  
  await notifyTab(tabId, 'loading', 'Generating summary...');
  
  try {
    const summary = await generateSummary(text, {
      length,
      style: state.settings.defaultStyle
    });
    
    await saveSummaryToHistory({
      type: 'selection',
      originalText: text.substring(0, 500) + '...',
      summary,
      url: (await chrome.tabs.get(tabId)).url,
      timestamp: Date.now()
    });
    
    await notifyTab(tabId, 'success', summary);
  } catch (error) {
    console.error('[AISummarizer] Summary error:', error);
    await notifyTab(tabId, 'error', error.message);
  }
}

async function handlePageSummary(tabId) {
  await notifyTab(tabId, 'loading', 'Extracting page content...');
  
  try {
    // Request content extraction from content script
    const response = await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_CONTENT' });
    
    if (!response.success || !response.content) {
      throw new Error('Failed to extract page content');
    }
    
    await notifyTab(tabId, 'loading', 'Generating summary...');
    
    const summary = await generateSummary(response.content, {
      length: state.settings.defaultLength,
      style: state.settings.defaultStyle,
      isFullPage: true
    });
    
    await saveSummaryToHistory({
      type: 'page',
      title: response.title,
      summary,
      url: (await chrome.tabs.get(tabId)).url,
      timestamp: Date.now()
    });
    
    await notifyTab(tabId, 'success', summary);
    
    // Open side panel with summary
    await chrome.sidePanel.open({ tabId });
    await chrome.runtime.sendMessage({
      type: 'DISPLAY_SUMMARY',
      summary,
      title: response.title
    });
    
  } catch (error) {
    console.error('[AISummarizer] Page summary error:', error);
    await notifyTab(tabId, 'error', error.message);
  }
}

async function handleLinkSummary(tabId, url) {
  await notifyTab(tabId, 'loading', 'Fetching linked page...');
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    const content = extractContentFromHTML(html);
    
    await notifyTab(tabId, 'loading', 'Generating summary...');
    
    const summary = await generateSummary(content, {
      length: state.settings.defaultLength,
      style: state.settings.defaultStyle
    });
    
    await saveSummaryToHistory({
      type: 'link',
      url,
      summary,
      timestamp: Date.now()
    });
    
    await notifyTab(tabId, 'success', summary);
  } catch (error) {
    console.error('[AISummarizer] Link summary error:', error);
    await notifyTab(tabId, 'error', 'Failed to fetch or summarize linked page');
  }
}

// ============================================================================
// AI Summary Generation
// ============================================================================

async function generateSummary(text, options = {}) {
  const { length = 'medium', style = 'paragraph', isFullPage = false } = options;
  
  if (!state.apiKey) {
    // Use built-in extractive summarization
    return generateExtractSummary(text, length);
  }
  
  const lengthRatio = CONFIG.SUMMARY_LENGTHS[length];
  const stylePrompt = CONFIG.SUMMARY_STYLES[style];
  const targetWords = Math.max(50, Math.floor(text.split(/\s+/).length * lengthRatio));
  
  const systemPrompt = `You are an expert content summarizer. Your task is to create clear, accurate, and insightful summaries that capture the essential information and key insights from the provided text.

Guidelines:
- ${stylePrompt}
- Target length: approximately ${targetWords} words
- Maintain factual accuracy
- Preserve key statistics, names, and important details
- Use clear and professional language
- If the content is technical, maintain appropriate terminology
- Highlight key findings or main arguments`;

  const userPrompt = isFullPage 
    ? `Please summarize the following web page content:\n\n${text}`
    : `Please summarize the following text:\n\n${text}`;

  try {
    if (state.settings.apiProvider === 'openai') {
      return await callOpenAI(systemPrompt, userPrompt);
    } else if (state.settings.apiProvider === 'anthropic') {
      return await callAnthropic(systemPrompt, userPrompt);
    }
  } catch (error) {
    console.warn('[AISummarizer] API call failed, using extractive summary:', error);
    return generateExtractSummary(text, length);
  }
}

async function callOpenAI(systemPrompt, userPrompt) {
  const response = await fetch(CONFIG.API_ENDPOINTS.openai, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.3
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(systemPrompt, userPrompt) {
  const response = await fetch(CONFIG.API_ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': state.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }
  
  const data = await response.json();
  return data.content[0].text;
}

// ============================================================================
// Extractive Summarization (Fallback)
// ============================================================================

function generateExtractSummary(text, length = 'medium') {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.length > 20);
  
  if (sentences.length === 0) {
    return 'Unable to generate summary. Please try with more content.';
  }
  
  // Score sentences based on importance
  const wordFreq = {};
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  words.forEach(word => {
    if (word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  const scoredSentences = sentences.map((sentence, index) => {
    const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    let score = 0;
    
    // Word frequency score
    sentenceWords.forEach(word => {
      score += wordFreq[word] || 0;
    });
    
    // Position score (first and last sentences are often important)
    if (index === 0) score *= 1.5;
    if (index === sentences.length - 1) score *= 1.2;
    
    // Length score (prefer medium-length sentences)
    if (sentence.length > 50 && sentence.length < 200) score *= 1.1;
    
    // Keyword bonus
    const keywords = ['important', 'significant', 'key', 'main', 'result', 'conclusion', 'finding'];
    keywords.forEach(kw => {
      if (sentence.toLowerCase().includes(kw)) score *= 1.2;
    });
    
    return { sentence, score, index };
  });
  
  // Sort by score and select top sentences
  const targetCount = Math.max(2, Math.floor(sentences.length * CONFIG.SUMMARY_LENGTHS[length]));
  const selected = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, targetCount)
    .sort((a, b) => a.index - b.index);
  
  return selected.map(s => s.sentence).join(' ');
}

// ============================================================================
// Content Extraction
// ============================================================================

function extractContentFromHTML(html) {
  // Simple HTML to text conversion
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  
  return text.substring(0, 15000); // Limit content length
}

// ============================================================================
// History Management
// ============================================================================

async function saveSummaryToHistory(entry) {
  state.history.unshift(entry);
  
  // Keep only last N entries
  if (state.history.length > CONFIG.MAX_HISTORY) {
    state.history = state.history.slice(0, CONFIG.MAX_HISTORY);
  }
  
  await chrome.storage.sync.set({
    [CONFIG.STORAGE_KEYS.HISTORY]: state.history
  });
}

// ============================================================================
// Tab Communication
// ============================================================================

async function notifyTab(tabId, type, message) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_NOTIFICATION',
      notificationType: type,
      message
    });
  } catch (error) {
    console.error('[AISummarizer] Failed to notify tab:', error);
  }
}

async function requestSelectionFromTab(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_SELECTION' });
    if (response.selection) {
      await handleSelectionSummary(tabId, response.selection);
    } else {
      await notifyTab(tabId, 'error', 'No text selected. Please select some text first.');
    }
  } catch (error) {
    console.error('[AISummarizer] Failed to get selection:', error);
  }
}

// ============================================================================
// Message Handling
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('[AISummarizer] Message error:', error);
      sendResponse({ success: false, error: error.message });
    });
  return true;
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'GET_SETTINGS':
      return { success: true, settings: state.settings, hasApiKey: !!state.apiKey };
    
    case 'UPDATE_SETTINGS':
      state.settings = { ...state.settings, ...message.settings };
      await chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.SETTINGS]: state.settings });
      return { success: true };
    
    case 'SET_API_KEY':
      state.apiKey = message.apiKey;
      await chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.API_KEY]: message.apiKey });
      return { success: true };
    
    case 'SUMMARIZE_TEXT':
      const summary = await generateSummary(message.text, message.options);
      return { success: true, summary };
    
    case 'SUMMARIZE_PAGE':
      if (sender.tab) {
        await handlePageSummary(sender.tab.id);
      }
      return { success: true };
    
    case 'GET_HISTORY':
      return { success: true, history: state.history };
    
    case 'CLEAR_HISTORY':
      state.history = [];
      await chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.HISTORY]: [] });
      return { success: true };
    
    case 'DELETE_HISTORY_ITEM':
      state.history = state.history.filter((_, i) => i !== message.index);
      await chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.HISTORY]: state.history });
      return { success: true };
    
    case 'OPEN_SIDE_PANEL':
      await chrome.sidePanel.open({ tabId: sender.tab?.id });
      return { success: true };
    
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

// ============================================================================
// Side Panel
// ============================================================================

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});

// Initialize
loadSettings();
