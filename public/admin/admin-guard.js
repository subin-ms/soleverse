const user = JSON.parse(localStorage.getItem("currentUser"));

if (!user || user.role !== "admin") {
  localStorage.clear();
  window.location.replace("/user/login.html");
}
