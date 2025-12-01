document.addEventListener('DOMContentLoaded', async () => {
  const productsList = document.getElementById('productsList');
  const trackCurrentBtn = document.getElementById('trackCurrentBtn');
  const totalProducts = document.getElementById('totalProducts');
  const priceDrops = document.getElementById('priceDrops');
  const totalSaved = document.getElementById('totalSaved');

  await loadProducts();

  trackCurrentBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const info = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PRODUCT_INFO' });
      if (info && info.price) {
        await chrome.runtime.sendMessage({ type: 'ADD_PRODUCT', product: { ...info, currentPrice: info.price }});
        trackCurrentBtn.textContent = '✓ Added!';
        await loadProducts();
        setTimeout(() => trackCurrentBtn.textContent = 'Track Current Page', 2000);
      }
    } catch (e) {
      trackCurrentBtn.textContent = 'Not a product page';
      setTimeout(() => trackCurrentBtn.textContent = 'Track Current Page', 2000);
    }
  });

  document.getElementById('settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());

  async function loadProducts() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_PRODUCTS' });
    const products = response.products || [];
    
    totalProducts.textContent = products.length;
    
    let drops = 0, saved = 0;
    products.forEach(p => {
      if (p.priceHistory.length > 1) {
        const initial = p.priceHistory[0].price;
        if (p.currentPrice < initial) {
          drops++;
          saved += initial - p.currentPrice;
        }
      }
    });
    priceDrops.textContent = drops;
    totalSaved.textContent = '$' + saved.toFixed(0);

    if (products.length === 0) {
      productsList.innerHTML = '<div class="empty">No products tracked yet</div>';
      return;
    }

    productsList.innerHTML = products.map(p => {
      const initial = p.priceHistory[0]?.price || p.currentPrice;
      const change = ((p.currentPrice - initial) / initial * 100).toFixed(1);
      const isUp = p.currentPrice > initial;
      return `
        <div class="product-item">
          <img class="product-img" src="${p.image || ''}" alt="">
          <div class="product-info">
            <div class="product-title">${p.title}</div>
            <div class="product-price">$${p.currentPrice.toFixed(2)}</div>
            <div class="product-change ${isUp ? 'up' : ''}">${isUp ? '↑' : '↓'} ${Math.abs(change)}%</div>
          </div>
          <div class="product-actions">
            <button onclick="window.open('${p.url}')">🔗</button>
            <button class="delete-btn" data-id="${p.id}">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    productsList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ type: 'REMOVE_PRODUCT', id: parseInt(btn.dataset.id) });
        await loadProducts();
      });
    });
  }
});
