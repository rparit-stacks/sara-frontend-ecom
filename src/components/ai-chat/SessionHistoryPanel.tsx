import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Loader2 } from 'lucide-react';
import { aiChatApi, type ChatSessionSummaryDto } from '@/lib/api';

interface SessionHistoryPanelProps {
  activeThreadId: string | null;
  onSelect: (threadId: string) => void;
  /** Compact overlay (mobile / menu) — shows a back button. Sidebar mode omits it. */
  onBack?: () => void;
  /** `sidebar` = permanent left rail in expanded chat; `panel` = full takeover. */
  variant?: 'panel' | 'sidebar';
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * The "one user, many independent chat sessions" list — logged-in customers can have several
 * saved conversations (spec: like ChatGPT/Claude/Gemini's session history) and need a way to
 * see and switch between them, since only one is ever "active" in the widget at a time.
 */
export function SessionHistoryPanel({
  activeThreadId,
  onSelect,
  onBack,
  variant = 'panel',
}: SessionHistoryPanelProps) {
  const [sessions, setSessions] = useState<ChatSessionSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSidebar = variant === 'sidebar';

  useEffect(() => {
    aiChatApi
      .listThreads()
      .then(setSessions)
      .catch((err) => {
        console.error('[AiChat] listThreads failed', err);
        setError("Couldn't load your chat history.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: isSidebar ? -8 : 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isSidebar ? -8 : 12 }}
      transition={{ duration: 0.18 }}
      className={`flex flex-col overflow-hidden ${
        isSidebar
          ? 'h-full w-[240px] shrink-0 border-r border-border bg-secondary/30'
          : 'flex-1'
      }`}
    >
      <div className={`flex items-center gap-2 border-b border-border ${isSidebar ? 'px-3 py-3.5' : 'px-4 py-3'}`}>
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
            aria-label="Back to chat"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <p className="text-sm font-semibold text-foreground">Chat history</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}

        {!isLoading && error && (
          <p className="px-2 py-6 text-center text-sm text-destructive">{error}</p>
        )}

        {!isLoading && !error && sessions.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No saved conversations yet — anything you ask will show up here.
          </p>
        )}

        {!isLoading &&
          !error &&
          sessions.map((session) => {
            const isActive = session.threadId === activeThreadId;
            return (
              <button
                key={session.threadId}
                onClick={() => onSelect(session.threadId)}
                className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  isActive ? 'bg-primary/10' : 'hover:bg-secondary'
                }`}
              >
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{session.title}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(session.updatedAt)}</p>
                </div>
                {isActive && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
              </button>
            );
          })}
      </div>
    </motion.div>
  );
}
