// Local Storage Keys
const GEMINI_KEY_NAME = "focus_gemini_key";
const TODOIST_KEY_NAME = "focus_todoist_token";

// DOM Elements
const geminiInput = document.getElementById("gemini-key");
const todoistInput = document.getElementById("todoist-token");
const clearBtn = document.getElementById("clear-btn");
const statusDiv = document.getElementById("status-indicator");

// Load keys automatically when the page opens
window.addEventListener("DOMContentLoaded", () => {
  const savedGemini = localStorage.getItem(GEMINI_KEY_NAME);
  const savedTodoist = localStorage.getItem(TODOIST_KEY_NAME);

  if (savedGemini && savedTodoist) {
    geminiInput.value = savedGemini;
    todoistInput.value = savedTodoist;
    clearBtn.style.display = "block";
    statusDiv.innerHTML = `<span class="status-badge connected">Credentials Active & Saved</span>`;
  } else {
    statusDiv.innerHTML = `<span class="status-badge missing">Keys Not Configured</span>`;
  }
});

// Save credentials
window.handleSaveKeys = function() {
  const gemini = geminiInput.value.trim();
  const todoist = todoistInput.value.trim();

  if (!gemini || !todoist) {
    alert("Please enter both your Gemini API key and Todoist API token.");
    return;
  }

  localStorage.setItem(GEMINI_KEY_NAME, gemini);
  localStorage.setItem(TODOIST_KEY_NAME, todoist);

  clearBtn.style.display = "block";
  statusDiv.innerHTML = `<span class="status-badge connected">Credentials Active & Saved</span>`;
  alert("Credentials successfully saved in browser memory!");
};

// Clear credentials
window.handleClearKeys = function() {
  if (confirm("Are you sure you want to clear your saved keys?")) {
    localStorage.removeItem(GEMINI_KEY_NAME);
    localStorage.removeItem(TODOIST_KEY_NAME);
    geminiInput.value = "";
    todoistInput.value = "";
    clearBtn.style.display = "none";
    statusDiv.innerHTML = `<span class="status-badge missing">Keys Not Configured</span>`;
  }
};
