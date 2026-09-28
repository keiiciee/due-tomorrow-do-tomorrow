/* =========================================================
   DUE TOMORROW, DO TOMORROW
   Main JavaScript
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

const AI_WORKER_URL = "https://dt-dt-ai.keiminiyaka.workers.dev/";

const STORAGE_KEY = "dueTomorrowDoTomorrowData";
const THEME_KEY = "dueTomorrowTheme";
const DARK_MODE_KEY = "dueTomorrowDarkMode";
const AI_HISTORY_KEY = "dueTomorrowAIHistory";

/* =========================================================
   DEFAULT DATA
   ========================================================= */

const defaultData = {
  subjects: [],
  tasks: [],
  schedule: [],
  deadlines: [],
  notes: [],
  folders: ["Unfiled"],
  links: [],
  trash: []
};

let data = loadData();

let currentTaskFilter = "all";
let currentNoteSort = "updated";
let currentNoteFolder = "all";

let editingType = null;
let editingId = null;

let calculatorExpression = "";
let scientificExpression = "";
let angleMode = "DEG";

let timerSeconds = 0;
let timerInterval = null;
let timerRunning = false;

/* =========================================================
   HELPERS
   ========================================================= */

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function nowISO() {
  return new Date().toISOString();
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "No date";

  const date = new Date(dateString + "T00:00:00");

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function todayDateString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function showToast(message) {
  const toast = $("#toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timeout);

  showToast.timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return structuredClone(defaultData);
    }

    const parsed = JSON.parse(saved);

    return {
      ...structuredClone(defaultData),
      ...parsed,
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      schedule: Array.isArray(parsed.schedule) ? parsed.schedule : [],
      deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      folders:
        Array.isArray(parsed.folders) && parsed.folders.length
          ? parsed.folders
          : ["Unfiled"],
      links: Array.isArray(parsed.links) ? parsed.links : [],
      trash: Array.isArray(parsed.trash) ? parsed.trash : []
    };
  } catch (error) {
    console.error("Could not load saved data:", error);
    return structuredClone(defaultData);
  }
}

/* =========================================================
   THEME
   ========================================================= */

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "lavender";

  document.body.dataset.theme = savedTheme;

  $all(".theme-option").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.theme === savedTheme
    );
  });
}

function setTheme(theme) {
  document.body.dataset.theme = theme;

  localStorage.setItem(THEME_KEY, theme);

  $all(".theme-option").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.theme === theme
    );
  });
}

function loadDarkMode() {
  const enabled = localStorage.getItem(DARK_MODE_KEY) === "true";

  document.body.classList.toggle("dark-mode", enabled);
}

function toggleDarkMode() {
  const enabled = !document.body.classList.contains("dark-mode");

  document.body.classList.toggle("dark-mode", enabled);

  localStorage.setItem(DARK_MODE_KEY, String(enabled));
}

/* =========================================================
   THEME PANEL
   ========================================================= */

function setupThemePanel() {
  const themeButton = $("#themeButton");
  const themePanel = $("#themePanel");

  if (!themeButton || !themePanel) return;

  themeButton.addEventListener("click", event => {
    event.stopPropagation();
    themePanel.classList.toggle("show");
  });

  themePanel.addEventListener("click", event => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => {
    themePanel.classList.remove("show");
  });

  $all(".theme-option").forEach(button => {
    button.addEventListener("click", () => {
      setTheme(button.dataset.theme);
      themePanel.classList.remove("show");
    });
  });
}

/* =========================================================
   GREETING
   ========================================================= */

function updateGreeting() {
  const greeting = $("#greeting");

  if (!greeting) return;

  const hour = new Date().getHours();

  let text = "Good evening";

  if (hour < 12) {
    text = "Good morning";
  } else if (hour < 18) {
    text = "Good afternoon";
  }

  greeting.textContent = text;
}

/* =========================================================
   STATS
   ========================================================= */

function updateStats() {
  const statSubjects = $("#statSubjects");
  const statTasks = $("#statTasks");
  const statPending = $("#statPending");
  const statOverdue = $("#statOverdue");
  const progressNumber = $("#progressNumber");

  const pending = data.tasks.filter(task => !task.completed);

  const overdue = data.deadlines.filter(deadline => {
    return deadline.date && deadline.date < todayDateString();
  });

  const completedTasks = data.tasks.filter(task => task.completed);

  if (statSubjects) {
    statSubjects.textContent = data.subjects.length;
  }

  if (statTasks) {
    statTasks.textContent = data.tasks.length;
  }

  if (statPending) {
    statPending.textContent = pending.length;
  }

  if (statOverdue) {
    statOverdue.textContent = overdue.length;
  }

  if (progressNumber) {
    const percentage =
      data.tasks.length === 0
        ? 0
        : Math.round(
            (completedTasks.length / data.tasks.length) * 100
          );

    progressNumber.textContent = `${percentage}%`;
  }
}

/* =========================================================
   SUBJECTS
   ========================================================= */

