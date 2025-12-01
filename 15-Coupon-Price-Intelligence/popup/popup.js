/**
 * Coupon Price Intelligence - Popup Script
 */
document.addEventListener('DOMContentLoaded', async () => {
  const couponsList = document.getElementById('couponsList');
  const savingsTotal = document.getElementById('savingsTotal');
  const siteName = document.getElementById('siteName');
  const refreshBtn = document.getElementById('refreshBtn');

  async function loadCoupons() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;
    
    const hostname = new URL(tab.url).hostname;
    siteName.textContent = hostname;
    
    // Get coupons from storage
    const { coupons = {}, savings = 0 } = await chrome.storage.local.get(['coupons', 'savings']);
    const siteCoupons = coupons[hostname] || [];
    
    savingsTotal.textContent = `$${savings.toFixed(2)}`;
    
    if (siteCoupons.length === 0) {
      couponsList.innerHTML = '<div class="empty">🔍 No coupons found for this site</div>';
      return;
    }
    
    couponsList.innerHTML = siteCoupons.map(c => `
      <div class="coupon-item">
        <div class="coupon-code">${c.code}</div>
        <div class="coupon-desc">${c.description}</div>
        <div class="coupon-discount">${c.discount}</div>
        <button class="copy-btn" data-code="${c.code}">Copy</button>
      </div>
    `).join('');
    
    couponsList.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.code);
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
      });
    });
  }

  refreshBtn?.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Searching...';
    
    // Simulate coupon search
    setTimeout(() => {
      refreshBtn.disabled = false;
      refreshBtn.textContent = 'Find Coupons';
      loadCoupons();
    }, 1500);
  });

  loadCoupons();
});
