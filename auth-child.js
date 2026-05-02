// Child Authentication Logic
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-message');
    const btnSubmit = document.querySelector('button[type="submit"]');
    
    if (!email || !password) {
        errorMsg.textContent = '⚠️ Please fill all fields';
        errorMsg.style.display = 'block';
        return;
    }
    
    btnSubmit.disabled = true;
    btnSubmit.textContent = '⏳ Logging in...';
    
    try {
        // Child demo accounts
        const childAccounts = {
            'anak1@svgwork.com': { name: 'Anak 1', password: 'Anak12345!' },
            'anak2@svgwork.com': { name: 'Anak 2', password: 'Anak22345!' }
        };
        
        if (childAccounts[email] && childAccounts[email].password === password) {
            // Login successful
            localStorage.setItem('userId', email);
            localStorage.setItem('userRole', 'child');
            localStorage.setItem('userName', childAccounts[email].name);
            
            errorMsg.style.display = 'none';
            setTimeout(() => {
                window.location.href = 'main-dashboard.html';
            }, 500);
        } else {
            // Invalid credentials
            errorMsg.textContent = '❌ Invalid email or password';
            errorMsg.style.display = 'block';
            btnSubmit.disabled = false;
            btnSubmit.textContent = '🔓 Login as Child';
        }
    } catch (error) {
        errorMsg.textContent = '❌ Login failed: ' + error.message;
        errorMsg.style.display = 'block';
        btnSubmit.disabled = false;
        btnSubmit.textContent = '🔓 Login as Child';
    }
});