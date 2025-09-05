import { useState, useEffect } from "react";
import { FloatingNav } from "./components/FloatingNav";
import { ChatPage } from "./components/ChatPage";
import { HistoryPage } from "./components/HistoryPage";
import { SettingsPage } from "./components/SettingsPage";
import { storageService } from "./services/storageService";
import { chromeService } from "./services/chromeService";
import type { ChatSession, Message, StructuredScript } from "./services/storageService";
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

  // Load initial data from storage
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-save settings on change
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

  const loadInitialData = async () => {
    try {
      // Load settings
      const settings = await storageService.getSettings();
      setApiKey(settings.apiKey || "");
      console.log('settings', settings);

      // Load chat sessions
      const sessions = await storageService.getChatSessions();
      setChatSessions(sessions);

      // Always start a new chat on load: clear any saved current session
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

    // Insert a placeholder assistant message to stream into
    const assistantMessageId = (Date.now() + 1).toString();
    const placeholderAssistant: Message = {
      id: assistantMessageId,
      content: "Generating userscript…",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([...newMessages, placeholderAssistant]);

    try {
      // Compose formatted user message with current page context
      let currentUrl = "unknown";
      try {
        const tab = await chromeService.getCurrentTab();
        currentUrl = tab?.url || "unknown";
      } catch {
        // Not in extension context or failed to get tab; keep placeholder
      }
      const formattedUserMessage = `Current Page: ${currentUrl}\nDOM content: PLACEHOLDER\nUser Query: ${message}`;

      // Load system prompt from extension/public (works in dev and extension)
      const systemPromptUrl = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
        ? chrome.runtime.getURL('system_prompt.md')
        : '/system_prompt.md';
      const resp = await fetch(systemPromptUrl);
      const systemPrompt = await resp.text();

      let accumulated = "";
      const fullText = await aiService.streamGenerate(
        {
          apiKey,
          userText: formattedUserMessage,
          systemPrompt,
        },
        (delta) => {
          accumulated += delta;
          // Do not stream raw JSON into the UI; wait to parse and show friendly_message
        }
      );

      // Try to parse structured JSON at the end
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
          // Replace assistant message content with friendly_message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: parsed.friendly_message }
                : m
            )
          );
          parsedScript = {
            title: parsed.title,
            friendly_message: parsed.friendly_message,
            userscript: parsed.userscript,
            urlmatch: parsed.urlmatch,
          };
        }
      } catch {
        // ignore if not JSON
      }

      const finalMessages = [
        ...newMessages,
        {
          id: assistantMessageId,
          content: parsedScript ? parsedScript.friendly_message : accumulated,
          isUser: false,
          timestamp: new Date(),
        },
      ];
      setMessages(finalMessages);
      setIsLoading(false);
      await saveConversation(finalMessages, message, parsedScript);
    } catch (error: any) {
      console.error("AI error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        content:
          error?.message === 'Missing Gemini API key'
            ? 'Please add your Gemini API key in Settings.'
            : 'Something went wrong generating a response. Try again.',
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

      // Save to storage
      await storageService.saveChatSession(session);
      await storageService.saveCurrentSession(session);

      // Update local state
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

    // Clear current session from storage
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

        // Save as current session
        await storageService.saveCurrentSession(session);
      }
    } catch (error) {
      console.error("Error resuming chat:", error);
    }
  };

  const handleDeleteChat = async (sessionId: string) => {
    try {
      await storageService.deleteChatSession(sessionId);

      // Update local state
      setChatSessions(await storageService.getChatSessions());

      // If we're deleting the current session, clear it
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
      <FloatingNav
        onNewChat={handleNewChat}
        onChatHistory={handleChatHistory}
        onSettings={handleSettings}
        title={getHeaderTitle()}
      />
      <div className="flex-1 min-h-0 flex flex-col bg-card shadow-lg">
        {renderCurrentPage()}
      </div>
    </div>
  );
}

export default App;
