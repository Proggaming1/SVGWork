// Demo Accounts Database
const demoAccounts = {
    parent: [
        { email: 'papa@svgwork.com', password: 'Papa12345!', name: 'Papa' },
        { email: 'mama@svgwork.com', password: 'Mama12345!', name: 'Mama' }
    ],
    child: [
        { email: 'anak1@svgwork.com', password: 'Anak12345!', name: 'Anak 1' },
        { email: 'anak2@svgwork.com', password: 'Anak22345!', name: 'Anak 2' }
    ]
};

// Parent Login Handler
document.getElementById('parent-login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('parent-email').value.trim();
    const password = document.getElementById('parent-password').value;
    const errorDiv = document.getElementById('parent-error');
    const btn = this.querySelector('button[type="submit"]');
    
    // Validate demo account
    const account = demoAccounts.parent.find(acc => acc.email === email && acc.password === password);
    
    if (account) {
        // Success
        localStorage.setItem('userRole', 'parent');
        localStorage.setItem('userId', email);
        localStorage.setItem('userName', account.name);
        errorDiv.style.display = 'none';
        btn.textContent = '✅ Login Berhasil...';
        btn.disabled = true;
        setTimeout(() => {
            window.location.href = 'main-dashboard.html';
        }, 1000);
    } else {
        // Failed
        errorDiv.textContent = '❌ Email atau password salah!';
        errorDiv.style.display = 'block';
        document.getElementById('parent-password').value = '';
    }
});

// Child Login Handler
if (document.getElementById('child-login-form')) {
    document.getElementById('child-login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('child-email').value.trim();
        const password = document.getElementById('child-password').value;
        const errorDiv = document.getElementById('child-error');
        const btn = this.querySelector('button[type="submit"]');
        
        // Validate demo account
        const account = demoAccounts.child.find(acc => acc.email === email && acc.password === password);
        
        if (account) {
            // Success
            localStorage.setItem('userRole', 'child');
            localStorage.setItem('userId', email);
            localStorage.setItem('userName', account.name);
            errorDiv.style.display = 'none';
            btn.textContent = '✅ Login Berhasil...';
            btn.disabled = true;
            setTimeout(() => {
                window.location.href = 'main-dashboard.html';
            }, 1000);
        } else {
            // Failed
            errorDiv.textContent = '❌ Email atau password salah!';
            errorDiv.style.display = 'block';
            document.getElementById('child-password').value = '';
        }
    });
}