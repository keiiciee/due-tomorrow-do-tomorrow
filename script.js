/* =========================================================
   PURPLE STUDY HUB
   Complete Study Dashboard
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://heypuhrbvincoyawpktw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_OT5GgrGXzqJpHf3LyIDmbg_-7eFqtXL";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

console.log(
    "Supabase connected:",
    supabaseClient
);


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY =
    "purpleStudyHubData";

const THEME_KEY =
    "purpleStudyHubTheme";


let data = {
    subjects: [],
    tasks: [],
    deadlines: [],
    links: []
};


let currentFilter = "all";
let currentSearch = "";


/* =========================================================
   DOM HELPER
========================================================= */

function $(selector) {
    return document.querySelector(selector);
}


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   ID
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
   LOAD DATA
========================================================= */

function loadData() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!saved) {
            return;
        }

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

    } catch (error) {

        console.error(
            "Could not load saved data:",
            error
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

        console.error(
            "Could not save data:",
            error
        );

        showToast(
            "Your browser could not save the data."
        );
    }
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(message) {

    const toast =
        $("#toast");

    if (!toast) {
        return;
    }

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(
            function() {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );
}


/* =========================================================
   DATE HELPERS
========================================================= */

function todayString() {

    const date =
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            dateString +
            "T00:00:00"
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
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

    return Boolean(
        dateString &&
        dateString < todayString()
    );
}


function isToday(dateString) {

    return (
        dateString ===
        todayString()
    );
}


/* =========================================================
   GREETING
========================================================= */

function updateGreeting() {

    const greetingElement =
        $("#greeting");

    if (!greetingElement) {
        return;
    }

    const hour =
        new Date().getHours();

    let greeting =
        "Welcome back!";

    if (hour < 12) {

        greeting =
            "Good morning!";

    } else if (hour < 18) {

        greeting =
            "Good afternoon!";

    } else {

        greeting =
            "Good evening!";
    }

    greetingElement.textContent =
        greeting;
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

    const overlay =
        $("#modalOverlay");

    const titleElement =
        $("#modalTitle");

    const fieldsElement =
        $("#modalFields");

    if (
        !overlay ||
        !titleElement ||
        !fieldsElement
    ) {
        return;
    }

    titleElement.textContent =
        title;

    fieldsElement.innerHTML =
        fields;

    modalSubmit =
        submitFunction;

    overlay.classList.remove(
        "hidden"
    );

    setTimeout(
        function() {

            const firstInput =
                fieldsElement.querySelector(
                    "input, select, textarea"
                );

            if (firstInput) {
                firstInput.focus();
            }

        },
        50
    );
}


function closeModal() {

    const overlay =
        $("#modalOverlay");

    const fields =
        $("#modalFields");

    if (overlay) {

        overlay.classList.add(
            "hidden"
        );
    }

    if (fields) {

        fields.innerHTML =
            "";
    }

    modalSubmit =
        null;
}


function setupModalEvents() {

    const closeButton =
        $("#modalClose");

    const cancelButton =
        $("#modalCancel");

    const overlay =
        $("#modalOverlay");

    const form =
        $("#modalForm");


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeModal
        );
    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeModal
        );
    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            function(event) {

                if (
                    event.target ===
                    overlay
                ) {
                    closeModal();
                }

            }
        );
    }


    if (form) {

        form.addEventListener(
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
    }


    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key ===
                "Escape"
            ) {

                const overlay =
                    $("#modalOverlay");

                if (
                    overlay &&
                    !overlay.classList.contains(
                        "hidden"
                    )
                ) {
                    closeModal();
                }
            }

        }
    );
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
            >

        </div>
        `,

        function() {

            const input =
                $("#subjectName");

            const name =
                input
                    ? input.value.trim()
                    : "";

            if (!name) {

                showToast(
                    "Please enter a subject."
                );

                return false;
            }

            data.subjects.push({

                id:
                    createId(),

                name:
                    name,

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


function countTasksForSubject(
    subjectName
) {

    return data.tasks.filter(
        function(task) {

            return (
                task.subject ===
                subjectName
            );

        }
    ).length;
}


function renderSubjects() {

    const list =
        $("#subjectsList");

    if (!list) {
        return;
    }

    list.innerHTML =
        "";

    const stat =
        $("#statSubjects");

    if (stat) {

        stat.textContent =
            data.subjects.length;
    }


    let subjects =
        [...data.subjects];


    if (currentSearch) {

        subjects =
            subjects.filter(
                function(subject) {

                    return subject.name
                        .toLowerCase()
                        .includes(
                            currentSearch
                        );

                }
            );
    }


    if (
        subjects.length ===
        0
    ) {

        list.innerHTML = `
            <p class="empty">
                No subjects yet.<br>
                Add your first subject.
            </p>
        `;

        return;
    }


    subjects.forEach(
        function(subject) {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "item";

            item.innerHTML = `

                <div class="item-main">

                    <p class="item-title">
                        📖
                        ${escapeHTML(
                            subject.name
                        )}
                    </p>

                    <p class="item-subtitle">
                        ${countTasksForSubject(
                            subject.name
                        )}
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

            list.appendChild(
                item
            );
        }
    );
}


