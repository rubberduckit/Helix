// Background script for Helix Chrome Extension
// Handles side panel communication and extension functionality

// Initialize the side panel when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Enable the side panel
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  
  console.log('Helix extension installed and side panel enabled');
});

// Handle messages from the side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'GET_CURRENT_TAB':
      // Get information about the current active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          sendResponse({
            success: true,
            tab: {
              id: tabs[0].id,
              url: tabs[0].url,
              title: tabs[0].title
            }
          });
        } else {
          sendResponse({ success: false, error: 'No active tab found' });
        }
      });
      return true; // Keep the message channel open for async response
      
    case 'INJECT_SCRIPT':
      // Inject a userscript into the current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          // Check if we should inject a file or execute code
          if (message.scriptFile) {
            // Inject an external script file (CSP compliant)
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              world: 'MAIN',
              files: [message.scriptFile]
            }).then(() => {
              sendResponse({
                success: true,
                result: 'External script file injected successfully'
              });
            }).catch((error) => {
              sendResponse({
                success: false,
                error: error.message
              });
            });
          } else {
            // Inject inline script into MAIN world by creating a <script> tag
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              world: 'MAIN',
              func: (code) => {
                try {
                  const script = document.createElement('script');
                  script.textContent = code;
                  (document.documentElement || document.head || document.body).appendChild(script);
                  script.remove();
                  return { success: true, message: 'Script injected into MAIN world' };
                } catch (error) {
                  return { success: false, error: error instanceof Error ? error.message : String(error) };
                }
              },
              args: [message.scriptCode]
            }).then((results) => {
              if (results && results[0] && results[0].result && results[0].result.success) {
                sendResponse({ success: true, result: results[0].result.message });
              } else {
                sendResponse({ success: false, error: 'Failed to inject script' });
              }
            }).catch((error) => {
              sendResponse({ success: false, error: error.message });
            });
          }
        } else {
          sendResponse({
            success: false,
            error: 'No active tab found'
          });
        }
      });
      return true;
      
    case 'GET_STORAGE_DATA':
      // Get data from Chrome storage
      chrome.storage.local.get(message.keys, (result) => {
        sendResponse({ success: true, data: result });
      });
      return true;
      
    case 'SET_STORAGE_DATA':
      // Set data in Chrome storage
      chrome.storage.local.set(message.data, () => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message
          });
        } else {
          sendResponse({ success: true });
        }
      });
      return true;
      
    case 'CLEAR_STORAGE_DATA':
      // Clear data from Chrome storage
      chrome.storage.local.remove(message.keys, () => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message
          });
        } else {
          sendResponse({ success: true });
        }
      });
      return true;
      
    default:
      sendResponse({
        success: false,
        error: 'Unknown message type'
      });
      return false;
  }
});

// Handle tab updates to potentially refresh side panel content
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Notify the side panel that the page has loaded
    chrome.runtime.sendMessage({
      type: 'TAB_UPDATED',
      tabId: tabId,
      url: tab.url,
      title: tab.title
    }).catch(() => {
      // Ignore errors if side panel is not open
    });
  }
});

// Handle tab activation to update side panel context
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab) {
      // Notify the side panel that a new tab is active
      chrome.runtime.sendMessage({
        type: 'TAB_ACTIVATED',
        tabId: tab.id,
        url: tab.url,
        title: tab.title
      }).catch(() => {
        // Ignore errors if side panel is not open
      });
    }
  });
});

// Handle extension action click (toolbar button)
chrome.action.onClicked.addListener((tab) => {
  // Open the side panel when the extension icon is clicked
  chrome.sidePanel.open({ windowId: tab.windowId });
});

console.log('Helix background script loaded');

