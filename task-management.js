// Task Management Logic

let currentUser = null;
let userRole = null;
let familyId = null;

// Initialize
window.addEventListener('load', () => {
    userRole = localStorage.getItem('userRole');
    currentUser = localStorage.getItem('userId');

    if (!userRole || !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    if (userRole === 'parent') {
        document.getElementById('parent-panel').style.display = 'block';
        loadParentData();
    } else {
        document.getElementById('child-panel').style.display = 'block';
        loadChildData();
    }
});

// Parent - Load children and tasks
function loadParentData() {
    const familyRef = firebase.database().ref('families');
    familyRef.orderByChild('parentId').equalTo(currentUser).once('value').then((snapshot) => {
        snapshot.forEach((childSnapshot) => {
            familyId = childSnapshot.key;
            const children = childSnapshot.val().children || {};
            
            const select = document.getElementById('task-child');
            Object.keys(children).forEach(childId => {
                const option = document.createElement('option');
                option.value = childId;
                option.textContent = children[childId].name;
                select.appendChild(option);
            });
        });
    });

    loadAllTasks();
}

// Parent - Create Task
document.getElementById('create-task-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const childId = document.getElementById('task-child').value;
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const reward = parseInt(document.getElementById('task-reward').value);
    const priority = document.getElementById('task-priority').value;
    const deadline = document.getElementById('task-deadline').value;

    const taskId = firebase.database().ref('tasks').push().key;
    const taskData = {
        id: taskId,
        childId: childId,
        parentId: currentUser,
        title: title,
        description: description,
        reward: reward,
        priority: priority,
        deadline: deadline,
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    firebase.database().ref('tasks/' + taskId).set(taskData).then(() => {
        alert('✅ Task created successfully!');
        document.getElementById('create-task-form').reset();
        loadAllTasks();
    }).catch((error) => {
        alert('Error: ' + error.message);
    });
});

// Load all tasks for parent
function loadAllTasks() {
    const tasksRef = firebase.database().ref('tasks');
    tasksRef.orderByChild('parentId').equalTo(currentUser).on('value', (snapshot) => {
        const taskList = document.getElementById('parent-task-list');
        taskList.innerHTML = '';

        snapshot.forEach((taskSnapshot) => {
            const task = taskSnapshot.val();
            taskList.appendChild(createTaskElement(task, 'parent'));
        });
    });
}

// Load child tasks
function loadChildData() {
    const tasksRef = firebase.database().ref('tasks');
    tasksRef.orderByChild('childId').equalTo(currentUser).on('value', (snapshot) => {
        const taskList = document.getElementById('child-task-list');
        taskList.innerHTML = '';

        snapshot.forEach((taskSnapshot) => {
            const task = taskSnapshot.val();
            taskList.appendChild(createTaskElement(task, 'child'));
        });
    });
}

// Create task element
function createTaskElement(task, role) {
    const element = document.createElement('div');
    element.className = 'task-item';

    const priorityColor = {
        low: '#17a2b8',
        medium: '#ffc107',
        high: '#dc3545'
    };

    element.innerHTML = `
        <div class="task-info">
            <div class="task-title">${task.title}</div>
            <div class="task-description">${task.description || 'No description'}</div>
            <div class="task-meta">
                <span>💰 Rp ${task.reward.toLocaleString('id-ID')}</span>
                <span>📅 ${task.deadline}</span>
                <span class="task-status status-${task.status}">${task.status.toUpperCase()}</span>
            </div>
        </div>
        <div class="task-actions">
            ${role === 'child' && task.status === 'pending' ? `
                <button class="btn-complete" onclick="completeTask('${task.id}')">✅ Mark Complete</button>
            ` : ''}
            ${role === 'parent' ? `
                <button class="btn-delete" onclick="deleteTask('${task.id}')">🗑️ Delete</button>
            ` : ''}
        </div>
    `;

    return element;
}

// Complete task
function completeTask(taskId) {
    firebase.database().ref('tasks/' + taskId).update({
        status: 'completed',
        completedAt: new Date().toISOString()
    }).then(() => {
        alert('🎉 Task completed!');
        loadChildData();
    });
}

// Delete task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        firebase.database().ref('tasks/' + taskId).remove().then(() => {
            alert('Task deleted');
            loadAllTasks();
        });
    }
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}