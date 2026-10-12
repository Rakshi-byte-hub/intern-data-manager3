/* =========================================
   HAVEN HOTEL MANAGEMENT
   Reservations, Rooms, Guests & Housekeeping
========================================= */

const $ = (selector) => document.querySelector(selector);

const STORAGE_KEY = "havenHotelData";

const today = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const addDays = (dateString, days) => {
  const date = new Date(${dateString}T12:00:00);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(${dateString}T12:00:00);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

function createInitialData() {
  return {
    rooms: Array.from({ length: 40 }, (_, index) => {
      const number = 101 + index;
      return {
        number: String(number),
        type: number % 5 === 0
          ? "Suite"
          : number % 2 === 0
            ? "Deluxe"
            : "Standard",
        status: "Available"
      };
    }),
    reservations: [],
    activities: []
  };
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (parsed && Array.isArray(parsed.rooms) &&
          Array.isArray(parsed.reservations)) {
        if (!Array.isArray(parsed.activities)) {
          parsed.activities = [];
        }
        return parsed;
      }
    }
  } catch (error) {
    console.error("Could not load saved hotel data:", error);
  }

  return createInitialData();
}

let data = loadData();

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Could not save hotel data:", error);
    showToast("Unable to save data. Check your browser storage.");
  }
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function logActivity(message) {
  data.activities.unshift({
    message,
    date: new Date().toISOString()
  });

  data.activities = data.activities.slice(0, 100);
}

function getRoom(roomNumber) {
  return data.rooms.find(
    (room) => String(room.number) === String(roomNumber)
  );
}

function getReservation(id) {
  return data.reservations.find(
    (reservation) => String(reservation.id) === String(id)
  );
}

/* =========================================
   NAVIGATION
========================================= */

function navigate(viewId) {
  const target = document.getElementById(viewId);
  if (!target || !target.classList.contains("view")) return;

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });

  document.querySelectorAll(".nav").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.view === viewId
    );
  });

  const titles = {
    dashboard: "Overview",
    reservations: "Reservations",
    rooms: "Room Management",
    guests: "Guests",
    housekeeping: "Housekeeping"
  };

  $("#pageTitle").textContent = titles[viewId] || "Overview";

  document.querySelector(".sidebar")?.classList.remove("open");
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    navigate(button.dataset.view);
  });
});

document.querySelectorAll("[data-goto]").forEach((button) => {
  button.addEventListener("click", () => {
    navigate(button.dataset.goto);
  });
});

$("#menuBtn")?.addEventListener("click", () => {
  document.querySelector(".sidebar")?.classList.toggle("open");
});

/* =========================================
   RESERVATION FORM
========================================= */

const bookingDialog = $("#bookingDialog");
const bookingForm = $("#bookingForm");

function isRoomAvailable(roomNumber, checkin, checkout) {
  const room = getRoom(roomNumber);

  if (!room || room.status !== "Available") return false;

  return !data.reservations.some((reservation) => {
    if (
      String(reservation.room) !== String(roomNumber) ||
      ["Cancelled", "Checked Out"].includes(reservation.status)
    ) {
      return false;
    }

    // Two stays overlap when each starts before the other ends.
    return checkin < reservation.checkout &&
           checkout > reservation.checkin;
  });
}

function populateRoomOptions() {
  const roomSelect = $("#bookingRoom");
  if (!roomSelect) return;

  const checkin = bookingForm.elements.namedItem("checkin").value;
  const checkout = bookingForm.elements.namedItem("checkout").value;
  const previousValue = roomSelect.value;

  roomSelect.innerHTML =
    '<option value="">Select an available room</option>';

  data.rooms.forEach((room) => {
    const available =
      checkin && checkout && checkout > checkin
        ? isRoomAvailable(room.number, checkin, checkout)
        : room.status === "Available";

    if (available) {
      const option = document.createElement("option");
      option.value = room.number;
      option.textContent = Room ${room.number} — ${room.type};
      roomSelect.appendChild(option);
    }
  });

  if (
    previousValue &&
    [...roomSelect.options].some(
      (option) => option.value === previousValue
    )
  ) {
    roomSelect.value = previousValue;
  }
}

