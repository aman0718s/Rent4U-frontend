/* =====================================================
   AUTH GUARD & INITIALIZATION
===================================================== */

// Verify authentication
if (typeof requireAuth === "function") {
    requireAuth();
} else if (!localStorage.getItem("token") || !localStorage.getItem("loggedIn")) {
    window.location.href = "login.html";
}

const loggedInUser = (typeof getUser === "function" && getUser()) ||
    JSON.parse(localStorage.getItem("loggedIn") || "{}");

const BASE_URL = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "https://rent4u-backend.onrender.com";

// Welcome message
const welcomeEl = document.getElementById("welcomeText");
if (welcomeEl && loggedInUser && loggedInUser.name) {
    welcomeEl.textContent = "Hi, " + loggedInUser.name;
}

// Logout button
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
        if (typeof logout === "function") {
            logout();
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("loggedIn");
            window.location.href = "index.html";
        }
    });
}


/* =====================================================
   TAB NAVIGATION
===================================================== */

const tabBtns = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

function switchTab(tabId) {
    tabBtns.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabId);
    });

    tabPanels.forEach(panel => {
        panel.classList.toggle("active", panel.id === tabId);
    });

    if (tabId === "browse") {
        clearSearchResults();
    } else if (tabId === "myVehicles") {
        renderMyVehicles();
    } else if (tabId === "myBookings") {
        renderMyBookings();
    } else if (tabId === "bookingRequests") {
        renderBookingRequests();
    }
}

tabBtns.forEach(btn => {
    btn.addEventListener("click", function () {
        switchTab(this.dataset.tab);
    });
});

// Check if URL contains hash (e.g. dashboard.html#add)
window.addEventListener("DOMContentLoaded", () => {
    const hash = window.location.hash.replace("#", "");
    if (hash && ["browse", "add", "myVehicles", "myBookings"].includes(hash)) {
        switchTab(hash);
    }
});


/* =====================================================
   HELPERS & ICONS
===================================================== */

