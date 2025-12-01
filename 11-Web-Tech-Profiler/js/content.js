/**
 * Web Tech Profiler - Content Script
 */
(() => {
  const TECH_SIGNATURES = {
    'React': { check: () => !!window.React || !!document.querySelector('[data-reactroot]'), category: 'Framework', icon: '⚛️' },
    'Vue.js': { check: () => !!window.Vue || !!document.querySelector('[data-v-]'), category: 'Framework', icon: '💚' },
    'Angular': { check: () => !!window.ng || !!document.querySelector('[ng-version]'), category: 'Framework', icon: '🅰️' },
    'jQuery': { check: () => !!window.jQuery || !!window.$, category: 'Library', icon: '📘' },
    'Bootstrap': { check: () => !!document.querySelector('.container, .row, .col, .btn'), category: 'CSS', icon: '🅱️' },
    'Tailwind CSS': { check: () => !!document.querySelector('[class*="flex"], [class*="grid"], [class*="text-"]'), category: 'CSS', icon: '🌊' },
    'WordPress': { check: () => !!document.querySelector('[class*="wp-"], link[href*="wp-"]'), category: 'CMS', icon: '📝' },
    'Shopify': { check: () => !!window.Shopify, category: 'E-commerce', icon: '🛒' },
    'Google Analytics': { check: () => !!window.ga || !!window.gtag, category: 'Analytics', icon: '📊' },
    'Google Tag Manager': { check: () => !!window.google_tag_manager, category: 'Analytics', icon: '🏷️' },
    'Next.js': { check: () => !!document.querySelector('#__next'), category: 'Framework', icon: '▲' },
    'Nuxt.js': { check: () => !!document.querySelector('#__nuxt'), category: 'Framework', icon: '💚' },
    'Node.js': { check: () => !!document.querySelector('meta[name="generator"][content*="node"]'), category: 'Backend', icon: '💚' },
    'PHP': { check: () => !!document.querySelector('[class*="php"], script[src*=".php"]'), category: 'Backend', icon: '🐘' },
    'Cloudflare': { check: () => document.cookie.includes('__cf') || !!document.querySelector('script[src*="cloudflare"]'), category: 'CDN', icon: '☁️' },
    'Font Awesome': { check: () => !!document.querySelector('[class*="fa-"], link[href*="fontawesome"]'), category: 'Icons', icon: '🎨' },
    'Lodash': { check: () => !!window._, category: 'Library', icon: '📦' },
    'Moment.js': { check: () => !!window.moment, category: 'Library', icon: '⏰' },
    'GSAP': { check: () => !!window.gsap || !!window.TweenMax, category: 'Animation', icon: '✨' },
    'Stripe': { check: () => !!window.Stripe, category: 'Payment', icon: '💳' }
  };

  const detect = () => {
    const technologies = [];
    for (const [name, sig] of Object.entries(TECH_SIGNATURES)) {
      try {
        if (sig.check()) technologies.push({ name, category: sig.category, icon: sig.icon });
      } catch (e) {}
    }
    
    // Check meta generator
    const generator = document.querySelector('meta[name="generator"]')?.content;
    if (generator) technologies.push({ name: generator.split(' ')[0], category: 'CMS', icon: '📄' });
    
    chrome.runtime.sendMessage({ type: 'TECH_DETECTED', technologies }).catch(() => {});
  };

  setTimeout(detect, 1000);
})();
