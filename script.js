// --- 1. STATE INITIALIZATION ---
let customers = JSON.parse(localStorage.getItem("customers")) || [];

// --- 2. DOM REFERENCES ---
const statTotal = document.getElementById("stat-total");
const statNew = document.getElementById("stat-new");
const statContacted = document.getElementById("stat-contacted");
const statInterested = document.getElementById("stat-interested");
const statClosed = document.getElementById("stat-closed");

const customerForm = document.getElementById("customer-form");
const editIndexInput = document.getElementById("edit-index");
const formHeading = document.getElementById("form-heading");
const submitBtn = document.querySelector("#customer-form button[type='submit']");
let cancelBtn = document.getElementById("cancel-btn");

if (!cancelBtn) {
  cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.id = "cancel-btn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.display = "none";
  cancelBtn.style.backgroundColor = "#64748b";
  cancelBtn.style.marginLeft = "8px";
  customerForm.appendChild(cancelBtn);
}

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const companyInput = document.getElementById("company");
const statusInput = document.getElementById("status");
const notesInput = document.getElementById("notes");

const tableBody = document.getElementById("customer-table-body");
const searchInput = document.getElementById("search-input");
const filterStatus = document.getElementById("filter-status");

// --- 3. STORAGE SYNC HELPER ---
function saveToStorage() {
  localStorage.setItem("customers", JSON.stringify(customers));
}

// --- 4. DASHBOARD UPDATE ---
function updateDashboard() {
  if (!statTotal) return;
  statTotal.textContent = customers.length;
  statNew.textContent = customers.filter(c => c.status === "New").length;
  statContacted.textContent = customers.filter(c => c.status === "Contacted").length;
  statInterested.textContent = customers.filter(c => c.status === "Interested").length;
  statClosed.textContent = customers.filter(c => c.status === "Closed").length;
}

// --- 5. RENDER TABLE WITH SEARCH & FILTER ---
function renderTable() {
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const selectedStatus = filterStatus ? filterStatus.value : "All";

  const filteredCustomers = customers.filter(customer => {
    const matchesName = customer.name.toLowerCase().includes(query);
    const matchesStatus = (selectedStatus === "All") || (customer.status === selectedStatus);
    return matchesName && matchesStatus;
  });

  tableBody.innerHTML = "";

  if (filteredCustomers.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 12px;">No matching records found</td></tr>`;
  } else {
    filteredCustomers.forEach(customer => {
      const originalIndex = customers.indexOf(customer);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><strong>${customer.name}</strong></td>
        <td>${customer.email}</td>
        <td>${customer.phone}</td>
        <td>${customer.company || "-"}</td>
        <td>${customer.status}</td>
        <td>
          <button type="button" onclick="editCustomer(${originalIndex})" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;">Edit</button>
          <button type="button" onclick="deleteCustomer(${originalIndex})" style="padding: 4px 8px; font-size: 12px; background-color: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  updateDashboard();
}

// --- 6. CREATE & UPDATE ---
customerForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const customerData = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    company: companyInput.value.trim(),
    status: statusInput.value,
    notes: notesInput.value.trim()
  };

  const currentIndex = parseInt(editIndexInput.value, 10);

  if (currentIndex === -1) {
    customers.push(customerData);
  } else {
    customers[currentIndex] = customerData;
    resetForm();
  }

  saveToStorage();
  renderTable();
  customerForm.reset();
});

// --- 7. EDIT PREPARATION ---
window.editCustomer = function (index) {
  const customer = customers[index];
  editIndexInput.value = index;

  nameInput.value = customer.name;
  emailInput.value = customer.email;
  phoneInput.value = customer.phone;
  companyInput.value = customer.company;
  statusInput.value = customer.status;
  notesInput.value = customer.notes;

  formHeading.textContent = "Edit Customer Details";
  submitBtn.textContent = "Update Customer";
  cancelBtn.style.display = "inline-block";

  customerForm.scrollIntoView({ behavior: "smooth" });
};

cancelBtn.addEventListener("click", resetForm);

function resetForm() {
  customerForm.reset();
  editIndexInput.value = "-1";
  formHeading.textContent = "Add Customer Details";
  submitBtn.textContent = "Add Customer";
  cancelBtn.style.display = "none";
}

// --- 8. DELETE ---
window.deleteCustomer = function (index) {
  if (confirm(`Delete record for ${customers[index].name}?`)) {
    customers.splice(index, 1);
    saveToStorage();
    renderTable();

    if (parseInt(editIndexInput.value, 10) === index) {
      resetForm();
    }
  }
};

// --- 9. EVENT LISTENERS & INITIAL LOAD ---
if (searchInput) searchInput.addEventListener("input", renderTable);
if (filterStatus) filterStatus.addEventListener("change", renderTable);

renderTable();