/* =========================================================
   DUE TOMORROW, DO TOMORROW
   A little space to get things done
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       STORAGE
       ========================================================= */

    const STORAGE_KEY = "dueTomorrowData";

    const defaultData = {
        theme: "lavender",
        darkMode: false,

        subjects: [],
        tasks: [],
        deadlines: [],
        schedule: [],
        notes: [],
        folders: [
            {
                id: "unfiled",
                name: "Unfiled"
            }
        ],
        links: [],

        trash: [],

        timerSeconds: 0
    };

    let data = loadData();

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
                subjects: parsed.subjects || [],
                tasks: parsed.tasks || [],
                deadlines: parsed.deadlines || [],
                schedule: parsed.schedule || [],
                notes: parsed.notes || [],
                folders: parsed.folders?.length
                    ? parsed.folders
                    : [{ id: "unfiled", name: "Unfiled" }],
                links: parsed.links || [],
                trash: parsed.trash || []
            };
        } catch (error) {
            console.error("Could not load saved data:", error);
            return structuredClone(defaultData);
        }
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function generateId(prefix = "item") {
        return (
            prefix +
            "_" +
            Date.now().toString(36) +
            "_" +
            Math.random().toString(36).slice(2, 8)
        );
    }

    /* =========================================================
       ELEMENT HELPERS
       ========================================================= */

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    function escapeHTML(value) {
        if (value === null || value === undefined) return "";

        return String(value)
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

        return date.toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function formatTime(time) {
        if (!time) return "";

        const [hourString, minute] = time.split(":");
        let hour = Number(hourString);

        const suffix = hour >= 12 ? "PM" : "AM";

        hour = hour % 12;
        if (hour === 0) hour = 12;

        return `${hour}:${minute} ${suffix}`;
    }

    function todayISO() {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

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

    /* =========================================================
       THEME
       ========================================================= */

    function applyTheme() {
        document.body.dataset.theme = data.theme || "lavender";

        if (data.darkMode) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }

        $$(".theme-option").forEach(option => {
            option.classList.toggle(
                "active",
                option.dataset.theme === data.theme
            );
        });

        const darkButton = $("#darkModeButton");

        if (darkButton) {
            darkButton.setAttribute(
                "aria-label",
                data.darkMode ? "Turn off dark mode" : "Turn on dark mode"
            );

            darkButton.textContent = data.darkMode
                ? "☀️"
                : "🌙";
        }
    }

    function setupTheme() {
        applyTheme();

        const themeButton = $("#themeButton");
        const themePanel = $("#themePanel");

        themeButton?.addEventListener("click", (event) => {
            event.stopPropagation();

            themePanel?.classList.toggle("open");
        });

        $$(".theme-option").forEach(option => {
            option.addEventListener("click", () => {
                data.theme = option.dataset.theme || "lavender";

                saveData();
                applyTheme();

                themePanel?.classList.remove("open");

                showToast("Theme changed.");
            });
        });

        $("#darkModeButton")?.addEventListener("click", () => {
            data.darkMode = !data.darkMode;

            saveData();
            applyTheme();
        });

        document.addEventListener("click", (event) => {
            if (
                themePanel &&
                !themePanel.contains(event.target) &&
                event.target !== themeButton
            ) {
                themePanel.classList.remove("open");
            }
        });
    }

    /* =========================================================
       WELCOME MESSAGE
       ========================================================= */

    function updateWelcome() {
        const welcome = $("#welcomeText");

        if (!welcome) return;

        const hour = new Date().getHours();

        let greeting = "Good evening";

        if (hour < 12) {
            greeting = "Good morning";
        } else if (hour < 18) {
            greeting = "Good afternoon";
        }

        welcome.textContent = greeting + "!";
    }

    /* =========================================================
       SUBJECTS
       ========================================================= */

    function renderSubjects() {
        const container = $("#subjectsList");

        if (!container) return;

        if (!data.subjects.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <p>No subjects yet.</p>
                    <button class="small-button" data-action="add-subject">
                        Add a subject
                    </button>
                </div>
            `;

            return;
        }

        container.innerHTML = data.subjects
            .map(subject => {
                const taskCount = data.tasks.filter(
                    task => task.subjectId === subject.id
                ).length;

                const completedCount = data.tasks.filter(
                    task =>
                        task.subjectId === subject.id &&
                        task.completed
                ).length;

                return `
                    <div
                        class="subject-card"
                        style="--subject-color:${escapeHTML(subject.color || "#b99acb")}"
                    >
                        <div class="subject-color"></div>

                        <div class="subject-info">
                            <h3>${escapeHTML(subject.name)}</h3>
                            <p>
                                ${completedCount}/${taskCount}
                                task${taskCount === 1 ? "" : "s"} completed
                            </p>
                        </div>

                        <div class="card-actions">
                            <button
                                class="icon-button"
                                data-action="edit-subject"
                                data-id="${subject.id}"
                                title="Edit"
                            >✎</button>

                            <button
                                class="icon-button danger"
                                data-action="delete-subject"
                                data-id="${subject.id}"
                                title="Delete"
                            >×</button>
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    /* =========================================================
       TASKS
       ========================================================= */

    let currentTaskFilter = "all";

    function renderTasks() {
        const container = $("#tasksList");

        if (!container) return;

        let tasks = [...data.tasks];

        if (currentTaskFilter === "active") {
            tasks = tasks.filter(task => !task.completed);
        }

        if (currentTaskFilter === "completed") {
            tasks = tasks.filter(task => task.completed);
        }

        tasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }

            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return a.dueDate.localeCompare(b.dueDate);
        });

        if (!tasks.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✓</div>
                    <p>
                        ${
                            currentTaskFilter === "completed"
                                ? "No completed tasks yet."
                                : "No tasks here."
                        }
                    </p>
                </div>
            `;

            return;
        }

        container.innerHTML = tasks
            .map(task => {
                const subject = data.subjects.find(
                    subject => subject.id === task.subjectId
                );

                const priorityClass =
                    task.priority === "high"
                        ? "priority-high"
                        : task.priority === "medium"
                        ? "priority-medium"
                        : "priority-low";

                return `
                    <div class="task-card ${task.completed ? "completed" : ""}">
                        <button
                            class="task-check"
                            data-action="toggle-task"
                            data-id="${task.id}"
                            aria-label="Complete task"
                        >
                            ${task.completed ? "✓" : ""}
                        </button>

                        <div class="task-content">
                            <h3>${escapeHTML(task.title || "Untitled task")}</h3>

                            ${
                                task.description
                                    ? `<p>${escapeHTML(task.description)}</p>`
                                    : ""
                            }

                            <div class="task-meta">
                                ${
                                    subject
                                        ? `<span>${escapeHTML(subject.name)}</span>`
                                        : ""
                                }

                                ${
                                    task.dueDate
                                        ? `<span>Due ${formatDate(task.dueDate)}</span>`
                                        : ""
                                }

                                ${
                                    task.priority
                                        ? `<span class="${priorityClass}">
                                            ${escapeHTML(task.priority)}
                                           </span>`
                                        : ""
                                }
                            </div>
                        </div>

                        <div class="card-actions">
                            <button
                                class="icon-button"
                                data-action="edit-task"
                                data-id="${task.id}"
                                title="Edit"
                            >✎</button>

                            <button
                                class="icon-button danger"
                                data-action="delete-task"
                                data-id="${task.id}"
                                title="Delete"
                            >×</button>
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    function setupTaskFilters() {
        $$(".task-filter").forEach(button => {
            button.addEventListener("click", () => {
                $$(".task-filter").forEach(btn =>
                    btn.classList.remove("active")
                );

                button.classList.add("active");

                currentTaskFilter =
                    button.dataset.filter || "all";

                renderTasks();
            });
        });
    }

    /* =========================================================
       DEADLINES
       ========================================================= */

    function renderDeadlines() {
        const container = $("#deadlinesList");

        if (!container) return;

        const deadlines = [...data.deadlines]
            .sort((a, b) => {
                return (a.date || "").localeCompare(b.date || "");
            })
            .slice(0, 10);

        if (!deadlines.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <p>No upcoming deadlines.</p>
                </div>
            `;

            return;
        }

        container.innerHTML = deadlines
            .map(deadline => {
                const overdue =
                    deadline.date &&
                    deadline.date < todayISO();

                return `
                    <div class="deadline-card ${overdue ? "overdue" : ""}">
                        <div class="deadline-date">
                            <span>${formatDate(deadline.date)}</span>
                        </div>

                        <div class="deadline-info">
                            <h3>${escapeHTML(deadline.title)}</h3>

                            ${
                                deadline.description
                                    ? `<p>${escapeHTML(deadline.description)}</p>`
                                    : ""
                            }
                        </div>

                        <div class="card-actions">
                            <button
                                class="icon-button"
                                data-action="edit-deadline"
                                data-id="${deadline.id}"
                            >✎</button>

                            <button
                                class="icon-button danger"
                                data-action="delete-deadline"
                                data-id="${deadline.id}"
                            >×</button>
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    /* =========================================================
       CLASS SCHEDULE
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

    function getTodayName() {
        return new Date().toLocaleDateString("en-US", {
            weekday: "long"
        });
    }

    function sortSchedule(items) {
        return [...items].sort((a, b) => {
            const dayDifference =
                (weekdayOrder[a.day] || 99) -
                (weekdayOrder[b.day] || 99);

            if (dayDifference !== 0) {
                return dayDifference;
            }

            return (a.startTime || "").localeCompare(
                b.startTime || ""
            );
        });
    }

    function renderSchedule() {
        const container = $("#scheduleList");
        const todayContainer = $("#todayClasses");

        const sorted = sortSchedule(data.schedule);

        if (container) {
            if (!sorted.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🗓️</div>
                        <p>No class schedule yet.</p>
                        <button
                            class="small-button"
                            data-action="add-schedule"
                        >
                            Add class
                        </button>
                    </div>
                `;
            } else {
                container.innerHTML = sorted
                    .map(item => scheduleHTML(item))
                    .join("");
            }
        }

        if (todayContainer) {
            const today = getTodayName();

            const todayClasses = sorted.filter(
                item => item.day === today
            );

            if (!todayClasses.length) {
                todayContainer.innerHTML = `
                    <div class="today-empty">
                        No classes today.
                    </div>
                `;
            } else {
                todayContainer.innerHTML = todayClasses
                    .map(item => scheduleHTML(item, true))
                    .join("");
            }
        }
    }

    function scheduleHTML(item, today = false) {
        return `
            <div class="schedule-card ${today ? "today-class" : ""}">
                <div class="schedule-time">
                    <strong>${formatTime(item.startTime)}</strong>
                    <span>${formatTime(item.endTime)}</span>
                </div>

                <div class="schedule-info">
                    <span class="schedule-day">
                        ${escapeHTML(item.day)}
                    </span>

                    <h3>${escapeHTML(item.subject)}</h3>

                    ${
                        item.teacher
                            ? `<p>${escapeHTML(item.teacher)}</p>`
                            : ""
                    }
                </div>

                <div class="card-actions">
                    <button
                        class="icon-button"
                        data-action="edit-schedule"
                        data-id="${item.id}"
                    >✎</button>

                    <button
                        class="icon-button danger"
                        data-action="delete-schedule"
                        data-id="${item.id}"
                    >×</button>
                </div>
            </div>
        `;
    }

    /* =========================================================
       NOTES
       ========================================================= */

    let notesSort = "updated";
    let selectedFolder = "all";

    function renderFolderFilter() {
        const select = $("#notesFolderFilter");

        if (!select) return;

        select.innerHTML = `
            <option value="all">All folders</option>
            ${data.folders
                .map(
                    folder => `
                    <option value="${folder.id}">
                        ${escapeHTML(folder.name)}
                    </option>
                `
                )
                .join("")}
        `;

        select.value = selectedFolder;
    }

    function renderNotes() {
        const container = $("#notesList");

        if (!container) return;

        let notes = [...data.notes];

        if (selectedFolder !== "all") {
            notes = notes.filter(
                note => (note.folderId || "unfiled") === selectedFolder
            );
        }

        if (notesSort === "updated") {
            notes.sort(
                (a, b) =>
                    new Date(b.updatedAt || b.createdAt) -
                    new Date(a.updatedAt || a.createdAt)
            );
        }

        if (notesSort === "created") {
            notes.sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );
        }

        if (notesSort === "az") {
            notes.sort((a, b) =>
                (a.title || "").localeCompare(b.title || "")
            );
        }

        if (notesSort === "za") {
            notes.sort((a, b) =>
                (b.title || "").localeCompare(a.title || "")
            );
        }

        if (notesSort === "pinned") {
            notes.sort((a, b) => {
                if (a.pinned !== b.pinned) {
                    return a.pinned ? -1 : 1;
                }

                return new Date(b.updatedAt || b.createdAt) -
                    new Date(a.updatedAt || a.createdAt);
            });
        }

        if (!notes.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>No notes here yet.</p>
                    <button
                        class="small-button"
                        data-action="add-note"
                    >
                        Create a note
                    </button>
                </div>
            `;

            return;
        }

        container.innerHTML = notes
            .map(note => {
                const folder = data.folders.find(
                    folder => folder.id === note.folderId
                );

                return `
                    <div class="note-card ${note.pinned ? "pinned" : ""}">
                        <div class="note-main">
                            <div class="note-heading">
                                <h3>${escapeHTML(note.title || "Untitled")}</h3>

                                ${
                                    note.pinned
                                        ? `<span class="pin-label">Pinned</span>`
                                        : ""
                                }
                            </div>

                            ${
                                note.content
                                    ? `<p>${escapeHTML(
                                          note.content
                                      ).slice(0, 180)}${
                                          note.content.length > 180
                                              ? "..."
                                              : ""
                                      }</p>`
                                    : `<p class="muted">No content</p>`
                            }

                            <div class="note-meta">
                                <span>
                                    ${escapeHTML(
                                        folder?.name || "Unfiled"
                                    )}
                                </span>

                                <span>
                                    ${formatDate(
                                        (
                                            note.updatedAt ||
                                            note.createdAt ||
                                            ""
                                        ).slice(0, 10)
                                    )}
                                </span>
                            </div>
                        </div>

                        <div class="card-actions">
                            <button
                                class="icon-button"
                                data-action="pin-note"
                                data-id="${note.id}"
                                title="${note.pinned ? "Unpin" : "Pin"}"
                            >📌</button>

                            <button
                                class="icon-button"
                                data-action="edit-note"
                                data-id="${note.id}"
                                title="Edit"
                            >✎</button>

                            <button
                                class="icon-button danger"
                                data-action="delete-note"
                                data-id="${note.id}"
                                title="Delete"
                            >×</button>
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    function setupNotes() {
        $("#notesFolderFilter")?.addEventListener("change", event => {
            selectedFolder = event.target.value;
            renderNotes();
        });

        $("#notesSort")?.addEventListener("change", event => {
            notesSort = event.target.value;
            renderNotes();
        });
    }

    /* =========================================================
       LINKS
       ========================================================= */

    function renderLinks() {
        const container = $("#linksList");

        if (!container) return;

        if (!data.links.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔗</div>
                    <p>No school resources yet.</p>
                    <button
                        class="small-button"
                        data-action="add-link"
                    >
                        Add a link
                    </button>
                </div>
            `;

            return;
        }

        container.innerHTML = data.links
            .map(link => `
                <div class="link-card">
                    <div class="link-info">
                        <h3>${escapeHTML(link.name)}</h3>
                        <a
                            href="${escapeHTML(link.url)}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            ${escapeHTML(link.url)}
                        </a>
                    </div>

                    <div class="card-actions">
                        <button
                            class="icon-button"
                            data-action="edit-link"
                            data-id="${link.id}"
                        >✎</button>

                        <button
                            class="icon-button danger"
                            data-action="delete-link"
                            data-id="${link.id}"
                        >×</button>
                    </div>
                </div>
            `)
            .join("");
    }

    /* =========================================================
       STATS / PROGRESS
       ========================================================= */

    function renderStats() {
        const totalTasks = data.tasks.length;
        const completedTasks = data.tasks.filter(
            task => task.completed
        ).length;

        const activeTasks = totalTasks - completedTasks;

        const statTasks = $("#statTasks");
        const statSubjects = $("#statSubjects");
        const statDeadlines = $("#statDeadlines");
        const statProgress = $("#statProgress");

        if (statTasks) {
            statTasks.textContent = activeTasks;
        }

        if (statSubjects) {
            statSubjects.textContent = data.subjects.length;
        }

        if (statDeadlines) {
            statDeadlines.textContent = data.deadlines.length;
        }

        if (statProgress) {
            const percent = totalTasks
                ? Math.round(
                      (completedTasks / totalTasks) * 100
                  )
                : 0;

            statProgress.textContent = `${percent}%`;
        }

        const progressBar = $("#progressBar");

        if (progressBar) {
            const percent = totalTasks
                ? Math.round(
                      (completedTasks / totalTasks) * 100
                  )
                : 0;

            progressBar.style.width = `${percent}%`;
        }
    }

    /* =========================================================
       MODAL
       ========================================================= */

    const modalOverlay = $("#modalOverlay");
    const modalTitle = $("#modalTitle");
    const modalFields = $("#modalFields");
    const modalForm = $("#modalForm");

    let modalSubmitHandler = null;

    function openModal(title, fields, submitHandler) {
        if (!modalOverlay || !modalFields || !modalTitle) return;

        modalTitle.textContent = title;

        modalFields.innerHTML = fields
            .map(fieldHTML)
            .join("");

        modalSubmitHandler = submitHandler;

        modalOverlay.classList.add("open");

        setTimeout(() => {
            modalFields.querySelector("input, textarea, select")?.focus();
        }, 50);
    }

    function fieldHTML(field) {
        const required = field.required ? "required" : "";

        if (field.type === "textarea") {
            return `
                <label class="form-field">
                    <span>${escapeHTML(field.label)}</span>
                    <textarea
                        name="${escapeHTML(field.name)}"
                        placeholder="${escapeHTML(field.placeholder || "")}"
                        ${required}
                    >${escapeHTML(field.value || "")}</textarea>
                </label>
            `;
        }

        if (field.type === "select") {
            return `
                <label class="form-field">
                    <span>${escapeHTML(field.label)}</span>

                    <select
                        name="${escapeHTML(field.name)}"
                        ${required}
                    >
                        ${field.options
                            .map(option => `
                                <option
                                    value="${escapeHTML(option.value)}"
                                    ${
                                        option.value === field.value
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escapeHTML(option.label)}
                                </option>
                            `)
                            .join("")}
                    </select>
                </label>
            `;
        }

        return `
            <label class="form-field">
                <span>${escapeHTML(field.label)}</span>

                <input
                    type="${escapeHTML(field.type || "text")}"
                    name="${escapeHTML(field.name)}"
                    value="${escapeHTML(field.value || "")}"
                    placeholder="${escapeHTML(field.placeholder || "")}"
                    ${required}
                />
            </label>
        `;
    }

    function closeModal() {
        modalOverlay?.classList.remove("open");
        modalSubmitHandler = null;
    }

    modalForm?.addEventListener("submit", event => {
        event.preventDefault();

        if (!modalSubmitHandler) return;

        const formData = new FormData(modalForm);
        const values = Object.fromEntries(formData.entries());

        modalSubmitHandler(values);
        closeModal();
    });

    modalOverlay?.addEventListener("click", event => {
        if (event.target === modalOverlay) {
            closeModal();
        }
    });

    /* =========================================================
       SUBJECT MODALS
       ========================================================= */

    function addSubject() {
        openModal(
            "Add Subject",
            [
                {
                    name: "name",
                    label: "Subject name",
                    placeholder: "e.g. General Mathematics",
                    required: true
                },
                {
                    name: "color",
                    label: "Color",
                    type: "color",
                    value: "#b99acb"
                }
            ],
            values => {
                data.subjects.push({
                    id: generateId("subject"),
                    name: values.name.trim(),
                    color: values.color || "#b99acb",
                    createdAt: new Date().toISOString()
                });

                saveData();
                renderAll();

                showToast("Subject added.");
            }
        );
    }

    function editSubject(id) {
        const subject = data.subjects.find(
            item => item.id === id
        );

        if (!subject) return;

        openModal(
            "Edit Subject",
            [
                {
                    name: "name",
                    label: "Subject name",
                    value: subject.name,
                    required: true
                },
                {
                    name: "color",
                    label: "Color",
                    type: "color",
                    value: subject.color || "#b99acb"
                }
            ],
            values => {
                subject.name = values.name.trim();
                subject.color = values.color;

                saveData();
                renderAll();

                showToast("Subject updated.");
            }
        );
    }

    /* =========================================================
       TASK MODALS
       ========================================================= */

    function addTask() {
        openModal(
            "Add Task",
            [
                {
                    name: "title",
                    label: "Task",
                    placeholder: "What do you need to do?",
                    required: true
                },
                {
                    name: "description",
                    label: "Description",
                    type: "textarea",
                    placeholder: "Optional"
                },
                {
                    name: "subjectId",
                    label: "Subject",
                    type: "select",
                    value: "",
                    options: [
                        {
                            value: "",
                            label: "No subject"
                        },
                        ...data.subjects.map(subject => ({
                            value: subject.id,
                            label: subject.name
                        }))
                    ]
                },
                {
                    name: "dueDate",
                    label: "Due date",
                    type: "date"
                },
                {
                    name: "priority",
                    label: "Priority",
                    type: "select",
                    value: "medium",
                    options: [
                        {
                            value: "low",
                            label: "Low"
                        },
                        {
                            value: "medium",
                            label: "Medium"
                        },
                        {
                            value: "high",
                            label: "High"
                        }
                    ]
                }
            ],
            values => {
                data.tasks.push({
                    id: generateId("task"),
                    title: values.title.trim(),
                    description: values.description.trim(),
                    subjectId: values.subjectId || null,
                    dueDate: values.dueDate || null,
                    priority: values.priority || "medium",
                    completed: false,
                    createdAt: new Date().toISOString()
                });

                saveData();
                renderAll();

                showToast("Task added.");
            }
        );
    }

    function editTask(id) {
        const task = data.tasks.find(
            item => item.id === id
        );

        if (!task) return;

        openModal(
            "Edit Task",
            [
                {
                    name: "title",
                    label: "Task",
                    value: task.title,
                    required: true
                },
                {
                    name: "description",
                    label: "Description",
                    type: "textarea",
                    value: task.description
                },
                {
                    name: "subjectId",
                    label: "Subject",
                    type: "select",
                    value: task.subjectId || "",
                    options: [
                        {
                            value: "",
                            label: "No subject"
                        },
                        ...data.subjects.map(subject => ({
                            value: subject.id,
                            label: subject.name
                        }))
                    ]
                },
                {
                    name: "dueDate",
                    label: "Due date",
                    type: "date",
                    value: task.dueDate || ""
                },
                {
                    name: "priority",
                    label: "Priority",
                    type: "select",
                    value: task.priority || "medium",
                    options: [
                        {
                            value: "low",
                            label: "Low"
                        },
                        {
                            value: "medium",
                            label: "Medium"
                        },
                        {
                            value: "high",
                            label: "High"
                        }
                    ]
                }
            ],
            values => {
                task.title = values.title.trim();
                task.description = values.description.trim();
                task.subjectId = values.subjectId || null;
                task.dueDate = values.dueDate || null;
                task.priority = values.priority || "medium";

                saveData();
                renderAll();

                showToast("Task updated.");
            }
        );
    }

    /* =========================================================
       DEADLINE MODALS
       ========================================================= */

    function addDeadline() {
        openModal(
            "Add Deadline",
            [
                {
                    name: "title",
                    label: "Deadline",
                    placeholder: "e.g. Research Paper",
                    required: true
                },
                {
                    name: "description",
                    label: "Details",
                    type: "textarea"
                },
                {
                    name: "date",
                    label: "Date",
                    type: "date",
                    required: true
                }
            ],
            values => {
                data.deadlines.push({
                    id: generateId("deadline"),
                    title: values.title.trim(),
                    description: values.description.trim(),
                    date: values.date,
                    createdAt: new Date().toISOString()
                });

                saveData();
                renderAll();

                showToast("Deadline added.");
            }
        );
    }

    function editDeadline(id) {
        const deadline = data.deadlines.find(
            item => item.id === id
        );

        if (!deadline) return;

        openModal(
            "Edit Deadline",
            [
                {
                    name: "title",
                    label: "Deadline",
                    value: deadline.title,
                    required: true
                },
                {
                    name: "description",
                    label: "Details",
                    type: "textarea",
                    value: deadline.description
                },
                {
                    name: "date",
                    label: "Date",
                    type: "date",
                    value: deadline.date,
                    required: true
                }
            ],
            values => {
                deadline.title = values.title.trim();
                deadline.description = values.description.trim();
                deadline.date = values.date;

                saveData();
                renderAll();

                showToast("Deadline updated.");
            }
        );
    }

    /* =========================================================
       SCHEDULE MODALS
       ========================================================= */

    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];

    function addSchedule() {
        openModal(
            "Add Class",
            [
                {
                    name: "day",
                    label: "Day",
                    type: "select",
                    value: "Monday",
                    options: days.map(day => ({
                        value: day,
                        label: day
                    }))
                },
                {
                    name: "subject",
                    label: "Subject",
                    placeholder: "e.g. General Mathematics",
                    required: true
                },
                {
                    name: "teacher",
                    label: "Teacher",
                    placeholder: "Teacher's name"
                },
                {
                    name: "startTime",
                    label: "Start time",
                    type: "time",
                    required: true
                },
                {
                    name: "endTime",
                    label: "End time",
                    type: "time",
                    required: true
                }
            ],
            values => {
                data.schedule.push({
                    id: generateId("schedule"),
                    day: values.day,
                    subject: values.subject.trim(),
                    teacher: values.teacher.trim(),
                    startTime: values.startTime,
                    endTime: values.endTime,
                    createdAt: new Date().toISOString()
                });

                saveData();
                renderAll();

                showToast("Class added.");
            }
        );
    }

    function editSchedule(id) {
        const item = data.schedule.find(
            schedule => schedule.id === id
        );

        if (!item) return;

        openModal(
            "Edit Class",
            [
                {
                    name: "day",
                    label: "Day",
                    type: "select",
                    value: item.day,
                    options: days.map(day => ({
                        value: day,
                        label: day
                    }))
                },
                {
                    name: "subject",
                    label: "Subject",
                    value: item.subject,
                    required: true
                },
                {
                    name: "teacher",
                    label: "Teacher",
                    value: item.teacher
                },
                {
                    name: "startTime",
                    label: "Start time",
                    type: "time",
                    value: item.startTime,
                    required: true
                },
                {
                    name: "endTime",
                    label: "End time",
                    type: "time",
                    value: item.endTime,
                    required: true
                }
            ],
            values => {
                item.day = values.day;
                item.subject = values.subject.trim();
                item.teacher = values.teacher.trim();
                item.startTime = values.startTime;
                item.endTime = values.endTime;

                saveData();
                renderAll();

                showToast("Class updated.");
            }
        );
    }

    /* =========================================================
       NOTES MODALS
       ========================================================= */

    function addNote() {
        openModal(
            "New Note",
            [
                {
                    name: "title",
                    label: "Title",
                    placeholder: "Note title",
                    required: true
                },
                {
                    name: "folderId",
                    label: "Folder",
                    type: "select",
                    value: "unfiled",
                    options: data.folders.map(folder => ({
                        value: folder.id,
                        label: folder.name
                    }))
                },
                {
                    name: "content",
                    label: "Note",
                    type: "textarea",
                    placeholder: "Write something..."
                }
            ],
            values => {
                const now = new Date().toISOString();

                data.notes.push({
                    id: generateId("note"),
                    title: values.title.trim(),
                    content: values.content.trim(),
                    folderId: values.folderId || "unfiled",
                    pinned: false,
                    createdAt: now,
                    updatedAt: now
                });

                saveData();
                renderAll();

                showToast("Note created.");
            }
        );
    }

    function editNote(id) {
        const note = data.notes.find(
            item => item.id === id
        );

        if (!note) return;

        openModal(
            "Edit Note",
            [
                {
                    name: "title",
                    label: "Title",
                    value: note.title,
                    required: true
                },
                {
                    name: "folderId",
                    label: "Folder",
                    type: "select",
                    value: note.folderId || "unfiled",
                    options: data.folders.map(folder => ({
                        value: folder.id,
                        label: folder.name
                    }))
                },
                {
                    name: "content",
                    label: "Note",
                    type: "textarea",
                    value: note.content
                }
            ],
            values => {
                note.title = values.title.trim();
                note.content = values.content.trim();
                note.folderId = values.folderId || "unfiled";
                note.updatedAt = new Date().toISOString();

                saveData();
                renderAll();

                showToast("Note updated.");
            }
        );
    }

    /* =========================================================
       FOLDERS
       ========================================================= */

    function addFolder() {
        openModal(
            "New Folder",
            [
                {
                    name: "name",
                    label: "Folder name",
                    placeholder: "e.g. School",
                    required: true
                }
            ],
            values => {
                const name = values.name.trim();

                if (!name) return;

                const exists = data.folders.some(
                    folder =>
                        folder.name.toLowerCase() ===
                        name.toLowerCase()
                );

                if (exists) {
                    showToast("That folder already exists.");
                    return;
                }

                data.folders.push({
                    id: generateId("folder"),
                    name
                });

                saveData();
                renderAll();

                showToast("Folder created.");
            }
        );
    }

    function manageFolders() {
        if (data.folders.length <= 1) {
            showToast("You don't have any custom folders yet.");
            return;
        }

        openModal(
            "Manage Folders",
            data.folders
                .filter(folder => folder.id !== "unfiled")
                .map(folder => ({
                    name: `folder_${folder.id}`,
                    label: folder.name,
                    value: folder.name
                })),
            values => {
                let changed = false;

                data.folders.forEach(folder => {
                    if (folder.id === "unfiled") return;

                    const newName = values[`folder_${folder.id}`]?.trim();

                    if (newName && newName !== folder.name) {
                        folder.name = newName;
                        changed = true;
                    }
                });

                if (changed) {
                    saveData();
                    renderAll();
                    showToast("Folders updated.");
                }
            }
        );
    }

    /* =========================================================
       LINKS
       ========================================================= */

    function addLink() {
        openModal(
            "Add School Resource",
            [
                {
                    name: "name",
                    label: "Name",
                    placeholder: "e.g. Google Classroom",
                    required: true
                },
                {
                    name: "url",
                    label: "URL",
                    placeholder: "https://...",
                    required: true
                }
            ],
            values => {
                let url = values.url.trim();

                if (
                    url &&
                    !url.startsWith("http://") &&
                    !url.startsWith("https://")
                ) {
                    url = "https://" + url;
                }

                data.links.push({
                    id: generateId("link"),
                    name: values.name.trim(),
                    url,
                    createdAt: new Date().toISOString()
                });

                saveData();
                renderAll();

                showToast("Link added.");
            }
        );
    }

    function editLink(id) {
        const link = data.links.find(
            item => item.id === id
        );

        if (!link) return;

        openModal(
            "Edit School Resource",
            [
                {
                    name: "name",
                    label: "Name",
                    value: link.name,
                    required: true
                },
                {
                    name: "url",
                    label: "URL",
                    value: link.url,
                    required: true
                }
            ],
            values => {
                let url = values.url.trim();

                if (
                    url &&
                    !url.startsWith("http://") &&
                    !url.startsWith("https://")
                ) {
                    url = "https://" + url;
                }

                link.name = values.name.trim();
                link.url = url;

                saveData();
                renderAll();

                showToast("Link updated.");
            }
        );
    }

    /* =========================================================
       TRASH
       ========================================================= */

    function moveToTrash(type, item) {
        data.trash.unshift({
            id: generateId("trash"),
            type,
            deletedAt: new Date().toISOString(),
            original: structuredClone(item)
        });
    }

    function restoreTrash(id) {
        const trashItem = data.trash.find(
            item => item.id === id
        );

        if (!trashItem) return;

        const targetMap = {
            subject: data.subjects,
            task: data.tasks,
            deadline: data.deadlines,
            schedule: data.schedule,
            note: data.notes,
            link: data.links
        };

        const target = targetMap[trashItem.type];

        if (!target) return;

        const alreadyExists = target.some(
            item => item.id === trashItem.original.id
        );

        if (!alreadyExists) {
            target.push(trashItem.original);
        }

        data.trash = data.trash.filter(
            item => item.id !== id
        );

        saveData();
        renderAll();

        showToast("Item restored.");
    }

    function permanentlyDeleteTrash(id) {
        const item = data.trash.find(
            trash => trash.id === id
        );

        if (!item) return;

        data.trash = data.trash.filter(
            trash => trash.id !== id
        );

        saveData();
        renderTrash();

        showToast("Permanently deleted.");
    }

    function emptyTrash() {
        if (!data.trash.length) {
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

    function renderTrash() {
        const container = $("#trashList");

        if (!container) return;

        if (!data.trash.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🗑️</div>
                    <p>Trash is empty.</p>
                </div>
            `;

            return;
        }

        container.innerHTML = data.trash
            .map(item => {
                const typeName =
                    item.type.charAt(0).toUpperCase() +
                    item.type.slice(1);

                const title =
                    item.original.title ||
                    item.original.name ||
                    item.original.subject ||
                    "Deleted item";

                return `
                    <div class="trash-card">
                        <div class="trash-info">
                            <span class="trash-type">
                                ${escapeHTML(typeName)}
                            </span>

                            <h3>${escapeHTML(title)}</h3>

                            <p>
                                Deleted
                                ${new Date(
                                    item.deletedAt
                                ).toLocaleString("en-PH", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit"
                                })}
                            </p>
                        </div>

                        <div class="card-actions">
                            <button
                                class="small-button"
                                data-action="restore-trash"
                                data-id="${item.id}"
                            >
                                Restore
                            </button>

                            <button
                                class="icon-button danger"
                                data-action="permanent-delete"
                                data-id="${item.id}"
                                title="Permanently delete"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    /* =========================================================
       DELETE FUNCTIONS
       ========================================================= */

    function deleteItem(type, id) {
        const map = {
            subject: data.subjects,
            task: data.tasks,
            deadline: data.deadlines,
            schedule: data.schedule,
            note: data.notes,
            link: data.links
        };

        const array = map[type];

        if (!array) return;

        const index = array.findIndex(
            item => item.id === id
        );

        if (index === -1) return;

        const item = array[index];

        moveToTrash(type, item);

        array.splice(index, 1);

        saveData();
        renderAll();

        showToast("Moved to Trash.");
    }

    /* =========================================================
       CALCULATOR
       ========================================================= */

    let calculatorExpression = "";

    function updateCalculatorDisplay() {
        const display = $("#calculatorDisplay");

        if (!display) return;

        display.textContent =
            calculatorExpression || "0";
    }

    function calculateExpression(expression) {
        if (!expression) return "";

        let clean = expression
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/%/g, "/100");

        if (!/^[0-9+\-*/().\s]+$/.test(clean)) {
            throw new Error("Invalid expression");
        }

        // eslint-disable-next-line no-new-func
        const result = Function(
            `"use strict"; return (${clean})`
        )();

        if (
            typeof result !== "number" ||
            !Number.isFinite(result)
        ) {
            throw new Error("Invalid calculation");
        }

        return String(
            Math.round((result + Number.EPSILON) * 1e12) /
                1e12
        );
    }

    function calculatorInput(value) {
        if (value === "clear") {
            calculatorExpression = "";
        } else if (value === "delete") {
            calculatorExpression =
                calculatorExpression.slice(0, -1);
        } else if (value === "=") {
            try {
                calculatorExpression =
                    calculateExpression(
                        calculatorExpression
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

    let scientificExpression = "";
    let angleMode = "DEG";

    function updateScientificDisplay() {
        const display = $("#scientificDisplay");

        if (!display) return;

        display.textContent =
            scientificExpression || "0";
    }

    function angleToRadians(value) {
        return angleMode === "DEG"
            ? value * Math.PI / 180
            : value;
    }

    function scientificCalculate(expression) {
        if (!expression) return "";

        let exp = expression;

        exp = exp
            .replace(/π/g, "Math.PI")
            .replace(/\be\b/g, "Math.E")
            .replace(/sqrt\(/g, "Math.sqrt(")
            .replace(/sin\(/g, `Math.sin(${angleMode === "DEG" ? "Math.PI/180*" : ""}`)
            .replace(/cos\(/g, `Math.cos(${angleMode === "DEG" ? "Math.PI/180*" : ""}`)
            .replace(/tan\(/g, `Math.tan(${angleMode === "DEG" ? "Math.PI/180*" : ""}`)
            .replace(/asin\(/g, `Math.asin(`)
            .replace(/acos\(/g, `Math.acos(`)
            .replace(/atan\(/g, `Math.atan(`)
            .replace(/log\(/g, "Math.log10(")
            .replace(/ln\(/g, "Math.log(")
            .replace(/\^/g, "**")
            .replace(/×/g, "*")
            .replace(/÷/g, "/");

        if (!/^[0-9+\-*/().,\sA-Za-z]+$/.test(exp)) {
            throw new Error("Invalid expression");
        }

        // eslint-disable-next-line no-new-func
        const result = Function(
            `"use strict"; return (${exp})`
        )();

        if (
            typeof result !== "number" ||
            !Number.isFinite(result)
        ) {
            throw new Error("Invalid calculation");
        }

        return String(
            Math.round((result + Number.EPSILON) * 1e12) /
                1e12
        );
    }

    function scientificInput(value) {
        if (value === "clear") {
            scientificExpression = "";
        } else if (value === "delete") {
            scientificExpression =
                scientificExpression.slice(0, -1);
        } else if (value === "=") {
            try {
                scientificExpression =
                    scientificCalculate(
                        scientificExpression
                    );
            } catch {
                scientificExpression = "";
                showToast("Invalid calculation.");
            }
        } else if (value === "square") {
            scientificExpression += "^2";
        } else if (value === "sqrt") {
            scientificExpression += "sqrt(";
        } else if (value === "sin") {
            scientificExpression += "sin(";
        } else if (value === "cos") {
            scientificExpression += "cos(";
        } else if (value === "tan") {
            scientificExpression += "tan(";
        } else if (value === "asin") {
            scientificExpression += "asin(";
        } else if (value === "acos") {
            scientificExpression += "acos(";
        } else if (value === "atan") {
            scientificExpression += "atan(";
        } else if (value === "log") {
            scientificExpression += "log(";
        } else if (value === "ln") {
            scientificExpression += "ln(";
        } else if (value === "inverse") {
            scientificExpression = `1/(${scientificExpression || "0"})`;
        } else {
            scientificExpression += value;
        }

        updateScientificDisplay();
    }

    function setupCalculators() {
        $$("[data-calculator]").forEach(button => {
            button.addEventListener("click", () => {
                calculatorInput(
                    button.dataset.calculator
                );
            });
        });

        $$("[data-scientific]").forEach(button => {
            button.addEventListener("click", () => {
                scientificInput(
                    button.dataset.scientific
                );
            });
        });

        $("#angleModeButton")?.addEventListener(
            "click",
            () => {
                angleMode =
                    angleMode === "DEG"
                        ? "RAD"
                        : "DEG";

                $("#angleModeButton").textContent =
                    angleMode;

                showToast(
                    `Scientific calculator: ${angleMode}`
                );
            }
        );

        updateCalculatorDisplay();
        updateScientificDisplay();
    }

    /* =========================================================
       STUDY TIMER
       ========================================================= */

    let timerSeconds = 0;
    let timerInterval = null;
    let timerRunning = false;

    function formatTimer(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return [
            String(hrs).padStart(2, "0"),
            String(mins).padStart(2, "0"),
            String(secs).padStart(2, "0")
        ].join(":");
    }

    function updateTimerDisplay() {
        const display = $("#timerDisplay");

        if (display) {
            display.textContent =
                formatTimer(timerSeconds);
        }

        const status = $("#timerStatus");

        if (status) {
            status.textContent = timerRunning
                ? "Studying..."
                : timerSeconds > 0
                ? "Paused"
                : "Ready";
        }
    }

    function startTimer() {
        if (timerRunning) return;

        timerRunning = true;

        timerInterval = setInterval(() => {
            timerSeconds++;
            updateTimerDisplay();
        }, 1000);

        const button = $("#timerStart");

        if (button) {
            button.textContent = "Pause";
        }

        updateTimerDisplay();
    }

    function pauseTimer() {
        if (!timerRunning) return;

        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;

        const button = $("#timerStart");

        if (button) {
            button.textContent = "Resume";
        }

        updateTimerDisplay();
    }

    function resetTimer() {
        clearInterval(timerInterval);

        timerInterval = null;
        timerRunning = false;
        timerSeconds = 0;

        const button = $("#timerStart");

        if (button) {
            button.textContent = "Start";
        }

        updateTimerDisplay();
    }

    function setupTimer() {
        $("#timerStart")?.addEventListener("click", () => {
            if (timerRunning) {
                pauseTimer();
            } else {
                startTimer();
            }
        });

        $("#timerReset")?.addEventListener(
            "click",
            resetTimer
        );

        updateTimerDisplay();
    }

    /* =========================================================
       GLOBAL SEARCH
       ========================================================= */

    function performSearch(query) {
        const term = query.trim().toLowerCase();

        if (!term) {
            renderAll();
            return;
        }

        const matches = [];

        data.subjects.forEach(item => {
            if (
                item.name
                    .toLowerCase()
                    .includes(term)
            ) {
                matches.push({
                    type: "Subject",
                    title: item.name
                });
            }
        });

        data.tasks.forEach(item => {
            if (
                `${item.title} ${item.description || ""}`
                    .toLowerCase()
                    .includes(term)
            ) {
                matches.push({
                    type: "Task",
                    title: item.title
                });
            }
        });

        data.deadlines.forEach(item => {
            if (
                `${item.title} ${item.description || ""}`
                    .toLowerCase()
                    .includes(term)
            ) {
                matches.push({
                    type: "Deadline",
                    title: item.title
                });
            }
        });

        data.notes.forEach(item => {
            if (
                `${item.title} ${item.content || ""}`
                    .toLowerCase()
                    .includes(term)
            ) {
                matches.push({
                    type: "Note",
                    title: item.title
                });
            }
        });

        data.schedule.forEach(item => {
            if (
                `${item.day} ${item.subject} ${item.teacher || ""}`
                    .toLowerCase()
                    .includes(term)
            ) {
                matches.push({
                    type: "Class",
                    title: `${item.subject} — ${item.day}`
                });
            }
        });

        data.links.forEach(item => {
            if (
                `${item.name} ${item.url}`
                    .toLowerCase()
                    .includes(term)
            ) {
                matches.push({
                    type: "Link",
                    title: item.name
                });
            }
        });

        const container = $("#searchResults");

        if (!container) {
            // If the current HTML doesn't have a dedicated
            // search result area, show the results in a toast.
            if (!matches.length) {
                showToast("No results found.");
            } else {
                showToast(
                    `${matches.length} result${
                        matches.length === 1 ? "" : "s"
                    } found.`
                );
            }

            return;
        }

        if (!matches.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No results found.</p>
                </div>
            `;

            return;
        }

        container.innerHTML = matches
            .map(
                result => `
                <div class="search-result">
                    <span>${escapeHTML(result.type)}</span>
                    <strong>${escapeHTML(result.title)}</strong>
                </div>
            `
            )
            .join("");
    }

    function setupSearch() {
        $("#globalSearch")?.addEventListener(
            "input",
            event => {
                performSearch(event.target.value);
            }
        );
    }

    /* =========================================================
       EXPORT / IMPORT
       ========================================================= */

    function exportData() {
        const backup = {
            app: "Due Tomorrow, Do Tomorrow",
            exportedAt: new Date().toISOString(),
            data
        };

        const blob = new Blob(
            [JSON.stringify(backup, null, 2)],
            {
                type: "application/json"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download =
            "due-tomorrow-backup.json";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        showToast("Backup exported.");
    }

    function importData() {
        const input = document.createElement("input");

        input.type = "file";
        input.accept = ".json,application/json";

        input.addEventListener("change", event => {
            const file = event.target.files?.[0];

            if (!file) return;

            const reader = new FileReader();

            reader.onload = () => {
                try {
                    const imported = JSON.parse(
                        reader.result
                    );

                    const importedData =
                        imported.data || imported;

                    if (
                        !importedData ||
                        typeof importedData !==
                            "object"
                    ) {
                        throw new Error(
                            "Invalid backup"
                        );
                    }

                    const confirmed = confirm(
                        "Import this backup? Your current local data will be replaced."
                    );

                    if (!confirmed) return;

                    data = {
                        ...structuredClone(
                            defaultData
                        ),
                        ...importedData
                    };

                    if (!data.folders?.length) {
                        data.folders = [
                            {
                                id: "unfiled",
                                name: "Unfiled"
                            }
                        ];
                    }

                    saveData();
                    applyTheme();
                    renderAll();

                    showToast("Backup imported.");
                } catch (error) {
                    console.error(error);
                    showToast(
                        "That file is not a valid backup."
                    );
                }
            };

            reader.readAsText(file);
        });

        input.click();
    }

    /* =========================================================
       QUICK ACTIONS
       ========================================================= */

    function setupQuickActions() {
        $("#addTaskButton")?.addEventListener(
            "click",
            addTask
        );

        $("#addSubjectButton")?.addEventListener(
            "click",
            addSubject
        );

        $("#addDeadlineButton")?.addEventListener(
            "click",
            addDeadline
        );

        $("#addNoteButton")?.addEventListener(
            "click",
            addNote
        );

        $("#addScheduleButton")?.addEventListener(
            "click",
            addSchedule
        );

        $("#addFolderButton")?.addEventListener(
            "click",
            addFolder
        );

        $("#manageFoldersButton")?.addEventListener(
            "click",
            manageFolders
        );

        $("#emptyTrashButton")?.addEventListener(
            "click",
            emptyTrash
        );

        $("#exportButton")?.addEventListener(
            "click",
            exportData
        );

        $("#importButton")?.addEventListener(
            "click",
            importData
        );
    }

    /* =========================================================
       EVENT DELEGATION
       ========================================================= */

    document.addEventListener("click", event => {
        const button =
            event.target.closest("[data-action]");

        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        switch (action) {
            case "add-subject":
                addSubject();
                break;

            case "edit-subject":
                editSubject(id);
                break;

            case "delete-subject":
                deleteItem("subject", id);
                break;

            case "toggle-task": {
                const task = data.tasks.find(
                    item => item.id === id
                );

                if (!task) return;

                task.completed = !task.completed;

                saveData();
                renderAll();

                showToast(
                    task.completed
                        ? "Task completed!"
                        : "Task marked active."
                );

                break;
            }

            case "edit-task":
                editTask(id);
                break;

            case "delete-task":
                deleteItem("task", id);
                break;

            case "edit-deadline":
                editDeadline(id);
                break;

            case "delete-deadline":
                deleteItem("deadline", id);
                break;

            case "add-schedule":
                addSchedule();
                break;

            case "edit-schedule":
                editSchedule(id);
                break;

            case "delete-schedule":
                deleteItem("schedule", id);
                break;

            case "add-note":
                addNote();
                break;

            case "edit-note":
                editNote(id);
                break;

            case "delete-note":
                deleteItem("note", id);
                break;

            case "pin-note": {
                const note = data.notes.find(
                    item => item.id === id
                );

                if (!note) return;

                note.pinned = !note.pinned;
                note.updatedAt =
                    new Date().toISOString();

                saveData();
                renderNotes();

                showToast(
                    note.pinned
                        ? "Note pinned."
                        : "Note unpinned."
                );

                break;
            }

            case "add-link":
                addLink();
                break;

            case "edit-link":
                editLink(id);
                break;

            case "delete-link":
                deleteItem("link", id);
                break;

            case "restore-trash":
                restoreTrash(id);
                break;

            case "permanent-delete":
                permanentlyDeleteTrash(id);
                break;
        }
    });

    /* =========================================================
       RENDER EVERYTHING
       ========================================================= */

    function renderAll() {
        renderSubjects();
        renderTasks();
        renderDeadlines();
        renderSchedule();
        renderFolderFilter();
        renderNotes();
        renderLinks();
        renderTrash();
        renderStats();
        updateWelcome();
    }

    /* =========================================================
       KEYBOARD SHORTCUTS
       ========================================================= */

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeModal();
        }
    });

    /* =========================================================
       START APP
       ========================================================= */

    setupTheme();
    setupTaskFilters();
    setupNotes();
    setupCalculators();
    setupTimer();
    setupSearch();
    setupQuickActions();

    renderAll();

    console.log(
        "Due Tomorrow, Do Tomorrow loaded successfully."
    );
});
