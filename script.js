// ============================================================
// LEAD MANAGEMENT DASHBOARD
// ============================================================


// ============================================================
// 1. SAFE STORAGE
// ============================================================

function loadCustomers() {
  try {
    const saved = localStorage.getItem("customers");

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];

  } catch (error) {
    console.error("Could not load customers:", error);
    return [];
  }
}


function loadActivities() {
  try {
    const saved = localStorage.getItem("activities");

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];

  } catch (error) {
    console.error("Could not load activities:", error);
    return [];
  }
}


let customers = loadCustomers();
let activities = loadActivities();

let statusChart = null;
let companyChart = null;
let leadTrendChart = null;


// ============================================================
// 2. DOM REFERENCES
// ============================================================

const statTotal = document.getElementById("stat-total");
const statNew = document.getElementById("stat-new");
const statContacted = document.getElementById("stat-contacted");
const statInterested = document.getElementById("stat-interested");
const statClosed = document.getElementById("stat-closed");
const statConversion = document.getElementById("stat-conversion");

const customerForm = document.getElementById("customer-form");
const editIndexInput = document.getElementById("edit-index");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-edit");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const companyInput = document.getElementById("company");
const statusInput = document.getElementById("status");
const priorityInput = document.getElementById("priority");
const followUpDateInput = document.getElementById("followUpDate");
const notesInput = document.getElementById("notes");

const tableBody = document.getElementById("customer-table-body");
const searchInput = document.getElementById("search-input");
const filterStatus = document.getElementById("filter-status");
const filterPriority = document.getElementById("filter-priority");

const followUpList = document.getElementById("followUpList");
const activityList = document.getElementById("activityList");
const exportBtn = document.getElementById("export-btn");
const themeToggle = document.getElementById("theme-toggle");


// ============================================================
// 3. STORAGE FUNCTIONS
// ============================================================

function saveToStorage() {
  try {
    localStorage.setItem(
      "customers",
      JSON.stringify(customers)
    );

    console.log("Customers saved:", customers);

  } catch (error) {
    console.error("Could not save customers:", error);
    alert("Unable to save the lead data in this browser.");
  }
}


function saveActivities() {
  try {
    localStorage.setItem(
      "activities",
      JSON.stringify(activities)
    );
  } catch (error) {
    console.error("Could not save activities:", error);
  }
}


// ============================================================
// 4. SECURITY HELPER
// ============================================================

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================================
// 5. ACTIVITY
// ============================================================

function addActivity(message) {

  activities.unshift({
    message: message,
    time: new Date().toLocaleString()
  });

  activities = activities.slice(0, 10);

  saveActivities();

  updateActivity();
}


function updateActivity() {

  if (!activityList) {
    return;
  }

  activityList.innerHTML = "";

  if (activities.length === 0) {

    activityList.innerHTML = `
      <div class="empty-state">
        No recent activity
      </div>
    `;

    return;
  }

  activities.forEach(activity => {

    const item = document.createElement("div");

    item.className = "activity-item";

    item.innerHTML = `
      <div class="activity-content">
        <strong>${escapeHTML(activity.message)}</strong>
        <span>${escapeHTML(activity.time)}</span>
      </div>
    `;

    activityList.appendChild(item);

  });
}


// ============================================================
// 6. DASHBOARD
// ============================================================

function updateDashboard() {

  const total = customers.length;

  const newLeads = customers.filter(
    customer => customer.status === "New"
  ).length;

  const contacted = customers.filter(
    customer => customer.status === "Contacted"
  ).length;

  const interested = customers.filter(
    customer => customer.status === "Interested"
  ).length;

  const closed = customers.filter(
    customer => customer.status === "Closed"
  ).length;


  if (statTotal) {
    statTotal.textContent = total;
  }

  if (statNew) {
    statNew.textContent = newLeads;
  }

  if (statContacted) {
    statContacted.textContent = contacted;
  }

  if (statInterested) {
    statInterested.textContent = interested;
  }

  if (statClosed) {
    statClosed.textContent = closed;
  }


  const conversionRate =
    total === 0
      ? 0
      : ((closed / total) * 100).toFixed(1);


  if (statConversion) {
    statConversion.textContent =
      `${conversionRate}%`;
  }


  updateCharts();
  updateFollowUps();
}


// ============================================================
// 7. STATUS CHART
// ============================================================

