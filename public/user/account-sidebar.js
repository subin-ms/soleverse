document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);

    const menuItems = document.querySelectorAll('.sidebar-item');

    // Remove active class from all first (just in case hardcoded ones exist)
    menuItems.forEach(item => {
        item.classList.remove('active');
        // Reset color if inline styles were used (though ideally we avoid them)
        item.style.color = '';
        item.style.fontWeight = '';
    });

    let activeLink = null;

    // Define mapping or check logic
    // We can check hrefs directly or use specific logic for sub-pages

    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (!href) return;

        // Exact match
        if (href === filename) {
            activeLink = item;
        }
    });

    // Handle Sub-pages / Flows mapping if exact match didn't find one, or override
    if (!activeLink) {
        if (filename.includes('order-details') || filename.includes('order-cancel') || filename.includes('order-review')) {
            // Map to "My Orders"
            activeLink = findLinkByHref('orders.html');
        } else if (filename.includes('return') && !filename.includes('returns.html')) {
            // return.html, return-success.html -> My Returns
            // BUT returns.html is the main page, handled by exact match above usually.
            // Wait, return.html is "Return Item", returns.html is "My Returns List".
            // User said: return.html -> My Returns.
            activeLink = findLinkByHref('returns.html');
        } else if (filename === 'profile.html') { // account.html is usually profile
            activeLink = findLinkByHref('account.html');
        }
    }

    // Explicit override for 'return.html' or 'return-success.html' if they didn't match 'returns.html' perfectly above
    if (filename === 'return.html' || filename === 'return-success.html') {
        activeLink = findLinkByHref('returns.html');
    }

    // Explicit override for cancellations sub-pages if any (currently order-cancel flows map to orders, but if we had specific cancellation details)
    // The user said: cancellations.html -> Cancellations.

    if (activeLink) {
        activeLink.classList.add('active');
    }

    // LOGOUT LOGIC
    const logoutBtn = Array.from(document.querySelectorAll('.sidebar-item'))
        .find(el => el.textContent.trim() === 'LOG OUT');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Clear auth data
            localStorage.removeItem('token');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser'); // Just in case

            // Redirect
            window.location.href = 'login.html';
        });
    }
});

function findLinkByHref(hrefVal) {
    const links = document.querySelectorAll('.sidebar-item');
    for (let link of links) {
        if (link.getAttribute('href') === hrefVal) {
            return link;
        }
    }
    return null;
}
