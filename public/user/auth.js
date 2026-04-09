document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5000/api";

  async function checkAuth() {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        credentials: "include"
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Protect wishlist
  if (window.location.href.includes("wishlist.html")) {
    checkAuth().then(isLoggedIn => {
      if (!isLoggedIn) {
        localStorage.clear();
        window.location.replace("login.html");
      }
    });
  }

  // Navbar logic
  checkAuth().then(isLoggedIn => {
    localStorage.setItem('isLoggedIn', isLoggedIn); // Sync state for header.js

    if (!isLoggedIn) return;

    const signUpLink = document.querySelector('.nav-menu a[href="signup.html"]');
    if (signUpLink) signUpLink.style.display = "none";
  });

  // Login Page Logic: Clear session to ensure fresh login
  if (window.location.pathname.endsWith('login.html')) {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    console.log('Session cleared for new login.');
  }

  // Login Handler Moved to login.html per user request

  //   // Signup
  //   const signupForm = document.getElementById("signupForm");
  //   if (signupForm) {
  //     signupForm.addEventListener("submit", async (e) => {
  //       e.preventDefault();

  //       const name = signupForm.signupName.value;
  //       const email = signupForm.signupEmail.value;
  //       const password = signupForm.signupPassword.value;

  //       const res = await fetch(`${API_BASE}/auth/register`, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         credentials: "include",
  //         body: JSON.stringify({ name, email, password })
  //       });

  //       const data = await res.json();
  //       if (!res.ok) return alert(data.message);

  //       alert("Signup successful. Please login.");
  //       window.location.href = "login.html";
  //     });
  //   }
});
