const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const TOTAL_ROOMS = 40;
const STORAGE_KEY = "havenHotelData";

function localDate(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")};
}

function sampleData() {
  return {
    reservations: [
      { id: "HV001", guest: "Aarav Sharma", phone: "9876543210", email: "aarav@example.com", room: "101", checkin: localDate(), checkout: localDate(2), amount: 8500, status: "Confirmed", notes: "" },
      { id: "HV002", guest: "Priya Rao", phone: "9876501234", email: "priya@example.com", room: "102", checkin: localDate(), checkout: localDate(1), amount: 5200, status: "Checked In", notes: "" },
      { id: "HV003", guest: "Rahul Mehta", phone: "9988776655", email: "rahul@example.com", room: "201", checkin: localDate(-1), checkout: localDate(), amount: 4100, status: "Checked In", notes: "" },
      { id: "HV004", guest: "Sneha Iyer", phone: "9123456780", email: "sneha@example.com", room: "202", checkin: localDate(1), checkout: localDate(3), amount: 9600, status: "Confirmed", notes: "" },
      { id: "HV005", guest: "Karan Patel", phone: "9090909090", email: "karan@example.com", room: "301", checkin: localDate(), checkout: localDate(2), amount: 7200, status: "Confirmed", notes: "" }
    ],
    rooms: Array.from({ length: TOTAL_ROOMS }, (_, i) => {
      const number = String(101 + i);
      return {
        number,
        type: i % 4 === 0 ? "Deluxe" : i % 4 === 1 ? "Standard" : i % 4 === 2 ? "Suite" : "Premium",
        status: i < 5 ? "Occupied" : i < 8 ? "Cleaning" : i < 10 ? "Maintenance" : "Available"
      };
    })
  };
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.reservations) && Array.isArray(parsed.rooms)) return parsed;
    }
  } catch (error) {
    console.error("Could not load saved hotel data:", error);
  }
  return sampleData();
}

let data = loadData();
let toastTimer;

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    notify("Could not save data in this browser.");
  }
}

