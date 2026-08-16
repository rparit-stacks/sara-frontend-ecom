import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { adminAiChatApi, type ChatSessionSummaryDto } from '@/lib/api';

interface Props {
  activeThreadId: string | null;
  onSelect: (threadId: string) => void;
  onBack?: () => void;
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

export function AdminHistoryPanel({ activeThreadId, onSelect, onBack }: Props) {
  const [sessions, setSessions] = useState<ChatSessionSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminAiChatApi
      .listThreads()
      .then(setSessions)
      .catch(() => setError("Couldn't load sessions."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex flex-1 flex-col overflow-hidden bg-white"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-amber-700"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <p className="text-sm font-semibold text-slate-800">Sessions</p>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500/70" />
          </div>
        )}
        {error && <p className="px-2 py-4 text-center text-xs text-red-600">{error}</p>}
        {!isLoading && !error && sessions.length === 0 && (
          <p className="px-2 py-8 text-center text-xs text-slate-400">No past sessions yet.</p>
        )}
        {sessions.map((s) => {
          const active = s.threadId === activeThreadId;
          return (
            <button
              key={s.threadId}
              type="button"
              onClick={() => onSelect(s.threadId)}
              className={`mb-1 flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left transition ${
                active ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-800">{s.title || 'Untitled'}</p>
                <p className="text-[10px] text-slate-400">{formatRelativeTime(s.updatedAt)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
