/* =========================================
   DUE TOMORROW, DO TOMORROW
   Main JavaScript
   LocalStorage version
========================================= */

"use strict";


/* =========================================
   STORAGE
========================================= */

const STORAGE_KEY = "dueTomorrowDoTomorrow";

const DEFAULT_DATA = {
    theme: "lavender",
    darkMode: false,

    subjects: [],
    tasks: [],
    deadlines: [],
    schedule: [],

    notes: [],
    folders: [
        {
            id: "folder-unfiled",
            name: "Unfiled"
        }
    ],

    links: [],

    trash: [],

    timer: {
        seconds: 0,
        running: false
    }
};


let data = loadData();

let currentTaskFilter = "all";

let timerInterval = null;

let currentModal = null;

let calculatorExpression = "";

let scientificExpression = "";

let angleMode = "DEG";


/* =========================================
   HELPERS
========================================= */

function createId(prefix = "item") {
    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
}


function saveData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return structuredClone(DEFAULT_DATA);
        }

        const parsed = JSON.parse(saved);

        return {
            ...structuredClone(DEFAULT_DATA),
            ...parsed,

            subjects: Array.isArray(parsed.subjects)
                ? parsed.subjects
                : [],

            tasks: Array.isArray(parsed.tasks)
                ? parsed.tasks
                : [],

            deadlines: Array.isArray(parsed.deadlines)
                ? parsed.deadlines
                : [],

            schedule: Array.isArray(parsed.schedule)
                ? parsed.schedule
                : [],

            notes: Array.isArray(parsed.notes)
                ? parsed.notes
                : [],

            folders: Array.isArray(parsed.folders)
                ? parsed.folders
                : structuredClone(DEFAULT_DATA.folders),

            links: Array.isArray(parsed.links)
                ? parsed.links
                : [],

            trash: Array.isArray(parsed.trash)
                ? parsed.trash
                : []
        };

    } catch (error) {
        console.error("Could not load saved data:", error);

        return structuredClone(DEFAULT_DATA);
    }
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
    if (!dateString) {
        return "No date";
    }

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


function formatDateTime(dateString) {
    if (!dateString) {
        return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


function todayString() {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function isOverdue(dateString) {
    return Boolean(
        dateString &&
        dateString < todayString()
    );
}


function getSubjectName(subjectId) {
    const subject = data.subjects.find(
        item => item.id === subjectId
    );

    return subject
        ? subject.name
        : "";
}


function getFolderName(folderId) {
    const folder = data.folders.find(
        item => item.id === folderId
    );

    return folder
        ? folder.name
        : "Unfiled";
}


/* =========================================
   THEME
========================================= */

function applyTheme() {
    document.documentElement.dataset.theme =
        data.theme || "lavender";

    document.documentElement.dataset.dark =
        data.darkMode ? "true" : "false";

    document.querySelectorAll(
        ".theme-option"
    ).forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.theme === data.theme
        );
    });

    const darkButton =
        document.getElementById("darkModeButton");

    if (darkButton) {
        darkButton.textContent =
            data.darkMode ? "☀" : "🌙";
    }
}


function setupTheme() {

    const themeButton =
        document.getElementById("themeButton");

    const themePanel =
        document.getElementById("themePanel");

    const closeThemeButton =
        document.getElementById("closeThemeButton");

    const darkModeButton =
        document.getElementById("darkModeButton");


    themeButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            themePanel.classList.toggle("open");
        }
    );


    closeThemeButton?.addEventListener(
        "click",
        () => {
            themePanel.classList.remove("open");
        }
    );


    document.querySelectorAll(
        ".theme-option"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                data.theme =
                    button.dataset.theme;

                saveData();

                applyTheme();

                showToast(
                    `${button.textContent.trim()} theme selected`
                );
            }
        );
    });


    darkModeButton?.addEventListener(
        "click",
        () => {

            data.darkMode =
                !data.darkMode;

            saveData();

            applyTheme();
        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                themePanel &&
                !themePanel.contains(event.target) &&
                event.target !== themeButton
            ) {
                themePanel.classList.remove("open");
            }
        }
    );
}


/* =========================================
   GREETING
========================================= */

function updateGreeting() {

    const greeting =
        document.getElementById("greeting");

    if (!greeting) {
        return;
    }

    const hour = new Date().getHours();

    let text = "Good evening!";

    if (hour < 12) {
        text = "Good morning!";
    } else if (hour < 18) {
        text = "Good afternoon!";
    }

    greeting.textContent = text;
}


/* =========================================
   STATS
========================================= */

function updateStats() {

    const totalTasks =
        data.tasks.length;

    const completedTasks =
        data.tasks.filter(
            task => task.completed
        ).length;

    const pendingTasks =
        totalTasks - completedTasks;

    const overdueTasks =
        data.tasks.filter(
            task =>
                !task.completed &&
                isOverdue(task.dueDate)
        ).length;


    const progress =
        totalTasks === 0
            ? 0
            : Math.round(
                completedTasks /
                totalTasks *
                100
            );


    document.getElementById(
        "statSubjects"
    ).textContent =
        data.subjects.length;


    document.getElementById(
        "statTasks"
    ).textContent =
        totalTasks;


    document.getElementById(
        "statPending"
    ).textContent =
        pendingTasks;


    document.getElementById(
        "statOverdue"
    ).textContent =
        overdueTasks;


    document.getElementById(
        "progressNumber"
    ).textContent =
        `${progress}%`;


    const ring =
        document.querySelector(".progress-ring");

    if (ring) {

        ring.style.background =
            `conic-gradient(
                var(--primary) ${progress * 3.6}deg,
                var(--border) ${progress * 3.6}deg
            )`;
    }
}


/* =========================================
   MODAL
========================================= */

function openModal(
    title,
    fields,
    onSubmit
) {

    const overlay =
        document.getElementById(
            "modalOverlay"
        );

    const modalTitle =
        document.getElementById(
            "modalTitle"
        );

    const modalFields =
        document.getElementById(
            "modalFields"
        );

    currentModal = {
        onSubmit
    };


    modalTitle.textContent = title;

    modalFields.innerHTML =
        fields.map(fieldHTML).join("");


    overlay.classList.add("open");


    const firstInput =
        modalFields.querySelector(
            "input, textarea, select"
        );

    setTimeout(
        () => firstInput?.focus(),
        50
    );
}


