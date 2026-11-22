
/* =================================
   FLOWSTATE - MAIN JAVASCRIPT
================================= */


/* =================================
   1. TASK MANAGEMENT
================================= */

const addTaskBtn = document.getElementById("add-task-btn");
const taskDialog = document.getElementById("task-dialog");
const closeDialogBtn = document.getElementById("close-dialog");

const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("task-title");
const taskPriority = document.getElementById("task-priority");
const taskDeadline = document.getElementById("task-deadline");
const taskStatus = document.getElementById("task-status");

let tasks = JSON.parse(localStorage.getItem("flowstateTasks")) || [];
let editingTaskId = null;


// Hapja e formularit
if (addTaskBtn && taskDialog) {
    addTaskBtn.addEventListener("click", function() {
        taskForm.reset();
        editingTaskId = null;

        document.getElementById("dialog-title").textContent = "Add New Task";

        taskDialog.showModal();
    });
}


// Mbyllja e formularit
if (closeDialogBtn && taskDialog) {
    closeDialogBtn.addEventListener("click", function() {
        taskDialog.close();
    });
}


// Ruajtja e detyrave
function saveTasks() {
    localStorage.setItem("flowstateTasks", JSON.stringify(tasks));
}


// Shfaqja e detyrave
function displayTasks() {

    const nowList = document.getElementById("now-list");
    const laterList = document.getElementById("later-list");
    const completedList = document.getElementById("completed-list");

    // Kontrollojmë nëse jemi në Tasks Page
    if (!nowList || !laterList || !completedList) {
        return;
    }

    nowList.innerHTML = "";
    laterList.innerHTML = "";
    completedList.innerHTML = "";


    tasks.forEach(function(task) {

        const card = document.createElement("div");
        card.className = "task-item";
        card.dataset.id = task.id;
        card.draggable = true;


        // Drag Start
        card.addEventListener("dragstart", function() {
            card.classList.add("dragging");
        });


        // Drag End
        card.addEventListener("dragend", function() {
            card.classList.remove("dragging");
        });


        // Task Title
        const title = document.createElement("h4");
        title.textContent = task.title;


        // Task Priority
        const meta = document.createElement("div");
        meta.className = "task-meta";

        const priority = document.createElement("span");
        priority.className = "priority priority-" + task.priority;
        priority.textContent = task.priority.toUpperCase();

        meta.appendChild(priority);


        card.appendChild(title);
        card.appendChild(meta);


        // Deadline
        if (task.deadline) {

            const deadline = document.createElement("p");

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const deadlineDate = new Date(task.deadline + "T00:00:00");

            if (deadlineDate < today && task.status !== "completed") {

                deadline.textContent = "Overdue: " + task.deadline;
                deadline.style.color = "#FF6B81";

            } else if (deadlineDate.getTime() === today.getTime()) {

                deadline.textContent = "Due Today: " + task.deadline;
                deadline.style.color = "#F4C66A";

            } else {

                deadline.textContent = "Deadline: " + task.deadline;

            }

            card.appendChild(deadline);
        }


        // Task Actions
        const actions = document.createElement("div");
        actions.className = "task-actions";


        // EDIT
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


        // DELETE
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-task";

        deleteBtn.addEventListener("click", function() {

            tasks = tasks.filter(function(item) {
                return item.id !== task.id;
            });

            saveTasks();
            displayTasks();
            updateStreak();
            updateWeeklyProductivityChart();

        });

        actions.appendChild(deleteBtn);

        card.appendChild(actions);


        // Vendosja në kolonën përkatëse
        if (task.status === "now") {

            nowList.appendChild(card);

        } else if (task.status === "later") {

            laterList.appendChild(card);

        } else if (task.status === "completed") {

            completedList.appendChild(card);

        }

    });

    // DRAG & DROP
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
            updateWeeklyProductivityChart();

        };

    });



    // Numërimi i detyrave
    document.getElementById("now-count").textContent =
        tasks.filter(task => task.status === "now").length;

    document.getElementById("later-count").textContent =
        tasks.filter(task => task.status === "later").length;

    document.getElementById("done-count").textContent =
        tasks.filter(task => task.status === "completed").length;


    updateAnalytics();
    updateSuggestions();
    renderWeeklyCalendar();

}


