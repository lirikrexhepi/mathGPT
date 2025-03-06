// This script handles popup functionality
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on ChatGPT
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0]) return;

    const url = tabs[0].url || "";
    const statusElement = document.getElementById("status");

    if (url.includes("chatgpt.com") || url.includes("chat.openai.com")) {
      statusElement.textContent =
        "You're on ChatGPT. The math symbol toolbox is active.";
      statusElement.className = "status-active";

      // Only try to communicate with content script if we're on ChatGPT
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "ping" },
        function (response) {
          if (chrome.runtime.lastError) {
            // Content script not ready or not loaded
            statusElement.textContent =
              "Extension loaded but not yet active on this page. Try refreshing.";
            statusElement.className = "status-warning";
          }
        }
      );
    } else {
      statusElement.textContent = "Navigate to chatgpt.com to use MathGPT.";
      statusElement.className = "status-inactive";
    }
  });

  // Load and display category settings
  loadSettings();

  // Add event listeners to category toggles
  document.querySelectorAll(".category-toggle").forEach((toggle) => {
    toggle.addEventListener("change", saveSettings);
  });

  // Add event listener to the "Go to ChatGPT" button
  const chatGptButton = document.getElementById("go-to-chatgpt");
  if (chatGptButton) {
    chatGptButton.addEventListener("click", () => {
      chrome.tabs.create({ url: "https://chatgpt.com" });
    });
  }

  // Add event listener to the "How to use" button
  const howToUseButton = document.getElementById("how-to-use-btn");
  const howToUseContent = document.getElementById("how-to-use-content");
  if (howToUseButton && howToUseContent) {
    howToUseButton.addEventListener("click", () => {
      if (howToUseContent.style.display === "block") {
        howToUseContent.style.display = "none";
        howToUseButton.textContent = "Instructions";
      } else {
        howToUseContent.style.display = "block";
        howToUseButton.textContent = "Hide Instructions";
      }
    });
  }
});

// Function to save all settings
function saveSettings() {
  // Save category settings
  const categories = {
    basic: document.getElementById("toggle-basic").checked,
    calculus: document.getElementById("toggle-calculus").checked,
    algebra: document.getElementById("toggle-algebra").checked,
    geometry: document.getElementById("toggle-geometry").checked,
    sets: document.getElementById("toggle-sets").checked,
    logic: document.getElementById("toggle-logic").checked,
    greek: document.getElementById("toggle-greek").checked,
  };

  // Save insertion mode settings
  const insertionMode = {
    clipboard: document.getElementById("toggle-clipboard").checked,
    directInsert: document.getElementById("toggle-direct-insert").checked,
  };

  // Save both settings
  chrome.storage.sync.set(
    {
      symbolCategories: categories,
      insertionMode: insertionMode,
    },
    function () {
      // Show saved message
      const savedMessage = document.getElementById("saved-message");
      if (savedMessage) {
        savedMessage.style.display = "block";
        setTimeout(() => {
          savedMessage.style.display = "none";
        }, 2000);
      }

      // Notify content script about the changes
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (
          tabs[0] &&
          (tabs[0].url.includes("chatgpt.com") ||
            tabs[0].url.includes("chat.openai.com"))
        ) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              action: "updateSettings",
              categories: categories,
              insertionMode: insertionMode,
            },
            function (response) {
              // Handle potential errors silently
              if (chrome.runtime.lastError) {
                console.log("Could not send message to content script");
              }
            }
          );
        }
      });
    }
  );
}

// Load settings function
function loadSettings() {
  chrome.storage.sync.get(
    ["symbolCategories", "insertionMode"],
    function (result) {
      // Load category settings
      const categories = result.symbolCategories || {
        basic: true,
        calculus: true,
        algebra: true,
        geometry: true,
        sets: true,
        logic: true,
        greek: true,
      };

      // Load insertion mode settings
      const insertionMode = result.insertionMode || {
        clipboard: true,
        directInsert: true,
      };

      // Update UI with loaded settings
      Object.keys(categories).forEach((category) => {
        const toggle = document.getElementById(`toggle-${category}`);
        if (toggle) toggle.checked = categories[category];
      });

      // Update insertion mode toggles
      document.getElementById("toggle-clipboard").checked =
        insertionMode.clipboard;
      document.getElementById("toggle-direct-insert").checked =
        insertionMode.directInsert;
    }
  );
}
