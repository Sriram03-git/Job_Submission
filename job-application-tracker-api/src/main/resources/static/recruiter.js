const API_BASE_URL = "/api/applications";

const applicationsListBody = document.getElementById("applications-list");
const totalAppsSpan = document.getElementById("total-apps");
const selectedAppsSpan = document.getElementById("selected-apps");
const rejectedAppsSpan = document.getElementById("rejected-apps");
const themeToggle = document.getElementById("theme-toggle");

// --- Theme and UI Helpers ---

// Custom Modal Implementation (to replace alert/confirm)
const customModal = document.getElementById("custom-modal");
const modalMessage = document.getElementById("modal-message");
const modalActions = document.getElementById("modal-actions");

function showModal(message, isConfirmation = false, onConfirm = () => {}) {
  modalMessage.textContent = message;
  modalActions.innerHTML = ""; // Clear previous buttons

  const closeBtn = document.createElement("button");
  closeBtn.textContent = isConfirmation ? "Cancel" : "Close";
  closeBtn.className = "btn btn-secondary";
  closeBtn.onclick = () => (customModal.style.display = "none");
  modalActions.appendChild(closeBtn);

  if (isConfirmation) {
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Confirm";
    confirmBtn.className = "btn btn-primary";
    confirmBtn.onclick = () => {
      customModal.style.display = "none";
      onConfirm();
    };
    modalActions.appendChild(confirmBtn);
  }

  customModal.style.display = "flex";
}

// Theme Toggle Logic
function initializeTheme() {
  const isDark = localStorage.getItem("theme") === "dark";
  if (isDark) {
    document.body.classList.add("dark");
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  } else {
    document.body.classList.remove("dark");
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.innerHTML = isDark
    ? '<i class="fas fa-moon"></i>'
    : '<i class="fas fa-sun"></i>';
});

// --- Application Logic ---

// Fetch and render statistics summary
async function loadStatistics() {
  try {
    const totalResponse = await fetch(`${API_BASE_URL}/statistics/total`);
    const total = await totalResponse.text();
    totalAppsSpan.textContent = total || "0";

    const statusResponse = await fetch(`${API_BASE_URL}/statistics/byStatus`);
    const statusCounts = statusResponse.ok ? await statusResponse.json() : {};

    // Summing Selected and Offer
    selectedAppsSpan.textContent =
      (statusCounts.Selected || 0) + (statusCounts.Offer || 0);
    rejectedAppsSpan.textContent = statusCounts.Rejected || 0;
  } catch (error) {
    totalAppsSpan.textContent = "0";
    selectedAppsSpan.textContent = "0";
    rejectedAppsSpan.textContent = "0";
    console.error("Error loading statistics:", error);
  }
}

// Update application status (API call)
async function updateApplicationStatus(id, newStatus, name) {
  showModal(`Change status for ${name} to ${newStatus}?`, true, async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        showModal(`Status for ${name} updated to ${newStatus}.`, false);
        // Reload data after successful update
        loadApplications();
        loadStatistics();
      } else {
        showModal(`Failed to update status for ${name}.`, false);
      }
    } catch (error) {
      showModal(`Could not connect to the API server to update status.`, false);
      console.error("Error updating status:", error);
    }
  });
}

// Renders the list of applications into the table body
function renderApplications(apps) {
  applicationsListBody.innerHTML = ""; // Clear previous rows

  apps.forEach((app) => {
    const row = document.createElement("tr");

    // Helper to create a cell with content
    const createCell = (content) => {
      const cell = document.createElement("td");
      cell.innerHTML = content;
      return cell;
    };

    // Table Cells
    row.appendChild(createCell(app.id));
    row.appendChild(createCell(`<strong>${app.name}</strong>`));
    row.appendChild(
      createCell(`
        <a href="mailto:${app.emailId}">${app.emailId}</a><br>
        <a href="tel:${app.mobileNumber}">${app.mobileNumber}</a>
    `)
    );
    row.appendChild(createCell(app.experienceRange));
    row.appendChild(createCell(app.jobRole));
    row.appendChild(
      createCell(
        `<span class="status-cell-${app.status.replace(/[^a-zA-Z]/g, "")}">${
          app.status
        }</span>`
      )
    );
    row.appendChild(
      createCell(new Date(app.applicationTimestamp).toLocaleString())
    );

    // Actions Cell
    const actionsCell = document.createElement("td");
    const actionsGroup = document.createElement("div");
    actionsGroup.className = "actions-group";

    // View Resume Link/Button
    const viewResumeBtn = document.createElement("a");
    viewResumeBtn.textContent = "Resume";
    viewResumeBtn.className = "btn btn-secondary";
    viewResumeBtn.href = `${API_BASE_URL}/resume/${app.id}`;
    viewResumeBtn.target = "_blank"; // Open in new tab
    actionsGroup.appendChild(viewResumeBtn);

    // Interview Button
    const interviewBtn = document.createElement("button");
    interviewBtn.textContent = "Interview";
    interviewBtn.className = "btn btn-warning";
    interviewBtn.onclick = () =>
      updateApplicationStatus(app.id, "Interview", app.name);
    actionsGroup.appendChild(interviewBtn);

    // Select/Offer Button
    const selectBtn = document.createElement("button");
    selectBtn.textContent = "Offer";
    selectBtn.className = "btn btn-primary";
    selectBtn.onclick = () =>
      updateApplicationStatus(app.id, "Offer", app.name);
    actionsGroup.appendChild(selectBtn);

    // Reject Button
    const rejectBtn = document.createElement("button");
    rejectBtn.textContent = "Reject";
    rejectBtn.className = "btn btn-delete";
    rejectBtn.onclick = () =>
      updateApplicationStatus(app.id, "Rejected", app.name);
    actionsGroup.appendChild(rejectBtn);

    actionsCell.appendChild(actionsGroup);
    row.appendChild(actionsCell);

    applicationsListBody.appendChild(row);
  });
}

// Load applications from API
async function loadApplications() {
  applicationsListBody.innerHTML =
    "<tr><td colspan='8'>Loading applications...</td></tr>";
  try {
    const response = await fetch(API_BASE_URL);
    const apps = await response.json();
    if (Array.isArray(apps) && apps.length > 0) {
      renderApplications(apps);
    } else {
      applicationsListBody.innerHTML =
        "<tr><td colspan='8'>No applications yet.</td></tr>";
    }
  } catch (error) {
    applicationsListBody.innerHTML = `<tr><td colspan='8' style="color: var(--color-error);">Error loading data. Is the backend server running?</td></tr>`;
    console.error("Fetch error:", error);
  }
}

function init() {
  initializeTheme();
  loadStatistics();
  loadApplications();
}

// Initialize on window load
window.onload = init;
