import type { ReactNode } from 'react';

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Highlight all case-insensitive matches of `query` inside `text`. */
export function highlightText(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q || !text) return text;
  const re = new RegExp(`(${escapeRegex(q)})`, 'gi');
  const parts = text.split(re);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={i}
        className="rounded px-0.5 font-semibold"
        style={{ background: 'rgba(0,103,106,0.22)', color: 'inherit' }}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
