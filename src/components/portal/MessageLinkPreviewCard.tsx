import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sym } from './Sym';
import { projectApi, clientProjectApi, adminCustomerChatApi, clientCustomerChatApi, type ProjectMessageDto, type CustomerMessageDto } from '@/lib/api';

export interface ParsedMessageLink {
  base: '/portal' | '/portal-admin';
  projectCode?: string;
  customerEmail?: string;
  isGeneral: boolean;
  messageId: number;
  fullUrl: string;
}

/** Recognizes our own copyMessageLink() output — `.../workspace-preview?project=CODE&tab=...#msg-123`
 *  or `.../workspace-preview?tab=general[&customer=email]#msg-123` — so a pasted message link renders
 *  a rich preview instead of a generic OG-unfurl card. Returns null for any other URL. */
export function parseMessageLink(url: string): ParsedMessageLink | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const base = parsed.pathname.includes('/portal-admin/workspace-preview') ? '/portal-admin'
    : parsed.pathname.includes('/portal/workspace-preview') ? '/portal'
    : null;
  if (!base) return null;
  const hashMatch = parsed.hash.match(/^#msg-(\d+)$/);
  if (!hashMatch) return null;
  const messageId = Number(hashMatch[1]);
  const projectCode = parsed.searchParams.get('project') || undefined;
  const customerEmail = parsed.searchParams.get('customer') || undefined;
  const isGeneral = parsed.searchParams.get('tab') === 'general' || (!projectCode && !!customerEmail);
  if (!projectCode && !isGeneral) return null;
  return { base, projectCode, customerEmail, isGeneral, messageId, fullUrl: url };
}

type MessageLike = ProjectMessageDto | CustomerMessageDto;

async function fetchMessage(link: ParsedMessageLink): Promise<MessageLike | null> {
  try {
    if (link.isGeneral) {
      if (link.base === '/portal-admin') {
        if (!link.customerEmail) return null;
        return await adminCustomerChatApi.getMessage(link.customerEmail, link.messageId);
      }
      return await clientCustomerChatApi.getMessage(link.messageId);
    }
    if (!link.projectCode) return null;
    if (link.base === '/portal-admin') return await projectApi.getMessage(link.projectCode, link.messageId);
    return await clientProjectApi.getMessage(link.projectCode, link.messageId);
  } catch {
    return null;
  }
}

function previewText(m: MessageLike): string {
  const body = (m.body || '').replace(/\[\[(?:product|payment|project|design|invoice|quote|file):[^\]]+\]\]/g, '').trim();
  if (body) return body.length > 140 ? `${body.slice(0, 137)}…` : body;
  const urls = m.attachmentUrls && m.attachmentUrls.length > 0 ? m.attachmentUrls : (m.attachmentUrl ? [m.attachmentUrl] : []);
  if (urls.length > 1) return `${urls.length} attachments`;
  if (urls.length === 1) return 'Sent an attachment';
  return '(no content)';
}

// Module-level cache — same pattern as LinkPreviewCard, so the same message-link across
// many bubbles resolves once.
const cache = new Map<string, MessageLike | null>();

/** Rich preview for a pasted message-deep-link (our own copyMessageLink() output): shows who
 *  said what, in which project/General Chat, with an "Open" action that jumps straight to
 *  that exact message (scroll + highlight) — mirrors LinkPreviewCard's shape/behavior for
 *  external links, but resolves from our own API instead of OG metadata. */
export default function MessageLinkPreviewCard({ link }: { link: ParsedMessageLink }) {
  const navigate = useNavigate();
  const cacheKey = link.fullUrl;
  const [data, setData] = useState<MessageLike | null | undefined>(cache.has(cacheKey) ? cache.get(cacheKey) : undefined);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    if (cache.has(cacheKey)) {
      setData(cache.get(cacheKey));
      return;
    }
    fetchMessage(link).then((res) => {
      cache.set(cacheKey, res);
      if (alive.current) setData(res);
    });
    return () => { alive.current = false; };
  }, [cacheKey]);

  if (data === undefined) return null; // still loading
  if (data === null) {
    // Message not found / no longer accessible — fall back to a plain, minimal link row
    // rather than a broken-looking rich card.
    return (
      <a href={link.fullUrl} className="mt-1.5 flex items-center gap-1.5 text-[12px] underline" style={{ color: 'var(--bubble-fg, var(--p-primary))' }}>
        <Sym name="link" className="text-[14px]" /> Open message
      </a>
    );
  }

  const contextLabel = link.isGeneral ? 'General Chat' : link.projectCode || 'Project';
  // A message with replies IS a thread root — same card, extra reply-count line and
  // "Open Thread" wording instead of "Open message" (the two only differ cosmetically
  // since a thread is addressed by its root message's id, not a separate entity).
  const replyCount = data.replyCount || 0;
  const isThread = replyCount > 0;

  return (
    <button
      type="button"
      onClick={() => navigate(`${link.base}/workspace-preview${new URL(link.fullUrl).search}${new URL(link.fullUrl).hash}`)}
      className="mt-1.5 flex w-full flex-col text-left overflow-hidden rounded-xl border hover:shadow-sm transition-shadow"
      style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
    >
      <div className="flex items-center gap-1.5 px-3 pt-2.5">
        <Sym name={isThread ? 'forum' : 'chat_bubble'} className="text-[14px]" style={{ color: 'var(--p-primary)' }} />
        <span className="text-[11px] font-semibold uppercase tracking-wide truncate" style={{ color: 'var(--p-on-surface-variant)' }}>
          {isThread ? 'Thread' : 'Message'} · {contextLabel}
        </span>
      </div>
      <div className="px-3 pb-2.5 pt-1">
        <p className="text-[12px] font-bold" style={{ color: 'var(--p-on-surface)' }}>{data.authorName || data.authorType}</p>
        <p className="text-[13px] leading-snug line-clamp-2 mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>{previewText(data)}</p>
        {isThread && (
          <p className="text-[11px] mt-1" style={{ color: 'var(--p-on-surface-variant)' }}>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</p>
        )}
      </div>
      <div className="px-3 py-1.5 border-t text-[11px] font-semibold flex items-center gap-1" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-primary)' }}>
        <Sym name="open_in_new" className="text-[13px]" /> {isThread ? 'Open thread' : 'Open message'}
      </div>
    </button>
  );
}
