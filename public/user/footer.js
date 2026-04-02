document.addEventListener('DOMContentLoaded', () => {
    // Idempotency check to prevent duplicated footers if script is included multiple times
    if (document.getElementById('global-footer-container')) {
        return;
    }

    const footerHTML = `
    <footer class="premium-footer-wrapper">
        <div class="premium-footer">
            <div class="footer-main-content">
                <div class="footer-left">
                    <div class="footer-logo">Soleverse</div>
                    <div class="footer-grid-info">
                        <div class="footer-nav-col">
                            <h4>Info</h4>
                            <ul>
                                <li><a href="account.html">Account</a></li>
                                <li><a href="login.html">Login/register</a></li>
                                <li><a href="about.html">About us</a></li>
                                <li><a href="contact.html">Contacts</a></li>
                            </ul>
                        </div>
                        <div class="footer-nav-col">
                            <h4>Contact Us</h4>
                            <div class="contact-info">
                                <p>+91 81291 03739</p>
                                <p>soleverse6@gmail.com</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="footer-right">
                    <div class="footer-quote">
                        <h2>Broken crayons<br>still color</h2>
                        <p class="footer-address">Areekad, Calicut, India 673027</p>
                        <div class="social-icons">
                            <a href="https://www.instagram.com/solever.s.e?igsh=eTI0YmxxMG45N3Jn" target="_blank"><i class="fab fa-instagram"></i></a>
                        </div>
                    </div>
                </div>
            </div>
            <button class="scroll-top-btn" onclick="scrollToTop()">
                <i class="fas fa-arrow-up"></i>
            </button>
            <div class="footer-bottom">
                © 2026 — Copyright
            </div>
        </div>
    </footer>
    `;

    const placeholder = document.getElementById('footer-placeholder');
    
    // Always append directly to body to break out of any container constraints
    const footerDiv = document.createElement('div');
    footerDiv.id = 'global-footer-container';
    footerDiv.style.width = '100%';
    footerDiv.innerHTML = footerHTML;
    document.body.appendChild(footerDiv);

    // Remove the placeholder if it exists so it doesn't take up empty space
    if (placeholder) {
        placeholder.remove();
    }
});

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
