/**
 * AI Content Summarizer - Side Panel Script
 */

let currentSummary = '';

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading');
  const summary = document.getElementById('summary');
  const emptyState = document.getElementById('emptyState');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const copyBtn = document.getElementById('copyBtn');
  const speakBtn = document.getElementById('speakBtn');
  const exportBtn = document.getElementById('exportBtn');

  // Event Listeners
  summarizeBtn.addEventListener('click', summarizePage);
  refreshBtn.addEventListener('click', summarizePage);
  copyBtn.addEventListener('click', copySummary);
  speakBtn.addEventListener('click', toggleSpeak);
  exportBtn.addEventListener('click', exportSummary);

  // Length/Style buttons
  document.querySelectorAll('.ctrl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.btn-group');
      group.querySelectorAll('.ctrl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (currentSummary) summarizePage();
    });
  });

  // Listen for summary updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'DISPLAY_SUMMARY') {
      showSummary(message.summary);
    }
  });

  async function summarizePage() {
    showLoading();
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const contentResponse = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_CONTENT' });
      
      if (!contentResponse.success) {
        throw new Error('Failed to extract content');
      }

      const length = document.querySelector('.ctrl-btn[data-length].active')?.dataset.length || 'medium';
      const style = document.querySelector('.ctrl-btn[data-style].active')?.dataset.style || 'paragraph';

      const response = await chrome.runtime.sendMessage({
        type: 'SUMMARIZE_TEXT',
        text: contentResponse.content,
        options: { length, style, isFullPage: true }
      });

      if (response.success) {
        showSummary(response.summary);
      } else {
        throw new Error(response.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Summary error:', error);
      showError(error.message);
    }
  }

  function showLoading() {
    loading.classList.add('visible');
    summary.classList.remove('visible');
    emptyState.classList.add('hidden');
  }

  function showSummary(text) {
    currentSummary = text;
    loading.classList.remove('visible');
    summary.classList.add('visible');
    emptyState.classList.add('hidden');
    summary.innerHTML = formatSummary(text);
    enableActions();
  }

  function showError(message) {
    loading.classList.remove('visible');
    summary.classList.add('visible');
    summary.innerHTML = `<p style="color: #ef4444;">Error: ${message}</p>`;
  }

  function formatSummary(text) {
    return text.split('\n').map(line => {
      line = line.trim();
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return `<li>${line.substring(2)}</li>`;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return `<h4>${line.slice(2, -2)}</h4>`;
      }
      return line ? `<p>${line}</p>` : '';
    }).join('').replace(/<li>/g, '<ul><li>').replace(/<\/li>(?!<li>)/g, '</li></ul>');
  }

  function enableActions() {
    copyBtn.disabled = false;
    speakBtn.disabled = false;
    exportBtn.disabled = false;
  }

  function copySummary() {
    if (currentSummary) {
      navigator.clipboard.writeText(currentSummary);
      copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg> Copied!`;
      setTimeout(() => {
        copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
      }, 2000);
    }
  }

  function toggleSpeak() {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      speakBtn.classList.remove('speaking');
      return;
    }
    
    if (currentSummary) {
      const utterance = new SpeechSynthesisUtterance(currentSummary);
      utterance.onend = () => speakBtn.classList.remove('speaking');
      window.speechSynthesis.speak(utterance);
      speakBtn.classList.add('speaking');
    }
  }

  function exportSummary() {
    if (currentSummary) {
      const blob = new Blob([currentSummary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'summary.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  }
});
