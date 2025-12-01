/**
 * Web Tech Profiler - Popup Script
 * Display detected technologies
 */
document.addEventListener('DOMContentLoaded', async () => {
  const techList = document.getElementById('techList');
  const siteUrl = document.getElementById('siteUrl');
  const refreshBtn = document.getElementById('refreshBtn');
  
  async function loadTech() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      siteUrl.textContent = new URL(tab.url).hostname;
      
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_TECH' });
        if (response?.technologies) {
          renderTech(response.technologies);
        }
      } catch {
        techList.innerHTML = '<div class="empty">Unable to detect technologies on this page</div>';
      }
    }
  }
  
  function renderTech(techs) {
    if (!techs.length) {
      techList.innerHTML = '<div class="empty">No technologies detected</div>';
      return;
    }
    
    const categories = {};
    techs.forEach(t => {
      if (!categories[t.category]) categories[t.category] = [];
      categories[t.category].push(t);
    });
    
    techList.innerHTML = Object.entries(categories).map(([cat, items]) => `
      <div class="tech-category">
        <h3>${cat}</h3>
        ${items.map(t => `
          <div class="tech-item">
            <span class="tech-icon">${getTechIcon(t.name)}</span>
            <span class="tech-name">${t.name}</span>
            ${t.version ? `<span class="tech-version">${t.version}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('');
  }
  
  function getTechIcon(name) {
    const icons = {
      'React': '⚛️', 'Vue': '💚', 'Angular': '🅰️', 'jQuery': '📜',
      'WordPress': '📝', 'Shopify': '🛒', 'Next.js': '▲', 'Nuxt': '💚',
      'Bootstrap': '🅱️', 'Tailwind': '🌊', 'Google Analytics': '📊',
      'Facebook Pixel': '📘', 'Node.js': '💚', 'PHP': '🐘'
    };
    return icons[name] || '🔧';
  }
  
  refreshBtn?.addEventListener('click', loadTech);
  loadTech();
});