function vehicleIcon(type) {
    if (type === "car") return "fa-car";
    if (type === "bike") return "fa-motorcycle";
    return "fa-bicycle";
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function authHeaders() {
    return typeof getAuthHeaders === "function"
        ? getAuthHeaders()
        : {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        };
}


/* =====================================================
   API CALLS
===================================================== */

async function fetchVehiclesApi(params = {}) {
    const query = new URLSearchParams();
    if (params.type && params.type !== "all") query.append("type", params.type);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);

    const url = `${BASE_URL}/api/vehicles${query.toString() ? "?" + query.toString() : ""}`;
    const response = await fetch(url, {
        method: "GET",
        headers: authHeaders()
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch vehicles");
    }
    return data.vehicles || [];
}

async function fetchMyBookingsApi() {
    const response = await fetch(`${BASE_URL}/api/bookings`, {
        method: "GET",
        headers: authHeaders()
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch bookings");
    }
    return data.bookings || [];
}

async function fetchBookingRequestsApi() {
    const response = await fetch(`${BASE_URL}/api/bookings/requests`, {
        method: "GET",
        headers: authHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch booking requests");
    }

    return data.requests || [];
}

/* =====================================================
   ADD VEHICLE
===================================================== */

const captureLocationBtn = document.getElementById("captureLocationBtn");
if (captureLocationBtn) {
    captureLocationBtn.addEventListener("click", function () {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        captureLocationBtn.textContent = "Getting location...";
        navigator.geolocation.getCurrentPosition(
            function (position) {
                document.getElementById("vLat").value = position.coords.latitude;
                document.getElementById("vLng").value = position.coords.longitude;
                captureLocationBtn.innerHTML = '<i class="fa-solid fa-check"></i> Location Captured';
                captureLocationBtn.style.background = "#16a34a";
                captureLocationBtn.style.color = "#fff";
                alert("Current location captured successfully!");
            },
            function () {
                captureLocationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Use My Current Location';
                alert("Could not access your current location. Please enter manually.");
            }
        );
    });
}

const addVehicleForm = document.getElementById("addVehicleForm");
if (addVehicleForm) {
    addVehicleForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const type = document.getElementById("vType").value;
        const name = document.getElementById("vName").value.trim();
        const price = Number(document.getElementById("vPrice").value);
        const location = document.getElementById("vLocation").value.trim();
        const imageUrl = document.getElementById("vImage").value.trim();
        const lat = document.getElementById("vLat").value;
        const lng = document.getElementById("vLng").value;

        if (!type || !name || !price || !location) {
            alert("Please fill all required fields!");
            return;
        }

        if (price <= 0) {
            alert("Price must be greater than 0!");
            return;
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = "Listing Vehicle...";

            const response = await fetch(`${BASE_URL}/api/vehicles`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    type: type,
                    name: name,
                    pricePerDay: price,
                    location: location,
                    lat: lat ? Number(lat) : null,
                    lng: lng ? Number(lng) : null,
                    imageUrl: imageUrl
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Failed to add vehicle");
                return;
            }

            alert("Vehicle listed successfully!");
            this.reset();
            document.getElementById("vLat").value = "";
            document.getElementById("vLng").value = "";

            if (captureLocationBtn) {
                captureLocationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Use My Current Location';
                captureLocationBtn.style.background = "";
                captureLocationBtn.style.color = "";
            }

            // Switch to My Vehicles tab
            switchTab("myVehicles");

        } catch (error) {
            console.error("Add vehicle error:", error);
            alert("Unable to connect to server!\nMake sure backend is running.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}


/* =====================================================
   SEARCH & BROWSE
===================================================== */

let userSearchCoords = null;
const useMyLocationBtn = document.getElementById("useMyLocationBtn");
const locationStatus = document.getElementById("locationStatus");
const searchLocationInput = document.getElementById("searchLocation");

if (useMyLocationBtn) {
    useMyLocationBtn.addEventListener("click", function () {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        locationStatus.textContent = "Getting your current location...";
        locationStatus.style.color = "#3b82f6";

        navigator.geolocation.getCurrentPosition(
            function (position) {
                userSearchCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                searchLocationInput.value = "";
                locationStatus.textContent = "✓ Current location selected";
                locationStatus.style.color = "#16a34a";
            },
            function () {
                userSearchCoords = null;
                locationStatus.textContent = "Unable to access current location.";
                locationStatus.style.color = "#dc2626";
            }
        );
    });
}

if (searchLocationInput) {
    searchLocationInput.addEventListener("input", function () {
        userSearchCoords = null;
        if (locationStatus) locationStatus.textContent = "";
    });
}

// Date constraints
const todayStr = new Date().toISOString().split("T")[0];
const searchFromDate = document.getElementById("searchFromDate");
const searchToDate = document.getElementById("searchToDate");

if (searchFromDate && searchToDate) {
    searchFromDate.min = todayStr;
    searchToDate.min = todayStr;

    searchFromDate.addEventListener("change", function () {
        searchToDate.min = this.value;
        if (searchToDate.value && searchToDate.value < this.value) {
            searchToDate.value = this.value;
        }
    });
}

const searchVehiclesBtn = document.getElementById("searchVehiclesBtn");
if (searchVehiclesBtn) {
    searchVehiclesBtn.addEventListener("click", function () {
        const location = searchLocationInput.value.trim().toLowerCase();
        const fromDate = searchFromDate.value;
        const toDate = searchToDate.value;
        const type = document.getElementById("filterType").value;

        if (!location && !userSearchCoords) {
            alert("Please enter a location or click Current Location.");
            return;
        }

        if (!fromDate || !toDate) {
            alert("Please select both Pickup Date and Drop Date.");
            return;
        }

        if (toDate < fromDate) {
            alert("Drop Date cannot be before Pickup Date.");
            return;
        }

        searchVehicles(location, fromDate, toDate, type);
    });
}

let activeSearchResults = [];

async function searchVehicles(location, fromDate, toDate, type) {
    const searchMessage = document.getElementById("searchMessage");
    const browseGrid = document.getElementById("browseGrid");
    const browseEmpty = document.getElementById("browseEmpty");

    try {
        searchMessage.textContent = "Searching available vehicles...";
        browseGrid.innerHTML = "";
        browseEmpty.style.display = "none";

        // Query backend with dates to automatically filter out conflicting bookings
        const allVehicles = await fetchVehiclesApi({
            type: type,
            startDate: fromDate,
            endDate: toDate
        });

        // 1. Exclude own vehicles & unavailable status
        let results = allVehicles.filter(v => {
            return v.ownerEmail !== loggedInUser.email && v.status === "available";
        });

        // 2. Filter by location string or coordinates
        if (userSearchCoords) {
            results = results
                .filter(v => v.lat !== null && v.lng !== null && !isNaN(v.lat) && !isNaN(v.lng))
                .map(v => ({
                    ...v,
                    distance: getDistanceKm(userSearchCoords.lat, userSearchCoords.lng, v.lat, v.lng)
                }))
                .filter(v => v.distance <= 5)
                .sort((a, b) => a.distance - b.distance);
        } else if (location) {
            results = results.filter(v => {
                return (v.location || "").toLowerCase().includes(location);
            });
        }

        activeSearchResults = results;
        renderSearchResults(results, fromDate, toDate);

    } catch (error) {
        console.error("Search error:", error);
        searchMessage.textContent = "Error loading vehicles: " + error.message;
        alert("Failed to search vehicles: " + error.message);
    }
}

function renderSearchResults(vehicles, fromDate, toDate) {
    const grid = document.getElementById("browseGrid");
    const empty = document.getElementById("browseEmpty");
    const message = document.getElementById("searchMessage");

    grid.innerHTML = "";

    if (vehicles.length === 0) {
        empty.style.display = "block";
        message.textContent = "No vehicle is available for the selected location and dates.";
        return;
    }

    empty.style.display = "none";
    message.textContent = `${vehicles.length} vehicle(s) available from ${fromDate} to ${toDate}:`;

    vehicles.forEach(vehicle => {
        const card = document.createElement("div");
        card.className = "vehicle-card";

        const imageHtml = vehicle.imageUrl
            ? `<img src="${vehicle.imageUrl}" alt="${vehicle.name}" onerror="this.onerror=null;this.parentElement.innerHTML='<i class=\'fa-solid ${vehicleIcon(vehicle.type)}\'></i>';">`
            : `<i class="fa-solid ${vehicleIcon(vehicle.type)}"></i>`;

        const distanceHtml = vehicle.distance !== undefined
            ? `<p class="distance"><i class="fa-solid fa-route"></i> ${vehicle.distance.toFixed(1)} km away</p>`
            : "";

        card.innerHTML = `
            <div class="vehicle-img">
                ${imageHtml}
            </div>
            <div class="vehicle-body">
                <span class="vehicle-type-tag">${vehicle.type}</span>
                <h3>${vehicle.name}</h3>
                <p class="location">
                    <i class="fa-solid fa-location-dot"></i> ${vehicle.location}
                </p>
                ${distanceHtml}
                <p class="price">
                    ₹${vehicle.pricePerDay} <span>/ day</span>
                </p>
            </div>
            <div class="vehicle-actions">
                <button class="btn-book" data-id="${vehicle._id}">
                    Book Now
                </button>
            </div>
        `;

        grid.appendChild(card);
    });

    grid.querySelectorAll(".btn-book").forEach(btn => {
        btn.addEventListener("click", function () {
            openBookingModal(this.dataset.id, fromDate, toDate);
        });
    });
}

function clearSearchResults() {
    const grid = document.getElementById("browseGrid");
    const empty = document.getElementById("browseEmpty");
    const message = document.getElementById("searchMessage");

    if (grid) grid.innerHTML = "";
    if (empty) empty.style.display = "none";
    if (message) message.textContent = "Enter location and dates to search available vehicles.";
}


/* =====================================================
   BOOKING MODAL & CREATION
===================================================== */

const bookingModal = document.getElementById("bookingModal");
const modalVehicleName = document.getElementById("modalVehicleName");
const fromDateInput = document.getElementById("fromDate");
const toDateInput = document.getElementById("toDate");
const modalCancel = document.getElementById("modalCancel");
const modalConfirm = document.getElementById("modalConfirm");

let activeVehicleId = null;

function openBookingModal(vehicleId, searchFrom, searchTo) {
    const vehicle = activeSearchResults.find(v => (v._id || v.id) === vehicleId);

    if (!vehicle) {
        alert("Vehicle details not found.");
        return;
    }

    activeVehicleId = vehicleId;
    modalVehicleName.textContent = `${vehicle.name} — ₹${vehicle.pricePerDay}/day`;

    fromDateInput.value = searchFrom || todayStr;
    toDateInput.value = searchTo || searchFrom || todayStr;

    fromDateInput.min = todayStr;
    toDateInput.min = fromDateInput.value;

    bookingModal.classList.add("active");
}

if (fromDateInput && toDateInput) {
    fromDateInput.addEventListener("change", function () {
        toDateInput.min = this.value;
        if (toDateInput.value && toDateInput.value < this.value) {
            toDateInput.value = this.value;
        }
    });
}

if (modalCancel) {
    modalCancel.addEventListener("click", function () {
        bookingModal.classList.remove("active");
        activeVehicleId = null;
    });
}

if (modalConfirm) {
    modalConfirm.addEventListener("click", async function () {
        const from = fromDateInput.value;
        const to = toDateInput.value;

        if (!from || !to) {
            alert("Please select both Pickup and Drop dates.");
            return;
        }

        if (to < from) {
            alert("Drop Date cannot be before Pickup Date.");
            return;
        }

        if (!activeVehicleId) {
            alert("No vehicle selected.");
            return;
        }

        const originalText = modalConfirm.textContent;

        try {
            modalConfirm.disabled = true;
            modalConfirm.textContent = "Confirming...";

            const response = await fetch(`${BASE_URL}/api/bookings`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    vehicleId: activeVehicleId,
                    startDate: from,
                    endDate: to
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Booking failed.");
                return;
            }

            alert(`Booking confirmed successfully!\nTotal Days: ${data.totalDays}\nTotal Price: ₹${data.totalPrice}`);

            bookingModal.classList.remove("active");
            activeVehicleId = null;

            // Switch to My Bookings tab
            switchTab("myBookings");

        } catch (error) {
            console.error("Booking creation error:", error);
            alert("Unable to connect to server!\nMake sure backend is running.");
        } finally {
            modalConfirm.disabled = false;
            modalConfirm.textContent = originalText;
        }
    });
}


/* =====================================================
   MY VEHICLES (LIST, EDIT, TOGGLE STATUS, DELETE)
===================================================== */

async function renderMyVehicles() {
    const grid = document.getElementById("myVehiclesGrid");
    const empty = document.getElementById("myVehiclesEmpty");

    try {
        grid.innerHTML = '<p style="padding: 20px;">Loading your vehicles...</p>';
        empty.style.display = "none";

        const vehicles = await fetchVehiclesApi();
        const myVehicles = vehicles.filter(v => v.ownerEmail === loggedInUser.email);

        grid.innerHTML = "";

        if (myVehicles.length === 0) {
            empty.style.display = "block";
            return;
        }

        empty.style.display = "none";

        myVehicles.forEach(vehicle => {
            const card = document.createElement("div");
            card.className = "vehicle-card";

            const vId = vehicle._id || vehicle.id;
            const isAvailable = vehicle.status === "available";

            const imageHtml = vehicle.imageUrl
                ? `<img src="${vehicle.imageUrl}" alt="${vehicle.name}" onerror="this.onerror=null;this.parentElement.innerHTML='<i class=\'fa-solid ${vehicleIcon(vehicle.type)}\'></i>';">`
                : `<i class="fa-solid ${vehicleIcon(vehicle.type)}"></i>`;

            card.innerHTML = `
                <div class="vehicle-img">
                    ${imageHtml}
                </div>
                <div class="vehicle-body">
                    <span class="status-badge status-${vehicle.status}">
                        ${vehicle.status}
                    </span>
                    <h3>${vehicle.name}</h3>
                    <p class="location">
                        <i class="fa-solid fa-location-dot"></i> ${vehicle.location}
                    </p>
                    <p class="price">
                        ₹${vehicle.pricePerDay} <span>/ day</span>
                    </p>
                </div>
                <div class="vehicle-actions">
                    <button class="btn-edit" data-id="${vId}">
                        Edit
                    </button>
                    <button class="btn-mark" data-id="${vId}">
                        ${isAvailable ? "Mark Unavailable" : "Mark Available"}
                    </button>
                    <button class="btn-delete" data-id="${vId}">
                        Delete
                    </button>
                </div>
            `;

            grid.appendChild(card);
        });

        grid.querySelectorAll(".btn-edit").forEach(btn => {
            btn.addEventListener("click", () => editVehicle(btn.dataset.id));
        });

        grid.querySelectorAll(".btn-mark").forEach(btn => {
            btn.addEventListener("click", () => toggleVehicleStatus(btn.dataset.id));
        });

        grid.querySelectorAll(".btn-delete").forEach(btn => {
            btn.addEventListener("click", () => deleteVehicle(btn.dataset.id));
        });

    } catch (error) {
        console.error("Error fetching my vehicles:", error);
        grid.innerHTML = "";
        alert("Failed to load your vehicles: " + error.message);
    }
}

async function editVehicle(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/vehicles/${id}`, {
            method: "GET",
            headers: authHeaders()
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || "Vehicle not found");
            return;
        }

        const vehicle = data.vehicle;

        const newPriceStr = prompt("Enter new price per day (₹):", vehicle.pricePerDay);
        if (newPriceStr === null) return;
        const newPrice = Number(newPriceStr);
        if (isNaN(newPrice) || newPrice <= 0) {
            alert("Price must be a valid number greater than 0");
            return;
        }

        const newLocation = prompt("Enter new location:", vehicle.location);
        if (newLocation === null) return;
        if (!newLocation.trim()) {
            alert("Location cannot be empty");
            return;
        }

        const newImageUrl = prompt("Enter new image URL (optional):", vehicle.imageUrl || "");
        if (newImageUrl === null) return;

        const updateRes = await fetch(`${BASE_URL}/api/vehicles/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({
                pricePerDay: newPrice,
                location: newLocation.trim(),
                imageUrl: newImageUrl.trim()
            })
        });

        const updateData = await updateRes.json();
        if (!updateRes.ok) {
            alert(updateData.message || "Failed to update vehicle");
            return;
        }

        alert("Vehicle updated successfully!");
        renderMyVehicles();

    } catch (error) {
        console.error("Update error:", error);
        alert("Unable to connect to server!");
    }
}

async function toggleVehicleStatus(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/vehicles/${id}`, {
            method: "PATCH",
            headers: authHeaders()
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || "Failed to update status");
            return;
        }

        alert("Vehicle status updated to: " + data.status);
        renderMyVehicles();

    } catch (error) {
        console.error("Status toggle error:", error);
        alert("Unable to connect to server!");
    }
}

async function deleteVehicle(id) {
    if (!confirm("Are you sure you want to delete this vehicle listing?")) {
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/vehicles/${id}`, {
            method: "DELETE",
            headers: authHeaders()
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || "Failed to delete vehicle");
            return;
        }

        alert("Vehicle deleted successfully");
        renderMyVehicles();

    } catch (error) {
        console.error("Delete error:", error);
        alert("Unable to connect to server!");
    }
}


/* =====================================================
   MY BOOKINGS (LIST & CANCEL)
===================================================== */

async function renderMyBookings() {
    const list = document.getElementById("myBookingsList");
    const empty = document.getElementById("myBookingsEmpty");

    try {
        list.innerHTML = '<p style="padding: 20px;">Loading your bookings...</p>';
        empty.style.display = "none";

        const bookings = await fetchMyBookingsApi();
        list.innerHTML = "";

        if (bookings.length === 0) {
            empty.style.display = "block";
            return;
        }

        empty.style.display = "none";

        bookings.forEach(booking => {
            const card = document.createElement("div");
            card.className = "booking-card";

            const startDate = new Date(booking.startDate).toISOString().split("T")[0];
            const endDate = new Date(booking.endDate).toISOString().split("T")[0];

            const cancelBtnHtml = booking.status === "confirmed"
                ? `<button class="btn-cancel-booking" data-id="${booking._id}">Cancel</button>`
                : "";

            card.innerHTML = `
                <div class="booking-info">
                    <h4>${booking.vehicleName}</h4>
                    <p><i class="fa-solid fa-calendar-days"></i> ${startDate} → ${endDate} (${booking.totalDays} days)</p>
                    <p><strong>Total:</strong> ₹${booking.totalPrice}</p>
                </div>
                <span class="booking-status status-${booking.status}">
                    ${booking.status}
                </span>
                ${cancelBtnHtml}
            `;

            list.appendChild(card);
        });

        list.querySelectorAll(".btn-cancel-booking").forEach(btn => {
            btn.addEventListener("click", () => cancelBooking(btn.dataset.id));
        });

    } catch (error) {
        console.error("Error fetching bookings:", error);
        list.innerHTML = "";
        alert("Failed to load bookings: " + error.message);
    }
}

async function cancelBooking(bookingId) {
    if (!confirm("Are you sure you want to cancel this booking?")) {
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/bookings/${bookingId}/cancel`, {
            method: "POST",
            headers: authHeaders()
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || "Failed to cancel booking");
            return;
        }

        alert("Booking cancelled successfully!");
        renderMyBookings();

    } catch (error) {
        console.error("Cancel booking error:", error);
        alert("Unable to connect to server!");
    }
}

/* =====================================================
   BOOKING REQUESTS (OWNER)
===================================================== */

async function renderBookingRequests() {
    const list = document.getElementById("bookingRequestsList");
    const empty = document.getElementById("bookingRequestsEmpty");
    const badge = document.getElementById("requestsBadge");

    try {
        list.innerHTML = '<p style="padding: 20px;">Loading booking requests...</p>';
        empty.style.display = "none";

        const requests = await fetchBookingRequestsApi();

        list.innerHTML = "";

        if (requests.length === 0) {
            empty.style.display = "block";

            if (badge) {
                badge.style.display = "none";
            }

            return;
        }

        empty.style.display = "none";

        if (badge) {
            badge.textContent = requests.length;
            badge.style.display = "inline-block";
        }

        requests.forEach(request => {
            const card = document.createElement("div");
            card.className = "booking-card";

            const startDate = new Date(request.startDate)
                .toISOString()
                .split("T")[0];

            const endDate = new Date(request.endDate)
                .toISOString()
                .split("T")[0];

            card.innerHTML = `
                <div class="booking-info">
                    <h4>${request.vehicleName}</h4>

                    <p>
                        <strong>Renter:</strong>
                        ${request.renterName || request.renterEmail}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${request.renterEmail}
                    </p>

                    <p>
                        <i class="fa-solid fa-calendar-days"></i>
                        ${startDate} → ${endDate}
                        (${request.totalDays} days)
                    </p>

                    <p>
                        <strong>Total:</strong>
                        ₹${request.totalPrice}
                    </p>
                </div>

                <span class="booking-status status-${request.status}">
                    ${request.status}
                </span>

                <div class="booking-actions">
                    <button
                        class="btn-accept-request"
                        data-id="${request._id}">
                        Accept
                    </button>

                    <button
                        class="btn-reject-request"
                        data-id="${request._id}">
                        Reject
                    </button>
                </div>
            `;

            list.appendChild(card);
        });

        list.querySelectorAll(".btn-accept-request").forEach(btn => {
            btn.addEventListener("click", () => {
                handleBookingRequest(btn.dataset.id, "accept");
            });
        });

        list.querySelectorAll(".btn-reject-request").forEach(btn => {
            btn.addEventListener("click", () => {
                handleBookingRequest(btn.dataset.id, "reject");
            });
        });

    } catch (error) {
        console.error("Error fetching booking requests:", error);

        list.innerHTML = "";

        alert("Failed to load booking requests: " + error.message);
    }
}

/* =====================================================
   Accept/Reject function
===================================================== */

async function handleBookingRequest(bookingId, action) {

    const message = action === "accept"
        ? "Accept this booking request?"
        : "Reject this booking request?";

    if (!confirm(message)) {
        return;
    }

    try {
        const endpoint = action === "accept"
            ? `/api/bookings/${bookingId}/accept`
            : `/api/bookings/${bookingId}/reject`;

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: "POST",
            headers: authHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || `Failed to ${action} booking`);
            return;
        }

        alert(
            action === "accept"
                ? "Booking request accepted successfully!"
                : "Booking request rejected successfully!"
        );

        renderBookingRequests();

    } catch (error) {
        console.error(`Booking ${action} error:`, error);

        alert("Unable to connect to server!");
    }
}

/* =====================================================
   INITIAL STATE
===================================================== */
clearSearchResults();
