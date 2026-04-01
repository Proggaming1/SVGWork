// Parent Login
document.getElementById('parent-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('parent-email').value;
    const password = document.getElementById('parent-password').value;
    
    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        localStorage.setItem('userRole', 'parent');
        localStorage.setItem('userId', user.uid);
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Child Login
document.getElementById('child-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('child-email').value;
    const password = document.getElementById('child-password').value;
    
    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        localStorage.setItem('userRole', 'child');
        localStorage.setItem('userId', user.uid);
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Error: ' + error.message);
    }
});