function deleteSubject(id) {

    const subject =
        data.subjects.find(
            function(item) {

                return item.id === id;

            }
        );

    if (!subject) {
        return;
    }

    const taskCount =
        countTasksForSubject(
            subject.name
        );

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
        data.subjects.filter(
            function(item) {

                return item.id !== id;

            }
        );

    saveData();

    renderAll();

    showToast(
        "Subject deleted."
    );
}


/* =========================================================
   TASKS
========================================================= */

function openTaskModal() {

    let subjectOptions =
        data.subjects
            .map(
                function(subject) {

                    return `
                        <option value="${escapeHTML(
                            subject.name
                        )}">
                            ${escapeHTML(
                                subject.name
                            )}
                        </option>
                    `;

                }
            )
            .join("");


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

                <option
                    value="medium"
                    selected
                >
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
                    ?.value
                    .trim() || "";

            const subject =
                $("#taskSubject")
                    ?.value || "";

            const priority =
                $("#taskPriority")
                    ?.value || "medium";

            const dueDate =
                $("#taskDueDate")
                    ?.value || "";


            if (!title) {

                showToast(
                    "Please enter a task."
                );

                return false;
            }


            data.tasks.unshift({

                id:
                    createId(),

                title:
                    title,

                subject:
                    subject,

                priority:
                    priority,

                dueDate:
                    dueDate,

                completed:
                    false,

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


function renderTasks() {

    const list =
        $("#tasksList");

    if (!list) {
        return;
    }

    list.innerHTML =
        "";


    let tasks =
        [...data.tasks];


    if (
        currentFilter ===
        "pending"
    ) {

        tasks =
            tasks.filter(
                function(task) {

                    return !task.completed;

                }
            );
    }


    if (
        currentFilter ===
        "completed"
    ) {

        tasks =
            tasks.filter(
                function(task) {

                    return task.completed;

                }
            );
    }


    if (
        currentFilter ===
        "high"
    ) {

        tasks =
            tasks.filter(
                function(task) {

                    return (
                        task.priority ===
                        "high" &&
                        !task.completed
                    );

                }
            );
    }


    if (currentSearch) {

        tasks =
            tasks.filter(
                function(task) {

                    const text =
                        (
                            task.title +
                            " " +
                            task.subject +
                            " " +
                            task.priority
                        )
                            .toLowerCase();

                    return text.includes(
                        currentSearch
                    );

                }
            );
    }


    tasks.sort(
        function(a, b) {

            if (
                a.completed !==
                b.completed
            ) {

                return a.completed
                    ? 1
                    : -1;
            }


            if (
                a.dueDate &&
                b.dueDate
            ) {

                return a.dueDate
                    .localeCompare(
                        b.dueDate
                    );
            }


            if (a.dueDate) {
                return -1;
            }

            if (b.dueDate) {
                return 1;
            }

            return 0;

        }
    );


    if (
        tasks.length ===
        0
    ) {

        list.innerHTML = `
            <p class="empty">
                No tasks found.
            </p>
        `;

        updateStats();

        return;
    }


    tasks.forEach(
        function(task) {

            const item =
                document.createElement(
                    "div"
                );


            let priorityClass =
                "priority-" +
                (
                    task.priority ||
                    "medium"
                );


            item.className =
                `item ${priorityClass}
                ${task.completed ? "completed" : ""}
                ${
                    isOverdue(
                        task.dueDate
                    ) &&
                    !task.completed
                        ? "overdue"
                        : ""
                }`;


            let dateText =
                "";


            if (task.dueDate) {

                if (
                    isToday(
                        task.dueDate
                    )
                ) {

                    dateText =
                        "Due today";

                } else if (
                    isOverdue(
                        task.dueDate
                    ) &&
                    !task.completed
                ) {

                    dateText =
                        `Overdue · ${formatDate(
                            task.dueDate
                        )}`;

                } else {

                    dateText =
                        `Due ${formatDate(
                            task.dueDate
                        )}`;
                }
            }


            let priorityBadge =
                "";


            if (
                task.priority ===
                "high"
            ) {

                priorityBadge = `
                    <span class="badge badge-high">
                        HIGH
                    </span>
                `;

            } else if (
                task.priority ===
                "medium"
            ) {

                priorityBadge = `
                    <span class="badge">
                        MEDIUM
                    </span>
                `;
            }


            item.innerHTML = `

                <div class="item-main">

                    <p class="item-title">
                        ${escapeHTML(
                            task.title
                        )}
                    </p>

                    ${
                        task.subject
                            ? `
                                <p class="item-subtitle">
                                    ${escapeHTML(
                                        task.subject
                                    )}
                                </p>
                              `
                            : ""
                    }

                    ${
                        dateText
                            ? `
                                <p class="item-subtitle">
                                    ${escapeHTML(
                                        dateText
                                    )}
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
                        ${
                            task.completed
                                ? "Undo"
                                : "Done"
                        }
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

            list.appendChild(
                item
            );
        }
    );


    updateStats();
}


function toggleTask(id) {

    const task =
        data.tasks.find(
            function(item) {

                return item.id === id;

            }
        );

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


function deleteTask(id) {

    const task =
        data.tasks.find(
            function(item) {

                return item.id === id;

            }
        );

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
        data.tasks.filter(
            function(item) {

                return item.id !== id;

            }
        );

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
                    ?.value
                    .trim() || "";

            const date =
                $("#deadlineDate")
                    ?.value || "";


            if (
                !title ||
                !date
            ) {

                showToast(
                    "Please complete the deadline details."
                );

                return false;
            }


            data.deadlines.push({

                id:
                    createId(),

                title:
                    title,

                date:
                    date,

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

    if (!list) {
        return;
    }

    list.innerHTML =
        "";


    let deadlines =
        [...data.deadlines];


    if (currentSearch) {

        deadlines =
            deadlines.filter(
                function(deadline) {

                    return deadline.title
                        .toLowerCase()
                        .includes(
                            currentSearch
                        );

                }
            );
    }


    deadlines.sort(
        function(a, b) {

            return a.date.localeCompare(
                b.date
            );

        }
    );


    if (
        deadlines.length ===
        0
    ) {

        list.innerHTML = `
            <p class="empty">
                No upcoming deadlines.
            </p>
        `;

        return;
    }


    deadlines.forEach(
        function(deadline) {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "item " +
                (
                    isOverdue(
                        deadline.date
                    )
                        ? "overdue"
                        : ""
                );


            let dateLabel =
                "";


            if (
                isToday(
                    deadline.date
                )
            ) {

                dateLabel =
                    "Today";

            } else if (
                isOverdue(
                    deadline.date
                )
            ) {

                dateLabel =
                    "Passed";

            } else {

                dateLabel =
                    formatDate(
                        deadline.date
                    );
            }


            item.innerHTML = `

                <div class="item-main">

                    <p class="item-title">
                        ${escapeHTML(
                            deadline.title
                        )}
                    </p>

                    <p class="item-subtitle">
                        ${escapeHTML(
                            dateLabel
                        )}
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

            list.appendChild(
                item
            );
        }
    );
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
        data.deadlines.filter(
            function(item) {

                return item.id !== id;

            }
        );

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
                    ?.value
                    .trim() || "";

            let url =
                $("#linkURL")
                    ?.value
                    .trim() || "";


            if (
                !name ||
                !url
            ) {

                showToast(
                    "Please complete the link details."
                );

                return false;
            }


            if (
                !url.startsWith(
                    "http://"
                ) &&
                !url.startsWith(
                    "https://"
                )
            ) {

                url =
                    "https://" +
                    url;
            }


            data.links.push({

                id:
                    createId(),

                name:
                    name,

                url:
                    url,

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

    if (!list) {
        return;
    }

    list.innerHTML =
        "";


    let links =
        [...data.links];


    if (currentSearch) {

        links =
            links.filter(
                function(link) {

                    return (
                        link.name
                            .toLowerCase()
                            .includes(
                                currentSearch
                            ) ||

                        link.url
                            .toLowerCase()
                            .includes(
                                currentSearch
                            )
                    );

                }
            );
    }


    if (
        links.length ===
        0
    ) {

        list.innerHTML = `
            <p class="empty">
                No school links yet.
            </p>
        `;

        return;
    }


    links.forEach(
        function(link) {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "item";


            item.innerHTML = `

                <div class="item-main">

                    <a
                        class="item-title link-button"
                        href="${escapeHTML(
                            link.url
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        🔗
                        ${escapeHTML(
                            link.name
                        )}
                    </a>

                    <p class="item-subtitle">
                        ${escapeHTML(
                            link.url
                        )}
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

            list.appendChild(
                item
            );
        }
    );
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
        data.links.filter(
            function(item) {

                return item.id !== id;

            }
        );

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
        data.tasks.filter(
            function(task) {

                return task.completed;

            }
        ).length;

    const pending =
        total -
        completed;

    const overdue =
        data.tasks.filter(
            function(task) {

                return (
                    !task.completed &&
                    isOverdue(
                        task.dueDate
                    )
                );

            }
        ).length;

    const percentage =
        total === 0
            ? 0
            : Math.round(
                (
                    completed /
                    total
                ) * 100
            );


    if ($("#statSubjects")) {

        $("#statSubjects")
            .textContent =
            data.subjects.length;
    }

    if ($("#statTasks")) {

        $("#statTasks")
            .textContent =
            total;
    }

    if ($("#statPending")) {

        $("#statPending")
            .textContent =
            pending;
    }

    if ($("#statOverdue")) {

        $("#statOverdue")
            .textContent =
            overdue;
    }

    if ($("#progressNumber")) {

        $("#progressNumber")
            .textContent =
            percentage +
            "%";
    }


    const ring =
        $(".progress-ring");

    if (ring) {

        const degrees =
            percentage *
            3.6;

        ring.style.background =
            `conic-gradient(
                #b9a1d2
                ${degrees}deg,
                #eee5ff
                ${degrees}deg
            )`;
    }
}


/* =========================================================
   GLOBAL SEARCH
========================================================= */

function performSearch() {

    const input =
        $("#globalSearch");

    if (!input) {
        return;
    }

    currentSearch =
        input.value
            .trim()
            .toLowerCase();


    const clearButton =
        $("#clearSearch");

    if (clearButton) {

        clearButton.style.display =
            currentSearch
                ? "block"
                : "none";
    }


    renderAll();
}


/* =========================================================
   FILTERS
========================================================= */

function setupFilters() {

    document
        .querySelectorAll(
            ".filter-button"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        document
                            .querySelectorAll(
                                ".filter-button"
                            )
                            .forEach(
                                function(item) {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        button.classList.add(
                            "active"
                        );


                        currentFilter =
                            button.dataset.filter ||
                            "all";


                        renderTasks();

                    }
                );

            }
        );
}


/* =========================================================
   ITEM ACTIONS
========================================================= */

function setupItemActions() {

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


            if (
                action ===
                "delete-subject"
            ) {

                deleteSubject(id);
            }


            if (
                action ===
                "toggle-task"
            ) {

                toggleTask(id);
            }


            if (
                action ===
                "delete-task"
            ) {

                deleteTask(id);
            }


            if (
                action ===
                "delete-deadline"
            ) {

                deleteDeadline(id);
            }


            if (
                action ===
                "delete-link"
            ) {

                deleteLink(id);
            }

        }
    );
}


/* =========================================================
   BUTTON SETUP
========================================================= */

function setupButton(
    selector,
    callback
) {

    const button =
        $(selector);

    if (button) {

        button.addEventListener(
            "click",
            callback
        );
    }
}


function setupButtons() {

    setupButton(
        "#addSubjectButton",
        openSubjectModal
    );

    setupButton(
        "#quickSubjectButton",
        openSubjectModal
    );

    setupButton(
        "#addTaskButton",
        openTaskModal
    );

    setupButton(
        "#quickTaskButton",
        openTaskModal
    );

    setupButton(
        "#addDeadlineButton",
        openDeadlineModal
    );

    setupButton(
        "#quickDeadlineButton",
        openDeadlineModal
    );

    setupButton(
        "#addLinkButton",
        openLinkModal
    );
}


/* =========================================================
   SEARCH EVENTS
========================================================= */

function setupSearch() {

    const search =
        $("#globalSearch");

    const clear =
        $("#clearSearch");


    if (search) {

        search.addEventListener(
            "input",
            performSearch
        );
    }


    if (clear) {

        clear.addEventListener(
            "click",
            function() {

                if (search) {

                    search.value =
                        "";
                }

                performSearch();

                if (search) {

                    search.focus();
                }

            }
        );
    }
}


/* =========================================================
   DARK MODE
========================================================= */

function loadTheme() {

    const theme =
        localStorage.getItem(
            THEME_KEY
        );


    if (
        theme ===
        "dark"
    ) {

        document.body.classList.add(
            "dark"
        );

    } else {

        document.body.classList.remove(
            "dark"
        );
    }


    updateThemeButton();
}


function updateThemeButton() {

    const button =
        $("#themeButton");

    if (!button) {
        return;
    }

    const isDark =
        document.body.classList.contains(
            "dark"
        );

    button.textContent =
        isDark
            ? "☀️"
            : "🌙";
}


function setupTheme() {

    const button =
        $("#themeButton");

    if (!button) {
        return;
    }

    button.addEventListener(
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

            updateThemeButton();

        }
    );
}


/* =========================================================
   EXPORT
========================================================= */

function setupExport() {

    const button =
        $("#exportButton");

    if (!button) {
        return;
    }

    button.addEventListener(
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
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );

            link.href =
                url;

            link.download =
                "purple-study-hub-backup.json";

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            URL.revokeObjectURL(
                url
            );


            showToast(
                "Backup downloaded."
            );

        }
    );
}