function renderSubjects() {
  const container = $("#subjectsList");

  if (!container) return;

  if (data.subjects.length === 0) {
    container.innerHTML =
      `<div class="empty-state">No subjects yet.</div>`;
    return;
  }

  const sorted = [...data.subjects].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  container.innerHTML = sorted
    .map(subject => {
      const taskCount = data.tasks.filter(
        task => task.subjectId === subject.id
      ).length;

      return `
        <div class="list-item subject-item">
          <div class="subject-info">
            <div class="subject-name">
              ${escapeHTML(subject.name)}
            </div>
            <div class="subject-meta">
              ${escapeHTML(subject.teacher || "No teacher")}
              · ${taskCount} task${taskCount === 1 ? "" : "s"}
            </div>
          </div>

          <div class="subject-actions">
            <button
              class="small-button"
              data-action="edit-subject"
              data-id="${subject.id}"
            >
              Edit
            </button>

            <button
              class="small-button danger-button"
              data-action="delete-subject"
              data-id="${subject.id}"
            >
              Delete
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

/* =========================================================
   TASKS
   ========================================================= */

function getSubjectName(subjectId) {
  const subject = data.subjects.find(
    item => item.id === subjectId
  );

  return subject ? subject.name : "No subject";
}

function renderTasks() {
  const container = $("#tasksList");

  if (!container) return;

  let tasks = [...data.tasks];

  if (currentTaskFilter === "pending") {
    tasks = tasks.filter(task => !task.completed);
  }

  if (currentTaskFilter === "completed") {
    tasks = tasks.filter(task => task.completed);
  }

  if (currentTaskFilter === "high") {
    tasks = tasks.filter(task => task.priority === "high");
  }

  tasks.sort((a, b) => {
    if (a.completed !== b.completed) {
      return Number(a.completed) - Number(b.completed);
    }

    if (a.dueDate && b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }

    return a.createdAt.localeCompare(b.createdAt);
  });

  if (tasks.length === 0) {
    container.innerHTML =
      `<div class="empty-state">No tasks here.</div>`;
    return;
  }

  container.innerHTML = tasks
    .map(task => {
      const priority = task.priority || "medium";

      return `
        <div class="list-item task-item priority-${priority} ${
          task.completed ? "completed" : ""
        }">

          <input
            type="checkbox"
            class="task-check"
            data-action="toggle-task"
            data-id="${task.id}"
            ${task.completed ? "checked" : ""}
          >

          <div class="task-content">
            <div class="task-title">
              ${escapeHTML(task.title)}
            </div>

            <div class="task-meta">
              ${escapeHTML(getSubjectName(task.subjectId))}
              ${
                task.dueDate
                  ? ` · Due ${escapeHTML(formatDate(task.dueDate))}`
                  : ""
              }
              · ${escapeHTML(priority)}
            </div>
          </div>

          <div class="item-actions">
            <button
              class="small-button"
              data-action="edit-task"
              data-id="${task.id}"
            >
              Edit
            </button>

            <button
              class="small-button danger-button"
              data-action="delete-task"
              data-id="${task.id}"
            >
              Delete
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

function setupTaskFilters() {
  $all(".filter-button").forEach(button => {
    button.addEventListener("click", () => {
      currentTaskFilter = button.dataset.filter || "all";

      $all(".filter-button").forEach(item => {
        item.classList.toggle(
          "active",
          item === button
        );
      });

      renderTasks();
    });
  });
}

/* =========================================================
   SCHEDULE
   ========================================================= */

const weekdayOrder = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

function timeToMinutes(time) {
  if (!time) return 0;

  const parts = time.split(":");

  const hours = Number(parts[0]) || 0;
  const minutes = Number(parts[1]) || 0;

  return hours * 60 + minutes;
}

function sortSchedule(schedule) {
  return [...schedule].sort((a, b) => {
    const dayDifference =
      (weekdayOrder[a.day] || 99) -
      (weekdayOrder[b.day] || 99);

    if (dayDifference !== 0) {
      return dayDifference;
    }

    return (
      timeToMinutes(a.startTime) -
      timeToMinutes(b.startTime)
    );
  });
}

function currentDayName() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long"
  });
}

function renderSchedule() {
  const container = $("#scheduleList");
  const todayContainer = $("#todayClasses");

  const sorted = sortSchedule(data.schedule);

  if (container) {
    if (sorted.length === 0) {
      container.innerHTML =
        `<div class="empty-state">No classes added yet.</div>`;
    } else {
      container.innerHTML = sorted
        .map(item => {
          return `
            <div class="list-item schedule-item ${
              item.day === currentDayName()
                ? "today-class"
                : ""
            }">

              <div class="schedule-time">
                ${escapeHTML(item.day)}<br>
                ${escapeHTML(item.startTime || "")}
                ${
                  item.endTime
                    ? `–${escapeHTML(item.endTime)}`
                    : ""
                }
              </div>

              <div>
                <div class="schedule-subject">
                  ${escapeHTML(item.subject)}
                </div>

                <div class="schedule-teacher">
                  ${escapeHTML(item.teacher || "No teacher")}
                </div>
              </div>

              <div class="item-actions">
                <button
                  class="small-button"
                  data-action="edit-schedule"
                  data-id="${item.id}"
                >
                  Edit
                </button>

                <button
                  class="small-button danger-button"
                  data-action="delete-schedule"
                  data-id="${item.id}"
                >
                  Delete
                </button>
              </div>

            </div>
          `;
        })
        .join("");
    }
  }

  if (todayContainer) {
    const today = sorted.filter(
      item => item.day === currentDayName()
    );

    if (today.length === 0) {
      todayContainer.innerHTML =
        `<div class="empty-state">No classes today.</div>`;
    } else {
      todayContainer.innerHTML = today
        .map(item => {
          return `
            <div class="list-item today-class">
              <strong>${escapeHTML(item.subject)}</strong>
              <div class="subject-meta">
                ${escapeHTML(item.startTime || "")}
                ${
                  item.endTime
                    ? `–${escapeHTML(item.endTime)}`
                    : ""
                }
                · ${escapeHTML(item.teacher || "No teacher")}
              </div>
            </div>
          `;
        })
        .join("");
    }
  }
}

/* =========================================================
   DEADLINES
   ========================================================= */

function renderDeadlines() {
  const container = $("#deadlinesList");

  if (!container) return;

  const sorted = [...data.deadlines].sort((a, b) =>
    (a.date || "").localeCompare(b.date || "")
  );

  if (sorted.length === 0) {
    container.innerHTML =
      `<div class="empty-state">No deadlines yet.</div>`;
    return;
  }

  const today = todayDateString();

  container.innerHTML = sorted
    .map(deadline => {
      const overdue =
        deadline.date && deadline.date < today;

      const soon =
        deadline.date &&
        deadline.date >= today &&
        Math.ceil(
          (new Date(deadline.date + "T00:00:00") -
            new Date(today + "T00:00:00")) /
            86400000
        ) <= 3;

      return `
        <div class="list-item deadline-item ${
          overdue
            ? "deadline-overdue"
            : soon
            ? "deadline-soon"
            : ""
        }">

          <div class="deadline-content">
            <div class="deadline-title">
              ${escapeHTML(deadline.title)}
            </div>

            <div class="deadline-date">
              ${escapeHTML(formatDate(deadline.date))}
              ${
                deadline.subject
                  ? ` · ${escapeHTML(deadline.subject)}`
                  : ""
              }
            </div>
          </div>

          <div class="item-actions">
            <button
              class="small-button"
              data-action="edit-deadline"
              data-id="${deadline.id}"
            >
              Edit
            </button>

            <button
              class="small-button danger-button"
              data-action="delete-deadline"
              data-id="${deadline.id}"
            >
              Delete
            </button>
          </div>

        </div>
      `;
    })
    .join("");
}

/* =========================================================
   NOTES
   ========================================================= */

function renderFolderSelect() {
  const select = $("#notesFolderFilter");

  if (!select) return;

  const folders = [...new Set(
    ["Unfiled", ...data.folders]
  )];

  select.innerHTML = `
    <option value="all">All folders</option>
    ${folders
      .map(folder => `
        <option value="${escapeHTML(folder)}">
          ${escapeHTML(folder)}
        </option>
      `)
      .join("")}
  `;

  select.value = currentNoteFolder;
}