// ADD AND EDIT TASK
if (taskForm) {

    taskForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const titleValue = taskTitle.value.trim();

        if (titleValue === "") {
            alert("Please enter a task name!");
            return;
        }


        if (editingTaskId !== null) {

            tasks = tasks.map(function(task) {

                if (task.id === editingTaskId) {

                    return {
                        ...task,
                        title: titleValue,
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
                title: titleValue,
                priority: taskPriority.value,
                deadline: taskDeadline.value,
                status: taskStatus.value,

                completedAt: taskStatus.value === "completed"
                    ? new Date().toISOString().split("T")[0]
                    : null

            };

            tasks.unshift(newTask);

        }


        saveTasks();
displayTasks();
updateStreak();
updateWeeklyProductivityChart();

taskForm.reset();

if (taskDialog.open) {
    taskDialog.close();
}

document.getElementById("dialog-title").textContent = "Add New Task";

    });

}


// Shfaqja fillestare e detyrave




/* =================================
   2. PRODUCTIVITY ANALYTICS
================================= */

function updateAnalytics() {

    const total = tasks.length;

    const completed = tasks.filter(function(task) {
        return task.status === "completed";
    }).length;


    let productivity = 0;

    if (total > 0) {
        productivity = Math.round((completed / total) * 100);
    }


    const totalElement = document.getElementById("total-tasks");
    const completedElement = document.getElementById("completed-tasks");
    const productivityElement = document.getElementById("productivity-rate");

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (completedElement) {
        completedElement.textContent = completed;
    }

    if (productivityElement) {
        productivityElement.textContent = productivity + "%";
    }


    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");

    if (progressFill) {
        progressFill.style.width = productivity + "%";
    }

    if (progressText) {
        progressText.textContent = productivity + "% completed";
    }

}

updateAnalytics();



/* =================================
   3. FOCUS MODE TIMER
================================= */

let timerSeconds = 25 * 60;
let timerInterval = null;

const timerDisplay = document.getElementById("timer");
const startTimerBtn = document.getElementById("start-timer");
const pauseTimerBtn = document.getElementById("pause-timer");
const resetTimerBtn = document.getElementById("reset-timer");


function updateTimerDisplay() {

    if (!timerDisplay) return;

    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    timerDisplay.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");

}


// START
if (startTimerBtn) {

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

}


// PAUSE
if (pauseTimerBtn) {

    pauseTimerBtn.addEventListener("click", function() {

        clearInterval(timerInterval);
        timerInterval = null;

    });

}


// RESET
if (resetTimerBtn) {

    resetTimerBtn.addEventListener("click", function() {

        clearInterval(timerInterval);
        timerInterval = null;

        timerSeconds = 25 * 60;

        updateTimerDisplay();

    });

}

updateTimerDisplay();



/* =================================
   4. STREAK SYSTEM
================================= */

function updateStreak() {

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
    checkDate.setHours(0, 0, 0, 0);


    while (true) {

        const dateString =
            checkDate.getFullYear() + "-" +
            String(checkDate.getMonth() + 1).padStart(2, "0") + "-" +
            String(checkDate.getDate()).padStart(2, "0");

        if (uniqueDates.includes(dateString)) {

            streak++;
            checkDate.setDate(checkDate.getDate() - 1);

        } else {

            break;

        }

    }


    const streakElement = document.getElementById("streak-count");

    if (streakElement) {
        streakElement.textContent = streak + " days";
    }

}

updateStreak();



/* =================================
   5. SMART SUGGESTIONS
================================= */

function updateSuggestions() {

    const suggestionText = document.getElementById("suggestion-text");

    if (!suggestionText) return;


    const activeTasks = tasks.filter(function(task) {
        return task.status !== "completed";
    });


    if (activeTasks.length === 0) {

        suggestionText.textContent =
            "Add some tasks to receive personalized suggestions.";

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

updateSuggestions();



/* =================================
   6. DAILY CHALLENGE
================================= */

const completeChallengeBtn =
    document.getElementById("complete-challenge");

const challengeText =
    document.getElementById("challenge-text");


if (completeChallengeBtn && challengeText) {

    completeChallengeBtn.addEventListener("click", function() {

        challengeText.textContent =
            "Challenge completed! Great job!";

        completeChallengeBtn.textContent = "Completed!";

        completeChallengeBtn.disabled = true;

    });

}





/* =================================
   8. WEEKLY CALENDAR
================================= */

const calendarGrid = document.getElementById("calendar-grid");
const calendarMonth = document.getElementById("calendar-month");
const selectedDateTitle = document.getElementById("selected-date");
const calendarTasks = document.getElementById("calendar-tasks");

const previousWeekBtn = document.getElementById("prev-week");
const nextWeekBtn = document.getElementById("next-week");

const dayNames = [
    "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"
];

let today = new Date();
today.setHours(0, 0, 0, 0);

let selectedDate = new Date(today);

let weekStart = new Date(today);
weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));


function formatDate(date) {

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}


function getTasksForDate(date) {

    const dateString = formatDate(date);

    return tasks.filter(function(task) {
        return task.deadline === dateString;
    });

}


function renderWeeklyCalendar() {

    if (!calendarGrid) return;

    calendarGrid.innerHTML = "";

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startLabel = weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });

    const endLabel = weekEnd.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    calendarMonth.textContent = startLabel + " - " + endLabel;


    for (let i = 0; i < 7; i++) {

        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);

        const dateString = formatDate(currentDate);

        const dayTasks = getTasksForDate(currentDate);

        const dayCard = document.createElement("div");
        dayCard.className = "calendar-day";

        if (dateString === formatDate(today)) {
            dayCard.classList.add("today");
        }

        if (dateString === formatDate(selectedDate)) {
            dayCard.classList.add("selected");
        }


        const dayName = document.createElement("span");
        dayName.className = "day-name";
        dayName.textContent = dayNames[i];

        const dateNumber = document.createElement("span");
        dateNumber.className = "date-number";
        dateNumber.textContent = currentDate.getDate();

        dayCard.appendChild(dayName);
        dayCard.appendChild(dateNumber);


        dayTasks.slice(0, 2).forEach(function(task) {

            const taskLabel = document.createElement("span");
            taskLabel.className = "calendar-task-dot";
            taskLabel.textContent = task.title;

            dayCard.appendChild(taskLabel);

        });


        if (dayTasks.length > 2) {

            const moreTasks = document.createElement("span");
            moreTasks.className = "calendar-task-dot";
            moreTasks.textContent = "+" + (dayTasks.length - 2) + " more";

            dayCard.appendChild(moreTasks);

        }


        dayCard.addEventListener("click", function() {

            selectedDate = new Date(currentDate);

            renderWeeklyCalendar();

        });


        calendarGrid.appendChild(dayCard);

    }

    renderCalendarDetails();

}


