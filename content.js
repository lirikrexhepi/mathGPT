// Wait for the page to fully load
function waitForChatGPTToLoad() {
  console.log("MathGPT: Waiting for ChatGPT to load...");

  // Check if the main ChatGPT interface is loaded
  if (document.querySelector("main")) {
    console.log("MathGPT: ChatGPT interface detected, initializing...");
    // Check if already initialized to prevent duplicates
    if (!document.getElementById("mathgpt-toggle")) {
      initMathGPT();
    }
  } else {
    console.log("MathGPT: ChatGPT interface not ready, waiting...");
    setTimeout(waitForChatGPTToLoad, 1000);
  }
}

// Start the waiting process
waitForChatGPTToLoad();

// Initialize MathGPT
function initMathGPT() {
  console.log("MathGPT: Initializing...");

  // Remove any existing elements to prevent duplicates
  const existingToggle = document.getElementById("mathgpt-toggle");
  if (existingToggle) existingToggle.remove();

  const existingSymbols = document.getElementById("symbols-container");
  if (existingSymbols) existingSymbols.remove();

  const existingNotification = document.getElementById("mathgpt-notification");
  if (existingNotification) existingNotification.remove();

  // Create toggle button
  const toggleButton = document.createElement("div");
  toggleButton.className = "mathgpt-toggle";
  toggleButton.id = "mathgpt-toggle";
  toggleButton.innerHTML = `
    <div class="mathgpt-toggle-icon">∫</div>
  `;
  document.body.appendChild(toggleButton);

  // Create symbols container
  const symbolsContainer = document.createElement("div");
  symbolsContainer.className = "mathgpt-symbols";
  symbolsContainer.id = "symbols-container";
  document.body.appendChild(symbolsContainer);

  // Create notification element
  const notification = document.createElement("div");
  notification.className = "copy-notification";
  notification.id = "mathgpt-notification";
  notification.textContent = "Symbol copied!";
  document.body.appendChild(notification);

  // Define symbols by category
  const symbolCategories = {
    Basic: [
      "+",
      "−",
      "×",
      "÷",
      "=",
      "≠",
      "<",
      ">",
      "≤",
      "≥",
      "±",
      "≈",
      "%",
      "∞",
      "π",
    ],
    Calculus: ["∫", "∬", "∭", "∮", "∇", "∂", "∑", "∏", "lim", "dx", "dy"],
    Algebra: [
      "√",
      "∛",
      "∜",
      "¹",
      "²",
      "³",
      "⁴",
      "⁵",
      "⁻¹",
      "⁻²",
      "⁻³",
      "⁻⁴",
      "⁻⁵",
      "log",
      "ln",
      "|x|",
    ],
    Geometry: ["∠", "°", "△", "□", "○", "⊥", "∥", "≅", "∼", "∝"],
    Sets: ["∈", "∉", "⊂", "⊃", "⊆", "⊇", "∪", "∩", "∅", "∁", "∖"],
    Logic: ["∧", "∨", "¬", "⇒", "⇔", "∀", "∃", "∄", "⊕", "⊤", "⊥"],
    Greek: [
      "α",
      "β",
      "γ",
      "δ",
      "ε",
      "ζ",
      "η",
      "θ",
      "ι",
      "κ",
      "λ",
      "μ",
      "ν",
      "ξ",
      "ο",
      "π",
      "ρ",
      "σ",
      "τ",
      "υ",
      "φ",
      "χ",
      "ψ",
      "ω",
      "Γ",
      "Δ",
      "Θ",
      "Λ",
      "Ξ",
      "Π",
      "Σ",
      "Φ",
      "Ψ",
      "Ω",
    ],
  };

  // Load category settings once
  loadCategorySettings(symbolCategories, symbolsContainer, notification);

  // Panel toggle state
  let isPanelLocked = false;
  let isHovering = false;

  // Toggle button hover event
  toggleButton.addEventListener("mouseenter", () => {
    isHovering = true;
    if (!isPanelLocked) {
      symbolsContainer.classList.add("visible");
      toggleButton.style.right = "440px";
    }
  });

  toggleButton.addEventListener("mouseleave", () => {
    isHovering = false;
    setTimeout(() => {
      if (!isPanelLocked && !isHovering) {
        symbolsContainer.classList.remove("visible");
        toggleButton.style.right = "20px";
      }
    }, 100);
  });

  // Toggle button click event
  toggleButton.addEventListener("click", () => {
    isPanelLocked = !isPanelLocked;

    if (isPanelLocked) {
      symbolsContainer.classList.add("visible");
      toggleButton.style.right = "440px";
    } else {
      symbolsContainer.classList.remove("visible");
      toggleButton.style.right = "20px";
    }
  });

  // Keep panel visible when mouse is over it
  symbolsContainer.addEventListener("mouseenter", () => {
    isHovering = true;
  });

  symbolsContainer.addEventListener("mouseleave", () => {
    isHovering = false;
    setTimeout(() => {
      if (!isPanelLocked && !isHovering) {
        symbolsContainer.classList.remove("visible");
        toggleButton.style.right = "20px";
      }
    }, 100);
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "ping") {
      sendResponse({ status: "active" });
      return true;
    }

    if (message.action === "updateSettings") {
      // Clear existing symbols
      symbolsContainer.innerHTML = "";

      // Reload with new settings
      displayCategories(
        message.categories,
        symbolCategories,
        symbolsContainer,
        notification
      );

      // Store the new insertion mode for future use
      chrome.storage.sync.set({ insertionMode: message.insertionMode });

      sendResponse({ status: "updated" });
      return true;
    }
  });
}

