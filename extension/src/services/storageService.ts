// Storage service for Helix
// Handles persistent storage of chat history, settings, and other data

import { chromeService } from './chromeService';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  messages: Message[];
  scriptData?: StructuredScript;
}

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface StructuredScript {
  title: string;
  friendly_message: string;
  userscript: string;
  urlmatch: string;
}

export interface Settings {
  apiKey: string;
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  maxHistoryItems: number;
}

export interface StorageKeys {
  CHAT_SESSIONS: 'chat_sessions';
  SETTINGS: 'settings';
  CURRENT_SESSION: 'current_session';
}

const STORAGE_KEYS: StorageKeys = {
  CHAT_SESSIONS: 'chat_sessions',
  SETTINGS: 'settings',
  CURRENT_SESSION: 'current_session'
};

const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  theme: 'system',
  autoSave: true,
  maxHistoryItems: 100
};

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Get all chat sessions
  public async getChatSessions(): Promise<ChatSession[]> {
    try {
      const data = await chromeService.getStorageData(STORAGE_KEYS.CHAT_SESSIONS);
      const sessions = data[STORAGE_KEYS.CHAT_SESSIONS] || [];
      
      // Convert timestamp strings back to Date objects
      return sessions.map((session: any) => ({
        ...session,
        timestamp: new Date(session.timestamp),
        messages: session.messages?.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) || []
      }));
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      return [];
    }
  }

  // Save a chat session
  public async saveChatSession(session: ChatSession): Promise<boolean> {
    try {
      const sessions = await this.getChatSessions();
      
      // Find existing session or add new one
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }

      // Sort by timestamp (newest first)
      sessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Limit the number of stored sessions
      const settings = await this.getSettings();
      const limitedSessions = sessions.slice(0, settings.maxHistoryItems);

      await chromeService.setStorageData({
        [STORAGE_KEYS.CHAT_SESSIONS]: limitedSessions
      });

      return true;
    } catch (error) {
      console.error('Error saving chat session:', error);
      return false;
    }
  }

  // Delete a chat session
  public async deleteChatSession(sessionId: string): Promise<boolean> {
    try {
      const sessions = await this.getChatSessions();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      
      await chromeService.setStorageData({
        [STORAGE_KEYS.CHAT_SESSIONS]: filteredSessions
      });

      return true;
    } catch (error) {
      console.error('Error deleting chat session:', error);
      return false;
    }
  }

  // Get the current active chat session
  public async getCurrentSession(): Promise<ChatSession | null> {
    try {
      const data = await chromeService.getStorageData(STORAGE_KEYS.CURRENT_SESSION);
      const session = data[STORAGE_KEYS.CURRENT_SESSION];
      
      if (session) {
        return {
          ...session,
          timestamp: new Date(session.timestamp),
          messages: session.messages?.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })) || []
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  // Save the current active chat session
  public async saveCurrentSession(session: ChatSession): Promise<boolean> {
    try {
      await chromeService.setStorageData({
        [STORAGE_KEYS.CURRENT_SESSION]: session
      });
      return true;
    } catch (error) {
      console.error('Error saving current session:', error);
      return false;
    }
  }

  // Clear the current session
  public async clearCurrentSession(): Promise<boolean> {
    try {
      await chromeService.clearStorageData([STORAGE_KEYS.CURRENT_SESSION]);
      return true;
    } catch (error) {
      console.error('Error clearing current session:', error);
      return false;
    }
  }

  // Get settings
  public async getSettings(): Promise<Settings> {
    try {
      const data = await chromeService.getStorageData(STORAGE_KEYS.SETTINGS);
      const settings = data[STORAGE_KEYS.SETTINGS];
      
      if (settings) {
        // Merge with defaults to ensure all properties exist
        return { ...DEFAULT_SETTINGS, ...settings };
      }
      
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error getting settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  // Save settings
  public async saveSettings(settings: Partial<Settings>): Promise<boolean> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      
      await chromeService.setStorageData({
        [STORAGE_KEYS.SETTINGS]: newSettings
      });

      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  // Reset settings to defaults
  public async resetSettings(): Promise<boolean> {
    try {
      await chromeService.setStorageData({
        [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS
      });
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  }

  // Clear all stored data
  public async clearAllData(): Promise<boolean> {
    try {
      await chromeService.clearStorageData([
        STORAGE_KEYS.CHAT_SESSIONS,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.CURRENT_SESSION
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  // Export all data as JSON
  public async exportData(): Promise<string> {
    try {
      const [sessions, settings, currentSession] = await Promise.all([
        this.getChatSessions(),
        this.getSettings(),
        this.getCurrentSession()
      ]);

      const exportData = {
        sessions,
        settings,
        currentSession,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Import data from JSON
  public async importData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate the imported data structure
      if (!data.sessions || !Array.isArray(data.sessions)) {
        throw new Error('Invalid data format: sessions array is required');
      }

      if (!data.settings || typeof data.settings !== 'object') {
        throw new Error('Invalid data format: settings object is required');
      }

      // Import the data
      await Promise.all([
        chromeService.setStorageData({
          [STORAGE_KEYS.CHAT_SESSIONS]: data.sessions
        }),
        chromeService.setStorageData({
          [STORAGE_KEYS.SETTINGS]: data.settings
        })
      ]);

      // Import current session if it exists
      if (data.currentSession) {
        await this.saveCurrentSession(data.currentSession);
      }

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // Get storage usage information
  public async getStorageInfo(): Promise<{ used: number; total: number }> {
    try {
      if (chrome.storage && chrome.storage.local.getBytesInUse) {
        const used = await chrome.storage.local.getBytesInUse();
        // Chrome local storage limit is typically 5MB
        const total = 5 * 1024 * 1024; // 5MB in bytes
        return { used, total };
      }
      
      return { used: 0, total: 0 };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { used: 0, total: 0 };
    }
  }
}

// Export a singleton instance
export const storageService = StorageService.getInstance();

