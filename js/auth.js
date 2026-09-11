/* =====================================================
   CENTRAL AUTHENTICATION & API CONFIGURATION
===================================================== */

const API_BASE_URL = "https://rent4u-backend.onrender.com";

function getToken() {
    return localStorage.getItem("token");
}

function getUser() {
    try {
        const user = localStorage.getItem("loggedIn");
        return user ? JSON.parse(user) : null;
    } catch (e) {
        return null;
    }
}

function setAuth(token, user) {
    if (token) {
        localStorage.setItem("token", token);
    }
    if (user) {
        localStorage.setItem("loggedIn", JSON.stringify(user));
    }
}

function clearAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedIn");
}

function isAuthenticated() {
    return !!(getToken() && getUser());
}

function getAuthHeaders() {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json"
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

function requireAuth() {
    if (!isAuthenticated()) {
        clearAuth();
        window.location.href = "login.html";
        return false;
    }
    return true;
}

function redirectIfLoggedIn() {
    if (isAuthenticated()) {
        window.location.href = "dashboard.html";
        return true;
    }
    return false;
}

function logout() {
    clearAuth();
    window.location.href = "index.html";
}

