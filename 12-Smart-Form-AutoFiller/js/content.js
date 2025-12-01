/**
 * Smart Form AutoFiller - Content Script
 */
(() => {
  const FIELD_PATTERNS = {
    name: /name|full.?name|your.?name/i,
    firstName: /first.?name|fname|given.?name/i,
    lastName: /last.?name|lname|surname|family.?name/i,
    email: /email|e-mail/i,
    phone: /phone|tel|mobile|cell/i,
    address: /address|street/i,
    city: /city|town/i,
    state: /state|province|region/i,
    zip: /zip|postal|postcode/i,
    country: /country|nation/i,
    company: /company|organization|business/i
  };

  const detectFieldType = (input) => {
    const name = input.name?.toLowerCase() || '';
    const id = input.id?.toLowerCase() || '';
    const placeholder = input.placeholder?.toLowerCase() || '';
    const label = document.querySelector(`label[for="${input.id}"]`)?.textContent?.toLowerCase() || '';
    const combined = `${name} ${id} ${placeholder} ${label}`;
    
    for (const [type, pattern] of Object.entries(FIELD_PATTERNS)) {
      if (pattern.test(combined)) return type;
    }
    if (input.type === 'email') return 'email';
    if (input.type === 'tel') return 'phone';
    return null;
  };

  const fillForms = async () => {
    const { activeProfile } = await chrome.storage.local.get('activeProfile');
    if (!activeProfile) return;
    
    document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea').forEach(input => {
      const fieldType = detectFieldType(input);
      if (fieldType && activeProfile[fieldType]) {
        input.value = activeProfile[fieldType];
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  };

  // Add fill button
  const addFillButton = () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (form.querySelector('.sfa-fill-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'sfa-fill-btn';
      btn.type = 'button';
      btn.innerHTML = '✨ Auto Fill';
      btn.onclick = fillForms;
      form.insertBefore(btn, form.firstChild);
    });
  };

  setTimeout(addFillButton, 1000);
  chrome.runtime.onMessage.addListener((msg) => { if (msg.type === 'FILL_FORMS') fillForms(); });
})();
