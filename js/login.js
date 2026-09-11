// If already logged in, redirect to dashboard
if (typeof redirectIfLoggedIn === "function") {
    redirectIfLoggedIn();
}

document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please enter both email and password!");
        return;
    }

    const loginBtn = document.getElementById("loginBtn") || this.querySelector('button[type="submit"]');
    const originalText = loginBtn ? loginBtn.textContent : "Login";

    try {
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = "Logging in...";
        }

        const baseUrl = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "https://rent4u-backend.onrender.com";
        const response = await fetch(`${baseUrl}/api/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Login failed!");
            return;
        }

        // Save JWT token & logged-in user
        if (typeof setAuth === "function") {
            setAuth(data.token, data.user);
        } else {
            localStorage.setItem("token", data.token);
            localStorage.setItem("loggedIn", JSON.stringify(data.user));
        }

        alert("Login Successful!\nWelcome " + data.user.name);
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Login error:", error);
        alert("Unable to connect to server!\nMake sure backend is running.");
    } finally {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
        }
    }
});