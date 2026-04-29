// Schedule Management Logic

let currentUser = null;
let userRole = null;
let familyId = null;
let templateSchedule = {};
let childrenList = {};
let mySchedule = {};

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
        loadMySchedule();
    }
});

// ========== PARENT FUNCTIONS ==========

function loadParentData() {
    // Get family and children
    const familyRef = firebase.database().ref('families');
    familyRef.orderByChild('parentId').equalTo(currentUser).once('value').then((snapshot) => {
        snapshot.forEach((familySnapshot) => {
            familyId = familySnapshot.key;
            const family = familySnapshot.val();
            childrenList = family.children || {};

            // Populate child select
            const select = document.getElementById('parent-child-select');
            Object.keys(childrenList).forEach(childId => {
                const option = document.createElement('option');
                option.value = childId;
                option.textContent = childrenList[childId].name;
                select.appendChild(option);
            });
        });
    });

    loadTemplateSchedule();
}

function loadTemplateSchedule() {
    const templateRef = firebase.database().ref('schedules/template/' + currentUser);
    templateRef.on('value', (snapshot) => {
        templateSchedule = snapshot.val() || {};
        displayTemplateView();
    });
}

function displayTemplateView() {
    const view = document.getElementById('template-view');
    view.innerHTML = '';

    // Sort by time
    const slots = Object.values(templateSchedule).sort((a, b) => a.time.localeCompare(b.time));

    if (slots.length === 0) {
        view.innerHTML = '<p style="color: #999; text-align: center;">No template created yet</p>';
        return;
    }

    slots.forEach(slot => {
        const slotEl = document.createElement('div');
        slotEl.className = 'time-slot template';
        slotEl.innerHTML = `
            <strong>${slot.time}</strong>
            <span>${slot.task}</span>
            <button class="btn-small btn-delete" onclick="deleteTemplateSlot('${slot.id}')">🗑️</button>
        `;
        view.appendChild(slotEl);
    });
}

function addTemplateSlot() {
    const time = document.getElementById('template-time').value;
    const task = document.getElementById('template-task').value;

    if (!time || !task) {
        alert('Please fill all fields');
        return;
    }

    const slotId = firebase.database().ref('schedules/template/' + currentUser).push().key;
    const slot = {
        id: slotId,
        time: time,
        task: task,
        createdAt: new Date().toISOString()
    };

    firebase.database().ref('schedules/template/' + currentUser + '/' + slotId).set(slot).then(() => {
        document.getElementById('template-time').value = '';
        document.getElementById('template-task').value = '';
        alert('✅ Template added!');
        displayTemplateView();
    });
}

function deleteTemplateSlot(slotId) {
    if (confirm('Delete this template slot?')) {
        firebase.database().ref('schedules/template/' + currentUser + '/' + slotId).remove();
    }
}

function loadChildSchedule() {
    const childId = document.getElementById('parent-child-select').value;
    const date = document.getElementById('parent-date-select').value;

    if (!childId) {
        document.getElementById('child-schedule-view').innerHTML = '<p style="color: #999;">Select a child first</p>';
        return;
    }

    const scheduleRef = firebase.database().ref('schedules/daily/' + childId + '/' + date);
    scheduleRef.on('value', (snapshot) => {
        displayChildScheduleForApproval(snapshot.val() || {});
    });
}

function displayChildScheduleForApproval(schedule) {
    const view = document.getElementById('child-schedule-view');
    view.innerHTML = '';

    const slots = Object.values(schedule).sort((a, b) => a.time.localeCompare(b.time));

    if (slots.length === 0) {
        view.innerHTML = '<p style="color: #999; text-align: center;">No schedule submitted</p>';
        return;
    }

    slots.forEach(slot => {
        const statusClass = slot.status || 'pending';
        const statusText = slot.status ? slot.status.toUpperCase() : 'PENDING';
        const childId = document.getElementById('parent-child-select').value;
        const date = document.getElementById('parent-date-select').value;

        const slotEl = document.createElement('div');
        slotEl.className = 'time-slot ' + statusClass;
        slotEl.innerHTML = `
            <strong>${slot.time}</strong>
            <div>
                <span>${slot.task}</span><br>
                <span class="status-badge status-${statusClass}">${statusText}</span>
            </div>
            <div class="slot-actions">
                ${slot.status !== 'approved' ? `<button class="btn-small btn-approve" onclick="approveSchedule('${childId}', '${date}', '${slot.id}')">✅</button>` : ''}
                ${slot.status !== 'rejected' ? `<button class="btn-small btn-reject" onclick="rejectSchedule('${childId}', '${date}', '${slot.id}')">❌</button>` : ''}
            </div>
        `;
        view.appendChild(slotEl);
    });
}

