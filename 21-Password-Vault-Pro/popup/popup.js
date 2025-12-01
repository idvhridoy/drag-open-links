/**
 * Password Vault Pro - Popup Script
 */
document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    password: document.getElementById('password'),
    strengthBar: document.getElementById('strengthBar'),
    generateBtn: document.getElementById('generateBtn'),
    copyBtn: document.getElementById('copyBtn'),
    length: document.getElementById('length'),
    lengthVal: document.getElementById('lengthVal'),
    uppercase: document.getElementById('uppercase'),
    lowercase: document.getElementById('lowercase'),
    numbers: document.getElementById('numbers'),
    symbols: document.getElementById('symbols')
  };

  const chars = { 
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 
    lowercase: 'abcdefghijklmnopqrstuvwxyz', 
    numbers: '0123456789', 
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?' 
  };

  function generate() {
    let charset = '';
    ['uppercase', 'lowercase', 'numbers', 'symbols'].forEach(type => {
      if (elements[type].checked) charset += chars[type];
    });
    if (!charset) charset = chars.lowercase;
    
    const length = parseInt(elements.length.value);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    elements.password.textContent = password;
    
    // Calculate strength
    const strength = Math.min(100, (length / 32) * 100);
    elements.strengthBar.style.width = strength + '%';
    elements.strengthBar.style.background = strength > 70 ? '#22c55e' : strength > 40 ? '#f59e0b' : '#ef4444';
    
    // Save to history
    saveToHistory(password);
  }

  async function saveToHistory(password) {
    const { passwordHistory = [] } = await chrome.storage.local.get('passwordHistory');
    passwordHistory.unshift(password);
    await chrome.storage.local.set({ passwordHistory: passwordHistory.slice(0, 20) });
  }

  elements.generateBtn?.addEventListener('click', generate);
  
  elements.copyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(elements.password.textContent);
    elements.copyBtn.textContent = '✓ Copied!';
    setTimeout(() => elements.copyBtn.textContent = '📋 Copy', 1500);
  });
  
  elements.length?.addEventListener('input', (e) => { 
    elements.lengthVal.textContent = e.target.value; 
  });

  generate();
});
