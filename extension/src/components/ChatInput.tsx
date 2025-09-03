import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-50">
      <div className="relative">
        <div className="bg-card border border-border rounded-2xl shadow-lg backdrop-blur-sm bg-opacity-95">
          <div className="flex items-end gap-3 p-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write your thoughts..."
              className="min-h-[48px] max-h-32 resize-none bg-transparent border-0 shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground flex-1"
              disabled={disabled}
            />

            {/* Send Button */}
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!message.trim() || disabled}
              className="w-15 h-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors p-0 flex-shrink-0"
            >
              <ArrowUp size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