// Function to load category settings and display symbols
function loadCategorySettings(
  symbolCategories,
  symbolsContainer,
  notification
) {
  chrome.storage.sync.get(["symbolCategories"], function (result) {
    const categories = result.symbolCategories || {
      basic: true,
      calculus: true,
      algebra: true,
      geometry: true,
      sets: true,
      logic: true,
    };

    displayCategories(
      categories,
      symbolCategories,
      symbolsContainer,
      notification
    );
  });
}

// Function to display categories based on settings
function displayCategories(
  categorySettings,
  symbolCategories,
  symbolsContainer,
  notification
) {
  // Get insertion mode settings
  chrome.storage.sync.get(["insertionMode"], function (result) {
    const insertionMode = result.insertionMode || {
      clipboard: true,
      directInsert: true,
    };

    // Map category names to settings keys
    const categoryMap = {
      Basic: "basic",
      Calculus: "calculus",
      Algebra: "algebra",
      Geometry: "geometry",
      Sets: "sets",
      Logic: "logic",
      Greek: "greek",
    };

    // Symbol descriptions for tooltips
    const symbolDescriptions = {
      // Basic
      "+": "Plus",
      "−": "Minus",
      "×": "Multiplication",
      "÷": "Division",
      "=": "Equals",
      "≠": "Not Equal",
      "<": "Less Than",
      ">": "Greater Than",
      "≤": "Less Than or Equal",
      "≥": "Greater Than or Equal",
      "±": "Plus-Minus",
      "≈": "Approximately Equal",
      "%": "Percent",
      "∞": "Infinity",
      π: "Pi",

      // Calculus
      "∫": "Integral",
      "∬": "Double Integral",
      "∭": "Triple Integral",
      "∮": "Contour Integral",
      "∇": "Nabla/Del",
      "∂": "Partial Derivative",
      "∑": "Summation",
      "∏": "Product",
      lim: "Limit",
      dx: "Differential x",
      dy: "Differential y",

      // Algebra
      "√": "Square Root",
      "∛": "Cube Root",
      "∜": "Fourth Root",
      "¹": "To the power of 1",
      "²": "Squared",
      "³": "Cubed",
      "⁴": "To the power of 4",
      "⁵": "To the power of 5",
      "⁻¹": "Inverse",
      "⁻²": "To the power of -2",
      "⁻³": "To the power of -3",
      "⁻⁴": "To the power of -4",
      "⁻⁵": "To the power of -5",
      log: "Logarithm",
      ln: "Natural Logarithm",
      "|x|": "Absolute Value",

      // Geometry
      "∠": "Angle",
      "°": "Degree",
      "△": "Triangle",
      "□": "Square",
      "○": "Circle",
      "⊥": "Perpendicular",
      "∥": "Parallel",
      "≅": "Congruent",
      "∼": "Similar",
      "∝": "Proportional",

      // Sets
      "∈": "Element Of",
      "∉": "Not Element Of",
      "⊂": "Subset",
      "⊃": "Superset",
      "⊆": "Subset or Equal",
      "⊇": "Superset or Equal",
      "∪": "Union",
      "∩": "Intersection",
      "∅": "Empty Set",
      "∁": "Complement",
      "∖": "Set Difference",

      // Logic
      "∧": "Logical AND",
      "∨": "Logical OR",
      "¬": "Logical NOT",
      "⇒": "Implies",
      "⇔": "If and Only If",
      "∀": "For All",
      "∃": "There Exists",
      "∄": "There Does Not Exist",
      "⊕": "Exclusive OR",
      "⊤": "True",
      "⊥": "False",

      // Greek
      α: "Alpha",
      β: "Beta",
      γ: "Gamma",
      δ: "Delta",
      ε: "Epsilon",
      ζ: "Zeta",
      η: "Eta",
      θ: "Theta",
      ι: "Iota",
      κ: "Kappa",
      λ: "Lambda",
      μ: "Mu",
      ν: "Nu",
      ξ: "Xi",
      ο: "Omicron",
      π: "Pi",
      ρ: "Rho",
      σ: "Sigma",
      τ: "Tau",
      υ: "Upsilon",
      φ: "Phi",
      χ: "Chi",
      ψ: "Psi",
      ω: "Omega",
      Γ: "Gamma (uppercase)",
      Δ: "Delta (uppercase)",
      Θ: "Theta (uppercase)",
      Λ: "Lambda (uppercase)",
      Ξ: "Xi (uppercase)",
      Π: "Pi (uppercase)",
      Σ: "Sigma (uppercase)",
      Φ: "Phi (uppercase)",
      Ψ: "Psi (uppercase)",
      Ω: "Omega (uppercase)",
    };

    // Populate symbols by category
    Object.entries(symbolCategories).forEach(([category, symbols]) => {
      const settingKey = categoryMap[category];

      // Skip this category if it's disabled
      if (!categorySettings[settingKey]) {
        return;
      }

      // Add category label
      const categoryLabel = document.createElement("div");
      categoryLabel.className = "mathgpt-category-label";
      categoryLabel.textContent = category;
      symbolsContainer.appendChild(categoryLabel);

      // Add container for this category's symbols
      const categoryContainer = document.createElement("div");
      categoryContainer.className = "mathgpt-category-container";
      symbolsContainer.appendChild(categoryContainer);

      // Add symbols for this category
      symbols.forEach((symbol) => {
        const symbolElement = document.createElement("div");
        symbolElement.className = "mathgpt-symbol";
        symbolElement.textContent = symbol;

        // Add descriptive tooltip
        symbolElement.setAttribute(
          "data-tooltip",
          symbolDescriptions[symbol] || symbol
        );

        symbolElement.addEventListener("click", () => {
          handleSymbolClick(symbol, notification, insertionMode);

          // Visual feedback
          symbolElement.classList.add("copied");
          setTimeout(() => {
            symbolElement.classList.remove("copied");
          }, 500);
        });

        categoryContainer.appendChild(symbolElement);
      });
    });
  });
}

