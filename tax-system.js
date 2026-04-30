// Tax System Logic

let currentUser = null;
let userRole = null;
let childrenList = {};
let familyId = null;
const TAX_RATE = 0.10; // 10%

window.addEventListener('load', () => {
    userRole = localStorage.getItem('userRole');
    currentUser = localStorage.getItem('userId');

    if (!userRole || !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    if (userRole === 'child') {
        document.getElementById('child-panel').style.display = 'block';
        loadMyTaxInfo();
    } else {
        document.getElementById('parent-panel').style.display = 'block';
        loadParentData();
    }
});

// ========== CHILD FUNCTIONS ==========

function getCurrentMonth() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
}

function loadMyTaxInfo() {
    const currentMonth = getCurrentMonth();
    
    // Calculate income from tasks
    let taskIncome = 0;
    const tasksRef = firebase.database().ref('tasks');
    tasksRef.orderByChild('childId').equalTo(currentUser).once('value').then((snapshot) => {
        snapshot.forEach((taskSnapshot) => {
            const task = taskSnapshot.val();
            if (task.status === 'completed') {
                const completedDate = new Date(task.completedAt);
                const completedMonth = completedDate.getFullYear() + '-' + String(completedDate.getMonth() + 1).padStart(2, '0');
                if (completedMonth === currentMonth) {
                    taskIncome += task.reward;
                }
            }
        });
        updateTaxDisplay(taskIncome);
    });
}

function updateTaxDisplay(taskIncome) {
    // Calculate business income
    let businessIncome = 0;
    const salesRef = firebase.database().ref('child_business_transactions');
    const currentMonth = getCurrentMonth();

    salesRef.orderByChild('sellerId').equalTo(currentUser).once('value').then((snapshot) => {
        snapshot.forEach((saleSnapshot) => {
            const sale = saleSnapshot.val();
            const saleDate = new Date(sale.timestamp);
            const saleMonth = saleDate.getFullYear() + '-' + String(saleDate.getMonth() + 1).padStart(2, '0');
            if (saleMonth === currentMonth) {
                businessIncome += sale.amount;
            }
        });

        const totalIncome = taskIncome + businessIncome;
        const taxAmount = Math.floor(totalIncome * TAX_RATE);

        // Update display
        document.getElementById('task-income').textContent = 'Rp ' + taskIncome.toLocaleString('id-ID');
        document.getElementById('business-income').textContent = 'Rp ' + businessIncome.toLocaleString('id-ID');
        document.getElementById('total-income').textContent = 'Rp ' + totalIncome.toLocaleString('id-ID');
        document.getElementById('tax-amount').textContent = 'Rp ' + taxAmount.toLocaleString('id-ID');

        // Check if already paid
        checkTaxStatus(currentMonth, taxAmount);
        loadPaymentHistory();
    });
}

function checkTaxStatus(month, taxAmount) {
    const taxRef = firebase.database().ref('tax_payments');
    taxRef.orderByChild('childId').equalTo(currentUser).once('value').then((snapshot) => {
        let isPaid = false;
        snapshot.forEach((paymentSnapshot) => {
            const payment = paymentSnapshot.val();
            if (payment.month === month && payment.status === 'paid') {
                isPaid = true;
            }
        });

        const statusEl = document.getElementById('current-month-status');
        const btnEl = document.getElementById('pay-tax-btn');

        if (isPaid) {
            statusEl.innerHTML = `<span class="status-badge status-paid">✅ Tax Paid for ${month}</span>`;
            btnEl.textContent = '✅ Tax Paid';
            btnEl.classList.add('paid');
            btnEl.disabled = true;
        } else {
            statusEl.innerHTML = `<span class="status-badge status-unpaid">⏳ Tax Pending for ${month}</span>`;
            btnEl.textContent = '💳 Pay Monthly Tax';
            btnEl.classList.remove('paid');
            btnEl.disabled = false;
        }
    });
}

function payMonthlyTax() {
    const currentMonth = getCurrentMonth();
    const taxAmount = parseInt(document.getElementById('tax-amount').textContent.replace(/\D/g, ''));

    if (taxAmount === 0) {
        alert('No tax to pay this month');
        return;
    }

    if (confirm(`Pay Rp ${taxAmount.toLocaleString('id-ID')} tax for ${currentMonth}?`)) {
        const paymentId = firebase.database().ref('tax_payments').push().key;
        const payment = {
            id: paymentId,
            childId: currentUser,
            month: currentMonth,
            taskIncome: parseInt(document.getElementById('task-income').textContent.replace(/\D/g, '')),
            businessIncome: parseInt(document.getElementById('business-income').textContent.replace(/\D/g, '')),
            taxAmount: taxAmount,
            status: 'paid',
            paidAt: new Date().toISOString()
        };

        firebase.database().ref('tax_payments/' + paymentId).set(payment).then(() => {
            alert('✅ Tax payment successful!');
            loadMyTaxInfo();
        }).catch(error => {
            alert('Error: ' + error.message);
        });
    }
}

