document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  const STORAGE_KEY = "havenHotelData";

  const today = () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
  };

  const addDays = (date, days) => {
    const result = new Date(date + "T12:00:00");
    result.setDate(result.getDate() + days);
    return result.toISOString().slice(0, 10);
  };

  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);

  const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value + "T12:00:00").toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  function createData() {
    return {
      rooms: Array.from({ length: 40 }, (_, index) => ({
        number: String(101 + index),
        type: index % 5 === 0 ? "Suite" :
              index % 2 === 0 ? "Deluxe" : "Standard",
        status: "Available"
      })),
      reservations: []
    };
  }

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.rooms) &&
            Array.isArray(parsed.reservations)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Could not load saved data:", error);
    }
    return createData();
  }

  let data = loadData();

  if (!Array.isArray(data.rooms)) data.rooms = [];
  if (!Array.isArray(data.reservations)) data.reservations = [];

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Could not save data:", error);
      toast("Could not save data in this browser.");
    }
  }

  function toast(message) {
    const element = $("#toast");
    if (!element) {
      alert(message);
      return;
    }

    element.textContent = message;
    element.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      element.classList.remove("show");
    }, 3000);
  }

  function roomFor(number) {
    return data.rooms.find((room) => String(room.number) === String(number));
  }

  function reservationFor(id) {
    return data.reservations.find((item) => String(item.id) === String(id));
  }

  // NAVIGATION
  function navigate(viewId) {
    const view = document.getElementById(viewId);

    if (!view || !view.classList.contains("view")) {
      console.warn("Navigation view not found:", viewId);
      return;
    }

    $$(".view").forEach((section) => {
      section.classList.toggle("active", section.id === viewId);
    });

    $$(".nav").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === viewId);
    });

    const titles = {
      dashboard: "Overview",
      reservations: "Reservations",
      rooms: "Room Management",
      guests: "Guests",
      housekeeping: "Housekeeping"
    };

    const title = $("#pageTitle");
    if (title) title.textContent = titles[viewId] || "Overview";

    $(".sidebar")?.classList.remove("open");
  }

  $$("[data-view]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.view));
  });

  $$("[data-goto]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.goto));
  });

  $("#menuBtn")?.addEventListener("click", () => {
    $(".sidebar")?.classList.toggle("open");
  });

  // RESERVATION FORM
  const dialog = $("#bookingDialog");
  const form = $("#bookingForm");
  const roomSelect = $("#bookingRoom");

  function roomAvailable(roomNumber, checkin, checkout) {
    const room = roomFor(roomNumber);
    if (!room || room.status !== "Available") return false;

    return !data.reservations.some((booking) => {
      if (
        String(booking.room) !== String(roomNumber) ||
        ["Cancelled", "Checked Out"].includes(booking.status)
      ) return false;

      return checkin < booking.checkout && checkout > booking.checkin;
    });
  }

  function updateRoomOptions() {
    if (!form || !roomSelect) return;

    const checkin = form.elements.namedItem("checkin").value;
    const checkout = form.elements.namedItem("checkout").value;
    const previous = roomSelect.value;

    roomSelect.innerHTML =
      '<option value="">Select an available room</option>';

    data.rooms.forEach((room) => {
      const available = checkin && checkout && checkout > checkin
        ? roomAvailable(room.number, checkin, checkout)
        : room.status === "Available";

      if (available) {
        const option = document.createElement("option");
        option.value = room.number;
        option.textContent = Room ${room.number} — ${room.type};
        roomSelect.appendChild(option);
      }
    });

    if ([...roomSelect.options].some((option) => option.value === previous)) {
      roomSelect.value = previous;
    }
  }

  function openReservation() {
    if (!dialog || !form) {
      alert("Reservation form is missing. Please check index.html.");
      return;
    }

    form.reset();

    const checkin = form.elements.namedItem("checkin");
    const checkout = form.elements.namedItem("checkout");

    checkin.value = addDays(today(), 1);
    checkin.min = today();
    checkout.value = addDays(today(), 2);
    checkout.min = addDays(checkin.value, 1);

    updateRoomOptions();

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  $("#newBooking")?.addEventListener("click", openReservation);
  $("#newBooking2")?.addEventListener("click", openReservation);

  $("#closeDialog")?.addEventListener("click", () => {
    if (dialog?.close) dialog.close();
    else dialog?.removeAttribute("open");
  });

  form?.elements.namedItem("checkin")?.addEventListener("change", () => {
    const checkin = form.elements.namedItem("checkin").value;
    const checkout = form.elements.namedItem("checkout");

    checkout.min = addDays(checkin, 1);
    if (checkout.value <= checkin) checkout.value = addDays(checkin, 1);

    updateRoomOptions();
  });

  form?.elements.namedItem("checkout")?.addEventListener("change", updateRoomOptions);

  // CREATE RESERVATION
  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const values = new FormData(form);
    const guest = String(values.get("guest") || "").trim();
    const phone = String(values.get("phone") || "").trim();
    const email = String(values.get("email") || "").trim();
    const room = String(values.get("room") || "");
    const checkin = String(values.get("checkin") || "");
    const checkout = String(values.get("checkout") || "");
    const amount = Number(values.get("amount"));
    const notes = String(values.get("notes") || "").trim();

    if (!guest || !phone || !room || !checkin || !checkout) {
      toast("Please fill in all required fields.");
      return;
    }

    if (checkout <= checkin) {
      toast("Check-out must be after check-in.");
      return;
    }

    if (checkin < today()) {
      toast("Check-in cannot be in the past.");
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      toast("Please enter a valid amount.");
      return;
    }

    if (!roomAvailable(room, checkin, checkout)) {
      toast("That room is no longer available for those dates.");
      updateRoomOptions();
      return;
    }

    data.reservations.unshift({
      id: "HV" + Date.now().toString().slice(-8),
      guest,
      phone,
      email,
      room,
      checkin,
      checkout,
      amount,
      notes,
      status: "Confirmed",
      createdAt: new Date().toISOString()
    });

    saveData();
    renderAll();

    if (dialog?.close) dialog.close();
    else dialog?.removeAttribute("open");

    toast("Reservation created successfully.");
  });

  // RESERVATION ACTIONS
  function checkIn(id) {
    const booking = reservationFor(id);
    if (!booking || booking.status !== "Confirmed") return;

    if (booking.checkin > today()) {
      toast("This reservation starts on " + formatDate(booking.checkin) + ".");
      return;
    }

    const room = roomFor(booking.room);
    if (!room || room.status !== "Available") {
      toast("This room is not available for check-in.");
      return;
    }

    booking.status = "Checked In";
    room.status = "Occupied";
    saveData();
    renderAll();
    toast("Guest checked in.");
  }

  function checkOut(id) {
    const booking = reservationFor(id);
    if (!booking || booking.status !== "Checked In") return;

    booking.status = "Checked Out";
    const room = roomFor(booking.room);
    if (room) room.status = "Cleaning";

    saveData();
    renderAll();
    toast("Guest checked out. Room sent for cleaning.");
  }

  function cancelBooking(id) {
    const booking = reservationFor(id);
    if (!booking || booking.status !== "Confirmed") return;

    booking.status = "Cancelled";
    saveData();
    renderAll();
    toast("Reservation cancelled.");
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    if (button.dataset.action === "checkin") checkIn(button.dataset.id);
    if (button.dataset.action === "checkout") checkOut(button.dataset.id);
    if (button.dataset.action === "cancel") cancelBooking(button.dataset.id);
  });

  function badge(status) {
    const safe = escapeHTML(status || "Unknown");
    const className = safe.toLowerCase().replace(/\s+/g, "-");
    return <span class="status ${className}">${safe}</span>;
  }

  function actions(booking) {
    if (booking.status === "Confirmed") {
      return `
        <button type="button" class="small-btn"
          data-action="checkin" data-id="${escapeHTML(booking.id)}">Check in</button>
        <button type="button" class="small-btn danger"
          data-action="cancel" data-id="${escapeHTML(booking.id)}">Cancel</button>`;
    }

    if (booking.status === "Checked In") {
      return `<button type="button" class="small-btn"
        data-action="checkout" data-id="${escapeHTML(booking.id)}">Check out</button>`;
    }

    return "—";
  }

  // DASHBOARD
  function renderDashboard() {
    const occupied = data.rooms.filter((room) => room.status === "Occupied").length;

    $("#occupancy").textContent = data.rooms.length
      ? Math.round(occupied / data.rooms.length * 100) + "%"
      : "0%";

    $("#arrivals").textContent = data.reservations.filter(
      (booking) => booking.checkin === today() && booking.status === "Confirmed"
    ).length;

    $("#departures").textContent = data.reservations.filter(
      (booking) => booking.checkout === today() && booking.status === "Checked In"
    ).length;

    const revenue = data.reservations
      .filter((booking) =>
        booking.checkin === today() &&
        ["Confirmed", "Checked In", "Checked Out"].includes(booking.status)
      )
      .reduce((sum, booking) => sum + (Number(booking.amount) || 0), 0);

    $("#revenue").textContent = money(revenue);

    const bookings = data.reservations.filter((booking) =>
      booking.checkin === today() ||
      booking.checkout === today() ||
      booking.status === "Checked In"
    ).slice(0, 10);

    $("#dashboardTable").innerHTML = bookings.length
      ? bookings.map((booking) => `
        <tr>
          <td>${escapeHTML(booking.id)}</td>
          <td>${escapeHTML(booking.guest)}</td>
          <td>${escapeHTML(booking.room)}</td>
          <td>${formatDate(booking.checkin)}</td>
          <td>${formatDate(booking.checkout)}</td>
          <td>${badge(booking.status)}</td>
          <td>${actions(booking)}</td>
        </tr>`).join("")
      : '<tr><td colspan="7">No reservations scheduled for today.</td></tr>';

    const counts = { Available: 0, Occupied: 0, Cleaning: 0, Maintenance: 0 };
    data.rooms.forEach((room) => {
      if (counts[room.status] !== undefined) counts[room.status]++;
    });

    $("#roomSummary").innerHTML = Object.entries(counts).map(([status, count]) => `
      <div class="summary-item">
        <span>${escapeHTML(status)}</span><strong>${count}</strong>
      </div>`).join("");
  }

  // RESERVATIONS TABLE
  function renderReservations() {
    const search = ($("#searchBookings")?.value || "").toLowerCase().trim();
    const filter = $("#filterStatus")?.value || "";

    const bookings = data.reservations.filter((booking) => {
      const text = [
        booking.id, booking.guest, booking.phone, booking.email, booking.room
      ].join(" ").toLowerCase();

      return text.includes(search) && (!filter || booking.status === filter);
    });

    $("#reservationsTable").innerHTML = bookings.length
      ? bookings.map((booking) => `
        <tr>
          <td>${escapeHTML(booking.id)}</td>
          <td>${escapeHTML(booking.guest)}</td>
          <td>${escapeHTML(booking.phone)}</td>
          <td>${escapeHTML(booking.room)}</td>
          <td>${formatDate(booking.checkin)} to ${formatDate(booking.checkout)}</td>
          <td>${money(booking.amount)}</td>
          <td>${badge(booking.status)}</td>
          <td>${actions(booking)}</td>
        </tr>`).join("")
      : '<tr><td colspan="8">No reservations found.</td></tr>';
  }

  $("#searchBookings")?.addEventListener("input", renderReservations);
  $("#filterStatus")?.addEventListener("change", renderReservations);

  // ROOMS
  function renderRooms() {
    $("#roomGrid").innerHTML = data.rooms.map((room) => `
      <article class="card room-card">
        <div class="room-number">Room ${escapeHTML(room.number)}</div>
        <p>${escapeHTML(room.type)}</p>
        ${badge(room.status)}
      </article>`).join("");
  }

  // GUESTS
  function renderGuests() {
    const guests = new Map();

    data.reservations.forEach((booking) => {
      const key = booking.phone || booking.email || booking.guest;

      if (!guests.has(key)) {
        guests.set(key, {
          guest: booking.guest,
          phone: booking.phone,
          email: booking.email,
          bookings: 0
        });
      }

      guests.get(key).bookings++;
    });

    const list = [...guests.values()];

    $("#guestsTable").innerHTML = list.length
      ? list.map((guest) => `
        <tr>
          <td>${escapeHTML(guest.guest)}</td>
          <td>${escapeHTML(guest.phone || "—")}</td>
          <td>${escapeHTML(guest.email || "—")}</td>
          <td>${guest.bookings}</td>
        </tr>`).join("")
      : '<tr><td colspan="4">No guest records yet.</td></tr>';
  }

  // HOUSEKEEPING
  function renderHousekeeping() {
    $("#housekeepingTable").innerHTML = data.rooms.map((room) => `
      <tr>
        <td>${escapeHTML(room.number)}</td>
        <td>${escapeHTML(room.type)}</td>
        <td>${badge(room.status)}</td>
        <td>
          <select data-room-status="${escapeHTML(room.number)}"
            aria-label="Room ${escapeHTML(room.number)} status">
            ${["Available", "Occupied", "Cleaning", "Maintenance"].map((status) => `
              <option value="${status}" ${room.status === status ? "selected" : ""}>
                ${status}
              </option>`).join("")}
          </select>
        </td>
      </tr>`).join("");
  }

  $("#housekeepingTable")?.addEventListener("change", (event) => {
    const select = event.target.closest("[data-room-status]");
    if (!select) return;

    const room = roomFor(select.dataset.roomStatus);
    if (!room) return;

    const activeGuest = data.reservations.some((booking) =>
      String(booking.room) === String(room.number) &&
      booking.status === "Checked In"
    );

    if (activeGuest && select.value !== "Occupied") {
      select.value = "Occupied";
      toast("A guest is currently checked into this room.");
      return;
    }

    room.status = select.value;
    saveData();
    renderAll();
    toast("Room status updated.");
  });

  // EXPORT RESERVATIONS TO CSV
  $("#exportCsv")?.addEventListener("click", () => {
    if (!data.reservations.length) {
      toast("No reservations to export yet.");
      return;
    }

    const fields = [
      ["Booking ID", "id"], ["Guest", "guest"], ["Phone", "phone"],
      ["Email", "email"], ["Room", "room"], ["Check-in", "checkin"],
      ["Check-out", "checkout"], ["Amount", "amount"],
      ["Status", "status"], ["Notes", "notes"]
    ];

    const cell = (value) => "${String(value ?? "").replace(/"/g, '""')}";
    const csv = [
      fields.map(([label]) => cell(label)).join(","),
      ...data.reservations.map((booking) =>
        fields.map(([, key]) => cell(booking[key])).join(",")
      )
    ].join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "haven-reservations-" + today() + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  // INITIAL RENDER
  function renderAll() {
    renderDashboard();
    renderReservations();
    renderRooms();
    renderGuests();
    renderHousekeeping();
    updateRoomOptions();
  }

  saveData();
  renderAll();

  console.log("Haven Hotel Management loaded successfully.");
});