function updateStatusChart() {

  const canvas =
    document.getElementById("statusChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }


  if (statusChart) {
    statusChart.destroy();
  }


  const counts = {
    New: 0,
    Contacted: 0,
    Interested: 0,
    Closed: 0
  };


  customers.forEach(customer => {

    if (
      Object.prototype.hasOwnProperty.call(
        counts,
        customer.status
      )
    ) {
      counts[customer.status]++;
    }

  });


  statusChart = new Chart(canvas, {

    type: "doughnut",

    data: {
      labels: Object.keys(counts),

      datasets: [
        {
          label: "Leads",
          data: Object.values(counts)
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }

  });
}


// ============================================================
// 8. COMPANY CHART
// ============================================================

function updateCompanyChart() {

  const canvas =
    document.getElementById("companyChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }


  if (companyChart) {
    companyChart.destroy();
  }


  const companyCounts = {};


  customers.forEach(customer => {

    const company =
      (customer.company || "Unknown").trim() ||
      "Unknown";

    companyCounts[company] =
      (companyCounts[company] || 0) + 1;

  });


  companyChart = new Chart(canvas, {

    type: "bar",

    data: {
      labels: Object.keys(companyCounts),

      datasets: [
        {
          label: "Number of Leads",
          data: Object.values(companyCounts)
        }
      ]
    },

    options: {

      responsive: true,
      maintainAspectRatio: false,

      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      },

      plugins: {
        legend: {
          display: false
        }
      }

    }

  });
}


// ============================================================
// 9. LEAD TREND CHART
// ============================================================

function updateLeadTrendChart() {

  const canvas =
    document.getElementById("leadTrendChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }


  if (leadTrendChart) {
    leadTrendChart.destroy();
  }


  const dateCounts = {};


  customers.forEach(customer => {

    if (!customer.createdAt) {
      return;
    }


    const date =
      new Date(customer.createdAt)
        .toLocaleDateString();


    dateCounts[date] =
      (dateCounts[date] || 0) + 1;

  });


  leadTrendChart = new Chart(canvas, {

    type: "line",

    data: {

      labels: Object.keys(dateCounts),

      datasets: [
        {
          label: "Leads Added",
          data: Object.values(dateCounts),
          tension: 0.3,
          fill: false
        }
      ]

    },

    options: {

      responsive: true,
      maintainAspectRatio: false,

      scales: {

        y: {
          beginAtZero: true,

          ticks: {
            stepSize: 1
          }

        }

      }

    }

  });
}


// ============================================================
// 10. UPDATE CHARTS
// ============================================================

function updateCharts() {

  updateStatusChart();
  updateCompanyChart();
  updateLeadTrendChart();

}


// ============================================================
// 11. RENDER TABLE
// ============================================================

function renderTable() {

  if (!tableBody) {
    return;
  }


  const query =
    searchInput
      ? searchInput.value.toLowerCase().trim()
      : "";


  const selectedStatus =
    filterStatus
      ? filterStatus.value
      : "All";


  const selectedPriority =
    filterPriority
      ? filterPriority.value
      : "All";


  const filteredCustomers =
    customers.filter(customer => {

      const name =
        (customer.name || "").toLowerCase();

      const email =
        (customer.email || "").toLowerCase();

      const company =
        (customer.company || "").toLowerCase();


      const matchesSearch =
        name.includes(query) ||
        email.includes(query) ||
        company.includes(query);


      const matchesStatus =
        selectedStatus === "All" ||
        customer.status === selectedStatus;


      const priority =
        customer.priority || "Medium";


      const matchesPriority =
        selectedPriority === "All" ||
        priority === selectedPriority;


      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );

    });


  tableBody.innerHTML = "";


  if (filteredCustomers.length === 0) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="8"
            style="
              text-align:center;
              color:#64748b;
              padding:20px;
            ">
          No matching records found
        </td>
      </tr>
    `;

  } else {

    filteredCustomers.forEach(customer => {

      const originalIndex =
        customers.indexOf(customer);


      const priority =
        customer.priority || "Medium";


      const priorityClass =
        priority.toLowerCase();


      let followUp = "-";


      if (customer.followUpDate) {

        const date =
          new Date(customer.followUpDate);

        if (!isNaN(date.getTime())) {

          followUp =
            date.toLocaleDateString();

        }

      }


      const status =
        customer.status || "New";


      const statusClass =
        status.toLowerCase();


      const row =
        document.createElement("tr");


      row.innerHTML = `

        <td>
          <strong>
            ${escapeHTML(customer.name)}
          </strong>
        </td>

        <td>
          ${escapeHTML(customer.email)}
        </td>

        <td>
          ${escapeHTML(customer.phone)}
        </td>

        <td>
          ${escapeHTML(customer.company || "-")}
        </td>

        <td>
          <span class="status-badge status-${escapeHTML(statusClass)}">
            ${escapeHTML(status)}
          </span>
        </td>

        <td>
          <span class="priority-badge priority-${escapeHTML(priorityClass)}">
            ${escapeHTML(priority)}
          </span>
        </td>

        <td>
          ${escapeHTML(followUp)}
        </td>

        <td>

          <button
            type="button"
            class="edit-btn"
            onclick="editCustomer(${originalIndex})">
            Edit
          </button>

          <button
            type="button"
            class="delete-btn"
            onclick="deleteCustomer(${originalIndex})">
            Delete
          </button>

        </td>

      `;


      tableBody.appendChild(row);

    });

  }


  updateDashboard();

}


// ============================================================
// 12. ADD / UPDATE CUSTOMER
// ============================================================

if (customerForm) {

  customerForm.addEventListener(
    "submit",
    function (event) {

      event.preventDefault();


      const currentIndex =
        parseInt(
          editIndexInput.value,
          10
        );


      const existingCustomer =
        currentIndex >= 0
          ? customers[currentIndex]
          : null;


      const customerData = {

        name:
          nameInput.value.trim(),

        email:
          emailInput.value.trim(),

        phone:
          phoneInput.value.trim(),

        company:
          companyInput.value.trim(),

        status:
          statusInput.value,

        priority:
          priorityInput.value || "Medium",

        followUpDate:
          followUpDateInput.value,

        notes:
          notesInput.value.trim(),

        createdAt:
          existingCustomer?.createdAt ||
          new Date().toISOString()

      };


      // -----------------------------
      // ADD
      // -----------------------------

      if (
        isNaN(currentIndex) ||
        currentIndex === -1
      ) {

        customers.push(customerData);

        saveToStorage();

        addActivity(
          `Added lead - ${customerData.name}`
        );

      }


      // -----------------------------
      // UPDATE
      // -----------------------------

      else if (
        currentIndex >= 0 &&
        currentIndex < customers.length
      ) {

        customers[currentIndex] =
          customerData;

        saveToStorage();

        addActivity(
          `Updated lead - ${customerData.name}`
        );

      }


      resetForm();

      renderTable();

    }
  );

}


// ============================================================
// 13. EDIT CUSTOMER
// ============================================================

window.editCustomer =
  function (index) {

    const customer =
      customers[index];


    if (!customer) {
      return;
    }


    editIndexInput.value =
      index;


    nameInput.value =
      customer.name || "";

    emailInput.value =
      customer.email || "";

    phoneInput.value =
      customer.phone || "";

    companyInput.value =
      customer.company || "";

    statusInput.value =
      customer.status || "New";

    priorityInput.value =
      customer.priority || "Medium";

    followUpDateInput.value =
      customer.followUpDate || "";

    notesInput.value =
      customer.notes || "";


    submitBtn.textContent =
      "Update Customer";


    if (cancelBtn) {
      cancelBtn.style.display =
        "inline-block";
    }


    customerForm.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  };


// ============================================================
// 14. RESET FORM
// ============================================================

function resetForm() {

  if (customerForm) {
    customerForm.reset();
  }


  if (editIndexInput) {
    editIndexInput.value = "-1";
  }


  if (submitBtn) {
    submitBtn.textContent =
      "Add Customer";
  }


  if (cancelBtn) {
    cancelBtn.style.display =
      "none";
  }


  if (priorityInput) {
    priorityInput.value =
      "Medium";
  }

}


// ============================================================
// 15. CANCEL EDIT
// ============================================================

if (cancelBtn) {

  cancelBtn.addEventListener(
    "click",
    resetForm
  );

}


// ============================================================
// 16. DELETE CUSTOMER
// ============================================================

window.deleteCustomer =
  function (index) {

    const customer =
      customers[index];


    if (!customer) {
      return;
    }


    if (
      !confirm(
        `Delete record for ${customer.name}?`
      )
    ) {
      return;
    }


    const deletedName =
      customer.name;


    customers.splice(index, 1);


    saveToStorage();


    addActivity(
      `Deleted lead - ${deletedName}`
    );


    if (
      editIndexInput &&
      parseInt(
        editIndexInput.value,
        10
      ) === index
    ) {

      resetForm();

    }


    renderTable();

  };


// ============================================================
// 17. FOLLOW-UPS
// ============================================================

function updateFollowUps() {

  if (!followUpList) {
    return;
  }


  followUpList.innerHTML = "";


  const upcoming =
    customers
      .filter(
        customer =>
          customer.followUpDate
      )
      .sort(
        (a, b) =>
          new Date(a.followUpDate) -
          new Date(b.followUpDate)
      )
      .slice(0, 5);


  if (upcoming.length === 0) {

    followUpList.innerHTML = `
      <div class="empty-state">
        No upcoming follow-ups
      </div>
    `;

    return;
  }


  const today =
    new Date();

  today.setHours(0, 0, 0, 0);


  upcoming.forEach(customer => {

    const date =
      new Date(customer.followUpDate);

    date.setHours(0, 0, 0, 0);


    let label =
      date.toLocaleDateString();


    if (
      date.getTime() ===
      today.getTime()
    ) {

      label = "Today";

    } else {

      const tomorrow =
        new Date(today);

      tomorrow.setDate(
        tomorrow.getDate() + 1
      );


      if (
        date.getTime() ===
        tomorrow.getTime()
      ) {

        label = "Tomorrow";

      }

    }


    const item =
      document.createElement("div");


    item.className =
      "follow-up-item";


    item.innerHTML = `

      <div>
        <strong>
          ${escapeHTML(customer.name)}
        </strong>

        <span>
          ${escapeHTML(
            customer.company || "No company"
          )}
        </span>
      </div>

      <div>
        <strong>
          ${escapeHTML(label)}
        </strong>

        <span>
          ${escapeHTML(
            customer.status || "New"
          )}
        </span>
      </div>

    `;


    followUpList.appendChild(item);

  });

}


// ============================================================
// 18. CSV EXPORT
// ============================================================

function exportCSV() {

  if (customers.length === 0) {

    alert(
      "No leads available to export."
    );

    return;
  }


  const headers = [
    "Name",
    "Email",
    "Phone",
    "Company",
    "Status",
    "Priority",
    "Follow-up Date",
    "Notes"
  ];


  const rows =
    customers.map(customer => [

      customer.name || "",
      customer.email || "",
      customer.phone || "",
      customer.company || "",
      customer.status || "",
      customer.priority || "Medium",
      customer.followUpDate || "",
      customer.notes || ""

    ]);


  const csvContent =
    [headers, ...rows]
      .map(row =>
        row.map(value =>
          `"${String(value).replace(/"/g, '""')}"`
        ).join(",")
      )
      .join("\n");


  const blob =
    new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;
  link.download =
    "lead-management-data.csv";


  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);


  addActivity(
    "Exported leads to CSV"
  );

}


