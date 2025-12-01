/**
 * Grammar Writing Assistant - Popup Script
 */
document.addEventListener('DOMContentLoaded', async () => {
  const textInput = document.getElementById('textInput');
  const checkBtn = document.getElementById('checkBtn');
  const resultsList = document.getElementById('resultsList');
  const statsWords = document.getElementById('statsWords');
  const statsChars = document.getElementById('statsChars');
  const statsSentences = document.getElementById('statsSentences');
  const optionsBtn = document.getElementById('optionsBtn');

  // Update stats on input
  textInput?.addEventListener('input', updateStats);

  function updateStats() {
    const text = textInput.value;
    statsWords.textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
    statsChars.textContent = text.length;
    statsSentences.textContent = text.split(/[.!?]+/).filter(s => s.trim()).length;
  }

  // Check grammar
  checkBtn?.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) {
      resultsList.innerHTML = '<div class="empty">Enter some text to check</div>';
      return;
    }

    checkBtn.disabled = true;
    checkBtn.textContent = 'Checking...';

    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_GRAMMAR', text });
      
      if (response.issues?.length > 0) {
        resultsList.innerHTML = response.issues.map(issue => `
          <div class="issue-item ${issue.type}">
            <div class="issue-header">
              <span class="issue-type">${issue.type}</span>
              <span class="issue-rule">${issue.rule}</span>
            </div>
            <div class="issue-text">"${issue.context}"</div>
            <div class="issue-suggestion">Suggestion: ${issue.suggestion}</div>
          </div>
        `).join('');
      } else {
        resultsList.innerHTML = '<div class="success">✓ No issues found! Your text looks good.</div>';
      }
    } catch (e) {
      resultsList.innerHTML = '<div class="error">✗ Failed to check grammar</div>';
    }

    checkBtn.disabled = false;
    checkBtn.textContent = 'Check Grammar';
  });

  optionsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  updateStats();
});
