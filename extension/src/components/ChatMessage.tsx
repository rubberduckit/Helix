import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  onExecuteScript?: () => void;
  onExecuteInlineScript?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser,
  timestamp,
  onExecuteScript,
  onExecuteInlineScript,
}) => {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
        <Card
          className={`${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-[#171717] text-foreground"
          } border-0`}
        >
          <CardContent className="p-3">
            <p className="text-sm">{message}</p>
            {!isUser && (onExecuteScript || onExecuteInlineScript) && (
              <div className="mt-3 pt-2 border-t border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (onExecuteScript) {
                      onExecuteScript();
                    } else if (onExecuteInlineScript) {
                      onExecuteInlineScript();
                    }
                  }}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Run Script
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <div
          className={`text-xs text-muted-foreground mt-1 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 ${
          isUser
            ? "order-1 bg-primary text-primary-foreground"
            : "order-2 bg-muted text-muted-foreground"
        }`}
      >
        <span className="text-sm font-medium">{isUser ? "U" : "A"}</span>
      </div>
    </div>
  );
};
