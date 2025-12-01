/**
 * Grammar Writing Assistant - Content Script
 */
(() => {
  let tooltip = null;

  const createTooltip = () => {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.id = 'grammar-assistant-tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
  };

  const showResults = (result, x, y) => {
    const tip = createTooltip();
    tip.innerHTML = `
      <div class="ga-header">
        <span class="ga-score">${result.score}/100</span>
        <span class="ga-title">Writing Score</span>
      </div>
      ${result.issues.length > 0 ? `
        <div class="ga-issues">
          ${result.issues.slice(0, 5).map(i => `
            <div class="ga-issue">
              <span class="ga-type">${i.type}</span>
              <span class="ga-text">"${i.original}" → "${i.suggestion}"</span>
            </div>
          `).join('')}
        </div>
      ` : '<div class="ga-success">✓ No issues found!</div>'}
      <button class="ga-fix-btn" id="gaFixAll">Fix All Issues</button>
    `;
    tip.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:2147483647`;
    tip.classList.add('visible');
    
    document.getElementById('gaFixAll')?.addEventListener('click', () => {
      navigator.clipboard.writeText(result.correctedText);
      tip.innerHTML = '<div class="ga-success">✓ Corrected text copied!</div>';
      setTimeout(() => tip.classList.remove('visible'), 1500);
    });
  };

  document.addEventListener('mouseup', async (e) => {
    const selection = window.getSelection().toString().trim();
    if (selection.length > 10) {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_GRAMMAR', text: selection });
      if (response.success) showResults(response, e.clientX, e.clientY + 10);
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (tooltip && !tooltip.contains(e.target)) tooltip.classList.remove('visible');
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SHOW_RESULTS') showResults(msg.result, 100, 100);
  });
})();