// Function to copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch((err) => {
    console.error("Could not copy text: ", err);
  });
}

// Function to insert text directly into the ChatGPT input
function insertIntoChat(text) {
  const textarea = document.querySelector("textarea[data-id]");
  if (!textarea) return;

  // Get current cursor position
  const startPos = textarea.selectionStart;
  const endPos = textarea.selectionEnd;

  // Get current text
  const currentText = textarea.value;

  // Insert the symbol at cursor position
  const newText =
    currentText.substring(0, startPos) + text + currentText.substring(endPos);

  // Update the textarea value
  textarea.value = newText;

  // Set cursor position after the inserted text
  textarea.selectionStart = textarea.selectionEnd = startPos + text.length;

  // Focus the textarea
  textarea.focus();

  // Trigger input event to make ChatGPT recognize the change
  const event = new Event("input", { bubbles: true });
  textarea.dispatchEvent(event);
}

// Function to handle symbol click based on insertion mode
function handleSymbolClick(symbol, notification, insertionMode) {
  // Default to clipboard only for now
  const modes = { clipboard: true, directInsert: false };

  // Copy to clipboard
  copyToClipboard(symbol);

  // Update notification text
  notification.textContent = "Symbol copied!";

  // Show notification
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 2000);
}

// Initialize when the page is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMathGPT);
} else {
  initMathGPT();
}

