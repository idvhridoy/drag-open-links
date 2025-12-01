// Coupon Price Intelligence - Content Script
(() => {
  const SAMPLE_COUPONS = ['SAVE10', 'FREESHIP', 'EXTRA20', 'DEAL15'];
  const showCouponButton = () => {
    const btn = document.createElement('button');
    btn.innerHTML = '🎟️ Find Coupons';
    btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;padding:12px 20px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 15px rgba(16,185,129,.4)';
    btn.onclick = () => alert('Available coupons: ' + SAMPLE_COUPONS.join(', '));
    document.body.appendChild(btn);
  };
  setTimeout(showCouponButton, 1000);
})();