function openBookingDialog() {
  if (!bookingDialog || !bookingForm) {
    showToast("Reservation form not found. Check index.html.");
    return;
  }

  bookingForm.reset();

  const checkinInput = bookingForm.elements.namedItem("checkin");
  const checkoutInput = bookingForm.elements.namedItem("checkout");

  checkinInput.value = addDays(today(), 1);
  checkoutInput.value = addDays(today(), 2);

  checkinInput.min = today();
  checkoutInput.min = addDays(checkinInput.value, 1);

  populateRoomOptions();

  if ($("#bookingRoom").options.length <= 1) {
    showToast("No available rooms for these dates.");
  }

  if (!bookingDialog.open) {
    bookingDialog.showModal();
  }
}

$("#newBooking")?.addEventListener("click", openBookingDialog);
$("#newBooking2")?.addEventListener("click", openBookingDialog);

$("#closeDialog")?.addEventListener("click", () => {
  bookingDialog?.close();
});

bookingForm?.elements.namedItem("checkin")?.addEventListener("change", () => {
  const checkin = bookingForm.elements.namedItem("checkin").value;
  const checkoutInput = bookingForm.elements.namedItem("checkout");

  checkoutInput.min = addDays(checkin, 1);

  if (checkoutInput.value <= checkin) {
    checkoutInput.value = addDays(checkin, 1);
  }

  populateRoomOptions();
});

bookingForm?.elements.namedItem("checkout")?.addEventListener("change", () => {
  populateRoomOptions();
});

function createBooking(event) {
  event.preventDefault();

  const formData = new FormData(bookingForm);

  const guest = String(formData.get("guest") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const roomNumber = String(formData.get("room") || "");
  const checkin = String(formData.get("checkin") || "");
  const checkout = String(formData.get("checkout") || "");
  const amount = Number(formData.get("amount"));
  const notes = String(formData.get("notes") || "").trim();

  if (!guest || !phone || !roomNumber || !checkin || !checkout) {
    showToast("Please complete all required fields.");
    return;
  }

  if (checkout <= checkin) {
    showToast("Check-out must be after check-in.");
    return;
  }

  if (checkin < today()) {
    showToast("Check-in cannot be in the past.");
    return;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    showToast("Enter a valid booking amount.");
    return;
  }

  if (!isRoomAvailable(roomNumber, checkin, checkout)) {
    showToast("This room is not available for the selected dates.");
    populateRoomOptions();
    return;
  }

  const reservation = {
    id: HV${Date.now().toString().slice(-8)},
    guest,
    phone,
    email,
    room: roomNumber,
    checkin,
    checkout,
    amount,
    notes,
    status: "Confirmed",
    createdAt: new Date().toISOString()
  };

  data.reservations.unshift(reservation);

  logActivity(Reservation created for ${guest}, room ${roomNumber}.);
  saveData();
  renderAll();

  bookingDialog.close();
  showToast("Reservation created successfully.");
}

bookingForm?.addEventListener("submit", createBooking);

/* =========================================
   RESERVATION ACTIONS
========================================= */

function checkInReservation(id) {
  const reservation = getReservation(id);
  if (!reservation || reservation.status !== "Confirmed") return;

  if (reservation.checkin > today()) {
    showToast("Check-in is scheduled for " + formatDate(reservation.checkin) + ".");
    return;
  }

  const room = getRoom(reservation.room);

  if (!room || room.status !== "Available") {
    showToast("This room is not currently available.");
    return;
  }

  reservation.status = "Checked In";
  room.status = "Occupied";

  logActivity(${reservation.guest} checked into room ${room.number}.);
  saveData();
  renderAll();
  showToast("Guest checked in successfully.");
}

function checkOutReservation(id) {
  const reservation = getReservation(id);
  if (!reservation || reservation.status !== "Checked In") return;

  reservation.status = "Checked Out";

  const room = getRoom(reservation.room);
  if (room) room.status = "Cleaning";

  logActivity(${reservation.guest} checked out of room ${reservation.room}.);
  saveData();
  renderAll();
  showToast("Guest checked out. Room sent for cleaning.");
}

function cancelReservation(id) {
  const reservation = getReservation(id);
  if (!reservation || reservation.status !== "Confirmed") {
    showToast("Only confirmed reservations can be cancelled.");
    return;
  }

  reservation.status = "Cancelled";

  logActivity(Reservation ${reservation.id} was cancelled.);
  saveData();
  renderAll();
  showToast("Reservation cancelled.");
}

function actionButtons(reservation) {
  if (reservation.status === "Confirmed") {
    return `
      <button type="button" class="small-btn"
        data-action="checkin" data-id="${escapeHTML(reservation.id)}">
        Check in
      </button>
      <button type="button" class="small-btn danger"
        data-action="cancel" data-id="${escapeHTML(reservation.id)}">
        Cancel
      </button>
    `;
  }

  if (reservation.status === "Checked In") {
    return `
      <button type="button" class="small-btn"
        data-action="checkout" data-id="${escapeHTML(reservation.id)}">
        Check out
      </button>
    `;
  }

  return "—";
}

function statusBadge(status) {
  const safeStatus = escapeHTML(status || "Unknown");
  const className = safeStatus.toLowerCase().replace(/\s+/g, "-");

  return <span class="status ${className}">${safeStatus}</span>;
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const id = button.dataset.id;

  switch (button.dataset.action) {
    case "checkin":
      checkInReservation(id);
      break;
    case "checkout":
      checkOutReservation(id);
      break;
    case "cancel":
      cancelReservation(id);
      break;
  }
});

