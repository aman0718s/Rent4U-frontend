const loginBtn = document.getElementById("loginBtn");
const getVehicleBtn = document.getElementById("getVehicleBtn");
const addVehicleBtn = document.getElementById("addVehicleBtn");

const loggedIn = typeof isAuthenticated === "function" ? isAuthenticated() : !!localStorage.getItem("token");

if (loggedIn) {
    if (loginBtn) {
        loginBtn.textContent = "Dashboard";
        loginBtn.addEventListener("click", function () {
            window.location.href = "dashboard.html";
        });
    }

    if (getVehicleBtn) {
        getVehicleBtn.addEventListener("click", function () {
            window.location.href = "dashboard.html#browse";
        });
    }

    if (addVehicleBtn) {
        addVehicleBtn.addEventListener("click", function () {
            window.location.href = "dashboard.html#add";
        });
    }
} else {
    if (loginBtn) {
        loginBtn.textContent = "Login";
        loginBtn.addEventListener("click", function () {
            window.location.href = "login.html";
        });
    }

    if (getVehicleBtn) {
        getVehicleBtn.addEventListener("click", function () {
            window.location.href = "login.html";
        });
    }

    if (addVehicleBtn) {
        addVehicleBtn.addEventListener("click", function () {
            window.location.href = "login.html";
        });
    }
}