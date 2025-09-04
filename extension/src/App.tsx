import { useState, useEffect } from "react";
import { FloatingNav } from "./components/FloatingNav";
import { ChatPage } from "./components/ChatPage";
import { HistoryPage } from "./components/HistoryPage";
import { SettingsPage } from "./components/SettingsPage";
import { storageService } from "./services/storageService";
import type { ChatSession, Message, StructuredScript } from "./services/storageService";
import "./App.css";

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

    // Simulate AI response (remove this when implementing actual API)
    setTimeout(async () => {
      let aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you want to "${message}". I can help you create a userscript to modify the current page. What specific changes would you like me to implement?`,
        isUser: false,
        timestamp: new Date(),
      };

      // Attempt to parse structured AI response if message contains JSON
      // Expected shape: { title, friendly_message, userscript, urlmatch }
      let parsedScript: StructuredScript | null = null;
      try {
        const parsed = JSON.parse(aiMessage.content);
        if (
          parsed &&
          typeof parsed.title === "string" &&
          typeof parsed.friendly_message === "string" &&
          typeof parsed.userscript === "string" &&
          typeof parsed.urlmatch === "string"
        ) {
          aiMessage = {
            ...aiMessage,
            content: parsed.friendly_message,
          };
          const newScriptData: StructuredScript = {
            title: parsed.title,
            friendly_message: parsed.friendly_message,
            userscript: parsed.userscript,
            urlmatch: parsed.urlmatch,
          };
          parsedScript = newScriptData;
          setScriptData(newScriptData);
        }
      } catch {
        // Not a structured response; leave as-is
      }

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      setIsLoading(false);

      // Save the conversation
      await saveConversation(finalMessages, message, parsedScript);
    }, 1500);
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