/* =========================================
   DASHBOARD
========================================= */

function renderDashboard() {
  const totalRooms = data.rooms.length;
  const occupiedRooms = data.rooms.filter(
    (room) => room.status === "Occupied"
  ).length;

  $("#occupancy").textContent = totalRooms
    ? ${Math.round((occupiedRooms / totalRooms) * 100)}%
    : "0%";

  $("#arrivals").textContent = data.reservations.filter(
    (reservation) =>
      reservation.checkin === today() &&
      reservation.status === "Confirmed"
  ).length;

  $("#departures").textContent = data.reservations.filter(
    (reservation) =>
      reservation.checkout === today() &&
      reservation.status === "Checked In"
  ).length;

  const revenueToday = data.reservations
    .filter((reservation) =>
      reservation.checkin === today() &&
      ["Confirmed", "Checked In", "Checked Out"].includes(reservation.status)
    )
    .reduce((total, reservation) => total + (Number(reservation.amount) || 0), 0);

  $("#revenue").textContent = money(revenueToday);

  const rows = data.reservations
    .filter((reservation) =>
      reservation.checkin === today() ||
      reservation.checkout === today() ||
      reservation.status === "Checked In"
    )
    .slice(0, 10);

  $("#dashboardTable").innerHTML = rows.length
    ? rows.map((reservation) => `
        <tr>
          <td>${escapeHTML(reservation.id)}</td>
          <td>${escapeHTML(reservation.guest)}</td>
          <td>${escapeHTML(reservation.room)}</td>
          <td>${formatDate(reservation.checkin)}</td>
          <td>${formatDate(reservation.checkout)}</td>
          <td>${statusBadge(reservation.status)}</td>
          <td>${actionButtons(reservation)}</td>
        </tr>
      `).join("")
    : <tr><td colspan="7">No reservations scheduled for today.</td></tr>;

  const counts = {
    Available: 0,
    Occupied: 0,
    Cleaning: 0,
    Maintenance: 0
  };

  data.rooms.forEach((room) => {
    if (counts[room.status] !== undefined) counts[room.status]++;
  });

  $("#roomSummary").innerHTML = Object.entries(counts)
    .map(([status, count]) => `
      <div class="summary-item">
        <span>${escapeHTML(status)}</span>
        <strong>${count}</strong>
      </div>
    `).join("");
}

/* =========================================
   RESERVATIONS TABLE + SEARCH
========================================= */

function renderReservations() {
  const search = ($("#searchBookings")?.value || "").toLowerCase().trim();
  const filter = $("#filterStatus")?.value || "";

  const reservations = data.reservations.filter((reservation) => {
    const searchable = [
      reservation.id,
      reservation.guest,
      reservation.phone,
      reservation.email,
      reservation.room
    ].join(" ").toLowerCase();

    return searchable.includes(search) &&
      (!filter || reservation.status === filter);
  });

  $("#reservationsTable").innerHTML = reservations.length
    ? reservations.map((reservation) => `
        <tr>
          <td>${escapeHTML(reservation.id)}</td>
          <td>${escapeHTML(reservation.guest)}</td>
          <td>${escapeHTML(reservation.phone)}</td>
          <td>${escapeHTML(reservation.room)}</td>
          <td>
            ${formatDate(reservation.checkin)}
            <span class="muted">to</span>
            ${formatDate(reservation.checkout)}
          </td>
          <td>${money(reservation.amount)}</td>
          <td>${statusBadge(reservation.status)}</td>
          <td>${actionButtons(reservation)}</td>
        </tr>
      `).join("")
    : <tr><td colspan="8">No reservations found.</td></tr>;
}