function fieldHTML(field) {

    const value =
        field.value ?? "";

    const required =
        field.required
            ? "required"
            : "";


    if (field.type === "textarea") {

        return `
            <div class="form-group">
                <label for="${field.id}">
                    ${escapeHTML(field.label)}
                </label>

                <textarea
                    id="${field.id}"
                    name="${field.id}"
                    ${required}
                    placeholder="${escapeHTML(
                        field.placeholder || ""
                    )}"
                >${escapeHTML(value)}</textarea>
            </div>
        `;
    }


    if (field.type === "select") {

        const options =
            (field.options || [])
                .map(option => {

                    const selected =
                        option.value === value
                            ? "selected"
                            : "";

                    return `
                        <option
                            value="${escapeHTML(option.value)}"
                            ${selected}
                        >
                            ${escapeHTML(option.label)}
                        </option>
                    `;
                })
                .join("");


        return `
            <div class="form-group">
                <label for="${field.id}">
                    ${escapeHTML(field.label)}
                </label>

                <select
                    id="${field.id}"
                    name="${field.id}"
                    ${required}
                >
                    ${options}
                </select>
            </div>
        `;
    }


    return `
        <div class="form-group">
            <label for="${field.id}">
                ${escapeHTML(field.label)}
            </label>

            <input
                id="${field.id}"
                name="${field.id}"
                type="${field.type || "text"}"
                value="${escapeHTML(value)}"
                ${required}
                placeholder="${escapeHTML(
                    field.placeholder || ""
                )}"
            >
        </div>
    `;
}


function closeModal() {

    const overlay =
        document.getElementById(
            "modalOverlay"
        );

    overlay.classList.remove("open");

    currentModal = null;
}


function setupModal() {

    document.getElementById(
        "modalClose"
    )?.addEventListener(
        "click",
        closeModal
    );


    document.getElementById(
        "modalCancel"
    )?.addEventListener(
        "click",
        closeModal
    );


    document.getElementById(
        "modalOverlay"
    )?.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "modalOverlay"
            ) {
                closeModal();
            }
        }
    );


    document.getElementById(
        "modalForm"
    )?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            if (!currentModal) {
                return;
            }

            const form =
                new FormData(event.target);

            const values =
                Object.fromEntries(form.entries());

            currentModal.onSubmit(values);

            closeModal();
        }
    );
}


/* =========================================
   SUBJECTS
========================================= */

function renderSubjects() {

    const container =
        document.getElementById(
            "subjectsList"
        );

    if (!container) {
        return;
    }


    if (data.subjects.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No subjects yet.
                Add your first subject.
            </div>
        `;

        return;
    }


    container.innerHTML =
        data.subjects.map(subject => {

            const color =
                subject.color || "var(--primary)";


            return `
                <div
                    class="subject-item"
                    data-search="${escapeHTML(
                        subject.name
                    )}"
                >

                    <div
                        class="subject-color"
                        style="background:${escapeHTML(color)}"
                    ></div>

                    <div class="subject-icon">
                        ${escapeHTML(
                            subject.icon || "📚"
                        )}
                    </div>

                    <div class="item-main">
                        <div class="item-title">
                            ${escapeHTML(subject.name)}
                        </div>
                    </div>

                    <div class="item-actions">

                        <button
                            class="item-action"
                            data-action="edit-subject"
                            data-id="${subject.id}"
                            type="button"
                        >
                            Edit
                        </button>

                        <button
                            class="item-action"
                            data-action="delete-subject"
                            data-id="${subject.id}"
                            type="button"
                        >
                            ×
                        </button>

                    </div>

                </div>
            `;
        }).join("");
}


function addSubject(existing = null) {

    const isEdit =
        Boolean(existing);


    const fields = [

        {
            id: "name",
            label: "Subject name",
            type: "text",
            value: existing?.name || "",
            required: true,
            placeholder: "e.g. General Mathematics"
        },

        {
            id: "color",
            label: "Color",
            type: "text",
            value:
                existing?.color ||
                "#9d82b8",
            required: true,
            placeholder: "#9d82b8"
        },

        {
            id: "icon",
            label: "Icon (optional)",
            type: "text",
            value: existing?.icon || "",
            placeholder: "e.g. 📖"
        }

    ];


    openModal(
        isEdit
            ? "Edit Subject"
            : "Add Subject",

        fields,

        values => {

            if (isEdit) {

                existing.name =
                    values.name.trim();

                existing.color =
                    values.color.trim();

                existing.icon =
                    values.icon.trim();

            } else {

                data.subjects.push({

                    id: createId("subject"),

                    name:
                        values.name.trim(),

                    color:
                        values.color.trim(),

                    icon:
                        values.icon.trim(),

                    createdAt:
                        new Date().toISOString()
                });
            }


            saveData();

            renderAll();

            showToast(
                isEdit
                    ? "Subject updated"
                    : "Subject added"
            );
        }
    );
}


/* =========================================
   TASKS
========================================= */

function renderTasks() {

    const container =
        document.getElementById(
            "tasksList"
        );

    if (!container) {
        return;
    }


    let tasks =
        [...data.tasks];


    if (currentTaskFilter === "active") {

        tasks =
            tasks.filter(
                task => !task.completed
            );
    }


    if (currentTaskFilter === "completed") {

        tasks =
            tasks.filter(
                task => task.completed
            );
    }


    tasks.sort(
        (a, b) => {

            if (
                !a.dueDate &&
                !b.dueDate
            ) {
                return 0;
            }

            if (!a.dueDate) {
                return 1;
            }

            if (!b.dueDate) {
                return -1;
            }

            return a.dueDate
                .localeCompare(b.dueDate);
        }
    );


    if (tasks.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Nothing here yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        tasks.map(task => {

            const overdue =
                !task.completed &&
                isOverdue(task.dueDate);


            const priority =
                task.priority
                    ? `
                        <span
                            class="priority-badge priority-${escapeHTML(
                                task.priority
                            )}"
                        >
                            ${escapeHTML(
                                task.priority
                            )}
                        </span>
                    `
                    : "";


            return `
                <div
                    class="
                        item
                        task-item
                        ${task.completed
                            ? "task-completed"
                            : ""}
                    "
                    data-search="${escapeHTML(
                        `${task.title} ${task.description || ""} ${getSubjectName(task.subjectId)}`
                    )}"
                >

                    <input
                        class="task-check"
                        type="checkbox"
                        data-action="toggle-task"
                        data-id="${task.id}"
                        ${task.completed ? "checked" : ""}
                        aria-label="Mark task complete"
                    >


                    <div class="item-main">

                        <div class="item-title">
                            ${escapeHTML(
                                task.title
                            )}
                        </div>


                        ${
                            task.description
                                ? `
                                    <div class="item-meta">
                                        ${escapeHTML(
                                            task.description
                                        )}
                                    </div>
                                `
                                : ""
                        }


                        <div>

                            ${
                                task.subjectId
                                    ? `
                                        <span class="folder-label">
                                            ${escapeHTML(
                                                getSubjectName(
                                                    task.subjectId
                                                )
                                            )}
                                        </span>
                                    `
                                    : ""
                            }


                            ${priority}


                            ${
                                task.dueDate
                                    ? `
                                        <span
                                            class="item-meta"
                                            style="${
                                                overdue
                                                    ? "color:var(--danger);font-weight:700;"
                                                    : ""
                                            }"
                                        >
                                            Due ${formatDate(
                                                task.dueDate
                                            )}
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                    </div>


                    <div class="item-actions">

                        <button
                            class="item-action"
                            data-action="edit-task"
                            data-id="${task.id}"
                            type="button"
                        >
                            Edit
                        </button>

                        <button
                            class="item-action"
                            data-action="delete-task"
                            data-id="${task.id}"
                            type="button"
                        >
                            ×
                        </button>

                    </div>

                </div>
            `;
        }).join("");
}


