import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ChatSession } from "../services/storageService";
import { Clock, MessageSquare, ChevronRight, Trash2 } from "lucide-react";

interface HistoryPageProps {
  chatSessions: ChatSession[];
  onResumeChat: (sessionId: string) => void;
  onDeleteChat: (sessionId: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  chatSessions,
  onResumeChat,
  onDeleteChat,
}) => {
  if (chatSessions.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No chat history</h3>
        <p className="text-sm">Start a new conversation to see it here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">History</h2>
        <span className="text-sm text-muted-foreground">
          {chatSessions.length} conversations
        </span>
      </div>

      <div className="space-y-2">
        {chatSessions.map((session) => (
          <Card
            key={session.id}
            className="group transition-colors border-transparent hover:bg-accent/50"
          >
            <CardHeader className="py-3">
              <div className="flex items-center gap-3">
                <button
                  className="flex flex-1 items-center gap-3 text-left"
                  onClick={() => onResumeChat(session.id)}
                  aria-label="Open conversation"
                >
                  <div className="h-8 w-8 shrink-0 rounded-md bg-muted/70 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-sm font-medium truncate">
                        {session.title}
                      </CardTitle>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {session.lastMessage}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{session.timestamp.toLocaleDateString()}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{session.messageCount} messages</span>
                    </div>
                  </div>
                </button>
                <div className="opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteChat(session.id)}
                    aria-label="Delete conversation"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};
