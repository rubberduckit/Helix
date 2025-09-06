export interface TabInfo {
  id: number;
  url: string;
  title: string;
}

export interface StorageData {
  [key: string]: any;
}

export interface ScriptInjectionResult {
  success: boolean;
  result?: any;
  error?: string;
}

export interface DOMModificationInstruction {
  action:
    | "style"
    | "addClass"
    | "removeClass"
    | "setAttribute"
    | "createElement"
    | "removeElement"
    | "addEventListener";
  selector: string;
  [key: string]: any;
}

export interface DOMModificationResult {
  success: boolean;
  result?: any[];
  error?: string;
}

export interface PageDomSnapshotResult {
  success: boolean;
  domHtml?: string;
  domText?: string;
  meta?: { url: string; title: string; lang?: string };
  error?: string;
}

export class ChromeService {
  private static instance: ChromeService;

  private constructor() {}

  public static getInstance(): ChromeService {
    if (!ChromeService.instance) {
      ChromeService.instance = new ChromeService();
    }
    return ChromeService.instance;
  }

  public isChromeExtension(): boolean {
    return !!(
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.id
    );
  }

  private async sendMessage(message: any): Promise<any> {
    if (!this.isChromeExtension()) {
      throw new Error("Not running in Chrome extension context");
    }

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  public async getCurrentTab(): Promise<TabInfo> {
    try {
      const response = await this.sendMessage({ type: "GET_CURRENT_TAB" });
      if (response.success) {
        return response.tab;
      } else {
        throw new Error(response.error || "Failed to get current tab");
      }
    } catch (error) {
      console.error("Error getting current tab:", error);
      throw error;
    }
  }

  public async injectScript(
    scriptCode: string
  ): Promise<ScriptInjectionResult> {
    try {
      const response = await this.sendMessage({
        type: "INJECT_SCRIPT",
        scriptCode,
      });

      if (response.success) {
        return { success: true, result: response.result };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("Error injecting script:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  public async injectScriptFile(
    scriptFile: string
  ): Promise<ScriptInjectionResult> {
    try {
      const response = await this.sendMessage({
        type: "INJECT_SCRIPT",
        scriptFile,
      });

      if (response.success) {
        return { success: true, result: response.result };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("Error injecting script file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  public async modifyDOM(
    instructions: DOMModificationInstruction[]
  ): Promise<DOMModificationResult> {
    try {
      const currentTab = await this.getCurrentTab();

      const response = await this.sendMessage({
        type: "MODIFY_DOM",
        tabId: currentTab.id,
        instructions,
      });

      if (response.success) {
        return { success: true, result: response.result };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("Error modifying DOM:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  public async getPageDomSnapshot(
    maxChars: number = 20000
  ): Promise<PageDomSnapshotResult> {
    try {
      const response = await this.sendMessage({
        type: "GET_PAGE_DOM",
        maxChars,
      });
      if (response && response.success) {
        return {
          success: true,
          domHtml: response.domHtml,
          domText: response.domText,
          meta: response.meta,
        };
      }
      return {
        success: false,
        error: response?.error || "Failed to get DOM snapshot",
      };
    } catch (error) {
      console.error("Error getting DOM snapshot:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  public async getStorageData(keys: string | string[]): Promise<StorageData> {
    try {
      const keyArray = Array.isArray(keys) ? keys : [keys];

      if (!this.isChromeExtension()) {
        const result: StorageData = {};
        for (const key of keyArray) {
          const raw = window.localStorage.getItem(key);
          try {
            result[key] = raw != null ? JSON.parse(raw) : undefined;
          } catch {
            result[key] = raw;
          }
        }
        return result;
      }

      const response = await this.sendMessage({
        type: "GET_STORAGE_DATA",
        keys: keyArray,
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || "Failed to get storage data");
      }
    } catch (error) {
      console.error("Error getting storage data:", error);
      throw error;
    }
  }

  public async setStorageData(data: StorageData): Promise<boolean> {
    try {
      if (!this.isChromeExtension()) {
        Object.keys(data).forEach((key) => {
          try {
            window.localStorage.setItem(key, JSON.stringify(data[key]));
          } catch {
            window.localStorage.setItem(key, String(data[key]));
          }
        });
        return true;
      }

      const response = await this.sendMessage({
        type: "SET_STORAGE_DATA",
        data,
      });

      if (response.success) {
        return true;
      } else {
        throw new Error(response.error || "Failed to set storage data");
      }
    } catch (error) {
      console.error("Error setting storage data:", error);
      throw error;
    }
  }

  public async clearStorageData(keys: string[]): Promise<boolean> {
    try {
      if (!this.isChromeExtension()) {
        keys.forEach((key) => window.localStorage.removeItem(key));
        return true;
      }

      const response = await this.sendMessage({
        type: "CLEAR_STORAGE_DATA",
        keys,
      });

      if (response.success) {
        return true;
      } else {
        throw new Error(response.error || "Failed to clear storage data");
      }
    } catch (error) {
      console.error("Error clearing storage data:", error);
      throw error;
    }
  }

  public onMessage(callback: (message: any) => void): void {
    if (!this.isChromeExtension()) {
      console.warn(
        "Not running in Chrome extension context, message listener not available"
      );
      return;
    }

    chrome.runtime.onMessage.addListener(callback);
  }

  public removeMessageListener(callback: (message: any) => void): void {
    if (!this.isChromeExtension()) {
      return;
    }

    chrome.runtime.onMessage.removeListener(callback);
  }

  public getExtensionInfo() {
    if (!this.isChromeExtension()) {
      return null;
    }

    return {
      id: chrome.runtime.id,
      version: chrome.runtime.getManifest().version,
      name: chrome.runtime.getManifest().name,
    };
  }

  public hasPermission(permission: string): boolean {
    if (!this.isChromeExtension()) {
      return false;
    }

    return !!(chrome.permissions && chrome.permissions.contains
      ? chrome.permissions.contains({ permissions: [permission] as any })
      : false);
  }

  public async requestPermission(permission: string): Promise<boolean> {
    if (!this.isChromeExtension()) {
      return false;
    }

    if (!chrome.permissions || !chrome.permissions.request) {
      return false;
    }

    try {
      const granted = await chrome.permissions.request({
        permissions: [permission] as any,
      });
      return granted;
    } catch (error) {
      console.error("Error requesting permission:", error);
      return false;
    }
  }
}

export const chromeService = ChromeService.getInstance();
