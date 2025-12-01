/**
 * Price Tracker Pro - Background Service Worker
 */

const STORAGE_KEY = 'trackedProducts';
let products = [];

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  products = data[STORAGE_KEY] || [];
  chrome.alarms.create('checkPrices', { periodInMinutes: 60 });
});

chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  products = data[STORAGE_KEY] || [];
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkPrices') await checkAllPrices();
});

async function saveProducts() {
  await chrome.storage.local.set({ [STORAGE_KEY]: products });
}

async function addProduct(product) {
  const existing = products.find(p => p.url === product.url);
  if (existing) {
    existing.priceHistory.push({ price: product.currentPrice, date: Date.now() });
    existing.currentPrice = product.currentPrice;
  } else {
    products.push({
      id: Date.now(),
      url: product.url,
      title: product.title,
      image: product.image,
      currentPrice: product.currentPrice,
      targetPrice: product.targetPrice || null,
      priceHistory: [{ price: product.currentPrice, date: Date.now() }],
      addedAt: Date.now(),
      site: new URL(product.url).hostname
    });
  }
  await saveProducts();
  return { success: true };
}

async function removeProduct(id) {
  products = products.filter(p => p.id !== id);
  await saveProducts();
  return { success: true };
}

async function setTargetPrice(id, targetPrice) {
  const product = products.find(p => p.id === id);
  if (product) {
    product.targetPrice = targetPrice;
    await saveProducts();
  }
  return { success: true };
}

async function checkAllPrices() {
  for (const product of products) {
    try {
      // In real implementation, fetch and parse price from product.url
      // For now, simulate price check
      const priceChange = (Math.random() - 0.5) * 10;
      const newPrice = Math.max(1, product.currentPrice + priceChange);
      
      if (newPrice < product.currentPrice) {
        product.priceHistory.push({ price: newPrice, date: Date.now() });
        
        if (product.targetPrice && newPrice <= product.targetPrice) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '🎉 Price Drop Alert!',
            message: `${product.title} is now $${newPrice.toFixed(2)} (Target: $${product.targetPrice})`
          });
        }
        product.currentPrice = newPrice;
      }
    } catch (e) {
      console.error('Price check failed:', e);
    }
  }
  await saveProducts();
}

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  (async () => {
    switch (msg.type) {
      case 'GET_PRODUCTS': respond({ success: true, products }); break;
      case 'ADD_PRODUCT': respond(await addProduct(msg.product)); break;
      case 'REMOVE_PRODUCT': respond(await removeProduct(msg.id)); break;
      case 'SET_TARGET_PRICE': respond(await setTargetPrice(msg.id, msg.targetPrice)); break;
      case 'CHECK_PRICES': await checkAllPrices(); respond({ success: true }); break;
      default: respond({ success: false });
    }
  })();
  return true;
});
