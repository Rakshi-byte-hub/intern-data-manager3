```javascript
// ============================================================
// LEAD MANAGEMENT DASHBOARD
// Enhanced version with Analytics, Priority, Follow-ups,
// Activity Tracking, CSV Export and Dark Mode
// ============================================================


// ============================================================
// 1. STATE INITIALIZATION
// ============================================================

let customers = JSON.parse(localStorage.getItem("customers")) || [];

let activities =
  JSON.parse(localStorage.getItem("activities")) || [];

let statusChart = null;
let companyChart = null;
let leadTrendChart = null;


// ============================================================
// 2. DOM REFERENCES
// ============================================================

// Dashboard cards
const statTotal = document.getElementById("stat-total");
const statNew = document.getElementById("stat-new");
const statContacted = document.getElementById("stat-contacted");
const statInterested = document.getElementById("stat-interested");
const statClosed = document.getElementById("stat-closed");
const statConversion = document.getElementById("stat-conversion");

// Form
const customerForm = document.getElementById("customer-form");
const editIndexInput = document.getElementById("edit-index");

const submitBtn = document.getElementById("submit-btn");

const cancelBtn =
  document.getElementById("cancel-edit");

const nameInput =
  document.getElementById("name");

const emailInput =
  document.getElementById("email");

const phoneInput =
  document.getElementById("phone");

const companyInput =
  document.getElementById("company");

const statusInput =
  document.getElementById("status");

const priorityInput =
  document.getElementById("priority");

const followUpDateInput =
  document.getElementById("followUpDate");

const notesInput =
  document.getElementById("notes");


// Search and filters
const tableBody =
  document.getElementById("customer-table-body");

const searchInput =
  document.getElementById("search-input");

const filterStatus =
  document.getElementById("filter-status");

const filterPriority =
  document.getElementById("filter-priority");


// Other sections
const followUpList =
  document.getElementById("followUpList");

const activityList =
  document.getElementById("activityList");

const exportBtn =
  document.getElementById("export-btn");

const themeToggle =
  document.getElementById("theme-toggle");


// ============================================================
// 3. HELPER FUNCTIONS
// ============================================================

// Escape user-entered text before placing it inside innerHTML.
// This prevents HTML entered into a customer field from
// becoming actual HTML on the page.

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
// 4. STORAGE
// ============================================================

function saveToStorage() {

  localStorage.setItem(
    "customers",
    JSON.stringify(customers)
  );
}


function saveActivities() {

  localStorage.setItem(
    "activities",
    JSON.stringify(activities)
  );
}


// ============================================================
// 5. ACTIVITY TRACKING
// ============================================================

function addActivity(message) {

  const activity = {

    message: message,

    time: new Date().toLocaleString()

  };

  activities.unshift(activity);

  // Keep only the latest 10 activities
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

    const item =
      document.createElement("div");

    item.className =
      "activity-item";

    item.innerHTML = `

      <div class="activity-content">

        <strong>
          ${escapeHTML(activity.message)}
        </strong>

        <small>
          ${escapeHTML(activity.time)}
        </small>

      </div>

    `;

    activityList.appendChild(item);

  });
}


// ============================================================
// 6. DASHBOARD UPDATE
// ============================================================

function updateDashboard() {

  if (!statTotal) {
    return;
  }


  const total =
    customers.length;


  const newLeads =
    customers.filter(
      c => c.status === "New"
    ).length;


  const contacted =
    customers.filter(
      c => c.status === "Contacted"
    ).length;


  const interested =
    customers.filter(
      c => c.status === "Interested"
    ).length;


  const closed =
    customers.filter(
      c => c.status === "Closed"
    ).length;


  statTotal.textContent =
    total;


  statNew.textContent =
    newLeads;


  statContacted.textContent =
    contacted;


  statInterested.textContent =
    interested;


  statClosed.textContent =
    closed;


  // Conversion rate
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

  updateActivity();
}


// ============================================================
// 7. STATUS CHART
// ============================================================

function updateStatusChart() {

  const canvas =
    document.getElementById("statusChart");

  if (!canvas) {
    return;
  }


  const statusCounts = {

    New: 0,

    Contacted: 0,

    Interested: 0,

    Closed: 0

  };


  customers.forEach(customer => {

    if (
      Object.prototype.hasOwnProperty.call(
        statusCounts,
        customer.status
      )
    ) {

      statusCounts[customer.status]++;

    }

  });


  if (statusChart) {

    statusChart.destroy();

  }


  statusChart = new Chart(canvas, {

    type: "doughnut",

    data: {

      labels: Object.keys(statusCounts),

      datasets: [

        {

          label: "Leads",

          data: Object.values(statusCounts)

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
// 8. COMPANY BAR CHART
// ============================================================

function updateCompanyChart() {

  const canvas =
    document.getElementById("companyChart");

  if (!canvas) {
    return;
  }


  const companyCounts = {};


  customers.forEach(customer => {

    const company =
      customer.company?.trim() ||
      "Unknown";


    if (!companyCounts[company]) {

      companyCounts[company] = 0;

    }


    companyCounts[company]++;

  });


  if (companyChart) {

    companyChart.destroy();

  }


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

  if (!canvas) {
    return;
  }


  /*
    Older leads may not have createdAt because they were
    created before this enhanced version.

    Therefore, we only use leads that have a createdAt date
    for the trend chart.
  */

  const datedCustomers =
    customers
      .filter(customer => customer.createdAt)
      .sort(
        (a, b) =>
          new Date(a.createdAt) -
          new Date(b.createdAt)
      );


  const dateCounts = {};


  datedCustomers.forEach(customer => {

    const date =
      new Date(customer.createdAt)
        .toLocaleDateString();


    if (!dateCounts[date]) {

      dateCounts[date] = 0;

    }


    dateCounts[date]++;

  });


  const labels =
    Object.keys(dateCounts);


  const values =
    Object.values(dateCounts);


  if (leadTrendChart) {

    leadTrendChart.destroy();

  }


  leadTrendChart = new Chart(canvas, {

    type: "line",

    data: {

      labels: labels,

      datasets: [

        {

          label: "Leads Added",

          data: values,

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
// 10. UPDATE ALL CHARTS
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

  const query =
    searchInput
      ? searchInput.value
          .toLowerCase()
          .trim()
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
        (customer.name || "")
          .toLowerCase();


      const email =
        (customer.email || "")
          .toLowerCase();


      const company =
        (customer.company || "")
          .toLowerCase();


      const matchesSearch =
        name.includes(query) ||
        email.includes(query) ||
        company.includes(query);


      const matchesStatus =
        selectedStatus === "All" ||
        customer.status === selectedStatus;


      const customerPriority =
        customer.priority || "Medium";


      const matchesPriority =
        selectedPriority === "All" ||
        customerPriority === selectedPriority;


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

        <td
          colspan="8"
          style="
            text-align:center;
            color:#64748b;
            padding:20px;
          "
        >

          No matching records found

        </td>

      </tr>

    `;

  }

  else {

    filteredCustomers.forEach(customer => {

      const originalIndex =
        customers.indexOf(customer);


      const priority =
        customer.priority || "Medium";


      const priorityClass =
        priority.toLowerCase();


      const followUp =
        customer.followUpDate
          ? new Date(
              customer.followUpDate
            ).toLocaleDateString()
          : "-";


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

          <span class="status-badge status-${escapeHTML(
            (customer.status || "New").toLowerCase()
          )}">

            ${escapeHTML(customer.status || "New")}

          </span>

        </td>


        <td>

          <span class="priority-badge priority-${priorityClass}">

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
            onclick="editCustomer(${originalIndex})"
          >
            Edit
          </button>


          <button
            type="button"
            class="delete-btn"
            onclick="deleteCustomer(${originalIndex})"
          >
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
// 12. CREATE / UPDATE CUSTOMER
// ============================================================

customerForm.addEventListener(
  "submit",
  function (e) {

    e.preventDefault();


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

      // Keep original creation date when editing
      createdAt:
        existingCustomer?.createdAt ||
        new Date().toISOString()

    };


    // CREATE
    if (currentIndex === -1) {

      customers.push(customerData);

      addActivity(
        `Added lead - ${customerData.name}`
      );

    }

    // UPDATE
    else {

      customers[currentIndex] =
        customerData;


      addActivity(
        `Updated lead - ${customerData.name}`
      );

    }


    saveToStorage();

    resetForm();

    renderTable();

  }
);


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

  customerForm.reset();


  editIndexInput.value =
    "-1";


  submitBtn.textContent =
    "Add Customer";


  if (cancelBtn) {

    cancelBtn.style.display =
      "none";

  }


  // Reset default priority
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


    const confirmed =
      confirm(
        `Delete record for ${customer.name}?`
      );


    if (!confirmed) {
      return;
    }


    const deletedName =
      customer.name;


    customers.splice(index, 1);


    saveToStorage();


    addActivity(
      `Deleted lead - ${deletedName}`
    );


    // If the deleted customer was being edited
    if (
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
// 17. UPCOMING FOLLOW-UPS
// ============================================================

function updateFollowUps() {

  if (!followUpList) {
    return;
  }


  followUpList.innerHTML = "";


  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


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


  upcoming.forEach(customer => {

    const date =
      new Date(
        customer.followUpDate
      );


    date.setHours(
      0,
      0,
      0,
      0
    );


    let dateLabel =
      date.toLocaleDateString();


    if (
      date.getTime() ===
      today.getTime()
    ) {

      dateLabel = "Today";

    }

    else {

      const tomorrow =
        new Date(today);

      tomorrow.setDate(
        tomorrow.getDate() + 1
      );


      if (
        date.getTime() ===
        tomorrow.getTime()
      ) {

        dateLabel =
          "Tomorrow";

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
          ${escapeHTML(customer.company || "No company")}
        </span>

      </div>


      <div>

        <strong>
          ${dateLabel}
        </strong>

        <small>
          ${escapeHTML(customer.status || "New")}
        </small>

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


  const csvRows = [

    headers,

    ...rows

  ];


  const csvContent =
    csvRows

      .map(row =>

        row.map(value => {

          const safeValue =
            String(value)
              .replace(/"/g, '""');

          return `"${safeValue}"`;

        }).join(",")

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


  link.href =
    url;


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
    localStorage.getItem(
      "theme"
    );


  if (savedTheme === "dark") {

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


      const isDark =
        document.body.classList.contains(
          "dark-mode"
        );


      localStorage.setItem(
        "theme",
        isDark ? "dark" : "light"
      );


      themeToggle.textContent =
        isDark
          ? "Light Mode"
          : "Dark Mode";

    }
  );

}


// ============================================================
// 20. EVENT LISTENERS
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
```
