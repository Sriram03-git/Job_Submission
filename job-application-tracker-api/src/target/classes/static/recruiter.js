const API_BASE_URL = 'http://localhost:8080/api/applications';

const applicationsListBody = document.getElementById('applications-list');
const totalAppsSpan = document.getElementById('total-apps');
const selectedAppsSpan = document.getElementById('selected-apps');
const rejectedAppsSpan = document.getElementById('rejected-apps');

// Fetch and render statistics summary
async function loadStatistics() {
  try {
    const total = await fetch(`${API_BASE_URL}/statistics/total`).then(r => r.text());
    totalAppsSpan.textContent = total || "0";
    const statusCounts = await fetch(`${API_BASE_URL}/statistics/byStatus`).then(r => r.ok ? r.json() : {});
    selectedAppsSpan.textContent = ((statusCounts.Selected || 0) + (statusCounts.Offer || 0));
    rejectedAppsSpan.textContent = statusCounts.Rejected || 0;
  } catch (error) {
    totalAppsSpan.textContent = "0";
    selectedAppsSpan.textContent = "0";
    rejectedAppsSpan.textContent = "0";
  }
}

// Update application status (API call)
async function updateApplicationStatus(id, newStatus, name) {
  if (!confirm(`Change status for ${name} to ${newStatus}?`)) return;
  try {
    const response = await fetch(`${API_BASE_URL}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (response.ok) {
      await loadStatistics();
      await loadApplications();
    } else {
      alert("Failed to update status.");
    }
  } catch (err) {
    alert("Error updating status.");
  }
}

// Render application rows
function renderApplications(applications) {
  applicationsListBody.innerHTML = "";
  applications.forEach(app => {
    const row = document.createElement("tr");

    // ID
    const idCell = document.createElement("td");
    idCell.textContent = app.id ?? "-";
    row.appendChild(idCell);

    // Candidate
    const nameCell = document.createElement("td");
    nameCell.textContent = app.name ?? "-";
    row.appendChild(nameCell);

    // Contact
    const contactCell = document.createElement("td");
    contactCell.innerHTML = `${app.emailId ?? "-"}<br>${app.mobileNumber ?? "-"}`;
    row.appendChild(contactCell);

    // Experience
    const expCell = document.createElement("td");
    expCell.textContent = app.experienceRange ?? "-";
    row.appendChild(expCell);

    // Job Role
    const jobRoleCell = document.createElement("td");
    jobRoleCell.textContent = app.jobRole ?? "-";
    row.appendChild(jobRoleCell);

    // Status
    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `status-${(app.status ?? "applied").toLowerCase()}`;
    badge.textContent = app.status ?? "Applied";
    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    // Submitted At
    const dateCell = document.createElement("td");
    dateCell.textContent = app.applicationTimestamp 
      ? new Date(app.applicationTimestamp).toLocaleString() 
      : "-";
    row.appendChild(dateCell);

    // Actions
    const actionsCell = document.createElement("td");
    const actionsGroup = document.createElement("div");
    actionsGroup.className = "actions-group";

    // Status Dropdown
    const statusOptions = ["Applied", "Interview", "Selected", "Rejected", "Offer"];
    const statusSelect = document.createElement("select");
    statusOptions.forEach(optText => {
      const opt = document.createElement("option");
      opt.value = optText;
      opt.textContent = optText;
      statusSelect.appendChild(opt);
    });
    statusSelect.value = app.status ?? "Applied";
    statusSelect.onchange = (e) => updateApplicationStatus(app.id, e.target.value, app.name);
    actionsGroup.appendChild(statusSelect);

    // View Resume
    const resumeLink = document.createElement("a");
    resumeLink.textContent = "View Resume";
    resumeLink.className = "btn link-btn";
    if (app.resumeFilename) {
      resumeLink.href = `${API_BASE_URL}/download/${app.resumeFilename}`;
      resumeLink.target = "_blank";
    } else {
      resumeLink.href = "#";
      resumeLink.onclick = (e) => {
        e.preventDefault();
        alert("Resume file not found.");
      };
    }
    actionsGroup.appendChild(resumeLink);

    // View Button
    const viewBtn = document.createElement("button");
    viewBtn.textContent = "View";
    viewBtn.className = "btn";
    viewBtn.onclick = () => alert(`View details for ID: ${app.id}`);
    actionsGroup.appendChild(viewBtn);

    // Edit Button
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn";
    editBtn.onclick = () => alert(`Edit application ID: ${app.id}`);
    actionsGroup.appendChild(editBtn);

    // Reject Button
    const rejectBtn = document.createElement("button");
    rejectBtn.textContent = "Reject";
    rejectBtn.className = "btn delete-btn";
    rejectBtn.onclick = () => {
      if (confirm("Reject this application?")) {
        updateApplicationStatus(app.id, "Rejected", app.name);
      }
    };
    actionsGroup.appendChild(rejectBtn);

    actionsCell.appendChild(actionsGroup);
    row.appendChild(actionsCell);

    applicationsListBody.appendChild(row);
  });
}

// Load applications from API
async function loadApplications() {
  applicationsListBody.innerHTML = "<tr><td colspan='8'>Loading…</td></tr>";
  try {
    const response = await fetch(API_BASE_URL);
    const apps = await response.json();
    if (Array.isArray(apps) && apps.length > 0) {
      renderApplications(apps);
    } else {
      applicationsListBody.innerHTML = "<tr><td colspan='8'>No applications yet.</td></tr>";
    }
  } catch (err) {
    applicationsListBody.innerHTML = "<tr><td colspan='8'>Failed to load.</td></tr>";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadStatistics();
  loadApplications();
});