function renderNotes() {
  const container = $("#notesList");

  if (!container) return;

  let notes = [...data.notes];

  if (currentNoteFolder !== "all") {
    notes = notes.filter(
      note => (note.folder || "Unfiled") === currentNoteFolder
    );
  }

  if (currentNoteSort === "updated") {
    notes.sort(
      (a, b) =>
        new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  }

  if (currentNoteSort === "created") {
    notes.sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  if (currentNoteSort === "az") {
    notes.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }

  if (currentNoteSort === "za") {
    notes.sort((a, b) =>
      b.title.localeCompare(a.title)
    );
  }

  if (currentNoteSort === "pinned") {
    notes.sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return Number(b.pinned) - Number(a.pinned);
      }

      return (
        new Date(b.updatedAt) -
        new Date(a.updatedAt)
      );
    });
  }

  if (notes.length === 0) {
    container.innerHTML =
      `<div class="empty-state">No notes here.</div>`;
    return;
  }

  container.innerHTML = notes
    .map(note => {
      return `
        <div class="list-item note-item ${
          note.pinned ? "pinned" : ""
        }">

          <div class="note-title">
            ${note.pinned ? "Pinned · " : ""}
            ${escapeHTML(note.title)}
          </div>

          <div class="note-preview">
            ${escapeHTML(note.content || "")}
          </div>

          <div class="note-meta">
            ${escapeHTML(note.folder || "Unfiled")}
            · Updated ${escapeHTML(
              formatDateTime(note.updatedAt)
            )}
          </div>

          <div class="item-actions" style="margin-top:10px;">
            <button
              class="small-button"
              data-action="edit-note"
              data-id="${note.id}"
            >
              Edit
            </button>

            <button
              class="small-button"
              data-action="pin-note"
              data-id="${note.id}"
            >
              ${note.pinned ? "Unpin" : "Pin"}
            </button>

            <button
              class="small-button danger-button"
              data-action="delete-note"
              data-id="${note.id}"
            >
              Delete
            </button>
          </div>

        </div>
      `;
    })
    .join("");
}

function refreshNotes() {
  renderFolderSelect();
  renderNotes();
}

function addFolder() {
  const name = prompt("Folder name:");

  if (!name) return;

  const cleanName = name.trim();

  if (!cleanName) return;

  if (
    data.folders.some(
      folder =>
        folder.toLowerCase() === cleanName.toLowerCase()
    )
  ) {
    showToast("That folder already exists.");
    return;
  }

  data.folders.push(cleanName);

  saveData();
  refreshNotes();

  showToast("Folder added.");
}

function manageFolders() {
  if (data.folders.length <= 1) {
    showToast("There are no extra folders to manage.");
    return;
  }

  const removable = data.folders.filter(
    folder => folder !== "Unfiled"
  );

  const selected = prompt(
    "Type the folder name you want to delete:\n\n" +
      removable.join("\n")
  );

  if (!selected) return;

  const folder = removable.find(
    item =>
      item.toLowerCase() === selected.trim().toLowerCase()
  );

  if (!folder) {
    showToast("Folder not found.");
    return;
  }

  const confirmDelete = confirm(
    `Delete the "${folder}" folder?\n\nNotes inside it will be moved to Unfiled.`
  );

  if (!confirmDelete) return;

  data.folders = data.folders.filter(
    item => item !== folder
  );

  data.notes.forEach(note => {
    if (note.folder === folder) {
      note.folder = "Unfiled";
      note.updatedAt = nowISO();
    }
  });

  currentNoteFolder = "all";

  saveData();
  refreshNotes();

  showToast("Folder deleted.");
}

/* =========================================================
   LINKS
   ========================================================= */

function renderLinks() {
  const container = $("#linksList");

  if (!container) return;

  if (data.links.length === 0) {
    container.innerHTML =
      `<div class="empty-state">No links saved yet.</div>`;
    return;
  }

  const sorted = [...data.links].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  container.innerHTML = sorted
    .map(link => {
      return `
        <div class="list-item link-item">

          <div class="link-content">
            <div class="link-title">
              ${escapeHTML(link.title)}
            </div>

            <a
              class="link-url"
              href="${escapeHTML(link.url)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${escapeHTML(link.url)}
            </a>
          </div>

          <div class="item-actions">
            <button
              class="small-button"
              data-action="edit-link"
              data-id="${link.id}"
            >
              Edit
            </button>

            <button
              class="small-button danger-button"
              data-action="delete-link"
              data-id="${link.id}"
            >
              Delete
            </button>
          </div>

        </div>
      `;
    })
    .join("");
}

/* =========================================================
   TRASH
   ========================================================= */

function addToTrash(type, item) {
  data.trash.unshift({
    id: generateId(),
    type,
    item,
    deletedAt: nowISO()
  });
}

function renderTrash() {
  const container = $("#trashList");

  if (!container) return;

  if (data.trash.length === 0) {
    container.innerHTML =
      `<div class="empty-state">Trash is empty.</div>`;
    return;
  }

  container.innerHTML = data.trash
    .map(entry => {
      const title =
        entry.item?.title ||
        entry.item?.name ||
        entry.item?.subject ||
        `${entry.type}`;

      return `
        <div class="list-item trash-item">

          <div class="trash-info">
            <div class="trash-title">
              ${escapeHTML(title)}
            </div>

            <div class="trash-meta">
              ${escapeHTML(entry.type)}
              · Deleted ${escapeHTML(
                formatDateTime(entry.deletedAt)
              )}
            </div>
          </div>

          <div class="item-actions">
            <button
              class="small-button"
              data-action="restore-trash"
              data-id="${entry.id}"
            >
              Restore
            </button>

            <button
              class="small-button danger-button"
              data-action="delete-trash"
              data-id="${entry.id}"
            >
              Delete permanently
            </button>
          </div>

        </div>
      `;
    })
    .join("");
}

function restoreTrash(id) {
  const index = data.trash.findIndex(
    entry => entry.id === id
  );

  if (index === -1) return;

  const entry = data.trash[index];

  if (!data[entry.type]) {
    showToast("This item could not be restored.");
    return;
  }

  data[entry.type].push(entry.item);

  data.trash.splice(index, 1);

  saveData();
  renderAll();

  showToast("Restored.");
}

function permanentlyDeleteTrash(id) {
  const confirmed = confirm(
    "Permanently delete this item?"
  );

  if (!confirmed) return;

  data.trash = data.trash.filter(
    entry => entry.id !== id
  );

  saveData();
  renderTrash();

  showToast("Deleted permanently.");
}