function taskFields(existing = null) {

    const subjectOptions = [
        {
            value: "",
            label: "No subject"
        },

        ...data.subjects.map(subject => ({
            value: subject.id,
            label: subject.name
        }))
    ];


    return [

        {
            id: "title",
            label: "Task title",
            type: "text",
            value: existing?.title || "",
            required: true,
            placeholder: "e.g. Finish Module 6"
        },

        {
            id: "description",
            label: "Description",
            type: "textarea",
            value: existing?.description || "",
            placeholder: "Optional details"
        },

        {
            id: "subjectId",
            label: "Subject",
            type: "select",
            value: existing?.subjectId || "",
            options: subjectOptions
        },

        {
            id: "dueDate",
            label: "Due date",
            type: "date",
            value: existing?.dueDate || ""
        },

        {
            id: "priority",
            label: "Priority",
            type: "select",
            value: existing?.priority || "medium",
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

    ];
}


function addTask(existing = null) {

    openModal(
        existing
            ? "Edit Task"
            : "Add Task",

        taskFields(existing),

        values => {

            if (existing) {

                existing.title =
                    values.title.trim();

                existing.description =
                    values.description.trim();

                existing.subjectId =
                    values.subjectId;

                existing.dueDate =
                    values.dueDate;

                existing.priority =
                    values.priority;

                existing.updatedAt =
                    new Date().toISOString();

            } else {

                data.tasks.push({

                    id: createId("task"),

                    title:
                        values.title.trim(),

                    description:
                        values.description.trim(),

                    subjectId:
                        values.subjectId,

                    dueDate:
                        values.dueDate,

                    priority:
                        values.priority,

                    completed: false,

                    createdAt:
                        new Date().toISOString(),

                    updatedAt:
                        new Date().toISOString()
                });
            }


            saveData();

            renderAll();

            showToast(
                existing
                    ? "Task updated"
                    : "Task added"
            );
        }
    );
}


/* =========================================
   DEADLINES
========================================= */

function renderDeadlines() {

    const container =
        document.getElementById(
            "deadlinesList"
        );

    if (!container) {
        return;
    }


    const deadlines =
        [...data.deadlines]
            .sort(
                (a, b) =>
                    (a.date || "")
                        .localeCompare(
                            b.date || ""
                        )
            );


    if (deadlines.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No deadlines yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        deadlines.map(deadline => {

            const overdue =
                isOverdue(deadline.date);


            return `
                <div
                    class="
                        item
                        deadline-item
                        ${overdue ? "overdue" : ""}
                    "
                    data-search="${escapeHTML(
                        `${deadline.title} ${deadline.description || ""}`
                    )}"
                >

                    <div class="item-main">

                        <div class="item-title">
                            ${escapeHTML(
                                deadline.title
                            )}
                        </div>


                        <div
                            class="deadline-date"
                        >
                            ${
                                overdue
                                    ? "Overdue · "
                                    : ""
                            }

                            ${formatDate(
                                deadline.date
                            )}
                        </div>


                        ${
                            deadline.description
                                ? `
                                    <div class="item-meta">
                                        ${escapeHTML(
                                            deadline.description
                                        )}
                                    </div>
                                `
                                : ""
                        }

                    </div>


                    <div class="item-actions">

                        <button
                            class="item-action"
                            data-action="edit-deadline"
                            data-id="${deadline.id}"
                            type="button"
                        >
                            Edit
                        </button>

                        <button
                            class="item-action"
                            data-action="delete-deadline"
                            data-id="${deadline.id}"
                            type="button"
                        >
                            ×
                        </button>

                    </div>

                </div>
            `;
        }).join("");
}


function addDeadline(existing = null) {

    openModal(
        existing
            ? "Edit Deadline"
            : "Add Deadline",

        [
            {
                id: "title",
                label: "Deadline",
                type: "text",
                value: existing?.title || "",
                required: true,
                placeholder: "e.g. Performance Task"
            },

            {
                id: "date",
                label: "Date",
                type: "date",
                value: existing?.date || "",
                required: true
            },

            {
                id: "description",
                label: "Details",
                type: "textarea",
                value:
                    existing?.description || "",
                placeholder: "Optional"
            }
        ],

        values => {

            if (existing) {

                existing.title =
                    values.title.trim();

                existing.date =
                    values.date;

                existing.description =
                    values.description.trim();

            } else {

                data.deadlines.push({

                    id: createId("deadline"),

                    title:
                        values.title.trim(),

                    date:
                        values.date,

                    description:
                        values.description.trim(),

                    createdAt:
                        new Date().toISOString()
                });
            }


            saveData();

            renderAll();

            showToast(
                existing
                    ? "Deadline updated"
                    : "Deadline added"
            );
        }
    );
}


/* =========================================
   CLASS SCHEDULE
========================================= */

const WEEK_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];


function dayNumber(day) {
    const index =
        WEEK_DAYS.indexOf(day);

    return index === -1
        ? 99
        : index;
}


function renderSchedule() {

    const list =
        document.getElementById(
            "scheduleList"
        );

    const todayContainer =
        document.getElementById(
            "todayClasses"
        );


    if (!list) {
        return;
    }


    const schedules =
        [...data.schedule]
            .sort(
                (a, b) => {

                    const dayDifference =
                        dayNumber(a.day) -
                        dayNumber(b.day);

                    if (dayDifference !== 0) {
                        return dayDifference;
                    }

                    return (a.startTime || "")
                        .localeCompare(
                            b.startTime || ""
                        );
                }
            );


    const todayName =
        new Date().toLocaleDateString(
            "en-US",
            {
                weekday: "long"
            }
        );


    const today =
        schedules.filter(
            item => item.day === todayName
        );


    if (todayContainer) {

        if (today.length === 0) {

            todayContainer.innerHTML = `
                <div class="empty-state">
                    No classes scheduled today.
                </div>
            `;

        } else {

            todayContainer.innerHTML = `
                <div class="today-class">

                    <div class="today-class-label">
                        TODAY · ${escapeHTML(
                            todayName
                        )}
                    </div>

                    ${today.map(item => `
                        <div style="margin-top:8px;">

                            <strong>
                                ${escapeHTML(
                                    item.subject
                                )}
                            </strong>

                            <div class="item-meta">
                                ${escapeHTML(
                                    formatTimeRange(
                                        item.startTime,
                                        item.endTime
                                    )
                                )}

                                ${
                                    item.teacher
                                        ? ` · ${escapeHTML(item.teacher)}`
                                        : ""
                                }
                            </div>

                        </div>
                    `).join("")}

                </div>
            `;
        }
    }


    if (schedules.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                No classes added yet.
            </div>
        `;

        return;
    }


    list.innerHTML =
        schedules.map(item => {

            const isToday =
                item.day === todayName;


            return `
                <div
                    class="
                        schedule-item
                        ${isToday ? "today" : ""}
                    "
                    data-search="${escapeHTML(
                        `${item.day} ${item.subject} ${item.teacher || ""}`
                    )}"
                >

                    <div>
                        <div class="schedule-day">
                            ${escapeHTML(
                                item.day
                            )}
                        </div>

                        <div class="schedule-time">
                            ${escapeHTML(
                                formatTimeRange(
                                    item.startTime,
                                    item.endTime
                                )
                            )}
                        </div>
                    </div>


                    <div class="item-main">

                        <div class="schedule-subject">
                            ${escapeHTML(
                                item.subject
                            )}
                        </div>

                        ${
                            item.teacher
                                ? `
                                    <div class="schedule-teacher">
                                        ${escapeHTML(
                                            item.teacher
                                        )}
                                    </div>
                                `
                                : ""
                        }

                    </div>


                    <div class="item-actions">

                        <button
                            class="item-action"
                            data-action="edit-schedule"
                            data-id="${item.id}"
                            type="button"
                        >
                            Edit
                        </button>

                        <button
                            class="item-action"
                            data-action="delete-schedule"
                            data-id="${item.id}"
                            type="button"
                        >
                            ×
                        </button>

                    </div>

                </div>
            `;
        }).join("");
}


function formatTime(time) {

    if (!time) {
        return "";
    }

    const parts =
        time.split(":");

    let hour =
        Number(parts[0]);

    const minute =
        parts[1] || "00";

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
}


function formatTimeRange(
    start,
    end
) {

    if (!start && !end) {
        return "Time not set";
    }

    return `${formatTime(start)} - ${formatTime(end)}`;
}


function addSchedule(existing = null) {

    openModal(
        existing
            ? "Edit Class"
            : "Add Class",

        [
            {
                id: "day",
                label: "Day",
                type: "select",
                value:
                    existing?.day ||
                    "Monday",
                required: true,
                options:
                    WEEK_DAYS.map(day => ({
                        value: day,
                        label: day
                    }))
            },

            {
                id: "subject",
                label: "Subject",
                type: "text",
                value:
                    existing?.subject || "",
                required: true,
                placeholder: "e.g. General Mathematics"
            },

            {
                id: "teacher",
                label: "Teacher",
                type: "text",
                value:
                    existing?.teacher || "",
                placeholder: "Teacher name"
            },

            {
                id: "startTime",
                label: "Start time",
                type: "time",
                value:
                    existing?.startTime || "",
                required: true
            },

            {
                id: "endTime",
                label: "End time",
                type: "time",
                value:
                    existing?.endTime || "",
                required: true
            }
        ],

        values => {

            if (existing) {

                Object.assign(
                    existing,
                    {
                        day:
                            values.day,

                        subject:
                            values.subject.trim(),

                        teacher:
                            values.teacher.trim(),

                        startTime:
                            values.startTime,

                        endTime:
                            values.endTime
                    }
                );

            } else {

                data.schedule.push({

                    id:
                        createId("schedule"),

                    day:
                        values.day,

                    subject:
                        values.subject.trim(),

                    teacher:
                        values.teacher.trim(),

                    startTime:
                        values.startTime,

                    endTime:
                        values.endTime,

                    createdAt:
                        new Date().toISOString()
                });
            }


            saveData();

            renderAll();

            showToast(
                existing
                    ? "Class updated"
                    : "Class added"
            );
        }
    );
}


/* =========================================
   NOTES
========================================= */

function renderFolderOptions() {

    const select =
        document.getElementById(
            "notesFolderFilter"
        );

    if (!select) {
        return;
    }


    const current =
        select.value || "all";


    select.innerHTML = `
        <option value="all">
            All folders
        </option>

        ${data.folders.map(folder => `
            <option value="${folder.id}">
                ${escapeHTML(folder.name)}
            </option>
        `).join("")}
    `;


    if (
        data.folders.some(
            folder => folder.id === current
        )
    ) {
        select.value = current;
    } else {
        select.value = "all";
    }
}


function renderNotes() {

    renderFolderOptions();


    const container =
        document.getElementById(
            "notesList"
        );

    if (!container) {
        return;
    }


    const folderFilter =
        document.getElementById(
            "notesFolderFilter"
        )?.value || "all";


    const sort =
        document.getElementById(
            "notesSort"
        )?.value || "updated";


    let notes =
        [...data.notes];


    if (folderFilter !== "all") {

        notes =
            notes.filter(
                note =>
                    (note.folderId ||
                        "folder-unfiled") ===
                    folderFilter
            );
    }


    notes.sort(
        (a, b) => {

            if (sort === "az") {

                return a.title
                    .localeCompare(
                        b.title
                    );
            }


            if (sort === "za") {

                return b.title
                    .localeCompare(
                        a.title
                    );
            }


            if (sort === "pinned") {

                if (
                    Boolean(a.pinned) !==
                    Boolean(b.pinned)
                ) {
                    return a.pinned
                        ? -1
                        : 1;
                }
            }


            if (sort === "created") {

                return (
                    new Date(b.createdAt || 0) -
                    new Date(a.createdAt || 0)
                );
            }


            return (
                new Date(
                    b.updatedAt ||
                    b.createdAt ||
                    0
                ) -
                new Date(
                    a.updatedAt ||
                    a.createdAt ||
                    0
                )
            );
        }
    );


    if (notes.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No notes found.
            </div>
        `;

        return;
    }


    container.innerHTML =
        notes.map(note => {

            return `
                <div
                    class="item note-item"
                    data-search="${escapeHTML(
                        `${note.title} ${note.content || ""} ${getFolderName(note.folderId)}`
                    )}"
                >

                    <div class="item-main">

                        <div class="item-title">

                            ${
                                note.pinned
                                    ? `
                                        <span class="note-pin">
                                            📌
                                        </span>
                                    `
                                    : ""
                            }

                            ${escapeHTML(
                                note.title
                            )}

                        </div>


                        ${
                            note.content
                                ? `
                                    <div class="note-content">
                                        ${escapeHTML(
                                            note.content
                                        )}
                                    </div>
                                `
                                : ""
                        }


                        <span class="folder-label">
                            ${escapeHTML(
                                getFolderName(
                                    note.folderId
                                )
                            )}
                        </span>

                    </div>


                    <div class="item-actions">

                        <button
                            class="item-action"
                            data-action="pin-note"
                            data-id="${note.id}"
                            type="button"
                            title="Pin"
                        >
                            ${note.pinned ? "Unpin" : "Pin"}
                        </button>

                        <button
                            class="item-action"
                            data-action="edit-note"
                            data-id="${note.id}"
                            type="button"
                        >
                            Edit
                        </button>

                        <button
                            class="item-action"
                            data-action="delete-note"
                            data-id="${note.id}"
                            type="button"
                        >
                            ×
                        </button>

                    </div>

                </div>
            `;
        }).join("");
}


