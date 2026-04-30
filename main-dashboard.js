// Main Dashboard Logic

let currentUser = null;
let userRole = null;
let userStats = {};

window.addEventListener('load', () => {
    userRole = localStorage.getItem('userRole');
    currentUser = localStorage.getItem('userId');

    if (!userRole || !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    if (userRole === 'parent') {
        loadParentDashboard();
    } else {
        loadChildDashboard();
    }
});

// ========== PARENT DASHBOARD ==========

function loadParentDashboard() {
    // Load stats
    loadParentStats();
    loadParentFeatures();
}

function loadParentStats() {
    const familyRef = firebase.database().ref('families');
    familyRef.orderByChild('parentId').equalTo(currentUser).once('value').then((snapshot) => {
        let totalChildren = 0;
        let totalTasksCreated = 0;
        let totalRequests = 0;

        snapshot.forEach((familySnapshot) => {
            const family = familySnapshot.val();
            totalChildren = Object.keys(family.children || {}).length;
        });

        // Count tasks
        const tasksRef = firebase.database().ref('tasks');
        tasksRef.orderByChild('parentId').equalTo(currentUser).once('value').then((taskSnapshot) => {
            totalTasksCreated = taskSnapshot.numChildren();
        });

        // Count requests
        const requestsRef = firebase.database().ref('special_requests');
        requestsRef.once('value').then((reqSnapshot) => {
            reqSnapshot.forEach((req) => {
                // Count requests from this parent's children
            });
        });

        displayParentStats(totalChildren, totalTasksCreated);
    });
}

function displayParentStats(children, tasks) {
    const statsHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">👨‍👩‍👧‍👦 Children</div>
                <div class="stat-value">${children}</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <div class="stat-label">📋 Tasks Created</div>
                <div class="stat-value">${tasks}</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <div class="stat-label">💰 Total Paid</div>
                <div class="stat-value">Rp ${(children * 100000).toLocaleString('id-ID')}</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <div class="stat-label">📊 Active Stores</div>
                <div class="stat-value">${children}</div>
            </div>
        </div>
    `;
    document.getElementById('stats-section').innerHTML = statsHTML;
}

function loadParentFeatures() {
    const features = [
        {
            icon: '📋',
            name: 'Task Management',
            desc: 'Create and manage child tasks',
            link: 'task-management.html',
            badge: '✅'
        },
        {
            icon: '💰',
            name: 'Payment System',
            desc: 'Track payments & rewards',
            link: 'payment-system.html',
            badge: '💸'
        },
        {
            icon: '💬',
            name: 'Chat',
            desc: 'Communicate with children',
            link: 'chat.html',
            badge: '💬'
        },
        {
            icon: '🍽️',
            name: 'Mama Food Store',
            desc: 'Manage food menu',
            link: 'mama-store.html',
            badge: '🍽️'
        },
        {
            icon: '📅',
            name: 'Schedule Control',
            desc: 'Manage child schedules',
            link: 'schedule-management.html',
            badge: '📅'
        },
        {
            icon: '🎁',
            name: 'Special Requests',
            desc: 'Review child requests',
            link: 'special-request.html',
            badge: '🎁'
        },
        {
            icon: '💳',
            name: 'Tax System',
            desc: 'Monitor tax payments',
            link: 'tax-system.html',
            badge: '💳'
        }
    ];

    let featuresHTML = '';
    features.forEach(feature => {
        featuresHTML += `
            <div class="feature-card">
                <div class="feature-icon">${feature.icon}</div>
                <div class="feature-name">${feature.name}</div>
                <div class="feature-desc">${feature.desc}</div>
                <button class="feature-btn" onclick="navigateTo('${feature.link}')">${feature.badge} Open</button>
            </div>
        `;
    });

    document.getElementById('features-section').innerHTML = featuresHTML;
}

// ========== CHILD DASHBOARD ==========

function loadChildDashboard() {
    loadChildStats();
    loadChildNotifications();
    loadChildFeatures();
}

function loadChildStats() {
    let taskEarnings = 0;
    let businessEarnings = 0;
    let balance = 0;

    // Get task earnings
    const tasksRef = firebase.database().ref('tasks');
    tasksRef.orderByChild('childId').equalTo(currentUser).once('value').then((snapshot) => {
        snapshot.forEach((task) => {
            const taskData = task.val();
            if (taskData.status === 'completed') {
                taskEarnings += taskData.reward;
            }
        });

        // Get business earnings
        const salesRef = firebase.database().ref('child_business_transactions');
        salesRef.orderByChild('sellerId').equalTo(currentUser).once('value').then((snapshot) => {
            snapshot.forEach((sale) => {
                businessEarnings += sale.val().amount;
            });

            balance = taskEarnings + businessEarnings;
            displayChildStats(taskEarnings, businessEarnings, balance);
        });
    });
}

function displayChildStats(taskEarnings, businessEarnings, balance) {
    const statsHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">💼 Task Earnings</div>
                <div class="stat-value">Rp ${taskEarnings.toLocaleString('id-ID')}</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <div class="stat-label">🏪 Business Earnings</div>
                <div class="stat-value">Rp ${businessEarnings.toLocaleString('id-ID')}</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <div class="stat-label">💰 Total Balance</div>
                <div class="stat-value">Rp ${balance.toLocaleString('id-ID')}</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <div class="stat-label">🏪 My Store Status</div>
                <div class="stat-value">Active</div>
            </div>
        </div>
    `;
    document.getElementById('stats-section').innerHTML = statsHTML;
}

function loadChildNotifications() {
    const notificationsHTML = `
        <h3 style="margin-bottom: 15px;">🔔 Notifications</h3>
        <div class="notification-item">
            <div class="notification-icon">📋</div>
            <div class="notification-content">
                <div class="notification-title">New Task Available</div>
                <div class="notification-desc">Your parent added 2 new tasks for you</div>
            </div>
        </div>
        <div class="notification-item" style="border-left-color: #28a745;">
            <div class="notification-icon">✅</div>
            <div class="notification-content">
                <div class="notification-title">Task Approved</div>
                <div class="notification-desc">You earned Rp 50,000 from completed task</div>
            </div>
        </div>
        <div class="notification-item" style="border-left-color: #ffc107;">
            <div class="notification-icon">⏳</div>
            <div class="notification-content">
                <div class="notification-title">Pending Approval</div>
                <div class="notification-desc">Your request is waiting for parent approval</div>
            </div>
        </div>
    `;
    document.getElementById('notifications-section').innerHTML = notificationsHTML;
}

function loadChildFeatures() {
    const features = [
        {
            icon: '📋',
            name: 'My Tasks',
            desc: 'View and complete tasks',
            link: 'task-management.html',
            badge: '👀'
        },
        {
            icon: '💰',
            name: 'My Balance',
            desc: 'Check your earnings',
            link: 'payment-system.html',
            badge: '💸'
        },
        {
            icon: '💬',
            name: 'Chat',
            desc: 'Message your family',
            link: 'chat.html',
            badge: '💬'
        },
        {
            icon: '🍽️',
            name: 'Food Store',
            desc: 'Order meals from mama',
            link: 'mama-store.html',
            badge: '🍽️'
        },
        {
            icon: '🏪',
            name: 'My Business',
            desc: 'Manage your store',
            link: 'child-business-store.html',
            badge: '🏢'
        },
        {
            icon: '📅',
            name: 'My Schedule',
            desc: 'Manage daily schedule',
            link: 'schedule-management.html',
            badge: '📅'
        },
        {
            icon: '🎁',
            name: 'Special Request',
            desc: 'Request something special',
            link: 'special-request.html',
            badge: '🎁'
        },
        {
            icon: '💳',
            name: 'Pay Tax',
            desc: 'Pay monthly tax',
            link: 'tax-system.html',
            badge: '💳'
        }
    ];

    let featuresHTML = '';
    features.forEach(feature => {
        featuresHTML += `
            <div class="feature-card">
                <div class="feature-icon">${feature.icon}</div>
                <div class="feature-name">${feature.name}</div>
                <div class="feature-desc">${feature.desc}</div>
                <button class="feature-btn" onclick="navigateTo('${feature.link}')">${feature.badge} Open</button>
            </div>
        `;
    });

    document.getElementById('features-section').innerHTML = featuresHTML;
}

function navigateTo(page) {
    window.location.href = page;
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}