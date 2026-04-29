// Special Request Logic

let currentUser = null;
let userRole = null;
let selectedPriority = 'medium';
let childrenList = {};
let familyId = null;

window.addEventListener('load', () => {
    userRole = localStorage.getItem('userRole');
    currentUser = localStorage.getItem('userId');

    if (!userRole || !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    if (userRole === 'child') {
        document.getElementById('child-panel').style.display = 'block';
        loadMyRequests();
    } else {
        document.getElementById('parent-panel').style.display = 'block';
        loadParentData();
    }
});

// ========== CHILD FUNCTIONS ==========

function selectPriority(priority) {
    selectedPriority = priority;
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('priority-' + priority).classList.add('active');
}

function makeRequest() {
    const type = document.getElementById('request-type').value;
    const amount = parseInt(document.getElementById('request-amount').value);
    const desc = document.getElementById('request-desc').value;

    if (!type || !amount || !desc) {
        alert('Please fill all fields');
        return;
    }

    const requestId = firebase.database().ref('special_requests').push().key;
    const request = {
        id: requestId,
        childId: currentUser,
        type: type,
        amount: amount,
        description: desc,
        priority: selectedPriority,
        status: 'pending',
        createdAt: new Date().toISOString(),
        approvedAt: null,
        rejectedAt: null
    };

    firebase.database().ref('special_requests/' + requestId).set(request).then(() => {
        alert('🎁 Request sent! Waiting for parent approval...');
        document.getElementById('request-type').value = '';
        document.getElementById('request-amount').value = '';
        document.getElementById('request-desc').value = '';
        selectedPriority = 'medium';
        selectPriority('medium');
        loadMyRequests();
    }).catch(error => {
        alert('Error: ' + error.message);
    });
}

function loadMyRequests() {
    const requestsRef = firebase.database().ref('special_requests');
    requestsRef.orderByChild('childId').equalTo(currentUser).on('value', (snapshot) => {
        const listElement = document.getElementById('my-requests-list');
        listElement.innerHTML = '';

        const requests = [];
        snapshot.forEach((requestSnapshot) => {
            requests.push({ id: requestSnapshot.key, ...requestSnapshot.val() });
        });

        // Sort by date (newest first)
        requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (requests.length === 0) {
            listElement.innerHTML = '<p style="text-align: center; color: #999;">No requests yet</p>';
            return;
        }

        requests.forEach(request => {
            const card = createRequestCard(request, 'child');
            listElement.appendChild(card);
        });
    });
}

// ========== PARENT FUNCTIONS ==========

function loadParentData() {
    // Get family and children
    const familyRef = firebase.database().ref('families');
    familyRef.orderByChild('parentId').equalTo(currentUser).once('value').then((snapshot) => {
        snapshot.forEach((familySnapshot) => {
            familyId = familySnapshot.key;
            const family = familySnapshot.val();
            childrenList = family.children || {};

            // Populate child filter
            const select = document.getElementById('parent-child-filter');
            Object.keys(childrenList).forEach(childId => {
                const option = document.createElement('option');
                option.value = childId;
                option.textContent = childrenList[childId].name;
                select.appendChild(option);
            });
        });
    });

    loadRequests();
}

function loadRequests() {
    const childFilter = document.getElementById('parent-child-filter').value;
    const statusFilter = document.getElementById('parent-status-filter').value;

    const requestsRef = firebase.database().ref('special_requests');
    requestsRef.on('value', (snapshot) => {
        const listElement = document.getElementById('parent-requests-list');
        listElement.innerHTML = '';

        const requests = [];
        snapshot.forEach((requestSnapshot) => {
            const request = requestSnapshot.val();
            
            // Apply filters
            if (childFilter && request.childId !== childFilter) return;
            if (statusFilter && request.status !== statusFilter) return;

            requests.push({ id: requestSnapshot.key, ...request });
        });

        // Sort by date (newest first)
        requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (requests.length === 0) {
            listElement.innerHTML = '<p style="text-align: center; color: #999;">No requests found</p>';
            return;
        }

        requests.forEach(request => {
            const card = createRequestCard(request, 'parent');
            listElement.appendChild(card);
        });
    });
}

function createRequestCard(request, role) {
    const card = document.createElement('div');
    card.className = 'request-card ' + request.status;

    const childName = childrenList[request.childId]?.name || 'Unknown';
    const typeEmoji = {
        allowance: '💰',
        gift: '🎁',
        snack: '🍿',
        outing: '🎢',
        gadget: '📱',
        other: '❓'
    };

    const priorityLabel = {
        low: '🟢 Low',
        medium: '🟡 Medium',
        high: '🔴 High'
    };

    const statusIcon = {
        pending: '⏳',
        approved: '✅',
        rejected: '❌'
    };

    card.innerHTML = `
        <div class="request-header">
            <div>
                <div class="request-title">${typeEmoji[request.type] || '❓'} ${request.type.charAt(0).toUpperCase() + request.type.slice(1)}</div>
                ${role === 'parent' ? `<div style="font-size: 0.9em; color: #666;">from ${childName}</div>` : ''}
            </div>
            <span class="status-badge status-${request.status}">${statusIcon[request.status]} ${request.status.toUpperCase()}</span>
        </div>
        <div class="request-amount">Rp ${request.amount.toLocaleString('id-ID')}</div>
        <div class="request-desc">${request.description}</div>
        <div class="request-meta">
            <span>${priorityLabel[request.priority]}</span>
            <span>${new Date(request.createdAt).toLocaleDateString('id-ID')}</span>
        </div>
        ${role === 'parent' && request.status === 'pending' ? `
            <div class="request-actions">
                <button class="btn-action btn-approve" onclick="approveRequest('${request.id}')">✅ Approve</button>
                <button class="btn-action btn-reject" onclick="rejectRequest('${request.id}')">❌ Reject</button>
            </div>
        ` : ''}
        ${role === 'child' && request.status === 'pending' ? `
            <div class="request-actions">
                <button class="btn-action btn-delete" onclick="cancelRequest('${request.id}')">🗑️ Cancel</button>
            </div>
        ` : ''}
    `;

    return card;
}

function approveRequest(requestId) {
    if (confirm('Approve this request?')) {
        firebase.database().ref('special_requests/' + requestId).update({
            status: 'approved',
            approvedAt: new Date().toISOString()
        }).then(() => {
            alert('✅ Request approved!');
            loadRequests();
        });
    }
}

function rejectRequest(requestId) {
    if (confirm('Reject this request?')) {
        firebase.database().ref('special_requests/' + requestId).update({
            status: 'rejected',
            rejectedAt: new Date().toISOString()
        }).then(() => {
            alert('❌ Request rejected!');
            loadRequests();
        });
    }
}

function cancelRequest(requestId) {
    if (confirm('Cancel this request?')) {
        firebase.database().ref('special_requests/' + requestId).remove().then(() => {
            alert('Request cancelled');
            loadMyRequests();
        });
    }
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}