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

      <div className="space-y-3">
        {chatSessions.map((session) => (
          <Card
            key={session.id}
            className="group transition-all duration-200 border border-border/50 hover:border-border hover:shadow-sm cursor-pointer bg-card/50 hover:bg-card"
          >
            <CardHeader className="p-4">
              <div className="flex items-start gap-4">
                <button
                  className="flex flex-1 items-start gap-4 text-left min-w-0 w-full"
                  onClick={() => onResumeChat(session.id)}
                  aria-label={`Open conversation: ${session.title}`}
                >
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <CardTitle className="text-base font-semibold truncate flex-1 min-w-0 text-foreground group-hover:text-primary transition-colors">
                        {session.title}
                      </CardTitle>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                    </div>
                    {session.lastMessage && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                        {session.lastMessage}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.timestamp.toLocaleDateString()}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </button>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(session.id);
                    }}
                    aria-label="Delete conversation"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
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
