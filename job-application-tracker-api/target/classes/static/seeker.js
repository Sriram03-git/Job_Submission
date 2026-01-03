const API_BASE_URL = 'http://localhost:8080/api/applications';

const form = document.getElementById('application-form');
const totalAppsSpan = document.getElementById('total-apps');
const statusListDiv = document.getElementById('status-list');

// We should use a custom modal or message box instead of alert()
function showMessage(message, isError = false) {
    // Clear any previous pop-up message
    document.querySelectorAll('.app-message-popup').forEach(el => el.remove());
   
    console.log(`[${isError ? 'ERROR' : 'SUCCESS'}] ${message}`);
    const messageContainer = document.createElement('div');
    messageContainer.className = 'app-message-popup ' + (isError ? 'message-error' : 'message-success');
    messageContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 100; min-width: 300px; text-align: center; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: opacity 0.3s;';
    messageContainer.textContent = message;
   
    document.body.appendChild(messageContainer);
   
    // Auto-hide the message after 5 seconds
    setTimeout(() => messageContainer.remove(), 5000);
}

function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(span => {
        span.textContent = '';
    });
}


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
    statusListDiv.innerHTML = "<p>Please submit an application to view its status.</p>";
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
                <th>Job ID</th>
                <th>Job Role</th>
                <th>Link</th>
                <th>Status</th>
                <th>Applied On</th>
              </tr>
            </thead>
            <tbody>
              ${applications.map(app => `
                <tr>
                  <td>${app.id}</td>
                  <td>${app.jobRole}</td>
                  <td><a href="${app.jobLink}" target="_blank">View Link</a></td>
                  <td><span class="status-${app.status.toLowerCase()}">${app.status}</span></td>
                  <td>${new Date(app.applicationTimestamp).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else {
        statusListDiv.innerHTML = "<p>No applications found for this email address.</p>";
      }
    } else {
      statusListDiv.innerHTML = "<p>Could not load application status.</p>";
    }
  } catch (error) {
    statusListDiv.innerHTML = "<p>Could not connect to the API server to load status.</p>";
  }
}

// Handler for form submission
form.addEventListener('submit', handleFormSubmit);

async function handleFormSubmit(event) {
  event.preventDefault();
  clearFieldErrors(); // Clear previous errors

  const resumeFile = document.getElementById('resume').files[0];
 
  if (!resumeFile) {
    document.getElementById('error-resume').textContent = 'Resume file is required.';
    showMessage('Submission failed: Please select a resume file.', true);
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
      showMessage('Application submitted successfully! Your Job ID is now visible in the status list below.', false);
      form.reset();
      await loadTotalStatistics();
      await loadStatusList();
    } else if (response.status === 409) {
      // Custom message for duplicate email (409 Conflict)
      showMessage('Failed to submit application. Email ID was already exists. Check your status below.', true);
    } else if (response.status === 400) {
      // Custom message for validation errors (400 Bad Request)
      const errors = await response.json();
      Object.keys(errors).forEach(key => {
          const errorElement = document.getElementById(`error-${key}`);
          if (errorElement) {
              errorElement.textContent = errors[key];
          }
      });
      // Show general error if validation failed
      showMessage(errors.general || 'Submission failed. Please check the highlighted fields.', true);
    } else {
      // Generic message for other server errors (e.g., 500)
      showMessage('Failed to submit application. Server returned an unexpected error.', true);
    }
  } catch (error) {
    showMessage('Could not connect to the API server. Please check if the backend is running.', true);
  }
}

function pollStatusListPeriodically() {
  setInterval(loadStatusList, 10000);
}

// Initial loads
window.onload = () => {
  loadTotalStatistics();
  loadStatusList();
  pollStatusListPeriodically();
};
