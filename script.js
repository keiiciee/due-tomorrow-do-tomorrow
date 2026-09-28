/* =========================================================
   PURPLE STUDY HUB
   Complete Study Dashboard
========================================================= */

const SUPABASE_URL = "https://heypuhrbvincoyawpktw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OT5GgrGXzqJpHf3LyIDmbg_-7eFqtXL";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Supabase connected:", supabase);

/* =========================================================
   DATA
========================================================= */

const STORAGE_KEY = "purpleStudyHubData";
const THEME_KEY = "purpleStudyHubTheme";


let data = {
    subjects: [],
    tasks: [],
    deadlines: [],
    links: []
};


let currentFilter = "all";
let currentSearch = "";


/* =========================================================
   DOM
========================================================= */

const $ = function(selector) {
    return document.querySelector(selector);
};


/* =========================================================
   LOAD DATA
========================================================= */

function loadData() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (saved) {

            const parsed =
                JSON.parse(saved);

            data = {
                subjects:
                    Array.isArray(parsed.subjects)
                        ? parsed.subjects
                        : [],

                tasks:
                    Array.isArray(parsed.tasks)
                        ? parsed.tasks
                        : [],

                deadlines:
                    Array.isArray(parsed.deadlines)
                        ? parsed.deadlines
                        : [],

                links:
                    Array.isArray(parsed.links)
                        ? parsed.links
                        : []
            };
        }

    } catch (error) {

        console.log(
            "Could not load saved data."
        );

    }
}


/* =========================================================
   SAVE DATA
========================================================= */

function saveData() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

    } catch (error) {

        showToast(
            "Your browser could not save the data."
        );
    }
}


/* =========================================================
   ID GENERATOR
========================================================= */

function createId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}


/* =========================================================
   ESCAPE USER TEXT
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(message) {

    const toast = $("#toast");

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function() {

        toast.classList.remove("show");

    }, 2200);
}


/* =========================================================
   DATE HELPERS
========================================================= */

function todayString() {

    const date = new Date();

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            dateString + "T00:00:00"
        );

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


function isOverdue(dateString) {

    return (
        dateString &&
        dateString < todayString()
    );
}


function isToday(dateString) {

    return (
        dateString === todayString()
    );
}


/* =========================================================
   GREETING
========================================================= */

function updateGreeting() {

    const hour =
        new Date().getHours();

    let greeting = "Welcome back!";

    if (hour < 12) {
        greeting = "Good morning!";
    } else if (hour < 18) {
        greeting = "Good afternoon!";
    } else {
        greeting = "Good evening!";
    }

    $("#greeting").textContent =
        greeting;
}


/* =========================================================
   SUBJECTS
========================================================= */

function openSubjectModal() {

    openModal(
        "Add Subject",
        `
        <div class="form-group">
            <label for="subjectName">
                Subject name
            </label>

            <input
                id="subjectName"
                type="text"
                placeholder="e.g. General Mathematics"
                maxlength="80"
                required
                autofocus
            >
        </div>
        `,
        function() {

            const name =
                $("#subjectName")
                    .value
                    .trim();

            if (!name) {
                showToast(
                    "Please enter a subject."
                );

                return false;
            }

            data.subjects.push({

                id: createId(),

                name: name,

                createdAt:
                    new Date().toISOString()

            });

            saveData();

            renderAll();

            showToast(
                "Subject added."
            );

            return true;
        }
    );
}


function renderSubjects() {

    const list =
        $("#subjectsList");

    list.innerHTML = "";

    $("#statSubjects").textContent =
        data.subjects.length;


    if (data.subjects.length === 0) {

        list.innerHTML =
            `<p class="empty">
                No subjects yet.<br>
                Add your first subject.
            </p>`;

        return;
    }


    let subjects =
        [...data.subjects];


    if (currentSearch) {

        subjects =
            subjects.filter(function(subject) {

                return subject.name
                    .toLowerCase()
                    .includes(currentSearch);

            });
    }


    subjects.forEach(function(subject) {

        const item =
            document.createElement("div");

        item.className = "item";

        item.innerHTML = `

            <div class="item-main">

                <p class="item-title">
                    📖 ${escapeHTML(subject.name)}
                </p>

                <p class="item-subtitle">
                    ${countTasksForSubject(subject.name)}
                    task(s)
                </p>

            </div>

            <div class="item-actions">

                <button
                    class="small-button delete-button"
                    type="button"
                    data-action="delete-subject"
                    data-id="${subject.id}"
                >
                    Delete
                </button>

            </div>
        `;

        list.appendChild(item);
    });
}