$("#searchBookings")?.addEventListener("input", renderReservations);
$("#filterStatus")?.addEventListener("change", renderReservations);

/* =========================================
   ROOM MANAGEMENT
========================================= */

function renderRooms() {
  $("#roomGrid").innerHTML = data.rooms.map((room) => `
    <article class="card room-card">
      <div class="room-number">Room ${escapeHTML(room.number)}</div>
      <p>${escapeHTML(room.type)}</p>
      ${statusBadge(room.status)}
    </article>
  `).join("");
}

/* =========================================
   GUEST DIRECTORY
========================================= */

function renderGuests() {
  const guests = new Map();

  data.reservations.forEach((reservation) => {
    const key = reservation.phone || reservation.email || reservation.guest;

    if (!guests.has(key)) {
      guests.set(key, {
        guest: reservation.guest,
        phone: reservation.phone,
        email: reservation.email,
        bookings: 0
      });
    }

    guests.get(key).bookings++;
  });

  const guestList = [...guests.values()];

  $("#guestsTable").innerHTML = guestList.length
    ? guestList.map((guest) => `
        <tr>
          <td>${escapeHTML(guest.guest)}</td>
          <td>${escapeHTML(guest.phone || "—")}</td>
          <td>${escapeHTML(guest.email || "—")}</td>
          <td>${guest.bookings}</td>
        </tr>
      `).join("")
    : <tr><td colspan="4">No guest records yet.</td></tr>;
}

/* =========================================
   HOUSEKEEPING
========================================= */

function renderHousekeeping() {
  $("#housekeepingTable").innerHTML = data.rooms.map((room) => `
    <tr>
      <td>${escapeHTML(room.number)}</td>
      <td>${escapeHTML(room.type)}</td>
      <td>${statusBadge(room.status)}</td>
      <td>
        <select data-room-status="${escapeHTML(room.number)}"
          aria-label="Update room ${escapeHTML(room.number)} status">
          ${["Available", "Occupied", "Cleaning", "Maintenance"]
            .map((status) => `
              <option value="${status}"
                ${room.status === status ? "selected" : ""}>
                ${status}
              </option>
            `).join("")}
        </select>
      </td>
    </tr>
  `).join("");
}

$("#housekeepingTable")?.addEventListener("change", (event) => {
  const select = event.target.closest("[data-room-status]");
  if (!select) return;

  const room = getRoom(select.dataset.roomStatus);
  if (!room) return;

  const newStatus = select.value;

  // Prevent housekeeping from marking an active guest's room available.
  const hasActiveGuest = data.reservations.some(
    (reservation) =>
      String(reservation.room) === String(room.number) &&
      reservation.status === "Checked In"
  );

  if (hasActiveGuest && newStatus !== "Occupied") {
    select.value = "Occupied";
    showToast("This room has a checked-in guest.");
    return;
  }

  room.status = newStatus;
  logActivity(Room ${room.number} status changed to ${newStatus}.);
  saveData();
  renderAll();
  showToast(Room ${room.number} updated.);
});

/* =========================================
   CSV EXPORT
========================================= */

$("#exportCsv")?.addEventListener("click", () => {
  if (!data.reservations.length) {
    showToast("There are no reservations to export.");
    return;
  }

  const columns = [
    ["Booking ID", "id"],
    ["Guest", "guest"],
    ["Phone", "phone"],
    ["Email", "email"],
    ["Room", "room"],
    ["Check-in", "checkin"],
    ["Check-out", "checkout"],
    ["Amount", "amount"],
    ["Status", "status"],
    ["Notes", "notes"]
  ];

  const csvCell = (value) =>
    "${String(value ?? "").replace(/"/g, '""')}";

  const csv = [
    columns.map(([heading]) => csvCell(heading)).join(","),
    ...data.reservations.map((reservation) =>
      columns.map(([, key]) => csvCell(reservation[key])).join(",")
    )
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = haven-reservations-${today()}.csv;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

/* =========================================
   RENDER EVERYTHING
===============