/* =========================================================
   IMPORT
========================================================= */

function setupImport() {

    const button =
        $("#importButton");

    const input =
        $("#importFile");

    if (
        !button ||
        !input
    ) {
        return;
    }


    button.addEventListener(
        "click",
        function() {

            input.click();

        }
    );


    input.addEventListener(
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
                                "Invalid backup"
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


            reader.readAsText(
                file
            );

            input.value =
                "";

        }
    );
}


/* =========================================================
   CLEAR ALL
========================================================= */

function setupClearAll() {

    const button =
        $("#clearAllButton");

    if (!button) {
        return;
    }


    button.addEventListener(
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
}


/* =========================================================
   POMODORO
========================================================= */

let timerSeconds =
    25 * 60;

let timerInterval =
    null;

let timerRunning =
    false;


function updateTimerDisplay() {

    const display =
        $("#timerDisplay");

    if (!display) {
        return;
    }


    const minutes =
        Math.floor(
            timerSeconds /
            60
        );

    const seconds =
        timerSeconds %
        60;


    display.textContent =
        `${String(minutes).padStart(
            2,
            "0"
        )}:${String(seconds).padStart(
            2,
            "0"
        )}`;
}


function startTimer() {

    if (timerRunning) {

        clearInterval(
            timerInterval
        );

        timerRunning =
            false;

        const button =
            $("#timerStart");

        if (button) {

            button.textContent =
                "Start";
        }

        return;
    }


    timerRunning =
        true;


    const button =
        $("#timerStart");

    if (button) {

        button.textContent =
            "Pause";
    }


    timerInterval =
        setInterval(
            function() {

                timerSeconds--;

                updateTimerDisplay();


                if (
                    timerSeconds <=
                    0
                ) {

                    clearInterval(
                        timerInterval
                    );

                    timerRunning =
                        false;


                    if (button) {

                        button.textContent =
                            "Start";
                    }


                    showToast(
                        "Time's up! Take a little break. 💜"
                    );

                }

            },
            1000
        );
}


function resetTimer(
    minutes = 25
) {

    clearInterval(
        timerInterval
    );

    timerRunning =
        false;

    timerSeconds =
        minutes * 60;


    const button =
        $("#timerStart");

    if (button) {

        button.textContent =
            "Start";
    }


    updateTimerDisplay();
}


function setupTimer() {

    setupButton(
        "#timerStart",
        startTimer
    );


    setupButton(
        "#timerReset",
        function() {

            const active =
                document.querySelector(
                    ".timer-mode-button.active"
                );

            const minutes =
                active
                    ? Number(
                        active.dataset.minutes
                    )
                    : 25;

            resetTimer(
                minutes
            );

        }
    );


    document
        .querySelectorAll(
            ".timer-mode-button"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        document
                            .querySelectorAll(
                                ".timer-mode-button"
                            )
                            .forEach(
                                function(item) {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


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

            }
        );
}


/* =========================================================
   CRAM & JAM — AUDIUS
========================================================= */

/*
   PUT YOUR AUDIUS API KEY BELOW.

   Do NOT put the Bearer Token here.
*/

const AUDIUS_API_KEY =
    "0x786c445991fd07b656ce63ecbe3fe2ed3fbf13c4";


let audiusSdk =
    null;

let currentAudio =
    null;

let currentTrack =
    null;


/* =========================================================
   AUDIUS SDK SETUP
========================================================= */

function initializeAudius() {

    if (
        typeof window.audiusSdk !==
        "function"
    ) {

        console.error(
            "Audius SDK was not loaded."
        );

        return;
    }


    if (
        AUDIUS_API_KEY ===
        "PASTE_YOUR_API_KEY_HERE"
    ) {

        console.warn(
            "Audius API key has not been added yet."
        );

        return;
    }


    try {

        audiusSdk =
            window.audiusSdk({

                apiKey:
                    AUDIUS_API_KEY

            });


        console.log(
            "Audius Cram & Jam ready."
        );


    } catch (error) {

        console.error(
            "Could not initialize Audius:",
            error
        );
    }
}


/* =========================================================
   CRAM & JAM UI
========================================================= */

function setupCramAndJam() {

    const player =
        $("#spotifyPlayer");

    if (!player) {
        return;
    }


    player.innerHTML = `

        <div class="cram-jam-content">

            <div class="cram-jam-message">

                <strong>
                    Find something to listen to
                </strong>

                <span>
                    Search for a song or artist.
                </span>

            </div>


            <div class="spotify-input-row">

                <input
                    type="text"
                    id="musicSearchInput"
                    placeholder="Search a song or artist..."
                    autocomplete="off"
                >

                <button
                    type="button"
                    id="musicSearchButton"
                    class="primary-button"
                >
                    Search
                </button>

            </div>


            <div
                id="musicSearchResults"
                class="music-search-results"
            ></div>


            <div
                id="musicPlayer"
                class="music-player"
            ></div>

        </div>

    `;


    const searchInput =
        $("#musicSearchInput");

    const searchButton =
        $("#musicSearchButton");


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            searchAudiusTracks
        );
    }


    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            function(event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    searchAudiusTracks();
                }

            }
        );
    }
}