function noteFields(existing = null) {

    return [

        {
            id: "title",
            label: "Note title",
            type: "text",
            value:
                existing?.title || "",
            required: true,
            placeholder: "Note title"
        },

        {
            id: "content",
            label: "Note",
            type: "textarea",
            value:
                existing?.content || "",
            placeholder:
                "Write your note here..."
        },

        {
            id: "folderId",
            label: "Folder",
            type: "select",
            value:
                existing?.folderId ||
                "folder-unfiled",

            options:
                data.folders.map(folder => ({
                    value: folder.id,
                    label: folder.name
                }))
        }

    ];
}


function addNote(existing = null) {

    openModal(
        existing
            ? "Edit Note"
            : "Add Note",

        noteFields(existing),

        values => {

            if (existing) {

                existing.title =
                    values.title.trim();

                existing.content =
                    values.content.trim();

                existing.folderId =
                    values.folderId;

                existing.updatedAt =
                    new Date().toISOString();

            } else {

                data.notes.push({

                    id:
                        createId("note"),

                    title:
                        values.title.trim(),

                    content:
                        values.content.trim(),

                    folderId:
                        values.folderId ||
                        "folder-unfiled",

                    pinned: false,

                    createdAt:
                        new Date().toISOString(),

                    updatedAt:
                        new Date().toISOString()
                });
            }


            saveData();

            renderAll();

            showToast(
                existing
                    ? "Note updated"
                    : "Note added"
            );
        }
    );
}


