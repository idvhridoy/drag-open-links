document.addEventListener('DOMContentLoaded', async () => {
  const workspacesList = document.getElementById('workspacesList');
  const newWorkspaceBtn = document.getElementById('newWorkspaceBtn');
  const saveCurrentBtn = document.getElementById('saveCurrentBtn');
  const modal = document.getElementById('modal');
  const workspaceName = document.getElementById('workspaceName');
  const cancelBtn = document.getElementById('cancelBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  
  let selectedColor = '#3b82f6';
  let editingId = null;

  await loadWorkspaces();

  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedColor = btn.dataset.color;
    });
  });

  newWorkspaceBtn.addEventListener('click', () => {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'New Workspace';
    confirmBtn.textContent = 'Create';
    workspaceName.value = '';
    modal.classList.add('open');
  });

  saveCurrentBtn.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_WORKSPACES' });
    if (response.workspaces.length > 0) {
      await chrome.runtime.sendMessage({ type: 'UPDATE_WORKSPACE', id: response.workspaces[0].id });
      saveCurrentBtn.textContent = '✓ Saved!';
      setTimeout(() => saveCurrentBtn.textContent = '💾 Save Current', 1500);
    }
  });

  cancelBtn.addEventListener('click', () => modal.classList.remove('open'));

  confirmBtn.addEventListener('click', async () => {
    const name = workspaceName.value.trim() || 'Untitled';
    if (editingId) {
      await chrome.runtime.sendMessage({ type: 'RENAME_WORKSPACE', id: editingId, name, color: selectedColor });
    } else {
      await chrome.runtime.sendMessage({ type: 'CREATE_WORKSPACE', name, color: selectedColor });
    }
    modal.classList.remove('open');
    await loadWorkspaces();
  });

  settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

  async function loadWorkspaces() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_WORKSPACES' });
    workspacesList.innerHTML = response.workspaces.map(w => `
      <div class="workspace-item" data-id="${w.id}">
        <div class="workspace-color" style="background:${w.color}"></div>
        <div class="workspace-info">
          <div class="workspace-name">${w.name}</div>
          <div class="workspace-meta">${w.tabs.length} tabs</div>
        </div>
        <div class="workspace-actions">
          <button class="edit-btn" data-id="${w.id}" data-name="${w.name}" data-color="${w.color}">✏️</button>
          <button class="delete-btn" data-id="${w.id}">🗑️</button>
        </div>
      </div>
    `).join('') || '<p style="text-align:center;color:var(--text2);padding:20px">No workspaces yet</p>';

    workspacesList.querySelectorAll('.workspace-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        if (e.target.closest('.workspace-actions')) return;
        await chrome.runtime.sendMessage({ type: 'LOAD_WORKSPACE', id: parseInt(item.dataset.id) });
        window.close();
      });
    });

    workspacesList.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        editingId = parseInt(btn.dataset.id);
        workspaceName.value = btn.dataset.name;
        selectedColor = btn.dataset.color;
        document.querySelectorAll('.color-btn').forEach(b => {
          b.classList.toggle('selected', b.dataset.color === selectedColor);
        });
        document.getElementById('modalTitle').textContent = 'Edit Workspace';
        confirmBtn.textContent = 'Save';
        modal.classList.add('open');
      });
    });

    workspacesList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Delete this workspace?')) {
          await chrome.runtime.sendMessage({ type: 'DELETE_WORKSPACE', id: parseInt(btn.dataset.id) });
          await loadWorkspaces();
        }
      });
    });
  }
});