function countTasksForSubject(subjectName) {

    return data.tasks.filter(function(task) {

        return (
            task.subject === subjectName
        );

    }).length;
}


function deleteSubject(id) {

    const subject =
        data.subjects.find(function(item) {

            return item.id === id;

        });


    if (!subject) {
        return;
    }


    const taskCount =
        countTasksForSubject(subject.name);


    let message =
        `Delete "${subject.name}"?`;


    if (taskCount > 0) {

        message +=
            `\n\n${taskCount} task(s) use this subject.`;
    }


    if (!confirm(message)) {
        return;
    }


    data.subjects =
        data.subjects.filter(function(item) {

            return item.id !== id;

        });


    saveData();

    renderAll();

    showToast(
        "Subject deleted."
    );
}


/* =========================================================
   TASK MODAL
========================================================= */

function openTaskModal() {

    const subjectOptions =
        data.subjects.length
            ? data.subjects
                .map(function(subject) {

                    return `
                        <option value="${escapeHTML(subject.name)}">
                            ${escapeHTML(subject.name)}
                        </option>
                    `;

                })
                .join("")
            : `
                <option value="">
                    No subjects added
                </option>
            `;


    openModal(
        "Add Task",
        `
        <div class="form-group">

            <label for="taskTitle">
                Task or assignment
            </label>

            <input
                id="taskTitle"
                type="text"
                placeholder="e.g. Finish Module 6"
                maxlength="120"
                required
                autofocus
            >

        </div>


        <div class="form-group">

            <label for="taskSubject">
                Subject
            </label>

            <select id="taskSubject">

                <option value="">
                    No subject
                </option>

                ${subjectOptions}

            </select>

        </div>


        <div class="form-group">

            <label for="taskPriority">
                Priority
            </label>

            <select id="taskPriority">

                <option value="low">
                    Low
                </option>

                <option value="medium" selected>
                    Medium
                </option>

                <option value="high">
                    High
                </option>

            </select>

        </div>


        <div class="form-group">

            <label for="taskDueDate">
                Due date
            </label>

            <input
                id="taskDueDate"
                type="date"
            >

        </div>
        `,
        function() {

            const title =
                $("#taskTitle")
                    .value
                    .trim();


            if (!title) {

                showToast(
                    "Please enter a task."
                );

                return false;
            }


            data.tasks.unshift({

                id: createId(),

                title: title,

                subject:
                    $("#taskSubject").value,

                priority:
                    $("#taskPriority").value,

                dueDate:
                    $("#taskDueDate").value,

                completed: false,

                createdAt:
                    new Date().toISOString()

            });


            saveData();

            renderAll();

            showToast(
                "Task added."
            );

            return true;
        }
    );
}


/* =========================================================
   RENDER TASKS
========================================================= */

