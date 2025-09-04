import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, Clock, Settings } from "lucide-react";

interface FloatingNavProps {
  onNewChat: () => void;
  onChatHistory: () => void;
  onSettings: () => void;
  title?: string;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({
  onNewChat,
  onChatHistory,
  onSettings,
  title = "Helix",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNav = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 z-[900]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <header className="sticky top-0 z-[1000] bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="min-w-0 text-sm font-medium text-foreground truncate">
            {title}
          </div>
          <div className="relative">
            <Button
              onClick={toggleNav}
              size="icon"
              variant="ghost"
              className="w-9 h-9 text-foreground"
              aria-label="Open menu"
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </Button>

            <div
              className={`absolute right-0 mt-2 space-y-1.5 transition-all duration-200 ease-out z-[1100] ${
                isOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleItemClick(onNewChat)}
                className={`w-9 h-9 bg-white text-gray-900 shadow-md hover:shadow-lg transition-all duration-200 ring-1 ring-black/10 hover:ring-black/20`}
                aria-label="New chat"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleItemClick(onChatHistory)}
                className={`w-9 h-9 bg-white text-gray-900 shadow-md hover:shadow-lg transition-all duration-200 ring-1 ring-black/10 hover:ring-black/20`}
                aria-label="Open history"
              >
                <Clock className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleItemClick(onSettings)}
                className={`w-9 h-9 bg-white text-gray-900 shadow-md hover:shadow-lg transition-all duration-200 ring-1 ring-black/10 hover:ring-black/20`}
                aria-label="Open settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