function addFolder() {

    openModal(
        "Add Folder",

        [
            {
                id: "name",
                label: "Folder name",
                type: "text",
                required: true,
                placeholder: "e.g. Modules"
            }
        ],

        values => {

            const name =
                values.name.trim();

            if (!name) {
                return;
            }


            const exists =
                data.folders.some(
                    folder =>
                        folder.name
                            .toLowerCase() ===
                        name.toLowerCase()
                );


            if (exists) {

                showToast(
                    "That folder already exists"
                );

                return;
            }


            data.folders.push({

                id:
                    createId("folder"),

                name
            });


            saveData();

            renderNotes();

            showToast(
                "Folder added"
            );
        }
    );
}


function manageFolders() {

    const removable =
        data.folders.filter(
            folder =>
                folder.id !==
                "folder-unfiled"
        );


    if (removable.length === 0) {

        showToast(
            "No custom folders yet"
        );

        return;
    }


    const options =
        removable.map(
            folder =>
                `${folder.name}`
        ).join("\n");


    const answer =
        prompt(
            `Custom folders:\n\n${options}\n\nType the exact folder name to delete it.`
        );


    if (!answer) {
        return;
    }


    const folder =
        removable.find(
            item =>
                item.name.toLowerCase() ===
                answer.trim().toLowerCase()
        );


    if (!folder) {

        showToast(
            "Folder not found"
        );

        return;
    }


    const confirmed =
        confirm(
            `Delete "${folder.name}"?\n\nNotes inside it will be moved to Unfiled.`
        );


    if (!confirmed) {
        return;
    }


    data.notes.forEach(note => {

        if (note.folderId === folder.id) {

            note.folderId =
                "folder-unfiled";
        }
    });


    data.folders =
        data.folders.filter(
            item =>
                item.id !== folder.id
        );


    saveData();

    renderAll();

    showToast(
        "Folder deleted"
    );
}


/* =========================================
   SCHOOL LINKS
========================================= */

function renderLinks() {

    const container =
        document.getElementById(
            "linksList"
        );

    if (!container) {
        return;
    }


    if (data.links.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No school links yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        data.links.map(link => {

            return `
                <div
                    class="item link-item"
                    data-search="${escapeHTML(
                        `${link.name} ${link.url}`
                    )}"
                >

                    <div class="link-icon">
                        🔗
                    </div>


                    <div class="item-main">

                        <div class="item-title">
                            ${escapeHTML(
                                link.name
                            )}
                        </div>

                        <div class="link-url">
                            ${escapeHTML(
                                link.url
                            )}
                        </div>

                    </div>


                    <div class="item-actions">

                        <a
                            class="item-action link-open"
                            href="${escapeHTML(
                                normalizeURL(
                                    link.url
                                )
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open
                        </a>

                        <button
                            class="item-action"
                            data-action="edit-link"
                            data-id="${link.id}"
                            type="button"
                        >
                            Edit
                        </button>

                        <button
                            class="item-action"
                            data-action="delete-link"
                            data-id="${link.id}"
                            type="button"
                        >
                            ×
                        </button>

                    </div>

                </div>
            `;
        }).join("");
}


function normalizeURL(url) {

    if (
        url.startsWith("http://") ||
        url.startsWith("https://")
    ) {
        return url;
    }

    return `https://${url}`;
}


function addLink(existing = null) {

    openModal(
        existing
            ? "Edit School Link"
            : "Add School Link",

        [
            {
                id: "name",
                label: "Name",
                type: "text",
                value:
                    existing?.name || "",
                required: true,
                placeholder: "e.g. Google Classroom"
            },

            {
                id: "url",
                label: "URL",
                type: "url",
                value:
                    existing?.url || "",
                required: true,
                placeholder: "https://..."
            }
        ],

        values => {

            if (existing) {

                existing.name =
                    values.name.trim();

                existing.url =
                    values.url.trim();

            } else {

                data.links.push({

                    id:
                        createId("link"),

                    name:
                        values.name.trim(),

                    url:
                        values.url.trim(),

                    createdAt:
                        new Date().toISOString()
                });
            }


            saveData();

            renderAll();

            showToast(
                existing
                    ? "Link updated"
                    : "Link added"
            );
        }
    );
}


/* =========================================
   TRASH
========================================= */

function moveToTrash(
    type,
    item
) {

    data.trash.push({

        id:
            createId("trash"),

        originalId:
            item.id,

        type,

        item:
            structuredClone(item),

        deletedAt:
            new Date().toISOString()
    });


    saveData();
}


function renderTrash() {

    const container =
        document.getElementById(
            "trashList"
        );

    if (!container) {
        return;
    }


    if (data.trash.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Trash is empty.
            </div>
        `;

        return;
    }


    const trash =
        [...data.trash]
            .sort(
                (a, b) =>
                    new Date(b.deletedAt) -
                    new Date(a.deletedAt)
            );


    container.innerHTML =
        trash.map(item => {

            const title =
                getTrashTitle(item);


            return `
                <div class="item trash-item">

                    <div class="item-main">

                        <div class="item-title">
                            ${escapeHTML(title)}
                        </div>

                        <div class="item-meta">
                            ${escapeHTML(
                                capitalize(
                                    item.type
                                )
                            )}
                        </div>

                        <div class="deleted-date">
                            Deleted:
                            ${formatDateTime(
                                item.deletedAt
                            )}
                        </div>

                    </div>


                    <div class="item-actions">

                        <button
                            class="item-action"
                            data-action="restore-trash"
                            data-id="${item.id}"
                            type="button"
                        >
                            Restore
                        </button>

                        <button
                            class="item-action"
                            data-action="permanent-trash"
                            data-id="${item.id}"
                            type="button"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        }).join("");
}