function renderTasks() {

    const list =
        $("#tasksList");

    list.innerHTML = "";


    let tasks =
        [...data.tasks];


    if (currentFilter === "pending") {

        tasks =
            tasks.filter(function(task) {

                return !task.completed;

            });

    }


    if (currentFilter === "completed") {

        tasks =
            tasks.filter(function(task) {

                return task.completed;

            });

    }


    if (currentFilter === "high") {

        tasks =
            tasks.filter(function(task) {

                return (
                    task.priority === "high" &&
                    !task.completed
                );

            });

    }


    if (currentSearch) {

        tasks =
            tasks.filter(function(task) {

                const searchable =
                    `${task.title}
                     ${task.subject}
                     ${task.priority}`
                    .toLowerCase();

                return searchable
                    .includes(currentSearch);

            });
    }


    tasks.sort(function(a, b) {

        if (
            a.completed !==
            b.completed
        ) {

            return a.completed ? 1 : -1;
        }


        if (
            a.dueDate &&
            b.dueDate
        ) {

            return a.dueDate
                .localeCompare(b.dueDate);
        }


        if (a.dueDate) {
            return -1;
        }

        if (b.dueDate) {
            return 1;
        }


        return 0;

    });


    if (tasks.length === 0) {

        list.innerHTML =
            `<p class="empty">
                No tasks found.
            </p>`;

        updateStats();

        return;
    }


    tasks.forEach(function(task) {

        const item =
            document.createElement("div");


        let priorityClass =
            "priority-" +
            task.priority;


        item.className =
            `item ${priorityClass}
             ${task.completed ? "completed" : ""}
             ${isOverdue(task.dueDate) && !task.completed
                 ? "overdue"
                 : ""}`;


        let dateText = "";


        if (task.dueDate) {

            if (isToday(task.dueDate)) {

                dateText =
                    "Due today";

            } else if (
                isOverdue(task.dueDate) &&
                !task.completed
            ) {

                dateText =
                    `Overdue · ${formatDate(task.dueDate)}`;

            } else {

                dateText =
                    `Due ${formatDate(task.dueDate)}`;
            }
        }


        let priorityBadge = "";


        if (task.priority === "high") {

            priorityBadge =
                `<span class="badge badge-high">
                    HIGH
                </span>`;

        } else if (
            task.priority === "medium"
        ) {

            priorityBadge =
                `<span class="badge">
                    MEDIUM
                </span>`;
        }


        item.innerHTML = `

            <div class="item-main">

                <p class="item-title">
                    ${escapeHTML(task.title)}
                </p>

                ${
                    task.subject
                        ? `
                            <p class="item-subtitle">
                                ${escapeHTML(task.subject)}
                            </p>
                          `
                        : ""
                }

                ${
                    dateText
                        ? `
                            <p class="item-subtitle">
                                ${escapeHTML(dateText)}
                            </p>
                          `
                        : ""
                }

                ${priorityBadge}

            </div>


            <div class="item-actions">

                <button
                    class="small-button"
                    type="button"
                    data-action="toggle-task"
                    data-id="${task.id}"
                >
                    ${task.completed ? "Undo" : "Done"}
                </button>


                <button
                    class="small-button delete-button"
                    type="button"
                    data-action="delete-task"
                    data-id="${task.id}"
                >
                    Delete
                </button>

            </div>
        `;


        list.appendChild(item);
    });


    updateStats();
}


/* =========================================================
   TOGGLE TASK
========================================================= */

function toggleTask(id) {

    const task =
        data.tasks.find(function(item) {

            return item.id === id;

        });


    if (!task) {
        return;
    }


    task.completed =
        !task.completed;


    saveData();

    renderAll();


    showToast(
        task.completed
            ? "Task completed! 💜"
            : "Task moved back to pending."
    );
}


/* =========================================================
   DELETE TASK
========================================================= */

function deleteTask(id) {

    const task =
        data.tasks.find(function(item) {

            return item.id === id;

        });


    if (!task) {
        return;
    }


    if (
        !confirm(
            `Delete "${task.title}"?`
        )
    ) {
        return;
    }


    data.tasks =
        data.tasks.filter(function(item) {

            return item.id !== id;

        });


    saveData();

    renderAll();

    showToast(
        "Task deleted."
    );
}


/* =========================================================
   DEADLINES
========================================================= */

function openDeadlineModal() {

    openModal(
        "Add Deadline",
        `
        <div class="form-group">

            <label for="deadlineTitle">
                Event or deadline
            </label>

            <input
                id="deadlineTitle"
                type="text"
                placeholder="e.g. Philosophy Performance Task"
                maxlength="120"
                required
                autofocus
            >

        </div>


        <div class="form-group">

            <label for="deadlineDate">
                Date
            </label>

            <input
                id="deadlineDate"
                type="date"
                required
            >

        </div>
        `,
        function() {

            const title =
                $("#deadlineTitle")
                    .value
                    .trim();


            const date =
                $("#deadlineDate")
                    .value;


            if (!title || !date) {

                showToast(
                    "Please complete the deadline details."
                );

                return false;
            }


            data.deadlines.push({

                id: createId(),

                title: title,

                date: date,

                createdAt:
                    new Date().toISOString()

            });


            saveData();

            renderAll();

            showToast(
                "Deadline added."
            );

            return true;
        }
    );
}


