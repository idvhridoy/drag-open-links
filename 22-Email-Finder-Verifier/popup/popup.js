/**
 * Email Finder Verifier - Popup Script
 */
document.addEventListener('DOMContentLoaded', async () => {
  const emailCount = document.getElementById('emailCount');
  const emailsList = document.getElementById('emailsList');
  const copyAllBtn = document.getElementById('copyAll');

  async function findEmails() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'FIND_EMAILS' });
      const emails = response.emails || [];
      
      emailCount.textContent = emails.length;
      
      if (emails.length === 0) {
        emailsList.innerHTML = '<div class="empty">📭 No emails found on this page</div>';
        copyAllBtn.style.display = 'none';
        return;
      }
      
      emailsList.innerHTML = emails.map(e => `
        <div class="email-item">
          <span class="email-text">${e}</span>
          <button class="copy-btn" data-email="${e}">Copy</button>
        </div>
      `).join('');
      
      copyAllBtn.style.display = 'block';
      
      emailsList.querySelectorAll('.copy-btn').forEach(btn => {
        btn.onclick = () => {
          navigator.clipboard.writeText(btn.dataset.email);
          btn.textContent = '✓';
          setTimeout(() => btn.textContent = 'Copy', 1000);
        };
      });
      
      copyAllBtn.onclick = () => {
        navigator.clipboard.writeText(emails.join('\n'));
        copyAllBtn.textContent = '✓ Copied All!';
        setTimeout(() => copyAllBtn.textContent = '📋 Copy All Emails', 1500);
      };
      
      // Save to history
      const { emailHistory = [] } = await chrome.storage.local.get('emailHistory');
      const newHistory = [...new Set([...emails, ...emailHistory])];
      await chrome.storage.local.set({ emailHistory: newHistory.slice(0, 500) });
      
    } catch (e) {
      emailsList.innerHTML = '<div class="empty">⚠️ Cannot scan this page</div>';
      copyAllBtn.style.display = 'none';
    }
  }

  findEmails();
});
