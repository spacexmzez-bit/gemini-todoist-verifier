// Local Storage Keys
const GEMINI_KEY_NAME = "focus_gemini_key";
const TODOIST_KEY_NAME = "focus_todoist_token";

// Focus tag name
const FOCUS_LABEL = "_!!focus";

// DOM Elements
const geminiInput = document.getElementById("gemini-key");
const todoistInput = document.getElementById("todoist-token");
const clearBtn = document.getElementById("clear-btn");
const statusDiv = document.getElementById("status-indicator");
const tasksSection = document.getElementById("tasks-section");
const tasksContainer = document.getElementById("tasks-container");

// Load keys automatically when the page opens
window.addEventListener("DOMContentLoaded", () => {
  const savedGemini = localStorage.getItem(GEMINI_KEY_NAME);
  const savedTodoist = localStorage.getItem(TODOIST_KEY_NAME);

  if (savedGemini && savedTodoist) {
    geminiInput.value = savedGemini;
    todoistInput.value = savedTodoist;
    clearBtn.style.display = "block";
    statusDiv.innerHTML = `<span class="status-badge connected">Credentials Active & Saved</span>`;
    tasksSection.style.display = "block";
    fetchFocusTasks();
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
  tasksSection.style.display = "block";
  fetchFocusTasks();
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
    tasksSection.style.display = "none";
    tasksContainer.innerHTML = "";
  }
};

// Fetch focus tasks from Todoist through Cloudflare proxy
window.fetchFocusTasks = async function() {
  const token = localStorage.getItem(TODOIST_KEY_NAME);
  if (!token) return;

  tasksContainer.innerHTML = "<p>Loading active tasks...</p>";

  try {
    const encodedLabel = encodeURIComponent(FOCUS_LABEL);
    const response = await fetch(`/api/todoist/tasks?label=${encodedLabel}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Todoist returned status: ${response.status}`);
    }

    const tasks = await response.json();
    renderTasks(tasks.results || tasks);
  } catch (error) {
    tasksContainer.innerHTML = `<p style="color: var(--danger)">Error loading tasks: ${error.message}</p>`;
  }
};

// Render tasks into the UI
function renderTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    tasksContainer.innerHTML = "<p style='color: var(--success);'>No active focus tasks! You are free.</p>";
    return;
  }

  tasksContainer.innerHTML = "";
  tasks.forEach(task => {
    const item = document.createElement("div");
    item.className = "task-item";
    item.innerHTML = `
      <div>
        <span class="task-content">${task.content}</span>
        <span class="task-badge">@${FOCUS_LABEL}</span>
      </div>
      <button style="width: auto; margin-top: 0; padding: 0.35rem 0.7rem; font-size: 0.8rem;" onclick="selectTaskForVerification('${task.id}', '${task.content.replace(/'/g, "\\'")}')">
        Verify Proof
      </button>
    `;
    tasksContainer.appendChild(item);
  });
}

// Placeholder for Phase 4 proof verification
window.selectTaskForVerification = function(taskId, taskContent) {
  alert(`Selected task: "${taskContent}"\nIn Phase 4, this will open the image proof uploader.`);
};
