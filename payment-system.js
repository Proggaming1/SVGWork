// Payment System Logic

let currentUser = null;
let userRole = null;

window.addEventListener('load', () => {
    userRole = localStorage.getItem('userRole');
    currentUser = localStorage.getItem('userId');

    if (!userRole || !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    if (userRole === 'child') {
        document.getElementById('child-wallet').style.display = 'block';
        loadChildPayment();
    } else {
        document.getElementById('parent-wallet').style.display = 'block';
        loadParentPayment();
    }
});

// Load child payment
function loadChildPayment() {
    // Get completed tasks
    const tasksRef = firebase.database().ref('tasks');
    let totalIncome = 0;
    let totalExpenses = 0;

    tasksRef.orderByChild('childId').equalTo(currentUser).once('value').then((snapshot) => {
        snapshot.forEach((taskSnapshot) => {
            const task = taskSnapshot.val();
            if (task.status === 'completed') {
                totalIncome += task.reward;
            }
        });
        updateChildBalance();
    });
}

function updateChildBalance() {
    const balanceElement = document.getElementById('child-balance');
    const balance = parseInt(localStorage.getItem('childBalance')) || 0;
    balanceElement.textContent = 'Rp ' + balance.toLocaleString('id-ID');
}

function loadParentPayment() {
    // Load all children and their balances
    const childrenStatus = document.getElementById('children-status');
    childrenStatus.innerHTML = 'Loading children data...';
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}