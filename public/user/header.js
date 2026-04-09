document.addEventListener("DOMContentLoaded", async () => {
    // 1. Fetch & Inject Shared Header
    const headerContainer = document.getElementById("global-header");
    if (headerContainer) {
        try {
            const headerHTML = await fetch("header.html").then(res => {
                if (!res.ok) throw new Error("Header not found");
                return res.text();
            });
            headerContainer.innerHTML = headerHTML;
        } catch (error) {
            console.error("Failed to load global header:", error);
            // Fallback safety
            headerContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; background: #000; color: #fff;">
                    <h2><a href="index.html" style="color:#fff; text-decoration:none;">Soleverse</a></h2>
                </div>`;
        }
    }

  /* 
   * ---------------------------------------------------------
   * ACTIVE NAV LINK
   * ---------------------------------------------------------
   */
  const currentPath = window.location.pathname;
  let filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);
  if (!filename) filename = 'index.html';

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === filename) {
      link.classList.add('active');
    }

    // Hide Signup/Login links if already logged in
    if (isLoggedIn && (href === 'signup.html' || href === 'login.html')) {
      link.style.display = 'none';
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
   * GLOBAL SEARCH LOGIC (Desktop & Mobile)
   * ---------------------------------------------------------
   */
  
  // 1. Desktop Search & Suggestions
  const desktopSearchInput = document.querySelector('.search-input');
  const desktopSearchBtn = document.querySelector('.search-icon-btn');
  const searchBoxContainer = document.querySelector('.search-box-container');

  // 1.1 Inject Suggestions Dropdown (Desktop)
  if (searchBoxContainer && !document.getElementById('searchSuggestions')) {
    searchBoxContainer.insertAdjacentHTML('beforeend', `
       <div id="searchSuggestions" class="search-suggestions-dropdown"></div>
    `);
  }
  let suggestionsDropdown = document.getElementById('searchSuggestions');

  function handleSearch(query) {
    if (query && query.trim().length > 0) {
      window.location.href = `shop.html?search=${encodeURIComponent(query.trim())}`;
    }
  }

  // Debounce helper
  function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }

  async function fetchSuggestions(query) {
    if (!query || query.trim().length < 1) {
      suggestionsDropdown.classList.remove('active');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/products/suggestions?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      renderSuggestions(data, query);
    } catch (err) {
      console.error("Suggestions error", err);
    }
  }

  function renderSuggestions(data, query) {
    const { categories, products } = data;
    
    if (categories.length === 0 && products.length === 0) {
      suggestionsDropdown.classList.remove('active');
      return;
    }

    let html = '';

    // Brands Section
    if (categories.length > 0) {
      html += `
        <div class="suggestion-section">
          <span class="suggestion-title">In Brands</span>
          <div class="brand-chips">
            ${categories.map(c => `
              <a href="shop.html?category=${c._id}" class="brand-chip">${c.name}</a>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Products Section
    if (products.length > 0) {
      html += `
        <div class="suggestion-section">
          <span class="suggestion-title">Top Products</span>
          ${products.map(p => {
            const hasDiscount = p.discountValue > 0;
            const finalPrice = hasDiscount 
                ? (p.discountType === 'percent' ? p.price - (p.price * p.discountValue / 100) : p.price - p.discountValue)
                : p.price;
            const imgSrc = p.image ? `http://localhost:5000${p.image}` : '../img/logo.png';
            
            return `
              <a href="product.html?id=${p._id}" class="product-suggestion-item">
                <img src="${imgSrc}" alt="${p.name}" class="suggestion-thumb" onerror="this.src='../img/logo.png'">
                <div class="suggestion-info">
                  <span class="suggestion-name">${p.name}</span>
                  <span class="suggestion-price">₹${finalPrice.toLocaleString()}</span>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      `;
    }

    // Bottom Action
    html += `
      <a href="shop.html?search=${encodeURIComponent(query)}" class="see-all-results">
        See all results for "${query}" <i class="fas fa-arrow-right"></i>
      </a>
    `;

    suggestionsDropdown.innerHTML = html;
    suggestionsDropdown.classList.add('active');
  }

  const debouncedFetch = debounce((q) => fetchSuggestions(q));

  if (desktopSearchInput) {
    desktopSearchInput.addEventListener('input', (e) => {
      // Ensure suggestions is in desktop bar
      if (!searchBoxContainer.querySelector('#searchSuggestions')) {
         searchBoxContainer.appendChild(suggestionsDropdown);
      }
      debouncedFetch(e.target.value);
    });

    desktopSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch(desktopSearchInput.value);
      }
    });

    // Close on blur/outside click
    document.addEventListener('click', (e) => {
      if (!searchBoxContainer.contains(e.target) && !searchBar.contains(e.target)) {
        suggestionsDropdown.classList.remove('active');
      }
    });
  }

  if (desktopSearchBtn) {
    desktopSearchBtn.addEventListener('click', () => {
      handleSearch(desktopSearchInput.value);
    });
  }

  // 2. Mobile Search Overlay Logic
  if (!document.getElementById('mobileSearchBar')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="mobileSearchBar" class="mobile-search-bar">
        <form class="mobile-search-form">
          <input type="text" placeholder="Search products..." class="mobile-search-input">
          <div class="mobile-search-icons">
             <button type="submit" class="mobile-search-submit"><i class="fas fa-search"></i></button>
             <button type="button" class="mobile-search-close"><i class="fas fa-times"></i></button>
          </div>
        </form>
      </div>
    `);
  }

  const mobileSearchForm = document.querySelector('.mobile-search-form');
  const mobileSearchInput = document.querySelector('.mobile-search-input');
  const searchTrigger = document.querySelector('.mobile-search-icon');
  const searchBar = document.getElementById('mobileSearchBar');
  const searchClose = document.querySelector('.mobile-search-close');

  if (mobileSearchForm) {
    mobileSearchForm.oninput = (e) => {
      // For mobile, the dropdown should probably be a child of mobile-search-bar or body
      // Let's ensure searchSuggestions is present in mobileBar if needed
      if (!searchBar.querySelector('#searchSuggestions')) {
         searchBar.appendChild(suggestionsDropdown);
      }
      debouncedFetch(e.target.value);
    };

    mobileSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSearch(mobileSearchInput.value);
    });
  }

  if (searchTrigger && searchBar) {
    searchTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      // Move dropdown to mobile bar
      if (!searchBar.querySelector('#searchSuggestions')) {
         searchBar.appendChild(suggestionsDropdown);
      }
      searchBar.classList.add('active');
      mobileSearchInput?.focus();
    });
  }

  if (searchClose && searchBar) {
    searchClose.addEventListener('click', () => {
      searchBar.classList.remove('active');
      suggestionsDropdown.classList.remove('active');
    });
  }

});
