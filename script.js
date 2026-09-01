// In-memory task store (resets on page reload — this runs entirely client-side)
let tasks = [];
let nextId = 1;
let currentFilter = 'all';
let editingId = null;

const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const summary = document.getElementById('summary');
const filterBtns = document.querySelectorAll('.filter-btn');
const dateEl = document.getElementById('today-date');

dateEl.textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
});

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;
    tasks.push({ id: nextId++, text, completed: false });
    taskInput.value = '';
    render();
    taskInput.focus();
}

function toggleTask(id) {
    const t = tasks.find(t => t.id === id);
    if (t) t.completed = !t.completed;
    render();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    if (editingId === id) editingId = null;
    render();
}

function startEdit(id) {
    editingId = id;
    render();
}

function saveEdit(id, value) {
    const text = value.trim();
    const t = tasks.find(t => t.id === id);
    if (t && text) t.text = text;
    editingId = null;
    render();
}

function cancelEdit() {
    editingId = null;
    render();
}

function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
    render();
}

function getVisibleTasks() {
    if (currentFilter === 'pending') return tasks.filter(t => !t.completed);
    if (currentFilter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
}

function render() {
    const visible = getVisibleTasks();
    const pendingCount = tasks.filter(t => !t.completed).length;

    summary.textContent = tasks.length === 0
        ? ''
        : `${pendingCount} pending · ${tasks.length - pendingCount} completed`;

    taskList.innerHTML = '';

    if (visible.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'empty-state';
        empty.innerHTML = tasks.length === 0
            ? '<span>Nothing on the list yet</span>Add your first task above.'
            : '<span>No tasks here</span>Try a different filter.';
        taskList.appendChild(empty);
        return;
    }

    visible.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task' + (task.completed ? ' completed' : '');

        if (editingId === task.id) {
            li.innerHTML = `
          <span class="checkbox ${task.completed ? 'checked' : ''}" style="visibility:hidden"></span>
          <input type="text" class="edit-input" value="${escapeHtml(task.text)}" maxlength="200">
          <div class="task-actions">
            <button class="icon-btn save">Save</button>
            <button class="icon-btn cancel">Cancel</button>
          </div>
        `;
            const input = li.querySelector('.edit-input');
            li.querySelector('.save').addEventListener('click', () => saveEdit(task.id, input.value));
            li.querySelector('.cancel').addEventListener('click', cancelEdit);
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') saveEdit(task.id, input.value);
                if (e.key === 'Escape') cancelEdit();
            });
            taskList.appendChild(li);
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        } else {
            li.innerHTML = `
          <span class="checkbox ${task.completed ? 'checked' : ''}" role="checkbox" aria-checked="${task.completed}" tabindex="0"></span>
          <span class="task-text">${escapeHtml(task.text)}</span>
          <div class="task-actions">
            <button class="icon-btn edit">Edit</button>
            <button class="icon-btn delete">Delete</button>
          </div>
        `;
            const checkbox = li.querySelector('.checkbox');
            checkbox.addEventListener('click', () => toggleTask(task.id));
            checkbox.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTask(task.id); }
            });
            li.querySelector('.edit').addEventListener('click', () => startEdit(task.id));
            li.querySelector('.delete').addEventListener('click', () => deleteTask(task.id));
            taskList.appendChild(li);
        }
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
filterBtns.forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));

render();