function emptyTrash() {
  if (data.trash.length === 0) {
    showToast("Trash is already empty.");
    return;
  }

  const confirmed = confirm(
    "Permanently delete everything in Trash?"
  );

  if (!confirmed) return;

  data.trash = [];

  saveData();
  renderTrash();

  showToast("Trash emptied.");
}

/* =========================================================
   MODAL
   ========================================================= */

function openModal(title, type, id = null) {
  const overlay = $("#modalOverlay");
  const modalTitle = $("#modalTitle");
  const fields = $("#modalFields");

  if (!overlay || !modalTitle || !fields) return;

  editingType = type;
  editingId = id;

  modalTitle.textContent = title;

  const item =
    id && type !== "folder"
      ? findItem(type, id)
      : null;

  fields.innerHTML = getFormHTML(type, item);

  overlay.classList.add("show");

  const firstInput = fields.querySelector(
    "input, textarea, select"
  );

  if (firstInput) {
    setTimeout(() => firstInput.focus(), 50);
  }
}

function closeModal() {
  const overlay = $("#modalOverlay");

  if (!overlay) return;

  overlay.classList.remove("show");

  editingType = null;
  editingId = null;
}

/* =========================================================
   FIND ITEMS
   ========================================================= */

function findItem(type, id) {
  const collection = data[type];

  if (!Array.isArray(collection)) {
    return null;
  }

  return collection.find(item => item.id === id) || null;
}

/* =========================================================
   FORM HTML
   ========================================================= */

function getFormHTML(type, item) {
  const value = field => escapeHTML(item?.[field] || "");

  if (type === "subject") {
    return `
      <div class="form-group">
        <label>Subject name</label>
        <input
          name="name"
          required
          value="${value("name")}"
          placeholder="e.g. General Mathematics"
        >
      </div>

      <div class="form-group">
        <label>Teacher</label>
        <input
          name="teacher"
          value="${value("teacher")}"
          placeholder="Teacher name"
        >
      </div>
    `;
  }

  if (type === "task") {
    return `
      <div class="form-group">
        <label>Task</label>
        <input
          name="title"
          required
          value="${value("title")}"
          placeholder="What do you need to do?"
        >
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Subject</label>
          <select name="subjectId">
            <option value="">No subject</option>

            ${data.subjects
              .map(subject => `
                <option
                  value="${subject.id}"
                  ${
                    item?.subjectId === subject.id
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHTML(subject.name)}
                </option>
              `)
              .join("")}
          </select>
        </div>

        <div class="form-group">
          <label>Priority</label>
          <select name="priority">
            ${["low", "medium", "high"]
              .map(priority => `
                <option
                  value="${priority}"
                  ${
                    (item?.priority || "medium") ===
                    priority
                      ? "selected"
                      : ""
                  }
                >
                  ${priority}
                </option>
              `)
              .join("")}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Due date</label>
        <input
          type="date"
          name="dueDate"
          value="${value("dueDate")}"
        >
      </div>
    `;
  }

  if (type === "schedule") {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];

    return `
      <div class="form-row">
        <div class="form-group">
          <label>Day</label>
          <select name="day" required>
            ${days
              .map(day => `
                <option
                  value="${day}"
                  ${
                    item?.day === day
                      ? "selected"
                      : ""
                  }
                >
                  ${day}
                </option>
              `)
              .join("")}
          </select>
        </div>

        <div class="form-group">
          <label>Subject</label>
          <input
            name="subject"
            required
            value="${value("subject")}"
            placeholder="Subject"
          >
        </div>
      </div>

      <div class="form-group">
        <label>Teacher</label>
        <input
          name="teacher"
          value="${value("teacher")}"
          placeholder="Teacher name"
        >
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Start time</label>
          <input
            type="time"
            name="startTime"
            required
            value="${value("startTime")}"
          >
        </div>

        <div class="form-group">
          <label>End time</label>
          <input
            type="time"
            name="endTime"
            required
            value="${value("endTime")}"
          >
        </div>
      </div>
    `;
  }

  if (type === "deadline") {
    return `
      <div class="form-group">
        <label>Deadline</label>
        <input
          name="title"
          required
          value="${value("title")}"
          placeholder="e.g. Research paper"
        >
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Date</label>
          <input
            type="date"
            name="date"
            required
            value="${value("date")}"
          >
        </div>

        <div class="form-group">
          <label>Subject</label>
          <input
            name="subject"
            value="${value("subject")}"
            placeholder="Subject"
          >
        </div>
      </div>
    `;
  }

  if (type === "note") {
    const folders = [
      ...new Set(["Unfiled", ...data.folders])
    ];

    return `
      <div class="form-group">
        <label>Title</label>
        <input
          name="title"
          required
          value="${value("title")}"
          placeholder="Note title"
        >
      </div>

      <div class="form-group">
        <label>Folder</label>
        <select name="folder">
          ${folders
            .map(folder => `
              <option
                value="${escapeHTML(folder)}"
                ${
                  (item?.folder || "Unfiled") === folder
                    ? "selected"
                    : ""
                }
              >
                ${escapeHTML(folder)}
              </option>
            `)
            .join("")}
        </select>
      </div>

      <div class="form-group">
        <label>Note</label>
        <textarea
          name="content"
          placeholder="Write your note here..."
        >${value("content")}</textarea>
      </div>
    `;
  }

  if (type === "link") {
    return `
      <div class="form-group">
        <label>Link name</label>
        <input
          name="title"
          required
          value="${value("title")}"
          placeholder="e.g. Google Classroom"
        >
      </div>

      <div class="form-group">
        <label>URL</label>
        <input
          type="url"
          name="url"
          required
          value="${value("url")}"
          placeholder="https://..."
        >
      </div>
    `;
  }

  return "";
}

/* =========================================================
   MODAL SUBMIT
   ========================================================= */

function handleModalSubmit(event) {
  event.preventDefault();

  const formData = new FormData(
    $("#modalForm")
  );

  const values = Object.fromEntries(formData.entries());

  if (!editingType) return;

  if (editingType === "subject") {
    saveSubject(values);
  }

  if (editingType === "task") {
    saveTask(values);
  }

  if (editingType === "schedule") {
    saveSchedule(values);
  }

  if (editingType === "deadline") {
    saveDeadline(values);
  }

  if (editingType === "note") {
    saveNote(values);
  }

  if (editingType === "link") {
    saveLink(values);
  }

  closeModal();
  saveData();
  renderAll();
}

/* =========================================================
   SAVE SUBJECT
   ========================================================= */

