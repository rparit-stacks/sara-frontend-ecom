import { useEffect, useState } from 'react';
import { Sym } from './Sym';
import type { ProjectMessageDto } from '@/lib/api';
import { stripMessageMarkers } from '@/lib/messageFormat';
import { highlightText } from '@/lib/highlightText';

export default function ChatSearchBar({
  onSearch,
  onJumpTo,
}: {
  onSearch: (q: string) => Promise<ProjectMessageDto[]>;
  onJumpTo: (messageId: number, designId?: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ProjectMessageDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await onSearch(q.trim()));
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, open, onSearch]);

  const query = q.trim();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg hover:bg-black/5 transition-colors"
        title="Search messages"
      >
        <Sym name="search" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 w-80 sm:w-96 border rounded-xl shadow-xl z-40 overflow-hidden"
            style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
          >
            <div className="p-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--p-outline-variant)' }}>
              <Sym name="search" className="text-[18px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search in this project…"
                className="flex-1 bg-transparent border-none outline-none text-[14px]"
              />
              {loading && <Sym name="progress_activity" className="text-[16px] animate-spin" style={{ color: 'var(--p-primary)' }} />}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {!query ? (
                <p className="text-[13px] p-4 text-center" style={{ color: 'var(--p-on-surface-variant)' }}>Type to search messages</p>
              ) : results.length === 0 && !loading ? (
                <p className="text-[13px] p-4 text-center" style={{ color: 'var(--p-on-surface-variant)' }}>No matches</p>
              ) : (
                results.map((m) => {
                  const preview = stripMessageMarkers(m.body) || '(attachment)';
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { onJumpTo(m.id, m.designId); setOpen(false); }}
                      className="w-full text-left px-3 py-2.5 border-b hover:bg-black/[0.03] last:border-0"
                      style={{ borderColor: 'var(--p-outline-variant)' }}
                    >
                      <p className="text-[12px] font-semibold truncate">{highlightText(m.authorName || 'Message', query)}</p>
                      <p className="text-[13px] break-words line-clamp-2" style={{ color: 'var(--p-on-surface-variant)' }}>
                        {highlightText(preview, query)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