/* =========================================================
   AUDIUS SEARCH
========================================================= */

async function searchAudiusTracks() {

    const input =
        $("#musicSearchInput");

    const results =
        $("#musicSearchResults");


    if (
        !input ||
        !results
    ) {
        return;
    }


    const query =
        input.value.trim();


    if (!query) {

        showToast(
            "Type a song or artist first."
        );

        return;
    }


    if (!audiusSdk) {

        showToast(
            "Add your Audius API key first."
        );

        return;
    }


    results.innerHTML = `

        <p class="music-loading">
            Searching...
        </p>

    `;


    try {

        const response =
            await audiusSdk.tracks.searchTracks({

                query:
                    query,

                limit:
                    8,

                sortMethod:
                    "relevant"

            });


        const tracks =
            response?.data || [];


        if (
            tracks.length ===
            0
        ) {

            results.innerHTML = `

                <p class="empty">
                    No songs found.
                </p>

            `;

            return;
        }


        results.innerHTML =
            tracks
                .map(
                    function(track) {

                        const title =
                            escapeHTML(
                                track.title ||
                                "Untitled"
                            );


                        const artist =
                            escapeHTML(
                                track.user?.name ||
                                "Unknown artist"
                            );


                        const artwork =
                            track.artwork?.[
                                "_150x150"
                            ] ||
                            "";


                        return `

                            <button
                                type="button"
                                class="music-result"
                                data-track-id="${escapeHTML(
                                    track.id
                                )}"
                            >

                                ${
                                    artwork
                                        ? `
                                            <img
                                                src="${escapeHTML(
                                                    artwork
                                                )}"
                                                alt=""
                                            >
                                          `
                                        : `
                                            <span
                                                class="music-result-icon"
                                            >
                                                ♪
                                            </span>
                                          `
                                }


                                <span
                                    class="music-result-info"
                                >

                                    <strong>
                                        ${title}
                                    </strong>

                                    <small>
                                        ${artist}
                                    </small>

                                </span>

                            </button>

                        `;

                    }
                )
                .join("");


        results
            .querySelectorAll(
                ".music-result"
            )
            .forEach(
                function(button) {

                    button.addEventListener(
                        "click",
                        function() {

                            playAudiusTrack(
                                button.dataset.trackId
                            );

                        }
                    );

                }
            );


    } catch (error) {

        console.error(
            "Audius search error:",
            error
        );


        results.innerHTML = `

            <p class="empty">
                Something went wrong while searching.
            </p>

        `;


        showToast(
            "Couldn't search music right now."
        );
    }
}