function notify(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function statusBadge(status) {
  return <span class="badge ${statusClass(status)}">${escapeHTML(status)}</span>;
}

function roomForBooking(reservation) {
  return data.rooms.find(room => room.number === reservation.room);
}

function syncRoomStatuses() {
  data.rooms.forEach(room => {
    const active = data.reservations.find(r =>
      r.room === room.number && r.status === "Checked In"
    );
    if (active) room.status = "Occupied";
    else if (room.status === "Occupied") room.status = "Available";
  });
}

function showView(view) {
  $$(".view").forEach(section => section.classList.toggle("active", section.id === view));
  $$(".nav").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  $("#pageTitle").textContent = ({
    dashboard: "Overview",
    reservations: "Reservations",
    rooms: "Room Management",
    guests: "Guests",
    housekeeping: "Housekeeping"
  })[view] || "Overview";

  $(".sidebar").classList.remove("open");
  renderAll();
}

function availableRooms() {
  return data.rooms.filter(room => room.status === "Available");
}

function renderDashboard() {
  const occupied = data.rooms.filter(r => r.status === "Occupied").length;
  const arrivals = data.reservations.filter(r => r.checkin === localDate() && !["Cancelled", "Checked Out"].includes(r.status));
  const departures = data.reservations.filter(r => r.checkout === localDate() && r.status === "Checked In");
  const revenue = data.reservations.filter(r => r.checkin === localDate() && r.status !== "Cancelled").reduce((sum, r) => sum + Number(r.amount || 0), 0);

  $("#occupancy").textContent = Math.round(occupied / data.rooms.length * 100) + "%";
  $("#arrivals").textContent = arrivals.length;
  $("#departures").textContent = departures.length;
  $("#revenue").textContent = money(revenue);

  const rows = data.reservations.filter(r =>
    r.checkin === localDate() || r.checkout === localDate()
  ).slice(0, 10);

  $("#dashboardTable").innerHTML = rows.length ? rows.map(r => `
    <tr>
      <td><strong>${escapeHTML(r.id)}</strong></td>
      <td>${escapeHTML(r.guest)}</td>
      <td>${escapeHTML(r.room)}</td>
      <td>${escapeHTML(r.checkin)}</td>
      <td>${escapeHTML(r.checkout)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${reservationAction(r)}</td>
    </tr>).join("") : `<tr><td colspan="7" class="empty">No arrivals or departures scheduled for today.</td></tr>;

  const counts = {
    Occupied: data.rooms.filter(r => r.status === "Occupied").length,
    Available: data.rooms.filter(r => r.status === "Available").length,
    Cleaning: data.rooms.filter(r => r.status === "Cleaning").length,
    Maintenance: data.rooms.filter(r => r.status === "Maintenance").length
  };

  $("#roomSummary").innerHTML = Object.entries(counts).map(([name, count]) => `
    <div><strong>${count}</strong>${statusBadge(name)}<span>${name} rooms</span></div>
  `).join("");
}

function reservationAction(r) {
  if (r.status === "Confirmed") return <button class="action-btn" data-action="checkin" data-id="${escapeHTML(r.id)}">Check in</button>;
  if (r.status === "Checked In") return <button class="action-btn" data-action="checkout" data-id="${escapeHTML(r.id)}">Check out</button>;
  return <span class="muted">—</span>;
}

function renderReservations() {
  const search = ($("#searchBookings")?.value || "").toLowerCase();
  const filter = $("#filterStatus")?.value || "";
  const rows = data.reservations.filter(r => {
    const matches = [r.id, r.guest, r.phone, r.room].some(value => String(value).toLowerCase().includes(search));
    return matches && (!filter || r.status === filter);
  });

  $("#reservationsTable").innerHTML = rows.length ? rows.map(r => `
    <tr>
      <td><strong>${escapeHTML(r.id)}</strong></td>
      <td>${escapeHTML(r.guest)}</td>
      <td>${escapeHTML(r.phone)}</td>
      <td>${escapeHTML(r.room)}</td>
      <td>${escapeHTML(r.checkin)}<br><span class="muted">to ${escapeHTML(r.checkout)}</span></td>
      <td>${money(r.amount)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${reservationAction(r)}</td>
    </tr>).join("") : `<tr><td colspan="8" class="empty">No matching reservations.</td></tr>;
}

function renderRooms() {
  $("#roomGrid").innerHTML = data.rooms.map(room => `
    <article class="room-card">
      <h3>Room ${escapeHTML(room.number)}</h3>
      <p>${escapeHTML(room.type)}</p>
      ${statusBadge(room.status)}
      <label class="muted" style="display:block;margin-top:14px">Update status</label>
      <select data-room="${escapeHTML(room.number)}" aria-label="Status for room ${escapeHTML(room.number)}">
        ${["Available", "Occupied", "Cleaning", "Maintenance"].map(status =>
          <option ${room.status === status ? "selected" : ""}>${status}</option>
        ).join("")}
      </select>
    </article>
  `).join("");
}

function renderGuests() {
  const guests = new Map();
  data.reservations.forEach(r => {
    const existing = guests.get(r.phone);
    if (existing) existing.bookings++;
    else guests.set(r.phone, { ...r, bookings: 1 });
  });

  $("#guestsTable").innerHTML = [...guests.values()].map(g => `
    <tr>
      <td><strong>${escapeHTML(g.guest)}</strong></td>
      <td>${escapeHTML(g.phone)}</td>
      <td>${escapeHTML(g.email || "—")}</td>
      <td>${g.bookings}</td>
    </tr>
  ).join("") || `<tr><td colspan="4" class="empty">No guests yet.</td></tr>;
}

function renderHousekeeping() {
  $("#housekeepingTable").innerHTML = data.rooms.map(room => `
    <tr>
      <td><strong>${escapeHTML(room.number)}</strong></td>
      <td>${escapeHTML(room.type)}</td>
      <td>${statusBadge(room.status)}</td>
      <td>
        <select data-room="${escapeHTML(room.number)}">
          ${["Available", "Occupied", "Cleaning", "Maintenance"].map(status =>
            <option ${room.status === status ? "selected" : ""}>${status}</option>
          ).join("")}
        </select>
      </td>
    </tr>
  `).join("");
}

function populateRoomOptions() {
  const select = $("#bookingRoom");
  const current = select.value;
  const available = availableRooms();

  select.innerHTML = <option value="">Select an available room</option> + available.map(room =>
    <option value="${escapeHTML(room.number)}">Room ${escapeHTML(room.number)} — ${escapeHTML(room.type)}</option>
  ).join("");

  if (available.some(room => room.number === current)) select.value = current;
}

function renderAll() {
  syncRoomStatuses();
  renderDashboard();
  renderReservations();
  renderRooms();
  renderGuests();
  renderHousekeeping();
  populateRoomOptions();
  $("#reservationNavCount").textContent = data.reservations.filter(r => r.status === "Confirmed").length;
}

function openBookingDialog() {
  populateRoomOptions();
  if (!availableRooms().length) {
    notify("No available rooms. Update room status first.");
    return;
  }
  $("#bookingForm").reset();
  $("#bookingForm").elements.checkin.value = localDate();
  $("#bookingForm").elements.checkout.value = localDate(1);
  populateRoomOptions();
  $("#bookingDialog").showModal();
}

function createBooking(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const guest = String(form.get("guest")).trim();
  const phone = String(form.get("phone")).trim();
  const email = String(form.get("email")).trim();
  const roomNumber = String(form.get("room"));
  const checkin = String(form.get("checkin"));
  const checkout = String(form.get("checkout"));
  const amount = Number(form.get("amount"));

  if (!guest || !phone || !roomNumber) {
    notify("Please fill in all required fields.");
    return;
  }
  if (checkout <= checkin) {
    notify("Check-out must be after check-in.");
    return;
  }

  const room = data.rooms.find(r => r.number === roomNumber);
  if (!room || room.status !== "Available") {
    notify("That room is no longer available.");
    renderAll();
    return;
  }

  const id = "HV" + Date.now().toString().slice(-6);
  data.reservations.unshift({
    id, guest, phone, email, room: roomNumber, checkin, checkout,
    amount, status: "Confirmed", notes: String(form.get("notes") || "")
  });

  saveData();
  $("#bookingDialog").close();
  showView("reservations");
  notify("Reservation created successfully.");
}

function updateReservation(id, action) {
  const reservation = data.reservations.find(r => r.id === id);
  if (!reservation) return;

  if (action === "checkin") {
    const room = data.rooms.find(r => r.number === reservation.room);
    if (!room) return notify("Room not found.");
    if (room.status === "Maintenance" || room.status === "Cleaning") {
      return notify("Room must be ready before check-in.");
    }
    const conflict = data.reservations.some(r =>
      r.id !== id && r.room === reservation.room && r.status === "Checked In"
    );
    if (conflict) return notify("This room is already occupied.");

    reservation.status = "Checked In";
    room.status = "Occupied";
    saveData();
    renderAll();
    notify("Guest checked in successfully.");
  }

  if (action === "checkout") {
    reservation.status = "Checked Out";
    const room = data.rooms.find(r => r.number === reservation.room);
    if (room) room.status = "Cleaning";
    saveData();
    renderAll();
    notify("Guest checked out. Room sent for cleaning.");
  }
}

function exportReservations() {
  const headers = ["Booking ID", "Guest", "Phone", "Email", "Room", "Check-in", "Check-out", "Amount", "Status", "Notes"];
  const quote = value => "${String(value ?? "").replace(/"/g, '""')}";
  const csv = [
    headers.map(quote).join(","),
    ...data.reservations.map(r => [
      r.id, r.guest, r.phone, r.email, r.room, r.checkin, r.checkout, r.amount, r.status, r.notes
    ].map(quote).join(","))
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "haven-reservations.csv";
  link.click();
  URL.revokeObjectURL(url);
  notify("Reservations exported.");
}

$$(".nav").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

$$("[data-goto]").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.goto));
});