function renderCalendarDetails() {

    if (!calendarTasks || !selectedDateTitle) return;

    selectedDateTitle.textContent =
        selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });

    calendarTasks.innerHTML = "";

    const selectedTasks = getTasksForDate(selectedDate);


    if (selectedTasks.length === 0) {

        const message = document.createElement("p");
        message.textContent = "No tasks scheduled for this day.";

        calendarTasks.appendChild(message);

        return;

    }


    selectedTasks.forEach(function(task) {

        const taskItem = document.createElement("div");
        taskItem.className = "calendar-task-item";

        const title = document.createElement("h4");
        title.textContent = task.title;

        const details = document.createElement("p");
        details.textContent =
            "Priority: " + task.priority.toUpperCase() +
            " | Status: " + task.status.toUpperCase();

        taskItem.appendChild(title);
        taskItem.appendChild(details);

        calendarTasks.appendChild(taskItem);

    });

}


// PREVIOUS WEEK
if (previousWeekBtn) {

    previousWeekBtn.addEventListener("click", function() {

        weekStart.setDate(weekStart.getDate() - 7);
        selectedDate.setDate(selectedDate.getDate() - 7);

        renderWeeklyCalendar();

    });

}


// NEXT WEEK
if (nextWeekBtn) {

    nextWeekBtn.addEventListener("click", function() {

        weekStart.setDate(weekStart.getDate() + 7);
        selectedDate.setDate(selectedDate.getDate() + 7);

        renderWeeklyCalendar();

    });

}


