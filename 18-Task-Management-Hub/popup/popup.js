/**
 * Task Management Hub - Popup Script
 */
document.addEventListener('DOMContentLoaded', async () => {
  const taskInput = document.getElementById('taskInput');
  const addBtn = document.getElementById('addBtn');
  const tasksList = document.getElementById('tasksList');
  const totalTasks = document.getElementById('totalTasks');
  const completedTasks = document.getElementById('completedTasks');
  const optionsBtn = document.getElementById('optionsBtn');

  let tasks = [];

  // Load tasks
  async function loadTasks() {
    const data = await chrome.storage.local.get('tasks');
    tasks = data.tasks || [];
    renderTasks();
    updateStats();
  }

  // Render tasks
  function renderTasks() {
    const pending = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);
    
    tasksList.innerHTML = [...pending, ...completed].map(t => `
      <div class="task-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
        <input type="checkbox" ${t.completed ? 'checked' : ''} class="task-checkbox">
        <span class="task-text">${t.text}</span>
        <button class="delete-btn">×</button>
      </div>
    `).join('') || '<div class="empty">No tasks yet. Add one above!</div>';

    tasksList.querySelectorAll('.task-item').forEach(item => {
      const id = parseInt(item.dataset.id);
      
      item.querySelector('.task-checkbox')?.addEventListener('change', () => toggleTask(id));
      item.querySelector('.delete-btn')?.addEventListener('click', () => deleteTask(id));
    });
  }

  function updateStats() {
    totalTasks.textContent = tasks.length;
    completedTasks.textContent = tasks.filter(t => t.completed).length;
  }

  // Add task
  function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;
    
    tasks.unshift({ id: Date.now(), text, completed: false, createdAt: new Date().toISOString() });
    saveTasks();
    taskInput.value = '';
  }

  // Toggle task
  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) task.completed = !task.completed;
    saveTasks();
  }

  // Delete task
  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
  }

  // Save tasks
  async function saveTasks() {
    await chrome.storage.local.set({ tasks });
    renderTasks();
    updateStats();
  }

  addBtn?.addEventListener('click', addTask);
  taskInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });

  optionsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  loadTasks();
});