function renderDeadlines() {

    const list =
        $("#deadlinesList");

    list.innerHTML = "";


    let deadlines =
        [...data.deadlines];


    if (currentSearch) {

        deadlines =
            deadlines.filter(function(deadline) {

                return deadline.title
                    .toLowerCase()
                    .includes(currentSearch);

            });
    }


    deadlines.sort(function(a, b) {

        return a.date
            .localeCompare(b.date);

    });


    if (deadlines.length === 0) {

        list.innerHTML =
            `<p class="empty">
                No upcoming deadlines.
            </p>`;

        return;
    }


    deadlines.forEach(function(deadline) {

        const item =
            document.createElement("div");


        item.className =
            "item " +
            (
                isOverdue(deadline.date)
                    ? "overdue"
                    : ""
            );


        let dateLabel;


        if (isToday(deadline.date)) {

            dateLabel =
                "Today";

        } else if (
            isOverdue(deadline.date)
        ) {

            dateLabel =
                "Passed";

        } else {

            dateLabel =
                formatDate(deadline.date);
        }


        item.innerHTML = `

            <div class="item-main">

                <p class="item-title">
                    ${escapeHTML(deadline.title)}
                </p>

                <p class="item-subtitle">
                    ${escapeHTML(dateLabel)}
                </p>

            </div>


            <div class="item-actions">

                <button
                    class="small-button delete-button"
                    type="button"
                    data-action="delete-deadline"
                    data-id="${deadline.id}"
                >
                    Delete
                </button>

            </div>
        `;


        list.appendChild(item);
    });
}


function deleteDeadline(id) {

    if (
        !confirm(
            "Delete this deadline?"
        )
    ) {
        return;
    }


    data.deadlines =
        data.deadlines.filter(function(item) {

            return item.id !== id;

        });


    saveData();

    renderAll();

    showToast(
        "Deadline deleted."
    );
}


/* =========================================================
   SCHOOL LINKS
========================================================= */

function openLinkModal() {

    openModal(
        "Add School Link",
        `
        <div class="form-group">

            <label for="linkName">
                Link name
            </label>

            <input
                id="linkName"
                type="text"
                placeholder="e.g. Canva"
                maxlength="80"
                required
                autofocus
            >

        </div>


        <div class="form-group">

            <label for="linkURL">
                Website URL
            </label>

            <input
                id="linkURL"
                type="url"
                placeholder="https://..."
                required
            >

        </div>
        `,
        function() {

            const name =
                $("#linkName")
                    .value
                    .trim();


            let url =
                $("#linkURL")
                    .value
                    .trim();


            if (!name || !url) {

                showToast(
                    "Please complete the link details."
                );

                return false;
            }


            if (
                !url.startsWith("http://") &&
                !url.startsWith("https://")
            ) {

                url =
                    "https://" + url;
            }


            data.links.push({

                id: createId(),

                name: name,

                url: url,

                createdAt:
                    new Date().toISOString()

            });


            saveData();

            renderAll();

            showToast(
                "School link added."
            );

            return true;
        }
    );
}


function renderLinks() {

    const list =
        $("#linksList");

    list.innerHTML = "";


    let links =
        [...data.links];


    if (currentSearch) {

        links =
            links.filter(function(link) {

                return (
                    link.name
                        .toLowerCase()
                        .includes(currentSearch) ||

                    link.url
                        .toLowerCase()
                        .includes(currentSearch)
                );

            });
    }


    if (links.length === 0) {

        list.innerHTML =
            `<p class="empty">
                No school links yet.
            </p>`;

        return;
    }


    links.forEach(function(link) {

        const item =
            document.createElement("div");


        item.className =
            "item";


        item.innerHTML = `

            <div class="item-main">

                <a
                    class="item-title link-button"
                    href="${escapeHTML(link.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    🔗 ${escapeHTML(link.name)}
                </a>

                <p class="item-subtitle">
                    ${escapeHTML(link.url)}
                </p>

            </div>


            <div class="item-actions">

                <button
                    class="small-button delete-button"
                    type="button"
                    data-action="delete-link"
                    data-id="${link.id}"
                >
                    Delete
                </button>

            </div>
        `;


        list.appendChild(item);
    });
}


function deleteLink(id) {

    if (
        !confirm(
            "Delete this school link?"
        )
    ) {
        return;
    }


    data.links =
        data.links.filter(function(item) {

            return item.id !== id;

        });


    saveData();

    renderAll();

    showToast(
        "Link deleted."
    );
}


/* =========================================================
   STATS
========================================================= */

function updateStats() {

    const total =
        data.tasks.length;


    const completed =
        data.tasks.filter(function(task) {

            return task.completed;

        }).length;


    const pending =
        total - completed;


    const overdue =
        data.tasks.filter(function(task) {

            return (
                !task.completed &&
                isOverdue(task.dueDate)
            );

        }).length;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );


    $("#statSubjects").textContent =
        data.subjects.length;


    $("#statTasks").textContent =
        total;


    $("#statPending").textContent =
        pending;


    $("#statOverdue").textContent =
        overdue;


    $("#progressNumber").textContent =
        percentage + "%";


    const degrees =
        percentage * 3.6;


    $(".progress-ring").style.background =
        `conic-gradient(
            #b9a1d2 ${degrees}deg,
            #eee5ff ${degrees}deg
        )`;
}


