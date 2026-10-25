// ===== todo.js : Todo List with localStorage =====

const STORAGE_KEY = "todoTasks";

// 1. Elements
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const emptyEl = document.getElementById("todo-empty");
const countEl = document.getElementById("todo-count");
const clearBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll("[data-filter]");

// 2. State: tasks look like { id: 1, text: "Buy milk", done: false }
let tasks = loadTasks();
let filter = "all";      // "all" | "active" | "completed"
let editingId = null;    // id of the task being edited (or null)

// 3. Save / load from localStorage
function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return []; // corrupted data -> start fresh
  }
}
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// 4. Helper to build a button
function makeButton(label, action, extraClass = "") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn btn--ghost ${extraClass}`.trim();
  btn.dataset.action = action;
  btn.textContent = label;
  return btn;
}

// 5. Draw the list on the page
function render() {
  list.replaceChildren();

  const visible = tasks.filter((task) => {
    if (filter === "active") return !task.done;
    if (filter === "completed") return task.done;
    return true;
  });

  visible.forEach((task) => {
    const li = document.createElement("li");
    li.className = "todo__item" + (task.done ? " todo__item--done" : "");
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo__check";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Mark "${task.text}" as complete`);
    li.append(checkbox);

    if (task.id === editingId) {
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "input todo__edit";
      editInput.value = task.text;
      editInput.setAttribute("aria-label", "Edit task");
      li.append(editInput, makeButton("Save", "save"), makeButton("Cancel", "cancel"));
    } else {
      const text = document.createElement("span");
      text.className = "todo__text";
      text.textContent = task.text; // textContent keeps user input safe
      li.append(text, makeButton("Edit", "edit"), makeButton("Delete", "delete", "btn--danger"));
    }
    list.append(li);
  });

  // Empty message
  const messages = {
    all: "No tasks yet. Add your first one above.",
    active: "No active tasks.",
    completed: "No completed tasks yet.",
  };
  emptyEl.textContent = messages[filter];
  emptyEl.hidden = visible.length > 0;

  // Footer counter
  const left = tasks.filter((t) => !t.done).length;
  countEl.textContent = `${left} ${left === 1 ? "task" : "tasks"} left`;
  clearBtn.hidden = !tasks.some((t) => t.done);

  // Filter button highlight
  filterButtons.forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.filter === filter));
  });

  // Focus the edit box when editing
  const activeEdit = list.querySelector(".todo__edit");
  if (activeEdit) activeEdit.focus();
}

// 6. Add task
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  tasks.push({ id: Date.now(), text, done: false });
  input.value = "";
  saveTasks();
  render();
});

// 7. Actions inside the list (one listener for all buttons = event delegation)
function finishEdit(li, save) {
  if (save) {
    const newText = li.querySelector(".todo__edit").value.trim();
    const task = tasks.find((t) => t.id === Number(li.dataset.id));
    if (newText) task.text = newText;
  }
  editingId = null;
  saveTasks();
  render();
}

list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const li = button.closest("li");
  const id = Number(li.dataset.id);

  switch (button.dataset.action) {
    case "delete":
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      render();
      break;
    case "edit":
      editingId = id;
      render();
      break;
    case "save":
      finishEdit(li, true);
      break;
    case "cancel":
      finishEdit(li, false);
      break;
  }
});

// Mark complete / not complete
list.addEventListener("change", (event) => {
  if (!event.target.classList.contains("todo__check")) return;
  const id = Number(event.target.closest("li").dataset.id);
  const task = tasks.find((t) => t.id === id);
  task.done = event.target.checked;
  saveTasks();
  render();
});

// Enter = save, Escape = cancel while editing
list.addEventListener("keydown", (event) => {
  if (!event.target.classList.contains("todo__edit")) return;
  const li = event.target.closest("li");
  if (event.key === "Enter") finishEdit(li, true);
  if (event.key === "Escape") finishEdit(li, false);
});

// 8. Filters + clear completed
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    render();
  });
});

clearBtn.addEventListener("click", () => {
  tasks = tasks.filter((t) => !t.done);
  saveTasks();
  render();
});

// 9. First draw
render();