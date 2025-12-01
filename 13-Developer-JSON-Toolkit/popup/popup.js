/**
 * Developer JSON Toolkit - Popup Script
 */
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('jsonInput');
  const output = document.getElementById('jsonOutput');
  const formatBtn = document.getElementById('formatBtn');
  const minifyBtn = document.getElementById('minifyBtn');
  const validateBtn = document.getElementById('validateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const statusText = document.getElementById('status');

  function setStatus(msg, type = 'info') {
    statusText.textContent = msg;
    statusText.className = `status ${type}`;
  }

  formatBtn?.addEventListener('click', () => {
    try {
      const json = JSON.parse(input.value);
      output.value = JSON.stringify(json, null, 2);
      setStatus('✓ Formatted successfully', 'success');
    } catch (e) {
      setStatus(`✗ ${e.message}`, 'error');
    }
  });

  minifyBtn?.addEventListener('click', () => {
    try {
      const json = JSON.parse(input.value);
      output.value = JSON.stringify(json);
      setStatus('✓ Minified successfully', 'success');
    } catch (e) {
      setStatus(`✗ ${e.message}`, 'error');
    }
  });

  validateBtn?.addEventListener('click', () => {
    try {
      JSON.parse(input.value);
      setStatus('✓ Valid JSON', 'success');
    } catch (e) {
      setStatus(`✗ Invalid: ${e.message}`, 'error');
    }
  });

  copyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(output.value || input.value);
    setStatus('✓ Copied to clipboard', 'success');
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    output.value = '';
    setStatus('Cleared', 'info');
  });

  // Auto-format on paste
  input?.addEventListener('paste', () => {
    setTimeout(() => {
      try {
        const json = JSON.parse(input.value);
        output.value = JSON.stringify(json, null, 2);
        setStatus('✓ Auto-formatted', 'success');
      } catch {}
    }, 100);
  });
});