function getTrashTitle(item) {

    if (!item.item) {
        return "Deleted item";
    }


    return (
        item.item.title ||
        item.item.name ||
        item.item.subject ||
        "Deleted item"
    );
}


function capitalize(value) {

    return String(value)
        .charAt(0)
        .toUpperCase() +
        String(value)
            .slice(1);
}


function restoreTrash(id) {

    const trashItem =
        data.trash.find(
            item => item.id === id
        );


    if (!trashItem) {
        return;
    }


    const collection =
        getCollection(
            trashItem.type
        );


    if (!collection) {
        return;
    }


    const alreadyExists =
        collection.some(
            item =>
                item.id ===
                trashItem.originalId
        );


    if (!alreadyExists) {

        collection.push(
            trashItem.item
        );
    }


    data.trash =
        data.trash.filter(
            item =>
                item.id !== id
        );


    saveData();

    renderAll();

    showToast(
        "Item restored"
    );
}


function permanentlyDeleteTrash(id) {

    data.trash =
        data.trash.filter(
            item =>
                item.id !== id
        );


    saveData();

    renderTrash();

    showToast(
        "Permanently deleted"
    );
}


function getCollection(type) {

    const map = {

        subject:
            "subjects",

        task:
            "tasks",

        deadline:
            "deadlines",

        schedule:
            "schedule",

        note:
            "notes",

        link:
            "links"

    };


    const key = map[type];

    return key
        ? data[key]
        : null;
}


/* =========================================
   DELETE HELPERS
========================================= */

function deleteItem(
    type,
    id
) {

    const collection =
        getCollection(type);


    if (!collection) {
        return;
    }


    const index =
        collection.findIndex(
            item => item.id === id
        );


    if (index === -1) {
        return;
    }


    const item =
        collection[index];


    moveToTrash(
        type,
        item
    );


    collection.splice(
        index,
        1
    );


    saveData();

    renderAll();

    showToast(
        "Moved to Trash"
    );
}


/* =========================================
   EVENT ACTIONS
========================================= */

function handleAction(
    action,
    id
) {

    if (action === "edit-subject") {

        const item =
            data.subjects.find(
                subject => subject.id === id
            );

        if (item) {
            addSubject(item);
        }

        return;
    }


    if (action === "delete-subject") {

        if (
            confirm(
                "Move this subject to Trash?"
            )
        ) {
            deleteItem(
                "subject",
                id
            );
        }

        return;
    }


    if (action === "edit-task") {

        const item =
            data.tasks.find(
                task => task.id === id
            );

        if (item) {
            addTask(item);
        }

        return;
    }


    if (action === "delete-task") {

        if (
            confirm(
                "Move this task to Trash?"
            )
        ) {
            deleteItem(
                "task",
                id
            );
        }

        return;
    }


    if (action === "toggle-task") {

        const item =
            data.tasks.find(
                task => task.id === id
            );

        if (!item) {
            return;
        }


        item.completed =
            !item.completed;

        item.updatedAt =
            new Date().toISOString();


        saveData();

        renderAll();

        return;
    }


    if (action === "edit-deadline") {

        const item =
            data.deadlines.find(
                deadline =>
                    deadline.id === id
            );

        if (item) {
            addDeadline(item);
        }

        return;
    }


    if (action === "delete-deadline") {

        if (
            confirm(
                "Move this deadline to Trash?"
            )
        ) {
            deleteItem(
                "deadline",
                id
            );
        }

        return;
    }


    if (action === "edit-schedule") {

        const item =
            data.schedule.find(
                schedule =>
                    schedule.id === id
            );

        if (item) {
            addSchedule(item);
        }

        return;
    }


    if (action === "delete-schedule") {

        if (
            confirm(
                "Move this class to Trash?"
            )
        ) {
            deleteItem(
                "schedule",
                id
            );
        }

        return;
    }


    if (action === "edit-note") {

        const item =
            data.notes.find(
                note => note.id === id
            );

        if (item) {
            addNote(item);
        }

        return;
    }


    if (action === "delete-note") {

        if (
            confirm(
                "Move this note to Trash?"
            )
        ) {
            deleteItem(
                "note",
                id
            );
        }

        return;
    }


    if (action === "pin-note") {

        const item =
            data.notes.find(
                note => note.id === id
            );

        if (!item) {
            return;
        }


        item.pinned =
            !item.pinned;

        item.updatedAt =
            new Date().toISOString();


        saveData();

        renderNotes();

        return;
    }


    if (action === "edit-link") {

        const item =
            data.links.find(
                link => link.id === id
            );

        if (item) {
            addLink(item);
        }

        return;
    }


    if (action === "delete-link") {

        if (
            confirm(
                "Move this link to Trash?"
            )
        ) {
            deleteItem(
                "link",
                id
            );
        }

        return;
    }


    if (action === "restore-trash") {

        restoreTrash(id);

        return;
    }


    if (action === "permanent-trash") {

        if (
            confirm(
                "Permanently delete this item?"
            )
        ) {
            permanentlyDeleteTrash(id);
        }

        return;
    }
}


/* =========================================
   CALCULATOR
========================================= */

function setupCalculator() {

    document.querySelectorAll(
        "[data-calculator]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                calculatorInput(
                    button.dataset.calculator
                );
            }
        );
    });


    updateCalculatorDisplay();
}


function calculatorInput(value) {

    const display =
        document.getElementById(
            "calculatorDisplay"
        );


    if (value === "clear") {

        calculatorExpression = "";

        updateCalculatorDisplay();

        return;
    }


    if (value === "delete") {

        calculatorExpression =
            calculatorExpression.slice(
                0,
                -1
            );

        updateCalculatorDisplay();

        return;
    }


    if (value === "=") {

        calculateRegular();

        return;
    }


    const converted =
        value === "×"
            ? "*"
            : value === "÷"
                ? "/"
                : value;


    calculatorExpression +=
        converted;

    display.textContent =
        calculatorExpression || "0";
}


function updateCalculatorDisplay() {

    const display =
        document.getElementById(
            "calculatorDisplay"
        );

    if (display) {

        display.textContent =
            calculatorExpression || "0";
    }
}