/* =========================================================
   SEARCH
========================================================= */

function performSearch() {

    currentSearch =
        $("#globalSearch")
            .value
            .trim()
            .toLowerCase();


    $("#clearSearch").style.display =
        currentSearch
            ? "block"
            : "none";


    renderAll();
}


/* =========================================================
   MODAL
========================================================= */

let modalSubmit = null;


function openModal(
    title,
    fields,
    submitFunction
) {

    $("#modalTitle").textContent =
        title;


    $("#modalFields").innerHTML =
        fields;


    modalSubmit =
        submitFunction;


    $("#modalOverlay")
        .classList
        .remove("hidden");


    setTimeout(function() {

        const firstInput =
            $("#modalFields input, #modalFields select");

        if (firstInput) {
            firstInput.focus();
        }

    }, 50);
}


function closeModal() {

    $("#modalOverlay")
        .classList
        .add("hidden");

    $("#modalFields")
        .innerHTML = "";

    modalSubmit = null;
}


$("#modalClose")
    .addEventListener(
        "click",
        closeModal
    );


$("#modalCancel")
    .addEventListener(
        "click",
        closeModal
    );


$("#modalOverlay")
    .addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                $("#modalOverlay")
            ) {

                closeModal();
            }

        }
    );


$("#modalForm")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            if (
                typeof modalSubmit ===
                "function"
            ) {

                const success =
                    modalSubmit();

                if (success) {
                    closeModal();
                }
            }

        }
    );


document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape" &&
            !$("#modalOverlay")
                .classList
                .contains("hidden")
        ) {

            closeModal();
        }

    }
);


/* =========================================================
   FILTERS
========================================================= */

document
    .querySelectorAll(".filter-button")
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                document
                    .querySelectorAll(
                        ".filter-button"
                    )
                    .forEach(function(item) {

                        item.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                currentFilter =
                    button.dataset.filter;


                renderTasks();

            }
        );

    });


/* =========================================================
   ITEM BUTTON EVENTS
========================================================= */

document.addEventListener(
    "click",
    function(event) {

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


        if (action === "delete-subject") {
            deleteSubject(id);
        }


        if (action === "toggle-task") {
            toggleTask(id);
        }


        if (action === "delete-task") {
            deleteTask(id);
        }


        if (action === "delete-deadline") {
            deleteDeadline(id);
        }


        if (action === "delete-link") {
            deleteLink(id);
        }

    }
);


/* =========================================================
   SEARCH EVENTS
========================================================= */

$("#globalSearch")
    .addEventListener(
        "input",
        performSearch
    );


$("#clearSearch")
    .addEventListener(
        "click",
        function() {

            $("#globalSearch")
                .value = "";

            performSearch();

            $("#globalSearch").focus();

        }
    );


/* =========================================================
   BUTTON EVENTS
========================================================= */

$("#addSubjectButton")
    .addEventListener(
        "click",
        openSubjectModal
    );


$("#quickSubjectButton")
    .addEventListener(
        "click",
        openSubjectModal
    );


$("#addTaskButton")
    .addEventListener(
        "click",
        openTaskModal
    );


$("#quickTaskButton")
    .addEventListener(
        "click",
        openTaskModal
    );


$("#addDeadlineButton")
    .addEventListener(
        "click",
        openDeadlineModal
    );


$("#quickDeadlineButton")
    .addEventListener(
        "click",
        openDeadlineModal
    );


$("#addLinkButton")
    .addEventListener(
        "click",
        openLinkModal
    );


/* =========================================================
   DARK MODE
========================================================= */

function loadTheme() {

    const theme =
        localStorage.getItem(
            THEME_KEY
        );


    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

        $("#themeButton")
            .textContent = "☀️";

    } else {

        $("#themeButton")
            .textContent = "🌙";
    }
}


$("#themeButton")
    .addEventListener(
        "click",
        function() {

            document.body.classList.toggle(
                "dark"
            );


            const isDark =
                document.body.classList.contains(
                    "dark"
                );


            localStorage.setItem(
                THEME_KEY,
                isDark
                    ? "dark"
                    : "light"
            );


            $("#themeButton")
                .textContent =
                    isDark
                        ? "☀️"
                        : "🌙";

        }
    );


/* =========================================================
   EXPORT
========================================================= */

