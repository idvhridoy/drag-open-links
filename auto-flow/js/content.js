/**
 * Auto Flow - Content Script
 * VEO AI page interaction and automation
 */

(() => {
  chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    if (msg.type === 'PROCESS_PROMPT') {
      processPrompt(msg.prompt, msg.settings).then(result => respond(result)).catch(e => respond({ success: false, error: e.message }));
      return true;
    }
  });

  async function processPrompt(prompt, settings) {
    // Find and fill prompt input
    const promptInput = document.querySelector('textarea[placeholder*="prompt"], textarea[aria-label*="prompt"], input[type="text"][placeholder*="prompt"]');
    if (!promptInput) throw new Error('Prompt input not found');
    
    promptInput.focus();
    promptInput.value = typeof prompt === 'object' ? JSON.stringify(prompt) : prompt;
    promptInput.dispatchEvent(new Event('input', { bubbles: true }));
    promptInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    await delay(500);
    
    // Click generate button
    const generateBtn = document.querySelector('button[aria-label*="generate"], button:contains("Generate"), button[type="submit"]');
    if (generateBtn) {
      generateBtn.click();
      await waitForGeneration(settings.waitTimeMax * 1000);
    }
    
    return { success: true };
  }

  async function waitForGeneration(maxWait) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
      // Check for completion indicators
      const video = document.querySelector('video[src], .generated-video, .video-result');
      if (video) return true;
      
      // Check for error
      const error = document.querySelector('.error-message, [role="alert"]');
      if (error) throw new Error(error.textContent);
      
      await delay(2000);
    }
    throw new Error('Generation timeout');
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
})();