function calculateRegular() {

    try {

        let expression =
            calculatorExpression;


        expression =
            expression.replace(
                /(\d+(?:\.\d+)?)%/g,
                "($1/100)"
            );


        if (
            !/^[0-9+\-*/().%\s]+$/
                .test(expression)
        ) {
            throw new Error();
        }


        const result =
            Function(
                `"use strict"; return (${expression})`
            )();


        if (
            typeof result !== "number" ||
            !Number.isFinite(result)
        ) {
            throw new Error();
        }


        calculatorExpression =
            String(
                Math.round(
                    result * 1e12
                ) / 1e12
            );


        updateCalculatorDisplay();

    } catch {

        calculatorExpression = "";

        const display =
            document.getElementById(
                "calculatorDisplay"
            );

        if (display) {
            display.textContent =
                "Error";
        }
    }
}


/* =========================================
   SCIENTIFIC CALCULATOR
========================================= */

function setupScientificCalculator() {

    document.querySelectorAll(
        "[data-scientific]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                scientificInput(
                    button.dataset.scientific
                );
            }
        );
    });


    document.getElementById(
        "angleModeButton"
    )?.addEventListener(
        "click",
        () => {

            angleMode =
                angleMode === "DEG"
                    ? "RAD"
                    : "DEG";

            document.getElementById(
                "angleModeButton"
            ).textContent =
                angleMode;

        }
    );


    updateScientificDisplay();
}


function scientificInput(value) {

    if (value === "clear") {

        scientificExpression = "";

        updateScientificDisplay();

        return;
    }


    if (value === "delete") {

        scientificExpression =
            scientificExpression.slice(
                0,
                -1
            );

        updateScientificDisplay();

        return;
    }


    if (value === "=") {

        calculateScientific();

        return;
    }


    if (
        [
            "sin",
            "cos",
            "tan",
            "asin",
            "acos",
            "atan",
            "sqrt",
            "log",
            "ln"
        ].includes(value)
    ) {

        scientificExpression +=
            `${value}(`;

        updateScientificDisplay();

        return;
    }


    if (value === "square") {

        scientificExpression +=
            "^2";

        updateScientificDisplay();

        return;
    }


    if (value === "inverse") {

        scientificExpression =
            `1/(${scientificExpression || "0"})`;

        updateScientificDisplay();

        return;
    }


    if (value === "π") {

        scientificExpression +=
            "pi";

        updateScientificDisplay();

        return;
    }


    if (value === "e") {

        scientificExpression +=
            "e";

        updateScientificDisplay();

        return;
    }


    if (value === "×") {

        scientificExpression += "*";

        updateScientificDisplay();

        return;
    }


    if (value === "÷") {

        scientificExpression += "/";

        updateScientificDisplay();

        return;
    }


    scientificExpression += value;

    updateScientificDisplay();
}