if (exportBtn) {

  exportBtn.addEventListener(
    "click",
    exportCSV
  );

}


// ============================================================
// 19. DARK MODE
// ============================================================

function loadTheme() {

  const savedTheme =
    localStorage.getItem("theme");


  if (
    savedTheme === "dark"
  ) {

    document.body.classList.add(
      "dark-mode"
    );


    if (themeToggle) {

      themeToggle.textContent =
        "Light Mode";

    }

  }

}


if (themeToggle) {

  themeToggle.addEventListener(
    "click",
    function () {

      document.body.classList.toggle(
        "dark-mode"
      );


      const dark =
        document.body.classList.contains(
          "dark-mode"
        );


      localStorage.setItem(
        "theme",
        dark ? "dark" : "light"
      );


      themeToggle.textContent =
        dark
          ? "Light Mode"
          : "Dark Mode";

    }
  );

}


// ============================================================
// 20. FILTERS
// ============================================================

if (searchInput) {

  searchInput.addEventListener(
    "input",
    renderTable
  );

}


if (filterStatus) {

  filterStatus.addEventListener(
    "change",
    renderTable
  );

}


if (filterPriority) {

  filterPriority.addEventListener(
    "change",
    renderTable
  );

}


// ============================================================
// 21. INITIAL LOAD
// ============================================================

loadTheme();

renderTable();

updateActivity();

updateFollowUps();