$("#newBooking").addEventListener("click", openBookingDialog);
$("#newBooking2").addEventListener("click", openBookingDialog);
$("#closeDialog").addEventListener("click", () => $("#bookingDialog").close());
$("#bookingForm").addEventListener("submit", createBooking);
$("#searchBookings").addEventListener("input", renderReservations);
$("#filterStatus").addEventListener("change", renderReservations);
$("#exportCsv").addEventListener("click", exportReservations);

$("#menuBtn")?.addEventListener("click", () => $(".sidebar").classList.toggle("open"));

document.addEventListener("click", event => {
  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    updateReservation(actionButton.dataset.id, actionButton.dataset.action);
  }
});

document.addEventListener("change", event => {
  const select = event.target.closest("select[data-room]");
  if (!select) return;

  const room = data.rooms.find(r => r.number === select.dataset.room);
  if (!room) return;

  const activeBooking = data.reservations.some(r =>
    r.room === room.number && r.status === "Checked In"
  );

  if (activeBooking && select.value !== "Occupied") {
    notify("Check out the guest before changing this room's status.");
    renderAll();
    return;
  }

  room.status = select.value;
  saveData();
  renderAll();
  notify(Room ${room.number} updated.);
});

$("#bookingForm").elements.checkin.addEventListener("change", () => {
  const checkin = $("#bookingForm").elements.checkin.value;
  const checkout = $("#bookingForm").elements.checkout;
  if (checkout.value <= checkin) {
    const next = new Date(checkin + "T12:00:00");
    next.setDate(next.getDate() + 1);
    checkout.value = ${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")};
  }
});

$("#todayLabel")?.replaceChildren(document.createTextNode(
  new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
));

renderAll();
