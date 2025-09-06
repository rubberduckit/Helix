chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  console.log("Helix extension installed and side panel enabled");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  switch (message.type) {
    case "GET_CURRENT_TAB":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          sendResponse({
            success: true,
            tab: {
              id: tabs[0].id,
              url: tabs[0].url,
              title: tabs[0].title,
            },
          });
        } else {
          sendResponse({ success: false, error: "No active tab found" });
        }
      });
      return true;

    case "MODIFY_DOM":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id != null) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: "MODIFY_DOM", instructions: message.instructions },
            (response) => {
              if (chrome.runtime.lastError) {
                sendResponse({
                  success: false,
                  error: chrome.runtime.lastError.message,
                });
              } else {
                sendResponse(
                  response || {
                    success: false,
                    error: "No response from content script",
                  }
                );
              }
            }
          );
        } else {
          sendResponse({ success: false, error: "No active tab found" });
        }
      });
      return true;

    case "INJECT_SCRIPT":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          if (message.scriptFile) {
            chrome.scripting
              .executeScript({
                target: { tabId: tabs[0].id },
                world: "MAIN",
                files: [message.scriptFile],
              })
              .then(() => {
                sendResponse({
                  success: true,
                  result: "External script file injected successfully",
                });
              })
              .catch((error) => {
                sendResponse({
                  success: false,
                  error: error.message,
                });
              });
          } else {
            chrome.scripting
              .executeScript({
                target: { tabId: tabs[0].id },
                world: "MAIN",
                func: (code) => {
                  try {
                    const script = document.createElement("script");
                    script.textContent = code;
                    (
                      document.documentElement ||
                      document.head ||
                      document.body
                    ).appendChild(script);
                    script.remove();
                    return {
                      success: true,
                      message: "Script injected into MAIN world",
                    };
                  } catch (error) {
                    return {
                      success: false,
                      error:
                        error instanceof Error ? error.message : String(error),
                    };
                  }
                },
                args: [message.scriptCode],
              })
              .then((results) => {
                if (
                  results &&
                  results[0] &&
                  results[0].result &&
                  results[0].result.success
                ) {
                  sendResponse({
                    success: true,
                    result: results[0].result.message,
                  });
                } else {
                  sendResponse({
                    success: false,
                    error: "Failed to inject script",
                  });
                }
              })
              .catch((error) => {
                sendResponse({ success: false, error: error.message });
              });
          }
        } else {
          sendResponse({
            success: false,
            error: "No active tab found",
          });
        }
      });
      return true;

    case "GET_PAGE_DOM":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id != null) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: "GET_PAGE_DOM", maxChars: message.maxChars },
            (response) => {
              if (chrome.runtime.lastError) {
                sendResponse({
                  success: false,
                  error: chrome.runtime.lastError.message,
                });
              } else {
                sendResponse(
                  response || {
                    success: false,
                    error: "No response from content script",
                  }
                );
              }
            }
          );
        } else {
          sendResponse({ success: false, error: "No active tab found" });
        }
      });
      return true;

    case "GET_STORAGE_DATA":
      chrome.storage.local.get(message.keys, (result) => {
        sendResponse({ success: true, data: result });
      });
      return true;

    case "SET_STORAGE_DATA":
      chrome.storage.local.set(message.data, () => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          sendResponse({ success: true });
        }
      });
      return true;

    case "CLEAR_STORAGE_DATA":
      chrome.storage.local.remove(message.keys, () => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          sendResponse({ success: true });
        }
      });
      return true;

    default:
      sendResponse({
        success: false,
        error: "Unknown message type",
      });
      return false;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    chrome.runtime
      .sendMessage({
        type: "TAB_UPDATED",
        tabId: tabId,
        url: tab.url,
        title: tab.title,
      })
      .catch(() => {});
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab) {
      chrome.runtime
        .sendMessage({
          type: "TAB_ACTIVATED",
          tabId: tab.id,
          url: tab.url,
          title: tab.title,
        })
        .catch(() => {});
    }
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

console.log("Helix background script loaded");
