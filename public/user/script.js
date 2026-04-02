console.log("Converse Replica Loaded");

// Toggle Mobile Menu
const mobileBtn = document.querySelector('.mobile-menu-btn');
const nav = document.querySelector('.main-nav');

if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
        nav.classList.toggle('active');
        // Toggle icon between bars and times
        const icon = mobileBtn.querySelector('i');
        if (nav.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        } else {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        }
    });
}
