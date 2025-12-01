/**
 * Quick Note Taker - Popup Script
 */
document.addEventListener('DOMContentLoaded', async () => {
  const newNoteBtn = document.getElementById('newNote');
  const notesList = document.getElementById('notesList');
  const editor = document.getElementById('editor');
  const noteContent = document.getElementById('noteContent');
  const saveBtn = document.getElementById('saveBtn');
  const backBtn = document.getElementById('backBtn');

  let notes = [];
  let currentId = null;

  async function load() {
    const data = await chrome.storage.local.get('notes');
    notes = data.notes || [];
    render();
  }

  function render() {
    notesList.innerHTML = notes.length ? notes.map(n => `
      <div class="note" data-id="${n.id}">
        <div class="note-title">${n.content.split('\n')[0].slice(0, 30) || 'Untitled'}</div>
        <div class="note-preview">${n.content.slice(0, 50)}</div>
        <div class="note-date">${new Date(n.updated).toLocaleDateString()}</div>
      </div>
    `).join('') : '<p style="text-align:center;color:#64748b;padding:20px">No notes yet</p>';
    
    notesList.querySelectorAll('.note').forEach(el => { 
      el.onclick = () => openNote(el.dataset.id); 
    });
  }

  function openNote(id) {
    currentId = id;
    const note = notes.find(n => n.id === id);
    noteContent.value = note ? note.content : '';
    notesList.style.display = 'none';
    editor.classList.add('show');
  }

  async function save() {
    const content = noteContent.value;
    if (currentId) {
      const note = notes.find(n => n.id === currentId);
      if (note) { note.content = content; note.updated = Date.now(); }
    } else if (content.trim()) {
      notes.unshift({ id: Date.now().toString(), content, created: Date.now(), updated: Date.now() });
    }
    await chrome.storage.local.set({ notes });
    closeEditor();
  }

  function closeEditor() {
    currentId = null;
    editor.classList.remove('show');
    notesList.style.display = 'flex';
    load();
  }

  newNoteBtn?.addEventListener('click', () => { currentId = null; openNote(null); });
  saveBtn?.addEventListener('click', save);
  backBtn?.addEventListener('click', closeEditor);

  load();
});
