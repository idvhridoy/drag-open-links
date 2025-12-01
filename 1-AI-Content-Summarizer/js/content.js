/**
 * AI Content Summarizer - Content Script
 * Handles content extraction, UI injection, and user interactions
 */

(() => {
  'use strict';

  // ============================================================================
  // Constants
  // ============================================================================

  const CONFIG = {
    FAB_ID: 'ai-summarizer-fab',
    PANEL_ID: 'ai-summarizer-panel',
    TOAST_ID: 'ai-summarizer-toast',
    MIN_SELECTION_LENGTH: 50,
    MAX_CONTENT_LENGTH: 15000
  };

  // ============================================================================
  // State
  // ============================================================================

  let state = {
    fabVisible: true,
    panelOpen: false,
    currentSummary: null,
    settings: {}
  };

  // ============================================================================
  // Content Extraction
  // ============================================================================

  function extractPageContent() {
    // Try to find main content area
    const contentSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      '#content',
      '.post',
      '.article'
    ];

    let content = null;
    
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.length > 500) {
        content = element;
        break;
      }
    }

    // Fallback to body
    if (!content) {
      content = document.body;
    }

    // Clone and clean content
    const clone = content.cloneNode(true);
    
    // Remove unwanted elements
    const removeSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 'aside',
      '.sidebar', '.menu', '.navigation', '.comments', '.advertisement',
      '.ad', '.social-share', '.related-posts', '[role="navigation"]',
      '[role="banner"]', '[role="contentinfo"]', 'iframe', 'noscript'
    ];
    
    removeSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Extract text
    let text = clone.textContent || clone.innerText;
    
    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    // Limit length
    if (text.length > CONFIG.MAX_CONTENT_LENGTH) {
      text = text.substring(0, CONFIG.MAX_CONTENT_LENGTH);
    }

    return {
      content: text,
      title: document.title,
      url: window.location.href
    };
  }

  function getSelectedText() {
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : '';
  }

  // ============================================================================
  // Floating Action Button
  // ============================================================================

  function createFAB() {
    if (document.getElementById(CONFIG.FAB_ID)) return;

    const fab = document.createElement('div');
    fab.id = CONFIG.FAB_ID;
    fab.innerHTML = `
      <button class="ai-summarizer-fab-btn" title="Summarize Page (Ctrl+Shift+S)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      </button>
    `;

    fab.querySelector('.ai-summarizer-fab-btn').addEventListener('click', () => {
      summarizePage();
    });

    document.body.appendChild(fab);
  }

  function showFAB() {
    const fab = document.getElementById(CONFIG.FAB_ID);
    if (fab) fab.classList.add('visible');
  }

  function hideFAB() {
    const fab = document.getElementById(CONFIG.FAB_ID);
    if (fab) fab.classList.remove('visible');
  }

  // ============================================================================
  // Summary Panel
  // ============================================================================

  function createPanel() {
    if (document.getElementById(CONFIG.PANEL_ID)) return;

    const panel = document.createElement('div');
    panel.id = CONFIG.PANEL_ID;
    panel.innerHTML = `
      <div class="ai-summarizer-panel-header">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
          AI Summary
        </h3>
        <div class="ai-summarizer-panel-actions">
          <button class="ai-summarizer-btn-icon" id="ai-summarizer-copy" title="Copy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button class="ai-summarizer-btn-icon" id="ai-summarizer-speak" title="Read Aloud">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </button>
          <button class="ai-summarizer-btn-icon" id="ai-summarizer-close" title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="ai-summarizer-panel-content">
        <div class="ai-summarizer-loading">
          <div class="ai-summarizer-spinner"></div>
          <span>Generating summary...</span>
        </div>
        <div class="ai-summarizer-summary"></div>
      </div>
      <div class="ai-summarizer-panel-footer">
        <div class="ai-summarizer-length-control">
          <span>Length:</span>
          <button data-length="brief" class="ai-summarizer-length-btn">Brief</button>
          <button data-length="medium" class="ai-summarizer-length-btn active">Medium</button>
          <button data-length="detailed" class="ai-summarizer-length-btn">Detailed</button>
        </div>
      </div>
    `;

    // Event listeners
    panel.querySelector('#ai-summarizer-close').addEventListener('click', closePanel);
    panel.querySelector('#ai-summarizer-copy').addEventListener('click', copySummary);
    panel.querySelector('#ai-summarizer-speak').addEventListener('click', speakSummary);
    
    panel.querySelectorAll('.ai-summarizer-length-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.ai-summarizer-length-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        regenerateSummary(btn.dataset.length);
      });
    });

    document.body.appendChild(panel);
  }

  function openPanel() {
    const panel = document.getElementById(CONFIG.PANEL_ID);
    if (panel) {
      panel.classList.add('open');
      state.panelOpen = true;
    }
  }

  function closePanel() {
    const panel = document.getElementById(CONFIG.PANEL_ID);
    if (panel) {
      panel.classList.remove('open');
      state.panelOpen = false;
    }
    stopSpeaking();
  }

  function showPanelLoading() {
    const panel = document.getElementById(CONFIG.PANEL_ID);
    if (panel) {
      panel.querySelector('.ai-summarizer-loading').style.display = 'flex';
      panel.querySelector('.ai-summarizer-summary').style.display = 'none';
    }
  }

  function showPanelContent(summary) {
    const panel = document.getElementById(CONFIG.PANEL_ID);
    if (panel) {
      panel.querySelector('.ai-summarizer-loading').style.display = 'none';
      const summaryEl = panel.querySelector('.ai-summarizer-summary');
      summaryEl.style.display = 'block';
      summaryEl.innerHTML = formatSummary(summary);
      state.currentSummary = summary;
    }
  }

  function formatSummary(text) {
    // Convert bullet points and formatting
    return text
      .split('\n')
      .map(line => {
        line = line.trim();
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return `<li>${line.substring(2)}</li>`;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return `<h4>${line.slice(2, -2)}</h4>`;
        }
        if (line) {
          return `<p>${line}</p>`;
        }
        return '';
      })
      .join('')
      .replace(/<li>/g, '<ul><li>')
      .replace(/<\/li>(?!<li>)/g, '</li></ul>');
  }

  // ============================================================================
  // Toast Notifications
  // ============================================================================

  function showToast(message, type = 'info', duration = 3000) {
    let toast = document.getElementById(CONFIG.TOAST_ID);
    
    if (!toast) {
      toast = document.createElement('div');
      toast.id = CONFIG.TOAST_ID;
      document.body.appendChild(toast);
    }

    toast.className = `ai-summarizer-toast ${type}`;
    toast.textContent = message;
    toast.classList.add('visible');

    setTimeout(() => {
      toast.classList.remove('visible');
    }, duration);
  }

  // ============================================================================
  // Summary Actions
  // ============================================================================

  async function summarizePage() {
    createPanel();
    openPanel();
    showPanelLoading();

    try {
      const pageData = extractPageContent();
      const response = await chrome.runtime.sendMessage({
        type: 'SUMMARIZE_TEXT',
        text: pageData.content,
        options: { length: 'medium', style: 'paragraph', isFullPage: true }
      });

      if (response.success) {
        showPanelContent(response.summary);
      } else {
        showPanelContent('Failed to generate summary. Please try again.');
      }
    } catch (error) {
      console.error('[AISummarizer] Error:', error);
      showPanelContent('An error occurred. Please try again.');
    }
  }

  async function summarizeSelection(text) {
    createPanel();
    openPanel();
    showPanelLoading();

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SUMMARIZE_TEXT',
        text,
        options: { length: 'medium', style: 'paragraph' }
      });

      if (response.success) {
        showPanelContent(response.summary);
      } else {
        showPanelContent('Failed to generate summary. Please try again.');
      }
    } catch (error) {
      console.error('[AISummarizer] Error:', error);
      showPanelContent('An error occurred. Please try again.');
    }
  }

  async function regenerateSummary(length) {
    showPanelLoading();
    
    try {
      const pageData = extractPageContent();
      const response = await chrome.runtime.sendMessage({
        type: 'SUMMARIZE_TEXT',
        text: pageData.content,
        options: { length, style: 'paragraph', isFullPage: true }
      });

      if (response.success) {
        showPanelContent(response.summary);
      }
    } catch (error) {
      console.error('[AISummarizer] Regenerate error:', error);
    }
  }

  function copySummary() {
    if (state.currentSummary) {
      navigator.clipboard.writeText(state.currentSummary)
        .then(() => showToast('Summary copied to clipboard!', 'success'))
        .catch(() => showToast('Failed to copy', 'error'));
    }
  }

  function speakSummary() {
    if (!state.currentSummary) return;

    if (window.speechSynthesis.speaking) {
      stopSpeaking();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(state.currentSummary);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);

    const speakBtn = document.getElementById('ai-summarizer-speak');
    if (speakBtn) speakBtn.classList.add('speaking');

    utterance.onend = () => {
      if (speakBtn) speakBtn.classList.remove('speaking');
    };
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    const speakBtn = document.getElementById('ai-summarizer-speak');
    if (speakBtn) speakBtn.classList.remove('speaking');
  }

  // ============================================================================
  // Selection Handler
  // ============================================================================

  function handleSelection() {
    const selection = getSelectedText();
    
    if (selection.length >= CONFIG.MIN_SELECTION_LENGTH) {
      showSelectionPopup(selection);
    } else {
      hideSelectionPopup();
    }
  }

  function showSelectionPopup(text) {
    let popup = document.getElementById('ai-summarizer-selection-popup');
    
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'ai-summarizer-selection-popup';
      popup.innerHTML = `
        <button class="ai-summarizer-selection-btn" title="Summarize Selection">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
          Summarize
        </button>
      `;
      
      popup.querySelector('.ai-summarizer-selection-btn').addEventListener('click', () => {
        summarizeSelection(text);
        hideSelectionPopup();
      });
      
      document.body.appendChild(popup);
    }

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      popup.style.top = `${window.scrollY + rect.bottom + 10}px`;
      popup.style.left = `${window.scrollX + rect.left}px`;
      popup.classList.add('visible');
    }
  }

  function hideSelectionPopup() {
    const popup = document.getElementById('ai-summarizer-selection-popup');
    if (popup) popup.classList.remove('visible');
  }

  // ============================================================================
  // Message Handling
  // ============================================================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'EXTRACT_CONTENT':
        const data = extractPageContent();
        sendResponse({ success: true, ...data });
        break;
      
      case 'GET_SELECTION':
        sendResponse({ selection: getSelectedText() });
        break;
      
      case 'SHOW_NOTIFICATION':
        if (message.notificationType === 'loading') {
          showToast(message.message, 'info');
        } else if (message.notificationType === 'success') {
          createPanel();
          openPanel();
          showPanelContent(message.message);
        } else {
          showToast(message.message, message.notificationType);
        }
        sendResponse({ success: true });
        break;
      
      default:
        sendResponse({ success: false });
    }
    return true;
  });

  // ============================================================================
  // Initialization
  // ============================================================================

  function init() {
    // Create FAB
    createFAB();
    
    // Show FAB on scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      showFAB();
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(hideFAB, 2000);
    });

    // Handle text selection
    document.addEventListener('mouseup', () => {
      setTimeout(handleSelection, 100);
    });

    // Hide selection popup on click elsewhere
    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('#ai-summarizer-selection-popup')) {
        hideSelectionPopup();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        summarizePage();
      }
      if (e.key === 'Escape' && state.panelOpen) {
        closePanel();
      }
    });

    console.log('[AISummarizer] Content script initialized');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
