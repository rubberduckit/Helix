import React, { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { chromeService } from "@/services/chromeService";
import type { StructuredScript } from "@/services/storageService";
import { ArrowUp, Palette, Zap } from "lucide-react";

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
  scriptData?: StructuredScript | null;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  scriptData = null,
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
        if (scriptData && scriptData.userscript) {
          const result = await chromeService.injectScript(scriptData.userscript);
          if (result.success) {
            console.log("Userscript executed successfully:", result.result);
          } else {
            console.error("Failed to execute userscript:", result.error);
          }
        } else {
          // Fallback: inject template if no userscript is available
          const result = await chromeService.injectScriptFile("userscript-template.js");
          if (result.success) {
            console.log("Script file injected successfully:", result.result);
          } else {
            console.error("Failed to inject script file:", result.error);
          }
        }
      } else {
        // Fallback for development mode
        console.log("Development mode: Script would execute", scriptData);
        alert("Helix userscript would execute in extension mode");
      }
    } catch (error) {
      console.error("Error executing script:", error);
    }
  };

  const handleExecuteInlineScript = async () => {
    try {
      // Execute inline userscript from structured data if available
      const scriptCode = scriptData?.userscript;
      if (chromeService.isChromeExtension()) {
        const result = await chromeService.injectScript(scriptCode || "console.log('No userscript available')");
        if (result.success) {
          console.log("Inline script executed successfully:", result.result);
        } else {
          console.error("Failed to execute inline script:", result.error);
        }
      } else {
        // Fallback for development mode
        console.log("Development mode: Inline script would execute:", scriptCode);
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
                className="group relative w-full text-left rounded-xl p-[1px] bg-[linear-gradient(158.55deg,_#ffffffa8_13%,_#0086FFa8_64%)] hover:shadow-sm transition-shadow"
              >
                <div className="rounded-xl bg-[#171717] p-4 h-full">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-[#171717] flex items-center justify-center">
                      <ArrowUp className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">Add a scroll to top button</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Inject a floating button to jump back to the top quickly.
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onSendMessage("Change the style of this website")}
                className="group relative w-full text-left rounded-xl p-[1px] bg-[linear-gradient(158.55deg,_#ffffffa8_13%,_#0086FFa8_64%)] hover:shadow-sm transition-shadow"
              >
                <div className="rounded-xl bg-[#171717] p-4 h-full">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-[#171717] flex items-center justify-center">
                      <Palette className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">Change the style of this website</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Restyle colors, fonts, and spacing via a userscript.
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onSendMessage("Add a button that does something crazy")}
                className="group relative w-full text-left rounded-xl p-[1px] bg-[linear-gradient(158.55deg,_#ffffffa8_13%,_#0086FFa8_64%)] hover:shadow-sm transition-shadow"
              >
                <div className="rounded-xl bg-[#171717] p-4 h-full">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-[#171717] flex items-center justify-center">
                      <Zap className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">Add a button that does something crazy</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Insert a playful button with an unexpected action.
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          messages.map((message, idx) => (
            <ChatMessage
              key={message.id}
              message={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
              onExecuteScript={!message.isUser && idx === messages.length - 1 ? handleExecuteScript : undefined}
              onExecuteInlineScript={!message.isUser && idx === messages.length - 1 ? handleExecuteInlineScript : undefined}
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
