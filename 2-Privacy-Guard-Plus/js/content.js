/**
 * Privacy Guard Plus - Content Script
 * Handles fingerprinting protection and privacy enhancements
 */

(() => {
  'use strict';

  // ============================================================================
  // Fingerprinting Protection
  // ============================================================================

  const protectFingerprinting = () => {
    // Canvas fingerprinting protection
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
      const context = this.getContext('2d');
      if (context) {
        const imageData = context.getImageData(0, 0, this.width, this.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] ^= (Math.random() * 2) | 0;
        }
        context.putImageData(imageData, 0, 0);
      }
      return originalToDataURL.apply(this, args);
    };

    // WebGL fingerprinting protection
    const getParameterProxy = function(original) {
      return function(parameter) {
        const spoofedParams = {
          37445: 'Intel Inc.',
          37446: 'Intel Iris OpenGL Engine',
          7936: 'WebKit',
          7937: 'WebKit WebGL'
        };
        if (spoofedParams[parameter]) {
          return spoofedParams[parameter];
        }
        return original.call(this, parameter);
      };
    };

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      gl.getParameter = getParameterProxy(gl.getParameter);
    }

    // Audio fingerprinting protection
    if (window.AudioContext || window.webkitAudioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const originalCreateOscillator = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function() {
        const oscillator = originalCreateOscillator.call(this);
        oscillator.frequency.value += Math.random() * 0.01;
        return oscillator;
      };
    }

    // Navigator spoofing
    const navigatorProps = {
      hardwareConcurrency: 4,
      deviceMemory: 8,
      platform: 'Win32'
    };

    Object.keys(navigatorProps).forEach(prop => {
      try {
        Object.defineProperty(navigator, prop, {
          get: () => navigatorProps[prop]
        });
      } catch (e) {}
    });
  };

  // ============================================================================
  // Cookie Consent Auto-Handler
  // ============================================================================

  const handleCookieConsent = () => {
    const selectors = [
      '[class*="cookie"] [class*="accept"]',
      '[class*="cookie"] [class*="agree"]',
      '[class*="consent"] [class*="accept"]',
      '[id*="cookie"] [class*="accept"]',
      'button[class*="accept-cookies"]',
      '[data-testid*="cookie-accept"]',
      '.cc-btn.cc-dismiss',
      '#onetrust-accept-btn-handler'
    ];

    const rejectSelectors = [
      '[class*="cookie"] [class*="reject"]',
      '[class*="cookie"] [class*="decline"]',
      '[class*="consent"] [class*="reject"]',
      '[class*="necessary-only"]',
      '[data-testid*="cookie-reject"]'
    ];

    // Try to reject non-essential cookies first
    for (const selector of rejectSelectors) {
      const btn = document.querySelector(selector);
      if (btn && btn.offsetParent !== null) {
        btn.click();
        console.log('[PrivacyGuard] Rejected non-essential cookies');
        return;
      }
    }

    // Otherwise, accept to dismiss the banner
    setTimeout(() => {
      for (const selector of selectors) {
        const btn = document.querySelector(selector);
        if (btn && btn.offsetParent !== null) {
          btn.click();
          console.log('[PrivacyGuard] Dismissed cookie banner');
          return;
        }
      }
    }, 1000);
  };

  // ============================================================================
  // Privacy Indicators
  // ============================================================================

  const showPrivacyIndicator = () => {
    const indicator = document.createElement('div');
    indicator.id = 'privacy-guard-indicator';
    indicator.innerHTML = `
      <div class="pg-indicator">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9,12 11,14 15,10"/>
        </svg>
        <span>Protected</span>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      #privacy-guard-indicator {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 2147483647;
        pointer-events: none;
        animation: pgFadeIn 0.3s ease, pgFadeOut 0.3s ease 2.7s forwards;
      }
      .pg-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border-radius: 8px;
        font-family: -apple-system, sans-serif;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      @keyframes pgFadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pgFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 3000);
  };

  // ============================================================================
  // Link Tracking Prevention
  // ============================================================================

  const preventLinkTracking = () => {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (!href) return;
      
      // Remove tracking parameters
      try {
        const url = new URL(href, window.location.origin);
        const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 
                                'fbclid', 'gclid', 'msclkid', 'ref', 'ref_src'];
        
        let cleaned = false;
        trackingParams.forEach(param => {
          if (url.searchParams.has(param)) {
            url.searchParams.delete(param);
            cleaned = true;
          }
        });
        
        if (cleaned) {
          link.href = url.toString();
          console.log('[PrivacyGuard] Cleaned tracking params from link');
        }
      } catch (e) {}
    }, true);
  };

  // ============================================================================
  // Referrer Protection
  // ============================================================================

  const protectReferrer = () => {
    const meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.content = 'no-referrer-when-downgrade';
    document.head.appendChild(meta);
  };

  // ============================================================================
  // Message Handling
  // ============================================================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'GET_PAGE_INFO':
        sendResponse({
          hostname: window.location.hostname,
          hasTrackers: document.querySelectorAll('script[src*="google-analytics"], script[src*="facebook"]').length > 0
        });
        break;
      default:
        sendResponse({ success: false });
    }
    return true;
  });

  // ============================================================================
  // Initialize
  // ============================================================================

  const init = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
      
      if (response.success && response.enabled) {
        if (response.settings.blockFingerprinting) {
          protectFingerprinting();
        }
        preventLinkTracking();
        protectReferrer();
        
        // Handle cookie consent after page load
        if (document.readyState === 'complete') {
          handleCookieConsent();
        } else {
          window.addEventListener('load', () => {
            setTimeout(handleCookieConsent, 2000);
          });
        }
        
        // Show indicator briefly
        if (document.readyState === 'complete') {
          showPrivacyIndicator();
        } else {
          window.addEventListener('load', showPrivacyIndicator);
        }
      }
    } catch (error) {
      console.debug('[PrivacyGuard] Init error:', error);
    }
  };

  init();
})();
