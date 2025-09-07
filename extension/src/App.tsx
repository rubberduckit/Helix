import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { FloatingNav } from "./components/FloatingNav";
import { ChatPage } from "./components/ChatPage";
import { HistoryPage } from "./components/HistoryPage";
import { SettingsPage } from "./components/SettingsPage";
import { ChatInput } from "./components/ChatInput";
import { storageService } from "./services/storageService";
import { chromeService } from "./services/chromeService";
import type {
  ChatSession,
  Message,
  StructuredScript,
} from "./services/storageService";
import "./App.css";
import { aiService } from "./services/aiService";

type Page = "chat" | "history" | "settings";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [currentTab, _setCurrentTab] = useState<any>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [scriptData, setScriptData] = useState<StructuredScript | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await storageService.saveSettings({ apiKey });
      } catch (error) {
        console.error("Error auto-saving settings:", error);
      }
    };
    if (apiKey !== undefined) {
      save();
    }
  }, [apiKey]);

  useLayoutEffect(() => {
    if (scrollContainerRef.current && currentPage === "chat") {
      const container = scrollContainerRef.current;
      const prevMessagesLength = prevMessagesLengthRef.current;
      const currentMessagesLength = messages.length;

      // A conversation load is approximated by a large jump in message count
      const isConvoLoad =
        currentMessagesLength > 0 &&
        (prevMessagesLength === 0 ||
          Math.abs(currentMessagesLength - prevMessagesLength) > 2);

      const behavior = isConvoLoad ? "instant" : "smooth";

      container.scrollTo({
        top: container.scrollHeight,
        behavior: behavior,
      });
    }
    // Update the ref for the next render
    prevMessagesLengthRef.current = messages.length;
  }, [messages, currentPage]);

  const loadInitialData = async () => {
    try {
      const settings = await storageService.getSettings();
      setApiKey(settings.apiKey || "");
      console.log("settings", settings);

      const sessions = await storageService.getChatSessions();
      setChatSessions(sessions);

      await storageService.clearCurrentSession();
      setCurrentSessionId(null);
      setMessages([]);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const streamingAssistant: Message = {
      id: assistantMessageId,
      content: "",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([...newMessages, streamingAssistant]);

    try {
      let currentUrl = "unknown";
      let domSnippet = "";
      try {
        const tab = await chromeService.getCurrentTab();
        currentUrl = tab?.url || "unknown";
      } catch {}
      try {
        const domResult = await chromeService.getPageDomSnapshot(0);
        if (domResult.success) {
          domSnippet = domResult.domHtml || domResult.domText || "";
        }
      } catch {}
      const formattedUserMessage = `Current Page: ${currentUrl}\nDOM content (sanitized HTML):\n${domSnippet}\n\nUser Query: ${message}`;

      const systemPromptUrl =
        typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL
          ? chrome.runtime.getURL("system_prompt.md")
          : "/system_prompt.md";
      const resp = await fetch(systemPromptUrl);
      const systemPrompt = await resp.text();

      let accumulated = "";
      let hasShownFriendly = false;

      const extractFriendlyFromPartial = (text: string): string | null => {
        const fmKeyIndex = text.indexOf('"friendly_message"');
        if (fmKeyIndex === -1) return null;
        const afterColon = text.indexOf(":", fmKeyIndex);
        if (afterColon === -1) return null;
        const startQuote = text.indexOf('"', afterColon);
        if (startQuote === -1) return null;

        const userscriptKeyIndex = text.indexOf('"userscript"', startQuote + 1);

        const scanLimit =
          userscriptKeyIndex === -1 ? text.length : userscriptKeyIndex;
        let i = startQuote + 1;
        let closing = -1;
        while (i < scanLimit) {
          if (text[i] === '"') {
            let backslashes = 0;
            let j = i - 1;
            while (j > startQuote && text[j] === "\\") {
              backslashes++;
              j--;
            }
            if (backslashes % 2 === 0) {
              closing = i;
              break;
            }
          }
          i++;
        }

        const endIndex = closing !== -1 ? closing : scanLimit;
        if (endIndex <= startQuote + 1) return null;
        const raw = text.slice(startQuote + 1, endIndex);
        try {
          if (closing !== -1) {
            return JSON.parse('"' + raw + '"');
          }
        } catch {}

        return raw
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\\\"/g, '"')
          .replace(/\\\\/g, "\\");
      };
      const fullText = await aiService.streamGenerate(
        {
          apiKey,
          userText: formattedUserMessage,
          systemPrompt,
        },
        (delta) => {
          accumulated += delta;
          const maybeFriendly = extractFriendlyFromPartial(accumulated);
          if (maybeFriendly && maybeFriendly.length > 0) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: maybeFriendly }
                  : m
              )
            );
            if (!hasShownFriendly) {
              hasShownFriendly = true;
            }
          }
        }
      );

      let parsedScript: StructuredScript | null = null;
      try {
        const parsed = JSON.parse(fullText);
        if (
          parsed &&
          typeof parsed.title === "string" &&
          typeof parsed.friendly_message === "string" &&
          typeof parsed.userscript === "string" &&
          typeof parsed.urlmatch === "string"
        ) {
          setScriptData({
            title: parsed.title,
            friendly_message: parsed.friendly_message,
            userscript: parsed.userscript,
            urlmatch: parsed.urlmatch,
          });

          parsedScript = {
            title: parsed.title,
            friendly_message: parsed.friendly_message,
            userscript: parsed.userscript,
            urlmatch: parsed.urlmatch,
          };
        }
      } catch {}

      const finalContent = parsedScript
        ? parsedScript.friendly_message
        : extractFriendlyFromPartial(accumulated) || accumulated;
      const finalMessages = newMessages.concat([
        {
          id: assistantMessageId,
          content: finalContent,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setMessages(finalMessages);
      setIsLoading(false);
      await saveConversation(finalMessages, message, parsedScript);
    } catch (error: any) {
      console.error("AI error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        content:
          error?.message === "Missing Gemini API key"
            ? "Please add your Gemini API key in Settings."
            : "Something went wrong generating a response. Try again.",
        isUser: false,
        timestamp: new Date(),
      };
      const finalMessages = [...newMessages, errorMsg];
      setMessages(finalMessages);
      setIsLoading(false);
      await saveConversation(finalMessages, message, null);
    }
  };

  const saveConversation = async (
    messageList: Message[],
    userInput: string,
    newScriptData?: StructuredScript | null
  ) => {
    try {
      const sessionId = currentSessionId || `session_${Date.now()}`;
      const effectiveScript: StructuredScript | null =
        newScriptData ?? scriptData ?? null;
      const session: ChatSession = {
        id: sessionId,
        title:
          effectiveScript?.title ||
          (userInput.length > 50
            ? userInput.substring(0, 50) + "..."
            : userInput),
        lastMessage: messageList[messageList.length - 1]?.content || "",
        timestamp: new Date(),
        messageCount: messageList.length,
        messages: messageList,
        scriptData: effectiveScript || undefined,
      };

      await storageService.saveChatSession(session);
      await storageService.saveCurrentSession(session);

      setCurrentSessionId(sessionId);
      setChatSessions(await storageService.getChatSessions());
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  const handleNewChat = async () => {
    setCurrentPage("chat");
    setMessages([]);
    setCurrentSessionId(null);
    setScriptData(null);

    try {
      await storageService.clearCurrentSession();
    } catch (error) {
      console.error("Error clearing current session:", error);
    }
  };

  const handleChatHistory = () => {
    setCurrentPage("history");
  };

  const handleSettings = () => {
    setCurrentPage("settings");
  };

  const handleResumeChat = async (sessionId: string) => {
    try {
      const session = chatSessions.find((s) => s.id === sessionId);
      if (session) {
        setCurrentPage("chat");
        setMessages(session.messages);
        setCurrentSessionId(sessionId);
        setScriptData(session.scriptData || null);

        await storageService.saveCurrentSession(session);
      }
    } catch (error) {
      console.error("Error resuming chat:", error);
    }
  };

  const handleDeleteChat = async (sessionId: string) => {
    try {
      await storageService.deleteChatSession(sessionId);

      setChatSessions(await storageService.getChatSessions());

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting chat session:", error);
    }
  };

  const handleResetSettings = async () => {
    try {
      await storageService.resetSettings();
      const settings = await storageService.getSettings();
      setApiKey(settings.apiKey || "");
      console.log("Settings reset successfully");
    } catch (error) {
      console.error("Error resetting settings:", error);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "chat":
        return (
          <ChatPage
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            currentTab={currentTab}
            scriptData={scriptData}
          />
        );
      case "history":
        return (
          <HistoryPage
            chatSessions={chatSessions}
            onResumeChat={handleResumeChat}
            onDeleteChat={handleDeleteChat}
          />
        );
      case "settings":
        return (
          <SettingsPage
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            onResetSettings={handleResetSettings}
          />
        );
      default:
        return null;
    }
  };

  const getHeaderTitle = (): string => {
    if (currentPage === "history") return "History";
    if (currentPage === "settings") return "Settings";
    if (currentPage === "chat" && currentSessionId) {
      const session = chatSessions.find((s) => s.id === currentSessionId);
      if (session?.title) return session.title;
    }
    return "Helix";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-shrink-0">
        <FloatingNav
          onNewChat={handleNewChat}
          onChatHistory={handleChatHistory}
          onSettings={handleSettings}
          title={getHeaderTitle()}
        />
      </div>
      <div className="flex-1 min-h-0 flex flex-col bg-card shadow-lg relative">
        <div
          ref={scrollContainerRef}
          className="absolute inset-0 overflow-y-auto"
        >
          {renderCurrentPage()}
        </div>
        {currentPage === "chat" && (
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        )}
      </div>
    </div>
  );
}

export default App;
