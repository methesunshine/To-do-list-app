const STORAGE_KEY = 'todoTasks_v1';

const taskForm = document.getElementById('taskForm');
const titleInput = document.getElementById('taskTitle');
const categorySelect = document.getElementById('taskCategory');
const dateInput = document.getElementById('taskDate');
const saveBtn = document.getElementById('saveBtn');
const cancelEditBtn = document.getElementById('cancelEdit');
const taskList = document.getElementById('taskList');
const filters = document.querySelectorAll('.filter');
const searchInput = document.getElementById('search');
const clearAllBtn = document.getElementById('clearAll');

let tasks = [];
let editingId = null;
let activeFilter = 'All';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch {
    tasks = [];
  }
}
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function renderTasks() {
  const q = (searchInput.value || '').trim().toLowerCase();
  const visible = tasks.filter(
    t =>
      (activeFilter === 'All' || t.category === activeFilter) &&
      t.title.toLowerCase().includes(q)
  );

  taskList.innerHTML = '';
  if (visible.length === 0) {
    taskList.innerHTML = '<div class="empty">No tasks yet — add one above.</div>';
    return;
  }

  visible.sort(
    (a, b) =>
      (a.completed ? 1 : 0) - (b.completed ? 1 : 0) ||
      new Date(a.date || 0) - new Date(b.date || 0)
  );

  for (const t of visible) {
    const el = document.createElement('div');
    el.className = 'task card';
    const left = document.createElement('div');
    left.className = 'left';
    const right = document.createElement('div');
    right.className = 'actions';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = t.title + (t.completed ? ' (Done)' : '');

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<span class="badge ${t.category.toLowerCase()}">${t.category}</span> ${
      t.date ? ' • due ' + new Date(t.date).toLocaleDateString() : ''
    }`;

    left.appendChild(title);
    left.appendChild(meta);

    const editBtn = document.createElement('button');
    editBtn.title = 'Edit task';
    editBtn.innerHTML = '✏️';
    editBtn.onclick = () => startEditTask(t.id);

    const delBtn = document.createElement('button');
    delBtn.title = 'Delete task';
    delBtn.innerHTML = '🗑️';
    delBtn.onclick = () => deleteTask(t.id);

    const toggleBtn = document.createElement('button');
    toggleBtn.title = t.completed ? 'Mark as not done' : 'Mark as done';
    toggleBtn.innerHTML = t.completed ? '↺' : '✔️';
    toggleBtn.onclick = () => toggleComplete(t.id);

    right.appendChild(toggleBtn);
    right.appendChild(editBtn);
    right.appendChild(delBtn);

    el.appendChild(left);
    el.appendChild(right);
    taskList.appendChild(el);
  }
}

function addTask(task) {
  tasks.push(task);
  saveTasks();
  renderTasks();
}
function updateTask(id, patch) {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx > -1) {
    tasks[idx] = { ...tasks[idx], ...patch };
    saveTasks();
    renderTasks();
  }
}
function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}
function toggleComplete(id) {
  const t = tasks.find(t => t.id === id);
  if (t) {
    t.completed = !t.completed;
    saveTasks();
    renderTasks();
  }
}

function startEditTask(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  editingId = id;
  titleInput.value = t.title;
  categorySelect.value = t.category;
  dateInput.value = t.date || '';
  saveBtn.textContent = 'Save changes';
  cancelEditBtn.style.display = 'inline-block';
}
function cancelEdit() {
  editingId = null;
  taskForm.reset();
  saveBtn.textContent = 'Add Task';
  cancelEditBtn.style.display = 'none';
}

taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const category = categorySelect.value;
  const date = dateInput.value || null;
  if (!title) return titleInput.focus();

  if (editingId) {
    updateTask(editingId, { title, category, date });
    cancelEdit();
  } else {
    addTask({
      id: uid(),
      title,
      category,
      date,
      createdAt: new Date().toISOString(),
      completed: false
    });
    taskForm.reset();
  }
});

cancelEditBtn.addEventListener('click', cancelEdit);

filters.forEach(btn =>
  btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderTasks();
  })
);

searchInput.addEventListener('input', () => renderTasks());

clearAllBtn.addEventListener('click', () => {
  if (!confirm('Clear ALL tasks? This cannot be undone.')) return;
  tasks = [];
  saveTasks();
  renderTasks();
});

loadTasks();
renderTasks();
