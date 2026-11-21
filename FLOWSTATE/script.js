
/* ==============================
   1. TASK MANAGEMENT
============================== */

// Marrja e elementeve nga HTML
const addTaskBtn = document.getElementById("add-task-btn");
const taskDialog = document.getElementById("task-dialog");
const closeDialogBtn = document.getElementById("close-dialog");

// Hapja e formularit
addTaskBtn.addEventListener("click", function() {
    taskDialog.showModal();
});

// Mbyllja e formularit
closeDialogBtn.addEventListener("click", function() {
    taskDialog.close();
});

/* ==============================
   2. ADD AND DISPLAY TASKS
============================== */

// Marrja e elementeve nga HTML
const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("task-title");
const taskPriority = document.getElementById("task-priority");
const taskDeadline = document.getElementById("task-deadline");
const taskStatus = document.getElementById("task-status");

// Lista ku do t'i ruajmë detyrat
let tasks = JSON.parse(localStorage.getItem("flowstateTasks")) || [];
let editingTaskId = null;

// Funksioni për shfaqjen e detyrave
function displayTasks() {

    const nowList = document.getElementById("now-list");
    const laterList = document.getElementById("later-list");
    const completedList = document.getElementById("completed-list");

    // Pastrojmë kolonat para rifreskimit
    nowList.innerHTML = "";
    laterList.innerHTML = "";
    completedList.innerHTML = "";

    // Shfaqim secilën detyrë
    tasks.forEach(function(task) {

        const card = document.createElement("div");
        card.className = "task-item";
        card.dataset.id = task.id;
        card.draggable = true;

card.addEventListener("dragstart", function() {
    card.classList.add("dragging");
});

card.addEventListener("dragend", function() {
    card.classList.remove("dragging");
});

        const title = document.createElement("h4");
        title.textContent = task.title;

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const priority = document.createElement("span");
        priority.className = "priority priority-" + task.priority;
        priority.textContent = task.priority.toUpperCase();

        meta.appendChild(priority);

        card.appendChild(title);
        card.appendChild(meta);

        if (task.deadline !== "") {
            const deadline = document.createElement("p");
            deadline.textContent = "Deadline: " + task.deadline;
            card.appendChild(deadline);
        }

        // Butoni për fshirjen e detyrës
        const actions = document.createElement("div");
        actions.className = "task-actions";
        // Butoni për editimin e detyrës
const editBtn = document.createElement("button");
editBtn.textContent = "Edit";
editBtn.className = "edit-task";

editBtn.addEventListener("click", function() {
    taskTitle.value = task.title;
    taskPriority.value = task.priority;
    taskDeadline.value = task.deadline;
    taskStatus.value = task.status;

    editingTaskId = task.id;

    document.getElementById("dialog-title").textContent = "Edit Task";
    taskDialog.showModal();
});

actions.appendChild(editBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-task";

        deleteBtn.addEventListener("click", function() {
           tasks = tasks.filter(function(item) {
    return item.id !== task.id;
});

saveTasks();


            displayTasks();
        });
        updateStreak();

        actions.appendChild(deleteBtn);
        card.appendChild(actions);

        // Vendosja në kolonën përkatëse
        if (task.status === "now") {
            nowList.appendChild(card);
        } else if (task.status === "later") {
            laterList.appendChild(card);
            } else {
            completedList.appendChild(card);
        }

    });

    updateAnalytics();
    updateSuggestions();
    

    // Përditësimi i numrit të detyrave
    document.getElementById("now-count").textContent =
        tasks.filter(task => task.status === "now").length;

    document.getElementById("later-count").textContent =
        tasks.filter(task => task.status === "later").length;

    document.getElementById("done-count").textContent =
        tasks.filter(task => task.status === "completed").length;
     
// Aktivizimi i Drag & Drop në kolona
const columns = document.querySelectorAll(".task-column");

columns.forEach(function(column) {

    column.ondragover = function(event) {
        event.preventDefault();
    };

    column.ondrop = function(event) {
        event.preventDefault();

        const draggedCard = document.querySelector(".dragging");

        if (!draggedCard) return;

        const taskId = Number(draggedCard.dataset.id);
        const newStatus = column.dataset.status;

        tasks = tasks.map(function(task) {
            if (task.id === taskId) {
                return {
                    ...task,
                    status: newStatus,
                    completedAt: newStatus === "completed"
                        ? new Date().toISOString().split("T")[0]
                        : null
                };
            }

            return task;
        });

        saveTasks();
        displayTasks();
    
         updateStreak();
    };
});

}
 // Mbyllet displayTasks



// Ruajtja e detyrës nga formulari

// Ruajtja e detyrës nga formulari
taskForm.addEventListener("submit", function(event) {

    event.preventDefault();

    if (editingTaskId !== null) {

        tasks = tasks.map(function(task) {
            if (task.id === editingTaskId) {
                return {
                    ...task,
                    title: taskTitle.value.trim(),
                    priority: taskPriority.value,
                    deadline: taskDeadline.value,
                    status: taskStatus.value,
                    completedAt: taskStatus.value === "completed"
                        ? (task.completedAt || new Date().toISOString().split("T")[0])
                        : null
                };
            }

            return task;
        });

        editingTaskId = null;

    } else {

        const newTask = {
            id: Date.now(),
            title: taskTitle.value.trim(),
            priority: taskPriority.value,
            deadline: taskDeadline.value,
            status: taskStatus.value,
            completedAt: taskStatus.value === "completed"
                ? new Date().toISOString().split("T")[0]
                : null
        };

        tasks.push(newTask);
    }

    saveTasks();
    displayTasks();
    updateStreak();

    taskForm.reset();
    taskDialog.close();

    document.getElementById("dialog-title").textContent = "Add New Task";
});

// Ruajtja e detyrave në LocalStorage
function saveTasks() {
    localStorage.setItem("flowstateTasks", JSON.stringify(tasks));
}
// Shfaqja e detyrave të ruajtura kur hapet faqja
displayTasks();
/* ==============================
   3. PRODUCTIVITY ANALYTICS
============================== */

function updateAnalytics() {

    // Numri total i detyrave
    const total = tasks.length;

    // Numri i detyrave të përfunduara
    const completed = tasks.filter(function(task) {
        return task.status === "completed";
    }).length;

    // Llogaritja e produktivitetit
    let productivity = 0;

    if (total > 0) {
        productivity = Math.round((completed / total) * 100);
    }

    // Përditësimi i statistikave në HTML
    document.getElementById("total-tasks").textContent = total;

    document.getElementById("completed-tasks").textContent = completed;

    document.getElementById("productivity-rate").textContent =
        productivity + "%";

    // Përditësimi i Progress Bar
    document.getElementById("progress-fill").style.width =
        productivity + "%";

    document.getElementById("progress-text").textContent =
        productivity + "% completed";
}
/* ==============================
   4. FOCUS MODE TIMER
============================== */

// Koha fillestare: 25 minuta
let timerSeconds = 25 * 60;
let timerInterval = null;

// Marrja e elementeve nga HTML
const timerDisplay = document.getElementById("timer");
const startTimerBtn = document.getElementById("start-timer");
const pauseTimerBtn = document.getElementById("pause-timer");
const resetTimerBtn = document.getElementById("reset-timer");

// Shfaqja e kohës në ekran
function updateTimerDisplay() {

    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    timerDisplay.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
}

// Start Timer
startTimerBtn.addEventListener("click", function() {

    if (timerInterval !== null) return;

    timerInterval = setInterval(function() {

        if (timerSeconds > 0) {

            timerSeconds--;
            updateTimerDisplay();

        } else {

            clearInterval(timerInterval);
            timerInterval = null;

            alert("Focus session completed! Great job!");
        }

    }, 1000);
});

// Pause Timer
pauseTimerBtn.addEventListener("click", function() {

    clearInterval(timerInterval);
    timerInterval = null;
});

// Reset Timer
resetTimerBtn.addEventListener("click", function() {

    clearInterval(timerInterval);
    timerInterval = null;

    timerSeconds = 25 * 60;

    updateTimerDisplay();
});

// Shfaqja fillestare
updateTimerDisplay();

/* ==============================
   5. STREAK SYSTEM
============================== */

function updateStreak() {

    const today = new Date().toISOString().split("T")[0];

    const completedDates = tasks
        .filter(function(task) {
            return task.status === "completed" && task.completedAt;
        })
        .map(function(task) {
            return task.completedAt;
        });

    const uniqueDates = [...new Set(completedDates)];

    let streak = 0;

    let checkDate = new Date();

    while (true) {

        const dateString = checkDate.toISOString().split("T")[0];

        if (uniqueDates.includes(dateString)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    document.getElementById("streak-count").textContent = streak;
}

updateStreak();
// SMART SUGGESTIONS

function updateSuggestions() {

    const suggestionText = document.getElementById("suggestion-text");

    const activeTasks = tasks.filter(function(task) {
        return task.status !== "completed";
    });

    if (activeTasks.length === 0) {
        suggestionText.textContent = "Add some tasks to receive personalized suggestions.";
        return;
    }

    const highPriority = activeTasks.find(function(task) {
        return task.priority === "high";
    });

    if (highPriority) {
        suggestionText.textContent =
            "Your next priority should be: " + highPriority.title;
    } else {
        suggestionText.textContent =
            "Great! Start with: " + activeTasks[0].title;
    }
}

