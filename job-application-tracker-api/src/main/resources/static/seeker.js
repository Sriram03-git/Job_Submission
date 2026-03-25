const API_BASE_URL = "/api/applications";

const form = document.getElementById("application-form");
const totalAppsSpan = document.getElementById("total-apps");
const statusListDiv = document.getElementById("status-list");

// We should use a custom modal or message box instead of alert()
function showMessage(message, isError = false) {
  // Clear any previous pop-up message
  document.querySelectorAll(".app-message-popup").forEach((el) => el.remove());

  console.log(`[${isError ? "ERROR" : "SUCCESS"}] ${message}`);
  const messageContainer = document.createElement("div");
  messageContainer.className =
    "app-message-popup " + (isError ? "message-error" : "message-success");
  messageContainer.style.cssText =
    "position: fixed; top: 20px; right: 20px; z-index: 100; min-width: 300px; text-align: center; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: opacity 0.3s;";
  messageContainer.textContent = message;

  document.body.appendChild(messageContainer);

  // Auto-hide the message after 5 seconds
  setTimeout(() => messageContainer.remove(), 5000);
}

function clearFieldErrors() {
  document.querySelectorAll(".field-error").forEach((span) => {
    span.textContent = "";
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
    statusListDiv.innerHTML =
      "<p>Please submit an application to view its status.</p>";
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}?email=${encodeURIComponent(email)}`,
    );
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
              ${applications
                .map(
                  (app) => `
                <tr>
                  <td>${app.id}</td>
                  <td>${app.jobRole}</td>
                  <td><a href="${
                    app.jobLink
                  }" target="_blank">View Link</a></td>
                  <td><span class="status-${app.status.toLowerCase()}">${
                    app.status
                  }</span></td>
                  <td>${new Date(
                    app.applicationTimestamp,
                  ).toLocaleDateString()}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        `;
      } else {
        statusListDiv.innerHTML =
          "<p>No applications found for this email address.</p>";
      }
    } else {
      statusListDiv.innerHTML = "<p>Could not load application status.</p>";
    }
  } catch (error) {
    statusListDiv.innerHTML =
      "<p>Could not connect to the API server to load status.</p>";
  }
}

// --- Theme Toggle Logic ---
const themeToggle = document.getElementById("theme-toggle");
function initializeTheme() {
  const isDark = localStorage.getItem("theme") === "dark";
  if (isDark) {
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark");
    themeToggle.innerHTML =
      '<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"></path></svg>';
  } else {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
    themeToggle.innerHTML =
      '<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 6.66l-.71-.71M4.05 4.93l-.71-.71"></path></svg>';
  }
}

themeToggle.addEventListener("click", () => {
  const dark = document.documentElement.classList.toggle("dark");
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", dark ? "dark" : "light");
  initializeTheme();
});

// --- Resume Upload Progress Bar and Form Submission ---
form.addEventListener("submit", handleFormSubmit);

// Modal logic for My Applications
document.getElementById("my-applications-btn").onclick = function () {
  document.getElementById("my-applications-modal").classList.remove("hidden");
  loadStatusList();
};
document.getElementById("close-applications-modal").onclick = function () {
  document.getElementById("my-applications-modal").classList.add("hidden");
};

async function handleFormSubmit(event) {
  event.preventDefault();
  clearFieldErrors(); // Clear previous errors

  const resumeFile = document.getElementById("resume").files[0];
  const progressBar = document.getElementById("upload-progress");
  const bar = document.getElementById("upload-bar");
  const percentLabel = document.getElementById("upload-percent");

  // Start UI pre-animation (shimmer) to show UX progress from 1% to 8% while upload negotiates
  let fakeInterval = null;
  if (progressBar && bar) {
    progressBar.classList.remove("hidden");
    bar.style.width = "1%";
    if (percentLabel) percentLabel.textContent = "1%";
    let fake = 1;
    fakeInterval = setInterval(() => {
      if (fake < 8) {
        fake++;
        bar.style.width = fake + "%";
        if (percentLabel) percentLabel.textContent = fake + "%";
      } else {
        clearInterval(fakeInterval);
      }
    }, 80);
  }

  if (!resumeFile) {
    document.getElementById("error-resume").textContent =
      "Resume file is required.";
    showMessage("Submission failed: Please select a resume file.", true);
    if (progressBar) progressBar.classList.add("hidden");
    return;
  }

  const emailValue = document.getElementById("emailId").value;
  setCurrentEmail(emailValue);

  const applicationData = {
    name: document.getElementById("name").value,
    emailId: emailValue,
    mobileNumber: document.getElementById("mobileNumber").value,
    experienceRange: document.getElementById("experienceRange").value,
    jobRole: document.getElementById("jobRole").value,
    jobLink: document.getElementById("jobLink").value,
    notes: document.getElementById("notes").value,
    status: "Applied",
  };

  const formData = new FormData();
  formData.append(
    "application",
    new Blob([JSON.stringify(applicationData)], { type: "application/json" }),
  );
  formData.append("resume", resumeFile);

  // Use XMLHttpRequest for progress
  const xhr = new XMLHttpRequest();
  xhr.open("POST", API_BASE_URL, true);

  xhr.upload.onprogress = function (e) {
    if (e.lengthComputable && progressBar && bar) {
      const percent = Math.round((e.loaded / e.total) * 100);
      // Smoothly animate to the target percent
      let current = parseInt(bar.style.width) || 1;
      const target = Math.max(percent, current);
      const animate = () => {
        current += Math.ceil((target - current) / 6) || 1;
        if (current > target) current = target;
        bar.style.width = current + "%";
        const percentLabel = document.getElementById("upload-percent");
        if (percentLabel) percentLabel.textContent = current + "%";
        if (current < target) requestAnimationFrame(animate);
      };
      animate();
    }
  };
  xhr.onload = async function () {
    // Ensure any fake pre-animation stops
    if (typeof fakeInterval !== "undefined" && fakeInterval !== null) {
      clearInterval(fakeInterval);
    }

    if (progressBar && bar) {
      // Animate to 100% for visual completion
      bar.style.width = "100%";
      const percentLabel = document.getElementById("upload-percent");
      if (percentLabel) percentLabel.textContent = "100%";
      setTimeout(() => {
        progressBar.classList.add("hidden");
        bar.style.width = "1%";
        if (percentLabel) percentLabel.textContent = "";
      }, 600);
    }

    if (xhr.status === 201) {
      showMessage(
        "Application submitted successfully! Your Job ID is now visible in the status list below.",
        false,
      );
      form.reset();
      await loadTotalStatistics();
      await loadStatusList();
    } else if (xhr.status === 409) {
      showMessage(
        "Failed to submit application. Email ID already exists. Check your status below.",
        true,
      );
    } else if (xhr.status === 400) {
      try {
        const errors = JSON.parse(xhr.responseText);
        Object.keys(errors).forEach((key) => {
          const errorElement = document.getElementById(`error-${key}`);
          if (errorElement) {
            errorElement.textContent = errors[key];
          }
        });
        showMessage(
          errors.general ||
            "Submission failed. Please check the highlighted fields.",
          true,
        );
      } catch {
        showMessage(
          "Submission failed. Please check the highlighted fields.",
          true,
        );
      }
    } else {
      showMessage(
        "Failed to submit application. Server returned an unexpected error.",
        true,
      );
    }
  };
  xhr.onerror = function () {
    if (progressBar && bar) {
      progressBar.classList.add("hidden");
      bar.style.width = "1%";
    }
    showMessage(
      "Could not connect to the API server. Please check if the backend is running.",
      true,
    );
  };
  xhr.send(formData);
}

function pollStatusListPeriodically() {
  setInterval(loadStatusList, 10000);
}

// --- Offline Detection Logic ---
function updateOnlineStatus() {
  const offlineOverlay = document.getElementById("offline-overlay");
  if (navigator.onLine) {
    offlineOverlay.classList.add("hidden");
    offlineOverlay.classList.remove("flex");
  } else {
    offlineOverlay.classList.remove("hidden");
    offlineOverlay.classList.add("flex");
  }
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

// Initial loads
window.onload = () => {
  initializeTheme();
  loadTotalStatistics();
  loadStatusList();
  pollStatusListPeriodically();
  updateOnlineStatus(); // Check immediately on load
};
