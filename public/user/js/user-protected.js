/**
 * user-protected.js
 * Strict role-based route protection for user-facing pages.
 * Blocks Admins from accessing User pages and handles token expiration.
 */

(function () {
    const token = localStorage.getItem("token");
    const currentPath = window.location.pathname;
    
    console.log("[Guard] Checking access for path:", currentPath);

    // 1. Define Public Pages using Regex for better matching
    const publicPatterns = [
        /index\.html$/i,
        /shop\.html$/i,
        /product\.html$/i,
        /about\.html$/i,
        /contact\.html$/i,
        /\/user\/?$/i,  // Matches /user or /user/
        /^[\/]?$/       // Matches / or empty
    ];

    const isPublicPage = publicPatterns.some(pattern => pattern.test(currentPath));
    console.log("[Guard] Is Public Page:", isPublicPage);

    // 2. Token sanity check
    const hasValidTokenFormat = token && token.split(".").length === 3;
    console.log("[Guard] Has Token:", !!token, "| Valid Format:", hasValidTokenFormat);

    // 3. Handle Unauthorized Guests
    if (!token || token === "null" || token === "undefined") {
        if (isPublicPage) {
            console.log("[Guard] Guest allowed on public page.");
            return;
        } else {
            console.warn("[Guard] Unauthenticated access to protected page. Redirecting...");
            window.location.href = "/user/login.html";
            return;
        }
    }

    // 4. Handle Authenticated Users/Admins
    try {
        if (!hasValidTokenFormat) {
            throw new Error("Invalid token format");
        }

        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));

        console.log("[Guard] User Role:", payload.role);

        // A. Token Expiration
        if (payload.exp * 1000 < Date.now()) {
            console.error("[Guard] Session expired.");
            clearSessionAndRedirect();
            return;
        }

        // B. Strict Role Check: Block Admin from PROTECTED user pages
        // However, allow them to view PUBLIC pages as guests/observers.
        if (payload.role === "admin" && !isPublicPage) {
            console.error("[Guard] Admin blocked from protected user pages.");
            clearSessionAndRedirect();
            return;
        }

    } catch (err) {
        console.error("[Guard] Token validation error:", err.message);
        clearSessionAndRedirect();
    }

    function clearSessionAndRedirect() {
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("currentUser");
        window.location.href = "/user/login.html";
    }
})();