function approveSchedule(childId, date, slotId) {
    firebase.database().ref('schedules/daily/' + childId + '/' + date + '/' + slotId + '/status').set('approved').then(() => {
        alert('✅ Schedule approved!');
        loadChildSchedule();
    });
}

function rejectSchedule(childId, date, slotId) {
    firebase.database().ref('schedules/daily/' + childId + '/' + date + '/' + slotId + '/status').set('rejected').then(() => {
        alert('❌ Schedule rejected!');
        loadChildSchedule();
    });
}

// ========== CHILD FUNCTIONS ==========

function loadMySchedule() {
    const date = document.getElementById('child-date-select').value;

    // Load template from parent
    const familyRef = firebase.database().ref('families');
    familyRef.orderByChild('children/' + currentUser).equalTo(true).once('value').then((snapshot) => {
        snapshot.forEach((familySnapshot) => {
            const family = familySnapshot.val();
            const parentId = family.parentId;

            // Load parent's template
            const templateRef = firebase.database().ref('schedules/template/' + parentId);
            templateRef.once('value').then((templateSnapshot) => {
                displayMyTemplateView(templateSnapshot.val() || {});
            });
        });
    });

    // Load my custom schedule
    const myScheduleRef = firebase.database().ref('schedules/daily/' + currentUser + '/' + date);
    myScheduleRef.on('value', (snapshot) => {
        mySchedule = snapshot.val() || {};
        displayMyScheduleView();
    });
}

function displayMyTemplateView(template) {
    const view = document.getElementById('my-template-view');
    view.innerHTML = '';

    const slots = Object.values(template).sort((a, b) => a.time.localeCompare(b.time));

    if (slots.length === 0) {
        view.innerHTML = '<p style="color: #999; text-align: center;">No template from parent</p>';
        return;
    }

    slots.forEach(slot => {
        const slotEl = document.createElement('div');
        slotEl.className = 'time-slot template';
        slotEl.innerHTML = `
            <strong>${slot.time}</strong>
            <span>${slot.task}</span>
            <span style="opacity: 0.5;">🔒</span>
        `;
        view.appendChild(slotEl);
    });
}

function displayMyScheduleView() {
    const view = document.getElementById('my-schedule-view');
    view.innerHTML = '';

    const slots = Object.values(mySchedule).sort((a, b) => a.time.localeCompare(b.time));

    if (slots.length === 0) {
        view.innerHTML = '<p style="color: #999; text-align: center;">No custom schedule yet</p>';
        return;
    }

    slots.forEach(slot => {
        const statusClass = slot.status || 'pending';
        const statusText = slot.status ? slot.status.toUpperCase() : 'PENDING';
        const date = document.getElementById('child-date-select').value;

        const slotEl = document.createElement('div');
        slotEl.className = 'time-slot ' + statusClass;
        slotEl.innerHTML = `
            <strong>${slot.time}</strong>
            <div>
                <span>${slot.task}</span><br>
                <span class="status-badge status-${statusClass}">${statusText}</span>
            </div>
            <div class="slot-actions">
                <button class="btn-small btn-delete" onclick="deleteMySlot('${slot.id}')">🗑️</button>
            </div>
        `;
        view.appendChild(slotEl);
    });
}

function addMyScheduleSlot() {
    const time = document.getElementById('my-time').value;
    const task = document.getElementById('my-task').value;
    const date = document.getElementById('child-date-select').value;

    if (!time || !task) {
        alert('Please fill all fields');
        return;
    }

    const slotId = firebase.database().ref('schedules/daily/' + currentUser + '/' + date).push().key;
    const slot = {
        id: slotId,
        time: time,
        task: task,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    firebase.database().ref('schedules/daily/' + currentUser + '/' + date + '/' + slotId).set(slot).then(() => {
        document.getElementById('my-time').value = '';
        document.getElementById('my-task').value = '';
        alert('✅ Schedule added!');
        loadMySchedule();
    });
}

function deleteMySlot(slotId) {
    if (confirm('Delete this schedule slot?')) {
        const date = document.getElementById('child-date-select').value;
        firebase.database().ref('schedules/daily/' + currentUser + '/' + date + '/' + slotId).remove();
    }
}

function submitScheduleForApproval() {
    const date = document.getElementById('child-date-select').value;
    alert('📤 Schedule submitted for parent approval!');
    // Parent akan melihat di control center mereka
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}