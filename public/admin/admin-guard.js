(function () {
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');

    if (!token || !currentUser) {
        // No auth data found
        console.log('Admin Guard: No token or user found. Redirecting to login.');
        window.location.href = '../user/login.html';
        return;
    }

    try {
        const user = JSON.parse(currentUser);
        const role = user.role ? user.role.toLowerCase() : '';

        if (role !== 'admin') {
            // User is logged in but not an admin
            console.log('Admin Guard: User is not admin. Redirecting to login.');
            alert(`Access Denied! Your role is: "${user.role}". Expected: "admin".`);
            window.location.href = '../user/login.html';
        } else {
            console.log('Admin Guard: Access granted.');
        }
    } catch (e) {
        // Corrupt data
        console.error('Admin Guard: Error parsing user data.', e);
        localStorage.clear();
        window.location.href = '../user/login.html';
    }
})();
