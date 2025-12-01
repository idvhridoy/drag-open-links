// Email Finder Verifier - Content Script
(() => {
  const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  
  const findEmails = () => {
    const text = document.body.innerText || '';
    const emails = [...new Set(text.match(EMAIL_REGEX) || [])];
    return emails.filter(e => !e.includes('example') && !e.includes('test@'));
  };
  
  chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    if (msg.type === 'FIND_EMAILS') {
      respond({ emails: findEmails() });
    }
    return true;
  });
})();