/* =========================================================
   AUDIUS PLAYBACK
========================================================= */

async function playAudiusTrack(
    trackId
) {

    if (!audiusSdk) {

        showToast(
            "Audius is not ready yet."
        );

        return;
    }


    const player =
        $("#musicPlayer");

    if (!player) {
        return;
    }


    try {

        const response =
            await audiusSdk.tracks.getTrack({

                trackId:
                    trackId

            });


        const track =
            response?.data;


        if (!track) {

            showToast(
                "That song could not be loaded."
            );

            return;
        }


        currentTrack =
            track;


        if (currentAudio) {

            currentAudio.pause();

            currentAudio =
                null;
        }


        const streamUrl =
            `https://api.audius.co/v1/tracks/${encodeURIComponent(
                track.id
            )}/stream`;


        const title =
            escapeHTML(
                track.title ||
                "Untitled"
            );


        const artist =
            escapeHTML(
                track.user?.name ||
                "Unknown artist"
            );


        const artwork =
            track.artwork?.[
                "_150x150"
            ] ||
            "";


        player.innerHTML = `

            <div class="music-player-inner">

                <div class="music-now-playing">

                    ${
                        artwork
                            ? `
                                <img
                                    src="${escapeHTML(
                                        artwork
                                    )}"
                                    alt=""
                                >
                              `
                            : `
                                <span
                                    class="music-result-icon"
                                >
                                    ♪
                                </span>
                              `
                    }


                    <div>

                        <strong>
                            ${title}
                        </strong>

                        <span>
                            ${artist}
                        </span>

                    </div>

                </div>


                <audio
                    id="audiusAudio"
                    controls
                    preload="none"
                >

                    <source
                        src="${streamUrl}"
                        type="audio/mpeg"
                    >

                    Your browser does not support audio playback.

                </audio>

            </div>

        `;


        currentAudio =
            $("#audiusAudio");


        if (currentAudio) {

            currentAudio.play()
                .catch(
                    function() {

                        showToast(
                            "Press Play to start the song."
                        );

                    }
                );
        }


    } catch (error) {

        console.error(
            "Audius playback error:",
            error
        );


        showToast(
            "Couldn't play this song."
        );
    }
}


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
   INITIALIZE APP
========================================================= */

function initializeApp() {

    loadData();

    loadTheme();

    updateGreeting();

    updateTimerDisplay();

    setupModalEvents();

    setupFilters();

    setupItemActions();

    setupSearch();

    setupButtons();

    setupTheme();

    setupExport();

    setupImport();

    setupClearAll();

    setupTimer();

    setupCramAndJam();

    initializeAudius();

    renderAll();
}


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );

} else {

    initializeApp();

}
