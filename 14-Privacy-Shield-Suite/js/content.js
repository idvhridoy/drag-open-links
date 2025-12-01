/**
 * Privacy Shield Suite - Content Script
 * Fingerprint protection and tracking prevention
 */
(() => {
  // Spoof canvas fingerprinting
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, attributes) {
    const context = originalGetContext.call(this, type, attributes);
    if (type === '2d' && context) {
      const originalGetImageData = context.getImageData;
      context.getImageData = function(x, y, w, h) {
        const imageData = originalGetImageData.call(this, x, y, w, h);
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] ^= (Math.random() * 2) | 0;
        }
        return imageData;
      };
    }
    return context;
  };

  // Spoof WebGL fingerprinting
  const getParameterProxyHandler = {
    apply: function(target, thisArg, args) {
      const param = args[0];
      const result = Reflect.apply(target, thisArg, args);
      if (param === 37445) return 'Intel Inc.'; // UNMASKED_VENDOR_WEBGL
      if (param === 37446) return 'Intel Iris OpenGL Engine'; // UNMASKED_RENDERER_WEBGL
      return result;
    }
  };

  // Spoof audio fingerprinting
  const originalCreateOscillator = AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator = function() {
    const oscillator = originalCreateOscillator.call(this);
    oscillator.frequency.value += Math.random() * 0.0001;
    return oscillator;
  };

  // Block known tracking scripts
  const blockPatterns = [
    /google-analytics\.com/,
    /googletagmanager\.com/,
    /facebook\.net.*fbevents/,
    /connect\.facebook\.net/,
    /doubleclick\.net/,
    /adservice\.google/
  ];

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.tagName === 'SCRIPT' && node.src) {
          if (blockPatterns.some(p => p.test(node.src))) {
            node.remove();
            console.log('[Privacy Shield] Blocked:', node.src);
          }
        }
      });
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Notify background of protection status
  chrome.runtime.sendMessage({ type: 'PROTECTION_ACTIVE', url: location.href }).catch(() => {});
})();
