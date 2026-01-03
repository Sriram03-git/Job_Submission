const API_BASE_URL = 'http://localhost:8080/api/applications';

const form = document.getElementById('application-form');
const totalAppsSpan = document.getElementById('total-apps');
const statusListDiv = document.getElementById('status-list');

function getCurrentEmail() {
  return localStorage.getItem("userEmail") || "";
}
function setCurrentEmail(email) {
  localStorage.setItem("userEmail", email);
}

async function loadTotalStatistics() {
  try {
    const response = await fetch(`${API_BASE_URL}/statistics/total`);
    const total = await response.text();
    totalAppsSpan.textContent = total || "0";
  } catch (error) {
    totalAppsSpan.textContent = "0";
  }
}

async function loadStatusList() {
  const email = getCurrentEmail();
  if (!email) {
    statusListDiv.innerHTML = "<p>No applications submitted yet.</p>";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}?email=${encodeURIComponent(email)}`);
    if (response.ok) {
      const applications = await response.json();
      if (applications && applications.length > 0) {
        statusListDiv.innerHTML = `
          <table class="status-table">
            <thead>
              <tr>
                <th>App ID</th>
                <th>Job Role</th>
                <th>Link</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              ${applications.map(app => `
                <tr>
                  <td>${app.id}</td>
                  <td>${app.jobRole}</td>
                  <td>
                    <a href="${app.jobLink}" target="_blank">Your LinkedIn Link</a>
                  </td>
                  <td>
                    <span class="status-${app.status.toLowerCase()}">${app.status}</span>
                  </td>
                  <td>${new Date(app.applicationTimestamp).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else {
        statusListDiv.innerHTML = "<p>No submitted jobs found.</p>";
      }
    } else {
      statusListDiv.innerHTML = "<p>Could not load status list.</p>";
    }
  } catch (error) {
    statusListDiv.innerHTML = "<p>Error loading status list.</p>";
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const resumeFile = document.getElementById('resume').files[0];
  if (!resumeFile) {
    alert('Please upload a PDF resume.');
    return;
  }

  const emailValue = document.getElementById('emailId').value;
  setCurrentEmail(emailValue);

  const applicationData = {
    name: document.getElementById('name').value,
    emailId: emailValue,
    mobileNumber: document.getElementById('mobileNumber').value,
    experienceRange: document.getElementById('experienceRange').value,
    jobRole: document.getElementById('jobRole').value,
    jobLink: document.getElementById('jobLink').value,
    notes: document.getElementById('notes').value,
    status: 'Applied'
  };

  const formData = new FormData();
  formData.append('application', new Blob([JSON.stringify(applicationData)], { type: 'application/json' }));
  formData.append('resume', resumeFile);

  try {
    const response = await fetch(API_BASE_URL, { method: 'POST', body: formData });
    if (response.ok) {
      alert('Application submitted successfully!');
      form.reset();
      await loadTotalStatistics();
      await loadStatusList();
    } else {
      alert('Failed to submit application.');
    }
  } catch (error) {
    alert('Could not connect to the API server.');
  }
}

function pollStatusListPeriodically() {
  setInterval(loadStatusList, 10000);
}

document.addEventListener('DOMContentLoaded', () => {
  loadTotalStatistics();
  loadStatusList();
  pollStatusListPeriodically();
});
form.addEventListener('submit', handleFormSubmit);
