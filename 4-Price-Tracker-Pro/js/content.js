/**
 * Price Tracker Pro - Content Script
 */

(() => {
  const extractProductInfo = () => {
    const hostname = window.location.hostname;
    let title, price, image;

    // Amazon
    if (hostname.includes('amazon')) {
      title = document.querySelector('#productTitle')?.textContent?.trim();
      price = document.querySelector('.a-price .a-offscreen')?.textContent?.replace(/[^0-9.]/g, '');
      image = document.querySelector('#landingImage')?.src;
    }
    // eBay
    else if (hostname.includes('ebay')) {
      title = document.querySelector('h1.x-item-title__mainTitle')?.textContent?.trim();
      price = document.querySelector('.x-price-primary')?.textContent?.replace(/[^0-9.]/g, '');
      image = document.querySelector('#icImg')?.src;
    }
    // Walmart
    else if (hostname.includes('walmart')) {
      title = document.querySelector('h1[itemprop="name"]')?.textContent?.trim();
      price = document.querySelector('[data-automation="buybox-price"]')?.textContent?.replace(/[^0-9.]/g, '');
      image = document.querySelector('.hover-zoom-hero-image img')?.src;
    }
    // Generic fallback
    else {
      title = document.querySelector('h1')?.textContent?.trim();
      const priceEl = document.querySelector('[class*="price"], [data-price]');
      price = priceEl?.textContent?.replace(/[^0-9.]/g, '');
      image = document.querySelector('img[src*="product"], main img')?.src;
    }

    return { title, price: parseFloat(price) || 0, image, url: window.location.href };
  };

  // Inject tracking button
  const injectButton = () => {
    const info = extractProductInfo();
    if (!info.title || !info.price) return;

    const btn = document.createElement('button');
    btn.id = 'price-tracker-btn';
    btn.innerHTML = '📊 Track Price';
    btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;padding:12px 20px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 15px rgba(245,158,11,.4);transition:.2s';
    
    btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
    
    btn.addEventListener('click', async () => {
      const product = { ...info, currentPrice: info.price };
      const response = await chrome.runtime.sendMessage({ type: 'ADD_PRODUCT', product });
      if (response.success) {
        btn.innerHTML = '✓ Tracking!';
        btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
        setTimeout(() => {
          btn.innerHTML = '📊 Track Price';
          btn.style.background = 'linear-gradient(135deg,#f59e0b,#d97706)';
        }, 2000);
      }
    });

    document.body.appendChild(btn);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }

  chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    if (msg.type === 'GET_PRODUCT_INFO') {
      respond(extractProductInfo());
    }
    return true;
  });
})();
