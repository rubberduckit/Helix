import React, { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { chromeService } from "@/services/chromeService";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatPageProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  currentTab?: any;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleExecuteScript = async () => {
    try {
      if (chromeService.isChromeExtension()) {
        // Option 1: Inject external script file (CSP compliant)
        const result = await chromeService.injectScriptFile(
          "userscript-template.js"
        );
        if (result.success) {
          console.log("Script file injected successfully:", result.result);
        } else {
          console.error("Failed to inject script file:", result.error);
        }
      } else {
        // Fallback for development mode
        console.log("Development mode: Script would execute");
        alert("Helix userscript would execute in extension mode");
      }
    } catch (error) {
      console.error("Error executing script:", error);
    }
  };

  const handleExecuteInlineScript = async () => {
    try {
      // Option 2: Execute inline script code (may have CSP limitations)
      const scriptCode = `
        // This is a userscript that will run on the current page
        console.log('Helix inline userscript executed!');
        
        // Example: Change the page title
        document.title = 'Modified by Helix - ' + document.title;
        
        // Example: Add a visual indicator
        const indicator = document.createElement('div');
        indicator.style.cssText = 'position:fixed;top:10px;right:10px;background:red;color:white;padding:10px;z-index:9999;border-radius:5px;';
        indicator.textContent = 'Helix Script Active';
        document.body.appendChild(indicator);
        
        // Remove indicator after 3 seconds
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
          }
        }, 3000);
        
        return 'Inline script executed successfully!';
      `;

      if (chromeService.isChromeExtension()) {
        const result = await chromeService.injectScript(scriptCode);
        if (result.success) {
          console.log("Inline script executed successfully:", result.result);
        } else {
          console.error("Failed to execute inline script:", result.error);
        }
      } else {
        // Fallback for development mode
        console.log(
          "Development mode: Inline script would execute:",
          scriptCode
        );
        alert("Helix inline script would execute in extension mode");
      }
    } catch (error) {
      console.error("Error executing inline script:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 pb-24"
        ref={chatContainerRef}
      >
        {messages.length === 0 ? (
          <div className="mt-10 max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Helix</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Your copilot for tweaking pages, automating tasks, and crafting
              userscripts.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onSendMessage("Add a scroll to top button")}
                className="group relative w-full text-left rounded-xl border bg-background/60 hover:bg-muted/60 transition-colors p-4 ring-1 ring-inset ring-border hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-blue-400/20 to-blue-400/10 text-blue-600 ring-1 ring-blue-400/20 flex items-center justify-center">
                    <span className="text-base">🔝</span>
                  </div>
                  <div>
                    <div className="font-medium">Add a scroll to top button</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Inject a floating button to jump back to the top quickly.
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onSendMessage("Change the style of this website")}
                className="group relative w-full text-left rounded-xl border bg-background/60 hover:bg-muted/60 transition-colors p-4 ring-1 ring-inset ring-border hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-400/10 text-amber-600 ring-1 ring-amber-400/20 flex items-center justify-center">
                    <span className="text-base">🎨</span>
                  </div>
                  <div>
                    <div className="font-medium">Change the style of this website</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Restyle colors, fonts, and spacing via a userscript.
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onSendMessage("Add a button that does something crazy")}
                className="group relative w-full text-left rounded-xl border bg-background/60 hover:bg-muted/60 transition-colors p-4 ring-1 ring-inset ring-border hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-purple-400/20 to-purple-400/10 text-purple-600 ring-1 ring-purple-400/20 flex items-center justify-center">
                    <span className="text-base">🤪</span>
                  </div>
                  <div>
                    <div className="font-medium">Add a button that does something crazy</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Insert a playful button with an unexpected action.
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
              onExecuteScript={
                !message.isUser ? handleExecuteScript : undefined
              }
              onExecuteInlineScript={
                !message.isUser ? handleExecuteInlineScript : undefined
              }
            />
          ))
        )}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mx-2">
              <span className="text-muted-foreground text-sm font-medium">
                A
              </span>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
    </div>
  );
};