function saveSubject(values) {
  if (editingId) {
    const subject = findItem(
      "subjects",
      editingId
    );

    if (!subject) return;

    subject.name = values.name.trim();
    subject.teacher = values.teacher.trim();
    subject.updatedAt = nowISO();

    showToast("Subject updated.");
    return;
  }

  data.subjects.push({
    id: generateId(),
    name: values.name.trim(),
    teacher: values.teacher.trim(),
    createdAt: nowISO(),
    updatedAt: nowISO()
  });

  showToast("Subject added.");
}

/* =========================================================
   SAVE TASK
   ========================================================= */

function saveTask(values) {
  if (editingId) {
    const task = findItem(
      "tasks",
      editingId
    );

    if (!task) return;

    task.title = values.title.trim();
    task.subjectId = values.subjectId;
    task.priority = values.priority;
    task.dueDate = values.dueDate;
    task.updatedAt = nowISO();

    showToast("Task updated.");
    return;
  }

  data.tasks.push({
    id: generateId(),
    title: values.title.trim(),
    subjectId: values.subjectId,
    priority: values.priority || "medium",
    dueDate: values.dueDate,
    completed: false,
    createdAt: nowISO(),
    updatedAt: nowISO()
  });

  showToast("Task added.");
}

/* =========================================================
   SAVE SCHEDULE
   ========================================================= */

function saveSchedule(values) {
  if (editingId) {
    const item = findItem(
      "schedule",
      editingId
    );

    if (!item) return;

    Object.assign(item, {
      day: values.day,
      subject: values.subject.trim(),
      teacher: values.teacher.trim(),
      startTime: values.startTime,
      endTime: values.endTime,
      updatedAt: nowISO()
    });

    showToast("Class updated.");
    return;
  }

  data.schedule.push({
    id: generateId(),
    day: values.day,
    subject: values.subject.trim(),
    teacher: values.teacher.trim(),
    startTime: values.startTime,
    endTime: values.endTime,
    createdAt: nowISO(),
    updatedAt: nowISO()
  });

  showToast("Class added.");
}

/* =========================================================
   SAVE DEADLINE
   ========================================================= */

function saveDeadline(values) {
  if (editingId) {
    const deadline = findItem(
      "deadlines",
      editingId
    );

    if (!deadline) return;

    deadline.title = values.title.trim();
    deadline.date = values.date;
    deadline.subject = values.subject.trim();
    deadline.updatedAt = nowISO();

    showToast("Deadline updated.");
    return;
  }

  data.deadlines.push({
    id: generateId(),
    title: values.title.trim(),
    date: values.date,
    subject: values.subject.trim(),
    createdAt: nowISO(),
    updatedAt: nowISO()
  });

  showToast("Deadline added.");
}

/* =========================================================
   SAVE NOTE
   ========================================================= */

function saveNote(values) {
  if (editingId) {
    const note = findItem(
      "notes",
      editingId
    );

    if (!note) return;

    note.title = values.title.trim();
    note.folder = values.folder || "Unfiled";
    note.content = values.content;
    note.updatedAt = nowISO();

    showToast("Note updated.");
    return;
  }

  data.notes.push({
    id: generateId(),
    title: values.title.trim(),
    folder: values.folder || "Unfiled",
    content: values.content,
    pinned: false,
    createdAt: nowISO(),
    updatedAt: nowISO()
  });

  showToast("Note added.");
}

/* =========================================================
   SAVE LINK
   ========================================================= */

function saveLink(values) {
  let url = values.url.trim();

  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://")
  ) {
    url = "https://" + url;
  }

  if (editingId) {
    const link = findItem(
      "links",
      editingId
    );

    if (!link) return;

    link.title = values.title.trim();
    link.url = url;
    link.updatedAt = nowISO();

    showToast("Link updated.");
    return;
  }

  data.links.push({
    id: generateId(),
    title: values.title.trim(),
    url,
    createdAt: nowISO(),
    updatedAt: nowISO()
  });

  showToast("Link added.");
}

/* =========================================================
   DELETE HELPERS
   ========================================================= */

function deleteItem(type, id) {
  const collection = data[type];

  if (!Array.isArray(collection)) return;

  const index = collection.findIndex(
    item => item.id === id
  );

  if (index === -1) return;

  const item = collection[index];

  const confirmed = confirm(
    "Move this item to Trash?"
  );

  if (!confirmed) return;

  addToTrash(type, item);

  collection.splice(index, 1);

  saveData();
  renderAll();

  showToast("Moved to Trash.");
}

/* =========================================================
   TASK TOGGLE
   ========================================================= */

function toggleTask(id) {
  const task = findItem("tasks", id);

  if (!task) return;

  task.completed = !task.completed;
  task.updatedAt = nowISO();

  saveData();
  renderAll();
}

/* =========================================================
   NOTE PIN
   ========================================================= */

function toggleNotePin(id) {
  const note = findItem("notes", id);

  if (!note) return;

  note.pinned = !note.pinned;
  note.updatedAt = nowISO();

  saveData();
  renderNotes();

  showToast(
    note.pinned
      ? "Note pinned."
      : "Note unpinned."
  );
}

/* =========================================================
   ACTION HANDLER
   ========================================================= */

function handleActionClick(event) {
  const button = event.target.closest(
    "[data-action]"
  );

  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "edit-subject") {
    openModal("Edit Subject", "subject", id);
  }

  if (action === "delete-subject") {
    deleteItem("subjects", id);
  }

  if (action === "edit-task") {
    openModal("Edit Task", "task", id);
  }

  if (action === "delete-task") {
    deleteItem("tasks", id);
  }

  if (action === "toggle-task") {
    toggleTask(id);
  }

  if (action === "edit-schedule") {
    openModal("Edit Class", "schedule", id);
  }

  if (action === "delete-schedule") {
    deleteItem("schedule", id);
  }

  if (action === "edit-deadline") {
    openModal("Edit Deadline", "deadline", id);
  }

  if (action === "delete-deadline") {
    deleteItem("deadlines", id);
  }

  if (action === "edit-note") {
    openModal("Edit Note", "note", id);
  }

  if (action === "pin-note") {
    toggleNotePin(id);
  }

  if (action === "delete-note") {
    deleteItem("notes", id);
  }

  if (action === "edit-link") {
    openModal("Edit Link", "link", id);
  }

  if (action === "delete-link") {
    deleteItem("links", id);
  }

  if (action === "restore-trash") {
    restoreTrash(id);
  }

  if (action === "delete-trash") {
    permanentlyDeleteTrash(id);
  }
}

/* =========================================================
   GLOBAL SEARCH
   ========================================================= */

function setupSearch() {
  const search = $("#globalSearch");
  const clearButton = $("#clearSearch");

  if (!search) return;

  search.addEventListener("input", () => {
    performSearch(search.value.trim());
  });

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      search.value = "";
      performSearch("");
      search.focus();
    });
  }
}