// INITIAL CALENDAR
renderWeeklyCalendar();
displayTasks();


/* ==============================
   FOCUS SOUNDS DROPDOWN
============================== */

const musicToggle = document.getElementById("music-toggle");
const musicOptions = document.getElementById("music-options");
const musicArrow = document.getElementById("music-arrow");

if (musicToggle && musicOptions) {

    musicToggle.addEventListener("click", function () {

        musicOptions.classList.toggle("show");
        musicToggle.classList.toggle("open");

    });

}


/* ==============================
   FOCUS SOUNDS PLAYER
============================== */

const soundFiles = {
    rain: "sounds/rain.mp3",
    forest: "sounds/forest.mp3",
    noise: "sounds/sea.mp3"
};

let currentAudio = null;

const soundButtons = document.querySelectorAll(".sound-option");
const playButton = document.getElementById("play-sound");
const pauseButton = document.getElementById("pause-sound");

let selectedSound = null;

// Select a sound
soundButtons.forEach(button => {

    button.addEventListener("click", function () {

        const sound = this.dataset.sound;

        selectedSound = sound;

        soundButtons.forEach(btn => {
            btn.classList.remove("selected");
        });

        this.classList.add("selected");

        if (currentAudio) {
            currentAudio.pause();
        }

        currentAudio = new Audio(soundFiles[sound]);
        currentAudio.loop = true;

        currentAudio.play().catch(error => {
            console.log("Audio playback failed:", error);
        });

    });

});

// Play button
if (playButton) {
    playButton.addEventListener("click", function () {

        if (currentAudio) {
            currentAudio.play();
        } else if (selectedSound) {
            currentAudio = new Audio(soundFiles[selectedSound]);
            currentAudio.loop = true;
            currentAudio.play();
        }

    });
}

// Pause button
if (pauseButton) {
    pauseButton.addEventListener("click", function () {

        if (currentAudio) {
            currentAudio.pause();
        }

    });
}




/* ==============================
   WEEKLY PRODUCTIVITY CHART
   CONNECTED TO REAL TASKS
============================== */

let productivityChart = null;

function updateWeeklyProductivityChart() {

    const canvas = document.getElementById("productivityChart");

    if (!canvas || typeof Chart === "undefined") return;

    // Find the beginning of the current week (Monday)
    const today = new Date();

    const monday = new Date(today);
    monday.setHours(0, 0, 0, 0);

    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

    const labels = [];
    const dailyCompleted = [];

    // Get completed tasks for each day
    for (let i = 0; i < 7; i++) {

        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + i);

        const dateString =
            currentDate.getFullYear() + "-" +
            String(currentDate.getMonth() + 1).padStart(2, "0") + "-" +
            String(currentDate.getDate()).padStart(2, "0");

        labels.push(
            currentDate.toLocaleDateString("en-US", {
                weekday: "short"
            })
        );

        const completedCount = tasks.filter(function(task) {

            return task.status === "completed" &&
                   task.completedAt === dateString;

        }).length;

        dailyCompleted.push(completedCount);

    }

    // Calculate weekly total
    const weeklyTotal = dailyCompleted.reduce(
        (sum, value) => sum + value, 0
    );

    // Update weekly summary
    const weeklyAverage = document.getElementById("weekly-average");

    if (weeklyAverage) {
        weeklyAverage.textContent = weeklyTotal;
    }

    // Create gradient
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 0, 280);

    gradient.addColorStop(0, "rgba(167, 139, 250, 0.95)");
    gradient.addColorStop(1, "rgba(124, 92, 220, 0.25)");

    // Update existing chart
    if (productivityChart) {

        productivityChart.data.labels = labels;
        productivityChart.data.datasets[0].data = dailyCompleted;

        productivityChart.update();

        return;
    }

    // Create chart
    productivityChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [{

                label: "Completed Tasks",

                data: dailyCompleted,

                backgroundColor: gradient,

                borderRadius: 9,

                borderSkipped: false,

                barThickness: 28

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            animation: {
                duration: 700
            },

            plugins: {

                legend: {
                    display: false
                },

                tooltip: {

                    backgroundColor: "#222633",

                    titleColor: "#FFFFFF",

                    bodyColor: "#A78BFA",

                    padding: 12,

                    displayColors: false,

                    callbacks: {

                        label: function(context) {

                            return context.raw + " tasks completed";

                        }

                    }

                }

            },

            scales: {

                y: {

                    beginAtZero: true,

                    ticks: {

                        precision: 0,

                        stepSize: 1,

                        color: "#858B9B"

                    },

                    grid: {

                        color: "rgba(133, 139, 155, 0.12)"

                    },

                    border: {
                        display: false
                    }

                },

                x: {

                    ticks: {
                        color: "#858B9B"
                    },

                    grid: {
                        display: false
                    },

                    border: {
                        display: false
                    }

                }

            }

        }

    });

}

