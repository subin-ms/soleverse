/**
 * Global Admin Sidebar Logic
 * Handles active state, mobile toggle, and logout
 */

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
});

function initSidebar() {
    const currentPath = window.location.pathname.split('/').pop();

    // Mapping of filename to menu text (or ID if we added IDs)
    // We can just rely on matching hrefs

    const navItems = document.querySelectorAll('.sidebar .nav-item');

    navItems.forEach(item => {
        // Remove active class initially (in case hardcoded)
        item.classList.remove('active');

        // Check if this item's href matches current page
        const href = item.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || item.getAttribute('href');

        // Simple logic: if href contains current filename
        if (href && (href === currentPath || href.endsWith('/' + currentPath))) {
            item.classList.add('active');
        }

        // Special case for root/dashboard
        if (!currentPath || currentPath === '' || currentPath === 'index.html') {
            if (href && href.includes('dashboard.html')) {
                item.classList.add('active');
            }
        }

        // Handle click if not using onclick in HTML (we will migrate to href)
        item.addEventListener('click', (e) => {
            // If it has an onclick with location.href, let it run.
            // If we change to <a> tags, this is needed.
            // For now, existing code uses onclick="window.location.href..." on div
            // We will respect that or change it.
        });
    });

    // Mobile Toggle Logic
    // We try to find hamburger by ID first (admin-role style), then class (legacy)
    const hamburger = document.getElementById('hamburger-btn') || document.querySelector('.hamburger-menu');
    const sidebar = document.getElementById('sidebar');

    // Create overlay if not exists
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            overlay.classList.toggle('active');

            // If we use 'open' class in some files, toggle that too for compatibility
            sidebar.classList.toggle('open');
        });
    }

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });

    // Logout Logic
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        // Remove individual onclick if it exists (to prevent conflicts)
        logoutBtn.removeAttribute('onclick');
        
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Clear all auth data
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isLoggedIn');
            // Support legacy keys if any
            localStorage.removeItem('adminToken');
            
            console.log('Admin Sidebar: Auth data cleared. Logging out...');
            window.location.href = '../user/login.html';
        });
    }
}
