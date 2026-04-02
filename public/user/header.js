document.addEventListener('DOMContentLoaded', function () {

  /* 
   * ---------------------------------------------------------
   * ACTIVE NAV LINK
   * ---------------------------------------------------------
   */
  const currentPath = window.location.pathname;
  let filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);
  if (!filename) filename = 'index.html';

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === filename) {
      link.classList.add('active');
    }
  });

  /* 
   * ---------------------------------------------------------
   * MOBILE MENU
   * ---------------------------------------------------------
   */
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      document.body.style.overflow =
        navMenu.classList.contains('active') ? 'hidden' : '';

      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
      }
    });
  }

  /* 
   * ---------------------------------------------------------
   * ACCOUNT DROPDOWN (ONLY AFTER LOGIN) ✅ FIXED
   * ---------------------------------------------------------
   */
  const userContainer = document.querySelector('.user-dropdown-container');

  function renderAccountUI() {
    if (!userContainer) return;

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    // ❌ NOT LOGGED IN → show login icon only
    if (!isLoggedIn) {
      userContainer.innerHTML = `
        <a href="login.html" class="nav-icon-link">
          <i class="far fa-user"></i>
        </a>
      `;
      return;
    }

    // ✅ LOGGED IN → show dropdown
    userContainer.innerHTML = `
      <button id="accountBtn" class="user-icon-btn" type="button">
        <i class="far fa-user"></i>
      </button>

      <div class="dropdown-menu" id="accountDropdown">
        <a href="account.html"><i class="far fa-user"></i> Manage My Account</a>
        <a href="orders.html"><i class="fas fa-box-open"></i> My Order</a>
        <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</a>
      </div>
    `;

    const accountBtn = document.getElementById('accountBtn');
    const dropdown = document.getElementById('accountDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    // Toggle dropdown
    accountBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    // Close on outside click
    document.addEventListener('click', () => {
      dropdown.classList.remove('active');
    });

    // Logout
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
      } catch (err) {
        console.error("Logout error", err);
      }

      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('token'); // Clear token as well
      window.location.href = "login.html";
    });
  }

  // INIT ACCOUNT UI
  renderAccountUI();

  /* 
   * ---------------------------------------------------------
   * DYNAMIC WELCOME NAME
   * ---------------------------------------------------------
   */
  async function fetchWelcomeName() {
    const welcomeElem = document.getElementById('welcome-name');
    if (!welcomeElem) return;

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('token');

    if (isLoggedIn && token) {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.name) {
            welcomeElem.innerText = data.user.name;

            // NEW: If they are on any page and we find out they are admin,
            // make sure clicking the user icon/links points to admin side.
            if (data.user.role && data.user.role.toLowerCase() === 'admin_disabled') {
              const accountLinks = document.querySelectorAll('a[href="account.html"]');
              accountLinks.forEach(link => {
                  link.href = '../admin/dashboard.html';
              });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching welcome name", err);
      }
    }
  }

  fetchWelcomeName();

  /* 
   * ---------------------------------------------------------
   * MOBILE SEARCH
   * ---------------------------------------------------------
   */
  if (!document.getElementById('mobileSearchBar')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="mobileSearchBar" class="mobile-search-bar">
        <form class="mobile-search-form">
          <input type="text" placeholder="Search products..." class="mobile-search-input">
          <button type="submit"><i class="fas fa-search"></i></button>
          <button type="button" class="mobile-search-close"><i class="fas fa-times"></i></button>
        </form>
      </div>
    `);
  }

  const searchTrigger = document.querySelector('.mobile-search-icon');
  const searchBar = document.getElementById('mobileSearchBar');
  const searchClose = document.querySelector('.mobile-search-close');

  if (searchTrigger && searchBar) {
    searchTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      searchBar.classList.add('active');
      searchBar.querySelector('input')?.focus();
    });
  }

  if (searchClose && searchBar) {
    searchClose.addEventListener('click', () => {
      searchBar.classList.remove('active');
    });
  }

});
