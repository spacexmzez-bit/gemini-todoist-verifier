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

// Modal Elements
const proofModal = document.getElementById("proof-modal");
const modalTaskTitle = document.getElementById("modal-task-title");
const modalTaskDesc = document.getElementById("modal-task-desc");
const proofFileInput = document.getElementById("proof-file-input");
const fileLabel = document.getElementById("file-label");
const imagePreview = document.getElementById("image-preview");
const submitVerifyBtn = document.getElementById("submit-verify-btn");
const feedbackBox = document.getElementById("feedback-box");

// Active Verification State
let activeTaskId = null;
let activeTaskContent = "";
let activeTaskDescription = "";
let selectedBase64Image = null;
let selectedMimeType = "";

// Load credentials automatically
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

// Fetch focus tasks directly from Todoist
window.fetchFocusTasks = async function() {
  const token = localStorage.getItem(TODOIST_KEY_NAME);
  if (!token) return;

  tasksContainer.innerHTML = "<p>Loading active tasks...</p>";

  try {
    const encodedLabel = encodeURIComponent(FOCUS_LABEL);
    const response = await fetch(`https://api.todoist.com/api/v1/tasks?label=${encodedLabel}`, {
      method: "GET",
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

// Render tasks into the list
function renderTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    tasksContainer.innerHTML = "<p style='color: var(--success); font-weight: 500;'>No active focus tasks! You are free.</p>";
    return;
  }

  tasksContainer.innerHTML = "";
  tasks.forEach(task => {
    const item = document.createElement("div");
    item.className = "task-item";

    const descHtml = task.description 
      ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">${escapeHtml(task.description)}</div>`
      : "";

    item.innerHTML = `
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span class="task-content">${escapeHtml(task.content)}</span>
          <span class="task-badge">@${FOCUS_LABEL}</span>
        </div>
        ${descHtml}
      </div>
      <button style="width: auto; margin-top: 0; padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="selectTaskForVerification('${task.id}', '${escapeAttr(task.content)}', '${escapeAttr(task.description || "")}')">
        Verify Proof
      </button>
    `;
    tasksContainer.appendChild(item);
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}

function escapeAttr(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, " ");
}

// Modal controls
window.selectTaskForVerification = function(taskId, taskContent, taskDescription) {
  activeTaskId = taskId;
  activeTaskContent = taskContent;
  activeTaskDescription = taskDescription;

  modalTaskTitle.innerText = `Verify: ${taskContent}`;
  modalTaskDesc.innerText = taskDescription 
    ? `Criteria: ${taskDescription}`
    : "Upload a photo or screenshot proving you completed this task.";

  feedbackBox.style.display = "none";
  feedbackBox.innerText = "";
  imagePreview.style.display = "none";
  fileLabel.style.display = "block";
  proofFileInput.value = "";
  selectedBase64Image = null;
  submitVerifyBtn.disabled = true;
  submitVerifyBtn.style.opacity = "0.5";
  submitVerifyBtn.innerText = "Analyze & Complete";
  proofModal.style.display = "flex";
};

window.closeProofModal = function() {
  proofModal.style.display = "none";
  activeTaskId = null;
  activeTaskContent = "";
  activeTaskDescription = "";
};

// Handle file input and convert to Base64
window.handleFileSelected = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  selectedMimeType = file.type || "image/jpeg";
  const reader = new FileReader();

  reader.onload = function(e) {
    const dataUrl = e.target.result;
    imagePreview.src = dataUrl;
    imagePreview.style.display = "block";
    fileLabel.style.display = "none";

    selectedBase64Image = dataUrl.split(",")[1];
    submitVerifyBtn.disabled = false;
    submitVerifyBtn.style.opacity = "1";
  };

  reader.readAsDataURL(file);
};

// Send image proof and detailed criteria to Gemini API
window.submitProofToGemini = async function() {
  const geminiKey = localStorage.getItem(GEMINI_KEY_NAME);
  const todoistToken = localStorage.getItem(TODOIST_KEY_NAME);

  if (!geminiKey || !todoistToken) {
    alert("Missing credentials. Please check your settings.");
    return;
  }

  if (!selectedBase64Image || !activeTaskId) {
    alert("Please select a proof image first.");
    return;
  }

  submitVerifyBtn.disabled = true;
  submitVerifyBtn.innerText = "Analyzing proof with Gemini...";
  feedbackBox.style.display = "block";
  feedbackBox.className = "feedback-box";
  feedbackBox.innerText = "Evaluating evidence against task criteria...";

  const criteriaText = activeTaskDescription 
    ? `\nMandatory Verification Criteria: "${activeTaskDescription}"`
    : "";

  const systemPrompt = `You are a strict, objective task verification auditor.
The user claims to have completed the following task: "${activeTaskContent}".${criteriaText}

Instructions:
1. Examine the provided image thoroughly.
2. If mandatory verification criteria are provided above, the image MUST clearly fulfill them.
3. If no specific criteria are provided, evaluate whether the image represents authentic, definitive proof that the task was finished.
4. Strictly reject ambiguous, unrelated, duplicate, or low-effort submissions.

Respond EXCLUSIVELY with a JSON object following this exact schema:
{
  "is_verified": true | false,
  "reasoning": "A concise 1-2 sentence explanation of why this proof was accepted or rejected."
}`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType: selectedMimeType,
                data: selectedBase64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Gemini error ${response.status}`);
    }

    const data = await response.json();
    const rawResultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const result = JSON.parse(rawResultText);

    if (result.is_verified === true) {
      feedbackBox.className = "feedback-box success";
      feedbackBox.innerText = `Verified! ${result.reasoning} Completing task in Todoist...`;

      await completeTodoistTask(activeTaskId, todoistToken);

      feedbackBox.innerText = `Completed in Todoist! ${result.reasoning}`;
      setTimeout(() => {
        closeProofModal();
        fetchFocusTasks();
      }, 2000);
    } else {
      feedbackBox.className = "feedback-box error";
      feedbackBox.innerText = `Rejected: ${result.reasoning}`;
      submitVerifyBtn.disabled = false;
      submitVerifyBtn.innerText = "Try Again With New Photo";
    }
  } catch (error) {
    feedbackBox.className = "feedback-box error";
    feedbackBox.innerText = `Verification failed: ${error.message}`;
    submitVerifyBtn.disabled = false;
    submitVerifyBtn.innerText = "Try Again";
  }
};

// Complete task in Todoist API
async function completeTodoistTask(taskId, token) {
  const response = await fetch(`https://api.todoist.com/api/v1/tasks/${taskId}/close`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to close task in Todoist (Status: ${response.status})`);
  }
}