$("#exportButton")
    .addEventListener(
        "click",
        function() {

            const exportData = {

                app:
                    "Purple Study Hub",

                version:
                    1,

                exportedAt:
                    new Date().toISOString(),

                data:
                    data

            };


            const blob =
                new Blob(
                    [
                        JSON.stringify(
                            exportData,
                            null,
                            2
                        )
                    ],
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
                "purple-study-hub-backup.json";


            link.click();


            URL.revokeObjectURL(url);


            showToast(
                "Backup downloaded."
            );

        }
    );


/* =========================================================
   IMPORT
========================================================= */

$("#importButton")
    .addEventListener(
        "click",
        function() {

            $("#importFile").click();

        }
    );


$("#importFile")
    .addEventListener(
        "change",
        function(event) {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                function() {

                    try {

                        const imported =
                            JSON.parse(
                                reader.result
                            );


                        if (
                            !imported.data ||
                            typeof imported.data !==
                                "object"
                        ) {

                            throw new Error(
                                "Invalid file"
                            );

                        }


                        if (
                            !confirm(
                                "Import this backup? Your current data will be replaced."
                            )
                        ) {

                            return;
                        }


                        data = {

                            subjects:
                                Array.isArray(
                                    imported.data.subjects
                                )
                                    ? imported.data.subjects
                                    : [],

                            tasks:
                                Array.isArray(
                                    imported.data.tasks
                                )
                                    ? imported.data.tasks
                                    : [],

                            deadlines:
                                Array.isArray(
                                    imported.data.deadlines
                                )
                                    ? imported.data.deadlines
                                    : [],

                            links:
                                Array.isArray(
                                    imported.data.links
                                )
                                    ? imported.data.links
                                    : []

                        };


                        saveData();

                        renderAll();


                        showToast(
                            "Backup imported successfully."
                        );

                    } catch (error) {

                        showToast(
                            "That backup file is not valid."
                        );

                    }

                };


            reader.readAsText(file);


            event.target.value = "";

        }
    );


/* =========================================================
   CLEAR ALL
========================================================= */

$("#clearAllButton")
    .addEventListener(
        "click",
        function() {

            if (
                !confirm(
                    "Delete ALL Purple Study Hub data?\n\nThis cannot be undone."
                )
            ) {

                return;
            }


            data = {

                subjects: [],

                tasks: [],

                deadlines: [],

                links: []

            };


            saveData();

            renderAll();


            showToast(
                "All study data cleared."
            );

        }
    );


/* =========================================================
   POMODORO TIMER
========================================================= */

let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;


function updateTimerDisplay() {

    const minutes =
        Math.floor(
            timerSeconds / 60
        );


    const seconds =
        timerSeconds % 60;


    $("#timerDisplay")
        .textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


function startTimer() {

    if (timerRunning) {

        clearInterval(
            timerInterval
        );

        timerRunning = false;

        $("#timerStart")
            .textContent = "Start";

        return;
    }


    timerRunning = true;

    $("#timerStart")
        .textContent = "Pause";


    timerInterval =
        setInterval(
            function() {

                timerSeconds--;


                updateTimerDisplay();


                if (
                    timerSeconds <= 0
                ) {

                    clearInterval(
                        timerInterval
                    );

                    timerRunning = false;

                    $("#timerStart")
                        .textContent =
                            "Start";


                    showToast(
                        "Time's up! Take a little break. 💜"
                    );

                }

            },
            1000
        );
}


function resetTimer(minutes = 25) {

    clearInterval(
        timerInterval
    );

    timerRunning = false;

    timerSeconds =
        minutes * 60;


    $("#timerStart")
        .textContent = "Start";


    updateTimerDisplay();
}


$("#timerStart")
    .addEventListener(
        "click",
        startTimer
    );


$("#timerReset")
    .addEventListener(
        "click",
        function() {

            const activeMode =
                $(".timer-mode-button.active");


            const minutes =
                Number(
                    activeMode.dataset.minutes
                );


            resetTimer(minutes);

        }
    );


document
    .querySelectorAll(
        ".timer-mode-button"
    )
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                document
                    .querySelectorAll(
                        ".timer-mode-button"
                    )
                    .forEach(function(item) {

                        item.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                resetTimer(
                    Number(
                        button.dataset.minutes
                    )
                );

            }
        );

    });


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderAll() {

    renderSubjects();

    renderTasks();

    renderDeadlines();

    renderLinks();

    updateStats();

}


/* =========================================================
   START APP
========================================================= */

loadData();

loadTheme();

updateGreeting();

updateTimerDisplay();

renderAll();