function performSearch(query) {
  const normalized = query.toLowerCase();

  $all(".dashboard-card").forEach(card => {
    card.style.display = "";
  });

  if (!normalized) {
    renderAll();
    return;
  }

  const searchable = [
    ...data.subjects.map(item => ({
      type: "subjects",
      text: `${item.name} ${item.teacher}`
    })),

    ...data.tasks.map(item => ({
      type: "tasks",
      text: `${item.title} ${getSubjectName(
        item.subjectId
      )}`
    })),

    ...data.schedule.map(item => ({
      type: "schedule",
      text: `${item.day} ${item.subject} ${item.teacher}`
    })),

    ...data.deadlines.map(item => ({
      type: "deadlines",
      text: `${item.title} ${item.subject}`
    })),

    ...data.notes.map(item => ({
      type: "notes",
      text: `${item.title} ${item.content} ${item.folder}`
    })),

    ...data.links.map(item => ({
      type: "links",
      text: `${item.title} ${item.url}`
    }))
  ];

  const foundTypes = new Set();

  searchable.forEach(item => {
    if (item.text.toLowerCase().includes(normalized)) {
      foundTypes.add(item.type);
    }
  });

  const sectionMap = {
    subjects: "#subjectsList",
    tasks: "#tasksList",
    schedule: "#scheduleList",
    deadlines: "#deadlinesList",
    notes: "#notesList",
    links: "#linksList"
  };

  Object.entries(sectionMap).forEach(
    ([type, selector]) => {
      const element = $(selector);

      if (!element) return;

      const card = element.closest(".dashboard-card");

      if (!card) return;

      card.style.display = foundTypes.has(type)
        ? ""
        : "none";
    }
  );

  showToast(
    foundTypes.size
      ? `Found results for "${query}".`
      : `Nothing found for "${query}".`
  );
}

/* =========================================================
   REGULAR CALCULATOR
   ========================================================= */

function updateCalculatorDisplay() {
  const display = $("#calculatorDisplay");

  if (!display) return;

  display.textContent =
    calculatorExpression || "0";
}

function calculateExpression(expression) {
  if (!expression) return "";

  let safe = expression
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/%/g, "/100");

  if (!/^[0-9+\-*/().\s]+$/.test(safe)) {
    throw new Error("Invalid expression");
  }

  return Function(
    `"use strict"; return (${safe})`
  )();
}

function handleCalculatorInput(value) {
  if (value === "clear") {
    calculatorExpression = "";
  } else if (value === "delete") {
    calculatorExpression =
      calculatorExpression.slice(0, -1);
  } else if (value === "=") {
    try {
      const result = calculateExpression(
        calculatorExpression
      );

      if (!Number.isFinite(result)) {
        throw new Error("Invalid result");
      }

      calculatorExpression = String(
        Math.round(result * 1e12) / 1e12
      );
    } catch {
      calculatorExpression = "";
      showToast("Invalid calculation.");
    }
  } else {
    calculatorExpression += value;
  }

  updateCalculatorDisplay();
}

/* =========================================================
   SCIENTIFIC CALCULATOR
   ========================================================= */

function toRadians(value) {
  return angleMode === "DEG"
    ? (value * Math.PI) / 180
    : value;
}

function fromRadians(value) {
  return angleMode === "DEG"
    ? (value * 180) / Math.PI
    : value;
}

function updateScientificDisplay() {
  const display = $("#scientificDisplay");

  if (!display) return;

  display.textContent =
    scientificExpression || "0";
}

