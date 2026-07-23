import { useEffect, useRef, useState } from 'react';
import { mediaApi, type LinkPreview } from '@/lib/api';
import { Sym } from './Sym';

/** Extract the first http(s) URL from a message body (skips markdown-link targets is unnecessary — first bare/explicit URL wins). */
export function firstUrl(text: string | undefined): string | null {
  if (!text) return null;
  const m = text.match(/https?:\/\/[^\s<)\]]+/);
  if (!m) return null;
  return m[0].replace(/[.,;:!?)\]]+$/, '');
}

// Module-level cache so the same link across many message bubbles fetches once.
const cache = new Map<string, LinkPreview | null>();

/**
 * WhatsApp/Slack-style link unfurl card. Fetches OG metadata for `url` and renders
 * a compact card. Renders nothing while loading or if there's no usable preview,
 * so the plain clickable link (from RichMessageBody) is always still shown above it.
 */
export default function LinkPreviewCard({ url, compact = false }: { url: string; compact?: boolean }) {
  const [data, setData] = useState<LinkPreview | null | undefined>(cache.has(url) ? cache.get(url) : undefined);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    if (cache.has(url)) {
      setData(cache.get(url));
      return;
    }
    mediaApi.linkPreview(url).then((res) => {
      cache.set(url, res);
      if (alive.current) setData(res);
    });
    return () => { alive.current = false; };
  }, [url]);

  // undefined = still loading, null = no preview available → render nothing.
  if (!data) return null;

  const host = data.siteName || (() => { try { return new URL(url).host; } catch { return url; } })();

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`mt-1.5 flex overflow-hidden rounded-xl border hover:shadow-sm transition-shadow ${compact ? 'max-w-xs' : 'max-w-sm'}`}
      style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
    >
      {data.image && (
        <div className={`shrink-0 overflow-hidden ${compact ? 'w-16' : 'w-20'} `} style={{ background: 'var(--p-surface-container-high)' }}>
          <img src={data.image} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }} />
        </div>
      )}
      <div className="min-w-0 flex-1 p-2.5">
        <div className="flex items-center gap-1 mb-0.5">
          {data.favicon && (
            <img src={data.favicon} alt="" className="w-3.5 h-3.5 rounded-sm" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          )}
          <span className="text-[11px] font-semibold uppercase tracking-wide truncate" style={{ color: 'var(--p-on-surface-variant)' }}>
            {host}
          </span>
        </div>
        {data.title && (
          <p className="text-[13px] font-bold leading-snug line-clamp-2" style={{ color: 'var(--p-on-surface)' }}>
            {data.title}
          </p>
        )}
        {data.description && !compact && (
          <p className="text-[12px] leading-snug line-clamp-2 mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
            {data.description}
          </p>
        )}
        {!data.title && !data.description && (
          <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: 'var(--p-primary)' }}>
            <Sym name="link" className="text-[14px]" /> {url}
          </span>
        )}
      </div>
    </a>
  );
}
