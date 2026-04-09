document.addEventListener('DOMContentLoaded', () => {
    // 1. INJECT DYNAMIC CSS FOR MOBILE DRAWER & ACTIVE STATE
    const style = document.createElement('style');
    style.innerHTML = `
        /* Active State Style */
        .sidebar-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 4px;
            transition: all 0.2s ease-in-out;
            color: #757575 !important;
        }
        .sidebar-item i {
            font-size: 18px;
            width: 24px;
            text-align: center;
        }
        .sidebar-item:hover {
            background-color: #f5f5f5;
            color: #000 !important;
        }
        .sidebar-item.active {
            background-color: #e8f5e9;
            color: #4caf50 !important;
            font-weight: 700 !important;
            border-left: 3px solid #4caf50;
        }

        /* Mobile Drawer Styles */
        @media (max-width: 767px) {
            .account-sidebar {
                position: fixed;
                left: 0;
                top: 0;
                height: 100vh;
                width: 280px;
                background: #fff;
                z-index: 1001;
                transform: translateX(-100%);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 2px 0 15px rgba(0,0,0,0.1);
                padding: 30px 20px;
                overflow-y: auto;
            }
            .account-sidebar.open {
                transform: translateX(0);
            }
            .sidebar-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            .sidebar-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            /* The mobile toggle button */
            .account-menu-toggle {
                display: flex;
                align-items: center;
                gap: 10px;
                background: #fff;
                border: 1px solid #e5e5e5;
                padding: 14px 20px;
                font-size: 15px;
                font-weight: 700;
                color: #000;
                cursor: pointer;
                width: 100%;
                margin-bottom: 24px;
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.02);
                transition: background 0.2s;
            }
            .account-menu-toggle i {
                font-size: 18px;
            }
            .account-menu-toggle:active {
                background: #f9f9f9;
            }

            /* Main Content restructuring for mobile */
            .account-wrapper {
                display: flex !important;
                flex-direction: column;
            }
            
            /* Hide the sidebar titles on mobile if desired, or let them flow */
            .sidebar-title {
                margin-top: 10px;
            }
        }
    `;
    document.head.appendChild(style);

    // 2. ADD ICONS TO MENU ITEMS
    const iconMapping = {
        'My Profile': 'far fa-user',
        'Address Book': 'fas fa-map-marker-alt',
        'My Payment Options': 'far fa-credit-card',
        'My Orders': 'fas fa-box',
        'My Returns': 'fas fa-undo',
        'Cancellations': 'fas fa-times-circle',
        'LOG OUT': 'fas fa-sign-out-alt'
    };

    const menuItems = document.querySelectorAll('.sidebar-item');
    menuItems.forEach(item => {
        const text = item.textContent.trim();
        // Remove old inline styles and active class
        item.classList.remove('active');
        item.style.color = '';
        item.style.fontWeight = '';
        
        // Inject icon if matched and it doesn't already have one
        if (iconMapping[text] && !item.querySelector('i')) {
            item.innerHTML = `<i class="${iconMapping[text]}"></i> ${text}`;
        }
    });

    // 3. DETERMINE EXACT ACTIVE LINK
    const currentPath = window.location.pathname;
    const filename = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
    let activeLink = null;

    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (!href) return;
        if (href === filename) {
            activeLink = item;
        }
    });

    if (!activeLink) {
        if (filename.includes('order-details') || filename.includes('order-cancel') || filename.includes('order-review')) {
            activeLink = findLinkByHref('orders.html');
        } else if (filename.includes('return') && !filename.includes('returns.html')) {
            activeLink = findLinkByHref('returns.html');
        } else if (filename === 'profile.html' || filename === 'account.html') {
            activeLink = findLinkByHref('account.html');
        }
    }

    if (filename === 'return.html' || filename === 'return-success.html') {
        activeLink = findLinkByHref('returns.html');
    }

    if (activeLink) {
        activeLink.classList.add('active');
    }

    function findLinkByHref(hrefVal) {
        for (let link of menuItems) {
            if (link.getAttribute('href') === hrefVal) {
                return link;
            }
        }
        return null;
    }

    // 4. MOBILE DRAWER FUNCTIONALITY
    if (window.innerWidth <= 767) {
        const wrapper = document.querySelector('.account-wrapper');
        const sidebar = document.querySelector('.account-sidebar');

        if (wrapper && sidebar) {
            // Create toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'account-menu-toggle';
            toggleBtn.innerHTML = '<i class="fas fa-bars"></i> ACCOUNT MENU';
            
            // Insert toggle before sidebar in wrapper
            wrapper.prepend(toggleBtn);

            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);

            // Event Listeners
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.add('open');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden'; // prevent background scrolling
            });

            const closeSidebar = () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            };

            overlay.addEventListener('click', closeSidebar);

            // Close when clicking an item
            menuItems.forEach(item => {
                item.addEventListener('click', closeSidebar);
            });
        }
    }

    // 5. LOGOUT LOGIC
    const logoutBtn = Array.from(menuItems).find(el => el.textContent.trim().includes('LOG OUT'));
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }
});
