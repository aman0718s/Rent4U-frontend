// If already logged in, redirect to dashboard
if (typeof redirectIfLoggedIn === "function") {
    redirectIfLoggedIn();
}

document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const country = document.getElementById("country").value;
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!country) {
        alert("Please select a country code!");
        return;
    }

    if (!name || !email || !phone || !password || !confirmPassword) {
        alert("Fill all fields!");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert("Enter a valid email address!");
        return;
    }

    if (phone.length < 10 || isNaN(phone)) {
        alert("Enter a valid 10-digit phone number!");
        return;
    }

    if (password.length < 6) {
        alert("Password must contain at least 6 characters!");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    const fullPhone = country + phone;
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Creating Account...";

        const baseUrl = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "https://rent4u-backend.onrender.com";
        const response = await fetch(`${baseUrl}/api/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                email: email,
                phone: fullPhone,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Registration failed!");
            return;
        }

        alert("Registration Successful!\nPlease login to continue.");
        document.getElementById("registerForm").reset();
        window.location.href = "login.html";

    } catch (error) {
        console.error("Registration error:", error);
        alert("Unable to connect to server!\nMake sure the backend is running.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});