// Initial chart rendering
updateWeeklyProductivityChart();





/* ==============================
   FLOWSTATE - BUBBLE POP GAME
============================== */

const bubbleGame = document.getElementById("bubble-game");

if (bubbleGame) {

    const scoreDisplay = document.getElementById("game-score");
    const timerDisplay = document.getElementById("game-timer");
    const bestDisplay = document.getElementById("best-score");

    const startButton = document.getElementById("start-game");
    const restartButton = document.getElementById("restart-game");

    const message = document.getElementById("game-message");
    const overlay = document.getElementById("game-overlay");

    const finalScore = document.getElementById("final-score");

    let score = 0;
    let timeLeft = 30;
    let gameInterval;
    let bubbleInterval;
    let gameRunning = false;

    let bestScore = Number(localStorage.getItem("bubbleBestScore")) || 0;

    bestDisplay.textContent = bestScore;

    function startBubbleGame() {

        if (gameRunning) return;

        score = 0;
        timeLeft = 30;
        gameRunning = true;

        scoreDisplay.textContent = score;
        timerDisplay.textContent = timeLeft + "s";

        message.style.display = "none";
        overlay.style.display = "none";

        bubbleGame.querySelectorAll(".bubble").forEach(bubble => bubble.remove());

        createBubble();

        bubbleInterval = setInterval(createBubble, 650);

        gameInterval = setInterval(function() {

            timeLeft--;

            timerDisplay.textContent = timeLeft + "s";

            if (timeLeft <= 0) {
                endBubbleGame();
            }

        }, 1000);
    }

    function createBubble() {

        if (!gameRunning) return;

        const bubble = document.createElement("div");

        bubble.classList.add("bubble");

        const size = Math.floor(Math.random() * 35) + 30;

        const maxX = bubbleGame.clientWidth - size;
        const maxY = bubbleGame.clientHeight - size;

        bubble.style.width = size + "px";
        bubble.style.height = size + "px";

        bubble.style.left = Math.random() * maxX + "px";
        bubble.style.top = Math.random() * maxY + "px";

        bubble.addEventListener("click", function() {

            if (!gameRunning) return;

            score++;

            scoreDisplay.textContent = score;

            bubble.remove();

            createBubble();

        });

        bubbleGame.appendChild(bubble);

        setTimeout(function() {
            bubble.remove();
        }, 2500);

    }

    function endBubbleGame() {

        gameRunning = false;

        clearInterval(gameInterval);
        clearInterval(bubbleInterval);

        bubbleGame.querySelectorAll(".bubble").forEach(bubble => bubble.remove());

        if (score > bestScore) {

            bestScore = score;

            localStorage.setItem("bubbleBestScore", bestScore);

            bestDisplay.textContent = bestScore;

        }

        finalScore.textContent = score;

        overlay.style.display = "flex";

    }

    startButton.addEventListener("click", startBubbleGame);

    restartButton.addEventListener("click", startBubbleGame);

}





