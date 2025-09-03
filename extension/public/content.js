// Content script for Helix Chrome Extension
// This script runs in the context of web pages and can modify the DOM

console.log('Helix content script loaded');

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  switch (message.type) {
    case 'MODIFY_DOM':
      // Modify the DOM based on the received instructions
      try {
        const result = modifyDOM(message.instructions);
        sendResponse({ success: true, result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      break;
      
    case 'GET_PAGE_INFO':
      // Get information about the current page
      const pageInfo = {
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        elements: {
          links: document.querySelectorAll('a').length,
          buttons: document.querySelectorAll('button').length,
          forms: document.querySelectorAll('form').length,
          images: document.querySelectorAll('img').length
        }
      };
      sendResponse({ success: true, pageInfo });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Function to modify the DOM based on instructions
function modifyDOM(instructions) {
  const results = [];
  
  instructions.forEach((instruction, index) => {
    try {
      switch (instruction.action) {
        case 'style':
          // Apply CSS styles to elements
          const elements = document.querySelectorAll(instruction.selector);
          elements.forEach(element => {
            Object.assign(element.style, instruction.styles);
          });
          results.push({
            action: 'style',
            selector: instruction.selector,
            elementsModified: elements.length,
            success: true
          });
          break;
          
        case 'addClass':
          // Add CSS classes to elements
          const classElements = document.querySelectorAll(instruction.selector);
          classElements.forEach(element => {
            element.classList.add(...instruction.classes);
          });
          results.push({
            action: 'addClass',
            selector: instruction.selector,
            elementsModified: classElements.length,
            success: true
          });
          break;
          
        case 'removeClass':
          // Remove CSS classes from elements
          const removeClassElements = document.querySelectorAll(instruction.selector);
          removeClassElements.forEach(element => {
            element.classList.remove(...instruction.classes);
          });
          results.push({
            action: 'removeClass',
            selector: instruction.selector,
            elementsModified: removeClassElements.length,
            success: true
          });
          break;
          
        case 'setAttribute':
          // Set attributes on elements
          const attrElements = document.querySelectorAll(instruction.selector);
          attrElements.forEach(element => {
            element.setAttribute(instruction.attribute, instruction.value);
          });
          results.push({
            action: 'setAttribute',
            selector: instruction.selector,
            elementsModified: attrElements.length,
            success: true
          });
          break;
          
        case 'createElement':
          // Create and insert new elements
          const newElement = document.createElement(instruction.tagName);
          if (instruction.innerHTML) {
            newElement.innerHTML = instruction.innerHTML;
          }
          if (instruction.styles) {
            Object.assign(newElement.style, instruction.styles);
          }
          if (instruction.classes) {
            newElement.classList.add(...instruction.classes);
          }
          
          const targetElement = document.querySelector(instruction.targetSelector);
          if (targetElement) {
            if (instruction.position === 'before') {
              targetElement.parentNode.insertBefore(newElement, targetElement);
            } else if (instruction.position === 'after') {
              targetElement.parentNode.insertBefore(newElement, targetElement.nextSibling);
            } else {
              targetElement.appendChild(newElement);
            }
            results.push({
              action: 'createElement',
              tagName: instruction.tagName,
              success: true
            });
          } else {
            results.push({
              action: 'createElement',
              tagName: instruction.tagName,
              success: false,
              error: 'Target element not found'
            });
          }
          break;
          
        case 'removeElement':
          // Remove elements from the DOM
          const removeElements = document.querySelectorAll(instruction.selector);
          removeElements.forEach(element => {
            element.remove();
          });
          results.push({
            action: 'removeElement',
            selector: instruction.selector,
            elementsRemoved: removeElements.length,
            success: true
          });
          break;
          
        case 'addEventListener':
          // Add event listeners to elements
          const eventElements = document.querySelectorAll(instruction.selector);
          eventElements.forEach(element => {
            element.addEventListener(instruction.event, instruction.handler);
          });
          results.push({
            action: 'addEventListener',
            selector: instruction.selector,
            elementsModified: eventElements.length,
            success: true
          });
          break;
          
        default:
          results.push({
            action: instruction.action,
            success: false,
            error: 'Unknown action'
          });
      }
    } catch (error) {
      results.push({
        action: instruction.action,
        success: false,
        error: error.message
      });
    }
  });
  
  return results;
}

// Utility function to safely query elements
function safeQuerySelector(selector) {
  try {
    return document.querySelector(selector);
  } catch (error) {
    console.error('Invalid selector:', selector, error);
    return null;
  }
}

// Utility function to safely query all elements
function safeQuerySelectorAll(selector) {
  try {
    return document.querySelectorAll(selector);
  } catch (error) {
    console.error('Invalid selector:', selector, error);
    return [];
  }
}

// Notify that the content script is ready
chrome.runtime.sendMessage({
  type: 'CONTENT_SCRIPT_READY',
  url: window.location.href,
  timestamp: Date.now()
}).catch(() => {
  // Ignore errors if background script is not ready
});

