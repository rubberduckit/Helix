import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";

interface SettingsPageProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onSaveSettings: () => void;
  onResetSettings: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  apiKey,
  onApiKeyChange,
  onSaveSettings,
  onResetSettings,
}) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold"></h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onResetSettings}>
            Reset
          </Button>
          <Button onClick={onSaveSettings}>Save</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="grid grid-cols-2 gap-3">
              {(["light", "dark", "system", "dynamic"] as const).map(
                (themeOption) => (
                  <Button
                    key={themeOption}
                    variant={theme === themeOption ? "default" : "outline"}
                    onClick={() => setTheme(themeOption)}
                    className="justify-start"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          themeOption === "light"
                            ? "bg-white border-2 border-gray-300"
                            : themeOption === "dark"
                            ? "bg-gray-800 border-2 border-gray-600"
                            : themeOption === "system"
                            ? "bg-gradient-to-r from-white to-gray-800 border-2 border-gray-400"
                            : "bg-gradient-to-b from-blue-600 to-orange-500 border-2 border-blue-400"
                        }`}
                      />
                      <span className="capitalize">{themeOption}</span>
                    </div>
                  </Button>
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {theme === "system" && "Follows your system preference"}
              {theme === "dynamic" && "Changes based on time of day"}
              {theme === "light" && "Always use light theme"}
              {theme === "dark" && "Always use dark theme"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Gemini API Key
            </label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your API key is stored locally and never shared.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