function evaluateScientificExpression(expression) {
  let safe = expression
    .replace(/π/g, "Math.PI")
    .replace(/\be\b/g, "Math.E")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\^/g, "**");

  safe = safe.replace(
    /sqrt\(/g,
    "Math.sqrt("
  );

  safe = safe.replace(
    /log\(/g,
    "Math.log10("
  );

  safe = safe.replace(
    /ln\(/g,
    "Math.log("
  );

  safe = safe.replace(
    /sin\(/g,
    `Math.sin(toRadians(`
  );

  safe = safe.replace(
    /cos\(/g,
    `Math.cos(toRadians(`
  );

  safe = safe.replace(
    /tan\(/g,
    `Math.tan(toRadians(`
  );

  /*
   * The trig replacements above add one extra opening
   * parenthesis. We fix common simple cases below.
   */

  safe = safe
    .replace(
      /Math\.sin\(toRadians\(([^()]*)\)\)/g,
      "Math.sin(toRadians($1))"
    )
    .replace(
      /Math\.cos\(toRadians\(([^()]*)\)\)/g,
      "Math.cos(toRadians($1))"
    )
    .replace(
      /Math\.tan\(toRadians\(([^()]*)\)\)/g,
      "Math.tan(toRadians($1))"
    );

  if (
    !/^[0-9+\-*/().\sA-Za-z_]+$/.test(
      safe
    )
  ) {
    throw new Error("Invalid expression");
  }

  return Function(
    "toRadians",
    `"use strict"; return (${safe})`
  )(toRadians);
}

function scientificCalculate() {
  if (!scientificExpression) return;

  try {
    const result =
      evaluateScientificExpression(
        scientificExpression
      );

    if (!Number.isFinite(result)) {
      throw new Error("Invalid result");
    }

    scientificExpression = String(
      Math.round(result * 1e12) / 1e12
    );
  } catch {
    scientificExpression = "";
    showToast("Invalid scientific calculation.");
  }

  updateScientificDisplay();
}

function handleScientificInput(value) {
  if (value === "clear") {
    scientificExpression = "";
  } else if (value === "delete") {
    scientificExpression =
      scientificExpression.slice(0, -1);
  } else if (value === "=") {
    scientificCalculate();
    return;
  } else if (value === "sqrt") {
    scientificExpression += "sqrt(";
  } else if (value === "sin") {
    scientificExpression += "sin(";
  } else if (value === "cos") {
    scientificExpression += "cos(";
  } else if (value === "tan") {
    scientificExpression += "tan(";
  } else if (value === "log") {
    scientificExpression += "log(";
  } else if (value === "ln") {
    scientificExpression += "ln(";
  } else if (value === "pi") {
    scientificExpression += "π";
  } else if (value === "e") {
    scientificExpression += "e";
  } else if (value === "square") {
    scientificExpression += "^2";
  } else if (value === "power") {
    scientificExpression += "^";
  } else if (value === "inverse") {
    scientificExpression =
      `1/(${scientificExpression})`;
  } else {
    scientificExpression += value;
  }

  updateScientificDisplay();
}

function toggleAngleMode() {
  angleMode =
    angleMode === "DEG"
      ? "RAD"
      : "DEG";

  const button = $("#angleModeButton");

  if (button) {
    button.textContent = angleMode;
  }
}

/* =========================================================
   TIMER
   ========================================================= */

function updateTimerDisplay() {
  const display = $("#timerDisplay");

  if (!display) return;

  const hours = Math.floor(
    timerSeconds / 3600
  );

  const minutes = Math.floor(
    (timerSeconds % 3600) / 60
  );

  const seconds = timerSeconds % 60;

  display.textContent =
    `${String(hours).padStart(2, "0")}:` +
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`;
}

function updateTimerStatus() {
  const status = $("#timerStatus");
  const startButton = $("#timerStart");

  if (status) {
    status.textContent = timerRunning
      ? "Study timer is running."
      : timerSeconds > 0
      ? "Timer paused."
      : "Ready when you are.";
  }

  if (startButton) {
    startButton.textContent =
      timerRunning
        ? "Pause"
        : timerSeconds > 0
        ? "Resume"
        : "Start";
  }
}

function startTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;

    updateTimerStatus();
    return;
  }

  timerRunning = true;

  timerInterval = setInterval(() => {
    timerSeconds++;

    updateTimerDisplay();
  }, 1000);

  updateTimerStatus();
}

function resetTimer() {
  clearInterval(timerInterval);

  timerRunning = false;
  timerSeconds = 0;

  updateTimerDisplay();
  updateTimerStatus();
}

/* =========================================================
   EXPORT / IMPORT
   ========================================================= */

function exportData() {
  const exportObject = {
    app: "Due Tomorrow, Do Tomorrow",
    version: 1,
    exportedAt: nowISO(),
    data
  };

  const blob = new Blob(
    [JSON.stringify(exportObject, null, 2)],
    {
      type: "application/json"
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download =
    "due-tomorrow-do-tomorrow-backup.json";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showToast("Backup exported.");
}

function importData(file) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = event => {
    try {
      const imported = JSON.parse(
        event.target.result
      );

      const importedData =
        imported.data || imported;

      if (
        !importedData ||
        typeof importedData !== "object"
      ) {
        throw new Error("Invalid backup.");
      }

      const confirmed = confirm(
        "Import this backup?\n\nYour current local data will be replaced."
      );

      if (!confirmed) return;

      data = {
        ...structuredClone(defaultData),
        ...importedData
      };

      data.folders =
        Array.isArray(data.folders) &&
        data.folders.length
          ? data.folders
          : ["Unfiled"];

      saveData();
      renderAll();

      showToast("Backup imported.");
    } catch (error) {
      console.error(error);
      showToast("That backup file is not valid.");
    }
  };

  reader.readAsText(file);
}

/* =========================================================
   CLEAR ALL
   ========================================================= */

function clearAllData() {
  const confirmed = confirm(
    "This will delete all your saved subjects, tasks, schedule, deadlines, notes, links, and Trash.\n\nContinue?"
  );

  if (!confirmed) return;

  data = structuredClone(defaultData);

  saveData();
  renderAll();

  showToast("All data cleared.");
}

/* =========================================================
   AI ASSISTANT
   ========================================================= */

function loadAIHistory() {
  try {
    const saved = localStorage.getItem(
      AI_HISTORY_KEY
    );

    if (!saved) return [];

    const history = JSON.parse(saved);

    return Array.isArray(history)
      ? history
      : [];
  } catch {
    return [];
  }
}

let aiHistory = loadAIHistory();

function saveAIHistory() {
  localStorage.setItem(
    AI_HISTORY_KEY,
    JSON.stringify(aiHistory)
  );
}

function addAIMessage(role, content) {
  const container = $("#aiChatMessages");

  if (!container) return;

  const message = document.createElement("div");

  message.className =
    `ai-message ${
      role === "user"
        ? "user"
        : "model"
    }`;

  message.textContent = content;

  container.appendChild(message);

  container.scrollTop =
    container.scrollHeight;
}

function renderAIHistory() {
  const container = $("#aiChatMessages");

  if (!container) return;

  container.innerHTML = "";

  if (aiHistory.length === 0) {
    addAIMessage(
      "model",
      "Hi! I'm your AI Study Assistant. Ask me about your lessons, assignments, reviewers, math problems, or anything you're studying."
    );

    return;
  }

  aiHistory.forEach(message => {
    addAIMessage(
      message.role,
      message.content
    );
  });
}

async function sendAIMessage() {
  const input = $("#aiInput");
  const status = $("#aiStatus");
  const button = $("#aiSendButton");

  if (!input) return;

  const message = input.value.trim();

  if (!message) return;

  input.value = "";

  aiHistory.push({
    role: "user",
    content: message
  });

  saveAIHistory();
  addAIMessage("user", message);

  if (status) {
    status.textContent = "Thinking...";
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Sending...";
  }

  try {
    const response = await fetch(
      AI_WORKER_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: aiHistory.slice(-20)
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "The AI could not respond."
      );
    }

    const answer =
      result.answer?.trim();

    if (!answer) {
      throw new Error(
        "The AI returned an empty response."
      );
    }

    aiHistory.push({
      role: "model",
      content: answer
    });

    saveAIHistory();
    addAIMessage("model", answer);

    if (status) {
      status.textContent =
        "Ready for your next question.";
    }
  } catch (error) {
    console.error("AI error:", error);

    addAIMessage(
      "model",
      "Sorry, I couldn't connect to the AI right now. Please check your internet connection or try again in a moment."
    );

    if (status) {
      status.textContent =
        "Connection problem.";
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Send";
    }

    input.focus();
  }
}

function clearAIChat() {
  const confirmed = confirm(
    "Clear the AI Study Assistant chat?"
  );

  if (!confirmed) return;

  aiHistory = [];

  localStorage.removeItem(
    AI_HISTORY_KEY
  );

  renderAIHistory();

  showToast("AI chat cleared.");
}

/* =========================================================
   AI ENTER KEY
   ========================================================= */

function setupAI() {
  const input = $("#aiInput");
  const sendButton = $("#aiSendButton");
  const clearButton = $("#aiClearButton");

  renderAIHistory();

  if (sendButton) {
    sendButton.addEventListener(
      "click",
      sendAIMessage
    );
  }

  if (clearButton) {
    clearButton.addEventListener(
      "click",
      clearAIChat
    );
  }

  if (input) {
    input.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();
          sendAIMessage();
        }
      }
    );
  }
}

/* =========================================================
   QUICK BUTTONS
   ========================================================= */

function setupQuickButtons() {
  const quickTask = $("#quickTaskButton");
  const quickSubject = $("#quickSubjectButton");
  const quickDeadline = $("#quickDeadlineButton");
  const quickNote = $("#quickNoteButton");

  if (quickTask) {
    quickTask.addEventListener("click", () => {
      openModal("Add Task", "task");
    });
  }

  if (quickSubject) {
    quickSubject.addEventListener("click", () => {
      openModal("Add Subject", "subject");
    });
  }

  if (quickDeadline) {
    quickDeadline.addEventListener("click", () => {
      openModal(
        "Add Deadline",
        "deadline"
      );
    });
  }

  if (quickNote) {
    quickNote.addEventListener("click", () => {
      openModal("Add Note", "note");
    });
  }
}

/* =========================================================
   MAIN BUTTONS
   ========================================================= */

function setupMainButtons() {
  const addSubject = $("#addSubjectButton");
  const addTask = $("#addTaskButton");
  const addSchedule = $("#addScheduleButton");
  const addDeadline = $("#addDeadlineButton");
  const addNote = $("#addNoteButton");
  const addLink = $("#addLinkButton");
  const addFolderButton = $("#addFolderButton");
  const manageFoldersButton = $("#manageFoldersButton");

  if (addSubject) {
    addSubject.addEventListener("click", () => {
      openModal(
        "Add Subject",
        "subject"
      );
    });
  }

  if (addTask) {
    addTask.addEventListener("click", () => {
      openModal(
        "Add Task",
        "task"
      );
    });
  }

  if (addSchedule) {
    addSchedule.addEventListener("click", () => {
      openModal(
        "Add Class",
        "schedule"
      );
    });
  }

  if (addDeadline) {
    addDeadline.addEventListener("click", () => {
      openModal(
        "Add Deadline",
        "deadline"
      );
    });
  }

  if (addNote) {
    addNote.addEventListener("click", () => {
      openModal(
        "Add Note",
        "note"
      );
    });
  }

  if (addLink) {
    addLink.addEventListener("click", () => {
      openModal(
        "Add Link",
        "link"
      );
    });
  }

  if (addFolderButton) {
    addFolderButton.addEventListener(
      "click",
      addFolder
    );
  }

  if (manageFoldersButton) {
    manageFoldersButton.addEventListener(
      "click",
      manageFolders
    );
  }
}

/* =========================================================
   MODAL EVENTS
   ========================================================= */

function setupModal() {
  const overlay = $("#modalOverlay");
  const close = $("#modalClose");
  const cancel = $("#modalCancel");
  const form = $("#modalForm");

  if (close) {
    close.addEventListener(
      "click",
      closeModal
    );
  }

  if (cancel) {
    cancel.addEventListener(
      "click",
      closeModal
    );
  }

  if (overlay) {
    overlay.addEventListener(
      "click",
      event => {
        if (event.target === overlay) {
          closeModal();
        }
      }
    );
  }

  if (form) {
    form.addEventListener(
      "submit",
      handleModalSubmit
    );
  }

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Escape" &&
        overlay?.classList.contains("show")
      ) {
        closeModal();
      }
    }
  );
}

/* =========================================================
   NOTES CONTROLS
   ========================================================= */

function setupNotesControls() {
  const folder = $("#notesFolderFilter");
  const sort = $("#notesSort");

  if (folder) {
    folder.addEventListener("change", () => {
      currentNoteFolder = folder.value;
      renderNotes();
    });
  }

  if (sort) {
    sort.addEventListener("change", () => {
      currentNoteSort = sort.value;
      renderNotes();
    });
  }
}

/* =========================================================
   CALCULATOR EVENTS
   ========================================================= */

function setupCalculators() {
  $all("[data-calculator]").forEach(button => {
    button.addEventListener("click", () => {
      handleCalculatorInput(
        button.dataset.calculator
      );
    });
  });

  $all("[data-scientific]").forEach(button => {
    button.addEventListener("click", () => {
      handleScientificInput(
        button.dataset.scientific
      );
    });
  });

  const angleButton =
    $("#angleModeButton");

  if (angleButton) {
    angleButton.addEventListener(
      "click",
      toggleAngleMode
    );
  }

  updateCalculatorDisplay();
  updateScientificDisplay();
}

/* =========================================================
   TIMER EVENTS
   ========================================================= */

function setupTimer() {
  const start = $("#timerStart");
  const reset = $("#timerReset");

  if (start) {
    start.addEventListener(
      "click",
      startTimer
    );
  }

  if (reset) {
    reset.addEventListener(
      "click",
      resetTimer
    );
  }

  updateTimerDisplay();
  updateTimerStatus();
}

/* =========================================================
   EXPORT / IMPORT EVENTS
   ========================================================= */

function setupDataButtons() {
  const exportButton = $("#exportButton");
  const importButton = $("#importButton");
  const importFile = $("#importFile");
  const clearAll = $("#clearAllButton");

  if (exportButton) {
    exportButton.addEventListener(
      "click",
      exportData
    );
  }

  if (importButton && importFile) {
    importButton.addEventListener(
      "click",
      () => importFile.click()
    );
  }

  if (importFile) {
    importFile.addEventListener(
      "change",
      event => {
        const file =
          event.target.files?.[0];

        importData(file);

        event.target.value = "";
      }
    );
  }

  if (clearAll) {
    clearAll.addEventListener(
      "click",
      clearAllData
    );
  }
}

/* =========================================================
   DARK MODE BUTTON
   ========================================================= */

function setupDarkMode() {
  const button = $("#darkModeButton");

  if (!button) return;

  button.addEventListener(
    "click",
    toggleDarkMode
  );
}

/* =========================================================
   EVENT DELEGATION
   ========================================================= */

function setupActionDelegation() {
  document.addEventListener(
    "click",
    handleActionClick
  );
}

/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {
  renderSubjects();
  renderTasks();
  renderSchedule();
  renderDeadlines();
  refreshNotes();
  renderLinks();
  renderTrash();
  updateStats();
}

/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeApp() {
  loadTheme();
  loadDarkMode();

  updateGreeting();

  setupThemePanel();
  setupDarkMode();

  setupTaskFilters();
  setupQuickButtons();
  setupMainButtons();
  setupModal();

  setupSearch();
  setupNotesControls();

  setupCalculators();
  setupTimer();

  setupDataButtons();
  setupActionDelegation();

  setupAI();

  renderAll();

  /*
   * Refresh the greeting and today's schedule
   * if the page stays open overnight.
   */
  setInterval(() => {
    updateGreeting();
    renderSchedule();
  }, 60000);
}

/* =========================================================
   START APP
   ========================================================= */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );
} else {
  initializeApp();
}