function updateScientificDisplay() {

    const display =
        document.getElementById(
            "scientificDisplay"
        );

    if (!display) {
        return;
    }


    display.textContent =
        scientificExpression
            .replace(/pi/g, "π")
            .replace(/\*/g, "×")
            .replace(/\//g, "÷") ||
        "0";
}


function calculateScientific() {

    try {

        let expression =
            scientificExpression;


        expression =
            expression.replace(
                /\^/g,
                "**"
            );


        expression =
            expression.replace(
                /pi/g,
                "Math.PI"
            );


        expression =
            expression.replace(
                /\be\b/g,
                "Math.E"
            );


        expression =
            expression.replace(
                /sqrt\(/g,
                "Math.sqrt("
            );


        expression =
            expression.replace(
                /log\(/g,
                "Math.log10("
            );


        expression =
            expression.replace(
                /ln\(/g,
                "Math.log("
            );


        expression =
            expression.replace(
                /sin\(/g,
                angleMode === "DEG"
                    ? "Math.sin(Math.PI/180*("
                    : "Math.sin("
            );


        expression =
            expression.replace(
                /cos\(/g,
                angleMode === "DEG"
                    ? "Math.cos(Math.PI/180*("
                    : "Math.cos("
            );


        expression =
            expression.replace(
                /tan\(/g,
                angleMode === "DEG"
                    ? "Math.tan(Math.PI/180*("
                    : "Math.tan("
            );


        expression =
            expression.replace(
                /asin\(/g,
                angleMode === "DEG"
                    ? "(180/Math.PI*Math.asin("
                    : "Math.asin("
            );


        expression =
            expression.replace(
                /acos\(/g,
                angleMode === "DEG"
                    ? "(180/Math.PI*Math.acos("
                    : "Math.acos("
            );


        expression =
            expression.replace(
                /atan\(/g,
                angleMode === "DEG"
                    ? "(180/Math.PI*Math.atan("
                    : "Math.atan("
            );


        if (
            !/^[0-9+\-*/().\sA-Za-z]+$/
                .test(expression)
        ) {
            throw new Error();
        }


        const result =
            Function(
                `"use strict"; return (${expression})`
            )();


        if (
            typeof result !== "number" ||
            !Number.isFinite(result)
        ) {
            throw new Error();
        }


        scientificExpression =
            String(
                Math.round(
                    result * 1e12
                ) / 1e12
            );


        updateScientificDisplay();

    } catch {

        scientificExpression = "";

        const display =
            document.getElementById(
                "scientificDisplay"
            );

        if (display) {
            display.textContent =
                "Error";
        }
    }
}


/* =========================================
   TIMER
========================================= */

function formatTimer(seconds) {

    const hours =
        Math.floor(
            seconds / 3600
        );

    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );

    const remainingSeconds =
        seconds % 60;


    return [
        hours,
        minutes,
        remainingSeconds
    ]
        .map(
            number =>
                String(number)
                    .padStart(2, "0")
        )
        .join(":");
}


function updateTimerDisplay() {

    const display =
        document.getElementById(
            "timerDisplay"
        );

    const status =
        document.getElementById(
            "timerStatus"
        );


    if (display) {

        display.textContent =
            formatTimer(
                data.timer.seconds
            );
    }


    if (status) {

        status.textContent =
            data.timer.running
                ? "Studying..."
                : data.timer.seconds > 0
                    ? "Paused"
                    : "Ready";
    }


    const startButton =
        document.getElementById(
            "timerStart"
        );


    if (startButton) {

        startButton.textContent =
            data.timer.running
                ? "Pause"
                : data.timer.seconds > 0
                    ? "Resume"
                    : "Start";
    }
}


function startTimer() {

    if (data.timer.running) {

        data.timer.running = false;

        clearInterval(
            timerInterval
        );

        timerInterval = null;

        saveData();

        updateTimerDisplay();

        return;
    }


    data.timer.running = true;

    saveData();

    updateTimerDisplay();


    timerInterval =
        setInterval(
            () => {

                if (!data.timer.running) {
                    return;
                }

                data.timer.seconds++;

                saveData();

                updateTimerDisplay();

            },
            1000
        );
}


function resetTimer() {

    data.timer.running = false;

    data.timer.seconds = 0;

    clearInterval(
        timerInterval
    );

    timerInterval = null;

    saveData();

    updateTimerDisplay();
}


function setupTimer() {

    document.getElementById(
        "timerStart"
    )?.addEventListener(
        "click",
        startTimer
    );


    document.getElementById(
        "timerReset"
    )?.addEventListener(
        "click",
        resetTimer
    );


    updateTimerDisplay();


    if (data.timer.running) {

        data.timer.running = false;

        saveData();
    }
}


/* =========================================
   SEARCH
========================================= */

function setupSearch() {

    const search =
        document.getElementById(
            "globalSearch"
        );


    const clear =
        document.getElementById(
            "clearSearch"
        );


    if (!search) {
        return;
    }


    search.addEventListener(
        "input",
        performSearch
    );


    clear?.addEventListener(
        "click",
        () => {

            search.value = "";

            performSearch();

            search.focus();
        }
    );
}


function performSearch() {

    const input =
        document.getElementById(
            "globalSearch"
        );


    const query =
        input?.value
            .trim()
            .toLowerCase() || "";


    document.querySelectorAll(
        "[data-search]"
    ).forEach(item => {

        const text =
            item.dataset.search
                .toLowerCase();


        item.classList.toggle(
            "search-hidden",
            query.length > 0 &&
            !text.includes(query)
        );
    });
}


/* =========================================
   EXPORT / IMPORT
========================================= */

function exportData() {

    const json =
        JSON.stringify(
            data,
            null,
            2
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "due-tomorrow-data.json";


    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);


    showToast(
        "Data exported"
    );
}


function importData(file) {

    if (!file) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        event => {

            try {

                const imported =
                    JSON.parse(
                        event.target.result
                    );


                if (
                    typeof imported !==
                    "object" ||
                    imported === null
                ) {
                    throw new Error();
                }


                data = {
                    ...structuredClone(
                        DEFAULT_DATA
                    ),

                    ...imported
                };


                saveData();

                applyTheme();

                renderAll();

                showToast(
                    "Data imported successfully"
                );

            } catch {

                showToast(
                    "Invalid data file"
                );
            }
        };


    reader.readAsText(file);
}


function setupImportExport() {

    document.getElementById(
        "exportButton"
    )?.addEventListener(
        "click",
        exportData
    );


    document.getElementById(
        "importButton"
    )?.addEventListener(
        "click",
        () => {

            const input =
                document.createElement("input");

            input.type = "file";

            input.accept =
                "application/json,.json";


            input.addEventListener(
                "change",
                () => {

                    importData(
                        input.files[0]
                    );
                }
            );


            input.click();
        }
    );
}


/* =========================================
   CLEAR ALL
========================================= */

function clearAllData() {

    const confirmed =
        confirm(
            "This will permanently remove all saved data from this browser. Continue?"
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        STORAGE_KEY
    );


    data =
        structuredClone(
            DEFAULT_DATA
        );


    calculatorExpression = "";

    scientificExpression = "";


    applyTheme();

    renderAll();

    updateCalculatorDisplay();

    updateScientificDisplay();

    showToast(
        "All local data cleared"
    );
}


/* =========================================
   EVENT LISTENERS
========================================= */

function setupButtons() {

    document.getElementById(
        "quickTaskButton"
    )?.addEventListener(
        "click",
        () => addTask()
    );


    document.getElementById(
        "addTaskButton"
    )?.addEventListener(
        "click",
        () => addTask()
    );


    document.getElementById(
        "quickSubjectButton"
    )?.addEventListener(
        "click",
        () => addSubject()
    );


    document.getElementById(
        "addSubjectButton"
    )?.addEventListener(
        "click",
        () => addSubject()
    );


    document.getElementById(
        "quickDeadlineButton"
    )?.addEventListener(
        "click",
        () => addDeadline()
    );


    document.getElementById(
        "addDeadlineButton"
    )?.addEventListener(
        "click",
        () => addDeadline()
    );


    document.getElementById(
        "quickNoteButton"
    )?.addEventListener(
        "click",
        () => addNote()
    );


    document.getElementById(
        "addNoteButton"
    )?.addEventListener(
        "click",
        () => addNote()
    );


    document.getElementById(
        "addScheduleButton"
    )?.addEventListener(
        "click",
        () => addSchedule()
    );


    document.getElementById(
        "addFolderButton"
    )?.addEventListener(
        "click",
        addFolder
    );


    document.getElementById(
        "manageFoldersButton"
    )?.addEventListener(
        "click",
        manageFolders
    );


    document.getElementById(
        "addLinkButton"
    )?.addEventListener(
        "click",
        () => addLink()
    );


    document.getElementById(
        "emptyTrashButton"
    )?.addEventListener(
        "click",
        () => {

            if (
                data.trash.length === 0
            ) {
                showToast(
                    "Trash is already empty"
                );

                return;
            }


            const confirmed =
                confirm(
                    "Permanently delete everything in Trash?"
                );


            if (!confirmed) {
                return;
            }


            data.trash = [];

            saveData();

            renderTrash();

            showToast(
                "Trash emptied"
            );
        }
    );


    document.getElementById(
        "clearAllButton"
    )?.addEventListener(
        "click",
        clearAllData
    );


    document.querySelectorAll(
        ".task-filter"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                currentTaskFilter =
                    button.dataset.filter;


                document.querySelectorAll(
                    ".task-filter"
                ).forEach(item => {

                    item.classList.toggle(
                        "active",
                        item === button
                    );
                });


                renderTasks();
            }
        );
    });


    document.getElementById(
        "notesFolderFilter"
    )?.addEventListener(
        "change",
        renderNotes
    );


    document.getElementById(
        "notesSort"
    )?.addEventListener(
        "change",
        renderNotes
    );
}


/* =========================================
   GLOBAL ACTION CLICK HANDLER
========================================= */

function setupDelegatedActions() {

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            if (
                action === "toggle-task"
            ) {

                const task =
                    data.tasks.find(
                        item =>
                            item.id === id
                    );


                if (task) {

                    task.completed =
                        !task.completed;

                    task.updatedAt =
                        new Date()
                            .toISOString();

                    saveData();

                    renderAll();
                }


                return;
            }


            handleAction(
                action,
                id
            );
        }
    );
}


/* =========================================
   TOAST
========================================= */

let toastTimeout = null;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimeout
    );


    toastTimeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );
}


/* =========================================
   RENDER ALL
========================================= */

function renderAll() {

    updateGreeting();

    updateStats();

    renderSubjects();

    renderTasks();

    renderSchedule();

    renderDeadlines();

    renderNotes();

    renderLinks();

    renderTrash();

    updateTimerDisplay();

    performSearch();
}


/* =========================================
   START APP
========================================= */

function initializeApp() {

    applyTheme();

    setupTheme();

    setupModal();

    setupButtons();

    setupDelegatedActions();

    setupCalculator();

    setupScientificCalculator();

    setupTimer();

    setupSearch();

    setupImportExport();

    renderAll();
}


document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);
