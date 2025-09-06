console.log("Helix content script loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);

  switch (message.type) {
    case "MODIFY_DOM":
      try {
        const result = modifyDOM(message.instructions);
        sendResponse({ success: true, result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      break;

    case "GET_PAGE_INFO":
      const pageInfo = {
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        elements: {
          links: document.querySelectorAll("a").length,
          buttons: document.querySelectorAll("button").length,
          forms: document.querySelectorAll("form").length,
          images: document.querySelectorAll("img").length,
        },
      };
      sendResponse({ success: true, pageInfo });
      break;

    case "GET_PAGE_DOM": {
      try {
        const cloneDoc = document.cloneNode(true);

        function replaceContentWithComment(doc, tagName, commentText) {
          try {
            const elements = doc.getElementsByTagName(tagName);
            for (let i = elements.length - 1; i >= 0; i--) {
              const comment = doc.createComment(commentText);
              const parent = elements[i].parentNode;
              if (parent) parent.replaceChild(comment, elements[i]);
            }
          } catch (error) {
            console.error(`Error replacing ${tagName} content:`, error);
          }
        }

        function removeBase64Images(doc) {
          try {
            const images = doc.getElementsByTagName("img");
            for (let i = images.length - 1; i >= 0; i--) {
              if (images[i].src && images[i].src.startsWith("data:image")) {
                const comment = doc.createComment("Base64 image removed");
                const parent = images[i].parentNode;
                if (parent) parent.replaceChild(comment, images[i]);
              }
            }

            const elements = doc.querySelectorAll('[style*="url(data:image"]');
            for (let i = elements.length - 1; i >= 0; i--) {
              const style = elements[i].getAttribute("style") || "";
              const newStyle = style.replace(
                /url\(data:image[^)]+\)/g,
                "/* Base64 image removed */"
              );
              elements[i].setAttribute("style", newStyle);
            }
          } catch (error) {
            console.error("Error removing base64 images:", error);
          }
        }

        function removeSpecificContent(doc) {
          replaceContentWithComment(doc, "script", "Script content removed");
          replaceContentWithComment(doc, "style", "Style content removed");
          replaceContentWithComment(doc, "svg", "SVG content removed");
          removeBase64Images(doc);
        }

        removeSpecificContent(cloneDoc);

        const serializer = new XMLSerializer();
        const domHtml = serializer.serializeToString(cloneDoc);

        const meta = {
          url: location.href,
          title: document.title,
          lang: document.documentElement.lang || "",
        };
        sendResponse({ success: true, domHtml, meta });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      break;
    }

    default:
      sendResponse({ success: false, error: "Unknown message type" });
  }
});

function modifyDOM(instructions) {
  const results = [];

  instructions.forEach((instruction, index) => {
    try {
      switch (instruction.action) {
        case "style":
          const elements = document.querySelectorAll(instruction.selector);
          elements.forEach((element) => {
            Object.assign(element.style, instruction.styles);
          });
          results.push({
            action: "style",
            selector: instruction.selector,
            elementsModified: elements.length,
            success: true,
          });
          break;

        case "addClass":
          const classElements = document.querySelectorAll(instruction.selector);
          classElements.forEach((element) => {
            element.classList.add(...instruction.classes);
          });
          results.push({
            action: "addClass",
            selector: instruction.selector,
            elementsModified: classElements.length,
            success: true,
          });
          break;

        case "removeClass":
          const removeClassElements = document.querySelectorAll(
            instruction.selector
          );
          removeClassElements.forEach((element) => {
            element.classList.remove(...instruction.classes);
          });
          results.push({
            action: "removeClass",
            selector: instruction.selector,
            elementsModified: removeClassElements.length,
            success: true,
          });
          break;

        case "setAttribute":
          const attrElements = document.querySelectorAll(instruction.selector);
          attrElements.forEach((element) => {
            element.setAttribute(instruction.attribute, instruction.value);
          });
          results.push({
            action: "setAttribute",
            selector: instruction.selector,
            elementsModified: attrElements.length,
            success: true,
          });
          break;

        case "createElement":
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

          const targetElement = document.querySelector(
            instruction.targetSelector
          );
          if (targetElement) {
            if (instruction.position === "before") {
              targetElement.parentNode.insertBefore(newElement, targetElement);
            } else if (instruction.position === "after") {
              targetElement.parentNode.insertBefore(
                newElement,
                targetElement.nextSibling
              );
            } else {
              targetElement.appendChild(newElement);
            }
            results.push({
              action: "createElement",
              tagName: instruction.tagName,
              success: true,
            });
          } else {
            results.push({
              action: "createElement",
              tagName: instruction.tagName,
              success: false,
              error: "Target element not found",
            });
          }
          break;

        case "removeElement":
          const removeElements = document.querySelectorAll(
            instruction.selector
          );
          removeElements.forEach((element) => {
            element.remove();
          });
          results.push({
            action: "removeElement",
            selector: instruction.selector,
            elementsRemoved: removeElements.length,
            success: true,
          });
          break;

        case "addEventListener":
          const eventElements = document.querySelectorAll(instruction.selector);
          eventElements.forEach((element) => {
            element.addEventListener(instruction.event, instruction.handler);
          });
          results.push({
            action: "addEventListener",
            selector: instruction.selector,
            elementsModified: eventElements.length,
            success: true,
          });
          break;

        default:
          results.push({
            action: instruction.action,
            success: false,
            error: "Unknown action",
          });
      }
    } catch (error) {
      results.push({
        action: instruction.action,
        success: false,
        error: error.message,
      });
    }
  });

  return results;
}

function safeQuerySelector(selector) {
  try {
    return document.querySelector(selector);
  } catch (error) {
    console.error("Invalid selector:", selector, error);
    return null;
  }
}

function safeQuerySelectorAll(selector) {
  try {
    return document.querySelectorAll(selector);
  } catch (error) {
    console.error("Invalid selector:", selector, error);
    return [];
  }
}

chrome.runtime
  .sendMessage({
    type: "CONTENT_SCRIPT_READY",
    url: window.location.href,
    timestamp: Date.now(),
  })
  .catch(() => {});