function loadPaymentHistory() {
    const historyRef = firebase.database().ref('tax_payments');
    historyRef.orderByChild('childId').equalTo(currentUser).limitToLast(12).on('value', (snapshot) => {
        const historyEl = document.getElementById('payment-history');
        historyEl.innerHTML = '';

        const payments = [];
        snapshot.forEach((paymentSnapshot) => {
            payments.push(paymentSnapshot.val());
        });

        // Sort by month (newest first)
        payments.sort((a, b) => b.month.localeCompare(a.month));

        if (payments.length === 0) {
            historyEl.innerHTML = '<p style="text-align: center; color: #999;">No payment history</p>';
            return;
        }

        payments.forEach(payment => {
            const item = document.createElement('div');
            item.className = 'payment-item ' + payment.status;
            item.innerHTML = `
                <div class="payment-month">${payment.month}</div>
                <div class="payment-amount">Rp ${payment.taxAmount.toLocaleString('id-ID')} (10%)</div>
                <div class="payment-date">Paid: ${new Date(payment.paidAt).toLocaleDateString('id-ID')}</div>
            `;
            historyEl.appendChild(item);
        });
    });
}

// ========== PARENT FUNCTIONS ==========

function loadParentData() {
    const familyRef = firebase.database().ref('families');
    familyRef.orderByChild('parentId').equalTo(currentUser).once('value').then((snapshot) => {
        snapshot.forEach((familySnapshot) => {
            familyId = familySnapshot.key;
            const family = familySnapshot.val();
            childrenList = family.children || {};

            const select = document.getElementById('parent-child-select');
            Object.keys(childrenList).forEach(childId => {
                const option = document.createElement('option');
                option.value = childId;
                option.textContent = childrenList[childId].name;
                select.appendChild(option);
            });
        });
    });
}

function loadChildTaxInfo() {
    const childId = document.getElementById('parent-child-select').value;
    if (!childId) {
        document.getElementById('child-tax-info').innerHTML = '';
        document.getElementById('tax-report').innerHTML = '';
        return;
    }

    // Get child's tax information
    const taxRef = firebase.database().ref('tax_payments');
    taxRef.orderByChild('childId').equalTo(childId).on('value', (snapshot) => {
        let totalTaxPaid = 0;
        let totalIncome = 0;
        const payments = [];

        snapshot.forEach((paymentSnapshot) => {
            const payment = paymentSnapshot.val();
            payments.push(payment);
            totalTaxPaid += payment.taxAmount;
            totalIncome += payment.taskIncome + payment.businessIncome;
        });

        // Display summary
        const summaryHTML = `
            <div class="tax-summary">
                <div class="tax-summary-item">
                    <span>Total Income (All Time):</span>
                    <span>Rp ${totalIncome.toLocaleString('id-ID')}</span>
                </div>
                <div class="tax-summary-item">
                    <span>Total Tax Paid:</span>
                    <span>Rp ${totalTaxPaid.toLocaleString('id-ID')}</span>
                </div>
            </div>
        `;
        document.getElementById('child-tax-info').innerHTML = summaryHTML;

        // Display report table
        let reportHTML = '<table class="report-table"><thead><tr><th>Month</th><th>Task Income</th><th>Business Income</th><th>Tax (10%)</th><th>Status</th></tr></thead><tbody>';
        
        payments.sort((a, b) => b.month.localeCompare(a.month));
        payments.forEach(payment => {
            reportHTML += `
                <tr>
                    <td>${payment.month}</td>
                    <td>Rp ${payment.taskIncome.toLocaleString('id-ID')}</td>
                    <td>Rp ${payment.businessIncome.toLocaleString('id-ID')}</td>
                    <td><strong>Rp ${payment.taxAmount.toLocaleString('id-ID')}</strong></td>
                    <td><span class="status-badge status-paid">✅ Paid</span></td>
                </tr>
            `;
        });
        reportHTML += '</tbody></table>';
        document.getElementById('tax-report').innerHTML = reportHTML;
    });
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}