document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on ChatGPT
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0]) return;

    const url = tabs[0].url || "";
    const statusElement = document.getElementById("status");

    if (url.includes("chat.openai.com")) {
      statusElement.textContent =
        "✅ You're on ChatGPT. The math symbol toolbox is active.";
      statusElement.className = "status-active";

      // Only try to communicate with content script if we're on ChatGPT
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "ping" },
        function (response) {
          if (chrome.runtime.lastError) {
            // Content script not ready or not loaded
            statusElement.textContent =
              "⚠️ Extension loaded but not yet active on this page. Try refreshing.";
            statusElement.className = "status-warning";
          }
        }
      );
    } else {
      statusElement.textContent =
        "❌ Navigate to chat.openai.com to use MathGPT.";
      statusElement.className = "status-inactive";
    }
  });

  // Load and display category settings
  loadCategorySettings();

  // Add event listeners to category toggles
  document.querySelectorAll(".category-toggle").forEach((toggle) => {
    toggle.addEventListener("change", saveCategorySettings);
  });

  // Add event listener to the "Go to ChatGPT" button
  const chatGptButton = document.getElementById("go-to-chatgpt");
  if (chatGptButton) {
    chatGptButton.addEventListener("click", () => {
      chrome.tabs.create({ url: "https://chat.openai.com" });
    });
  }

  // Add event listener to the "How to use" button
  const howToUseButton = document.getElementById("how-to-use-btn");
  const howToUseContent = document.getElementById("how-to-use-content");

  if (howToUseButton && howToUseContent) {
    howToUseButton.addEventListener("click", () => {
      if (
        howToUseContent.style.display === "none" ||
        !howToUseContent.style.display
      ) {
        howToUseContent.style.display = "block";
        howToUseButton.textContent = "Hide Instructions";
      } else {
        howToUseContent.style.display = "none";
        howToUseButton.textContent = "Show Instructions";
      }
    });
  }
});

// Function to save category settings to storage
function saveCategorySettings() {
  const categories = {};
  document.querySelectorAll(".category-toggle").forEach((toggle) => {
    const category = toggle.id.replace("toggle-", "");
    categories[category] = toggle.checked;
  });

  chrome.storage.sync.set({ symbolCategories: categories }, function () {
    // Show a saved message
    const savedMsg = document.getElementById("saved-message");
    if (savedMsg) {
      savedMsg.style.display = "block";
      setTimeout(() => {
        savedMsg.style.display = "none";
      }, 2000);
    }

    // Notify content script about the change - only if we're on ChatGPT
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && tabs[0].url.includes("chat.openai.com")) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "updateCategories",
            categories: categories,
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
  });
}
