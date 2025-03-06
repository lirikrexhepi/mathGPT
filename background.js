// Background script for MathGPT extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("MathGPT extension installed");

  // Set default options if not already set
  chrome.storage.sync.get(
    ["symbolCategories", "insertionMode"],
    function (result) {
      if (!result.symbolCategories) {
        chrome.storage.sync.set({
          symbolCategories: {
            basic: true,
            calculus: true,
            algebra: true,
            geometry: true,
            sets: true,
            logic: true,
            greek: true,
          },
        });
      }

      if (!result.insertionMode) {
        chrome.storage.sync.set({
          insertionMode: {
            clipboard: true,
            directInsert: true,
          },
        });
      }
    }
  );
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "copyToClipboard") {
    // This is a fallback method if the navigator.clipboard in content script fails
    const input = document.createElement("textarea");
    document.body.appendChild(input);
    input.value = message.text;
    input.focus();
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "checkChatGPT") {
    // Check if the current tab is ChatGPT
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && tabs[0].url.includes("chatgpt.com")) {
        sendResponse({ isChatGPT: true });
      } else {
        sendResponse({ isChatGPT: false });
      }
    });
    return true; // Required for async sendResponse
  }
});
