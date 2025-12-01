/**
 * Smart Form AutoFiller - Popup Script
 */
document.addEventListener('DOMContentLoaded', async () => {
  const profileSelect = document.getElementById('profileSelect');
  const fillBtn = document.getElementById('fillBtn');
  const manageBtn = document.getElementById('manageBtn');
  const statusText = document.getElementById('statusText');
  
  let profiles = [];
  
  // Load profiles
  async function loadProfiles() {
    const data = await chrome.storage.local.get('profiles');
    profiles = data.profiles || [
      { id: 'default', name: 'Default Profile', data: { firstName: '', lastName: '', email: '', phone: '' } }
    ];
    renderProfiles();
  }
  
  function renderProfiles() {
    profileSelect.innerHTML = profiles.map(p => 
      `<option value="${p.id}">${p.name}</option>`
    ).join('');
  }
  
  // Fill form
  fillBtn?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const selectedProfile = profiles.find(p => p.id === profileSelect.value);
    
    if (tab && selectedProfile) {
      try {
        await chrome.tabs.sendMessage(tab.id, { 
          type: 'FILL_FORM', 
          profile: selectedProfile.data 
        });
        statusText.textContent = '✓ Form filled successfully!';
        statusText.className = 'status success';
      } catch {
        statusText.textContent = '✗ Could not fill form on this page';
        statusText.className = 'status error';
      }
    }
  });
  
  // Open options
  manageBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  loadProfiles();
});
