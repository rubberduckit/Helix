import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, Clock, Settings } from "lucide-react";

interface FloatingNavProps {
  onNewChat: () => void;
  onChatHistory: () => void;
  onSettings: () => void;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({
  onNewChat,
  onChatHistory,
  onSettings,
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
      {/* Dark backdrop with blur effect - positioned above ALL content */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300 z-[9999] ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Floating Navigation - positioned above backdrop */}
      <div className="fixed top-4 left-4 z-[10000]">
        {/* Floating Arrow Button */}
        <Button
          onClick={toggleNav}
          size="icon"
          variant="ghost"
          className="w-10 h-10 bg-[#171717] text-gray-700 transition-all duration-200 border border-none"
        >
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </Button>

        {/* Sliding Icon Navigation (group animation) */}
        <div
          className={`absolute top-12 left-0 space-y-1.5 transition-all duration-200 ease-out ${
            isOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          {/* New Chat Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleItemClick(onNewChat)}
            className={`w-9 h-9 bg-white/80 text-gray-800 shadow-md hover:shadow-lg transition-all duration-200 ring-1 ring-black/10 hover:ring-black/20 backdrop-blur-[2px]`}
          >
            <Plus className="w-4 h-4" />
          </Button>

          {/* Chat History Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleItemClick(onChatHistory)}
            className={`w-9 h-9 bg-white/80 text-gray-800 shadow-md hover:shadow-lg transition-all duration-200 ring-1 ring-black/10 hover:ring-black/20 backdrop-blur-[2px]`}
          >
            <Clock className="w-4 h-4" />
          </Button>

          {/* Settings Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleItemClick(onSettings)}
            className={`w-9 h-9 bg-white/80 text-gray-800 shadow-md hover:shadow-lg transition-all duration-200 ring-1 ring-black/10 hover:ring-black/20 backdrop-blur-[2px]`}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
};
