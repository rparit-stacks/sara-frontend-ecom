import { Fragment, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import PortalShell from '@/components/portal/PortalShell';
import { Sym } from '@/components/portal/Sym';
import AddDesignModal from '@/components/portal/AddDesignModal';
import RenameDesignModal from '@/components/portal/RenameDesignModal';
import MessageHoverActions from '@/components/portal/MessageHoverActions';
import ChatSearchBar from '@/components/portal/ChatSearchBar';
import PaymentCard, { parsePaymentCard } from '@/components/portal/PaymentCard';
import ProductCard, { parseProductCard, stripProductMarker } from '@/components/portal/ProductCard';
import Lightbox from '@/components/portal/Lightbox';
import FilePreviewModal from '@/components/portal/FilePreviewModal';
import Composer, { type Attachment, type MentionResult } from '@/components/portal/Composer';
import FileTagPickerModal from '@/components/portal/FileTagPickerModal';
import EntityTagMenu, { EntityTagPill } from '@/components/portal/EntityTagMenu';
import { buildProjectTagMarker, buildDesignTagMarker, buildInvoiceTagMarker, buildQuoteTagMarker } from '@/components/portal/EntityTagCard';
import { RichMessageBody } from '@/components/portal/RichMessageBody';
import FinancialOverviewPanel from '@/components/portal/FinancialOverviewPanel';
import ProjectBriefPanel from '@/components/portal/ProjectBriefPanel';
import ProjectFilesPanel from '@/components/portal/ProjectFilesPanel';
import ProjectResourceLinksPanel from '@/components/portal/ProjectResourceLinksPanel';
import ProjectTechPacksPanel from '@/components/portal/ProjectTechPacksPanel';
import ClientProjectQuotationPanel from '@/components/portal/ClientProjectQuotationPanel';
import ProjectInvoicesPanel from '@/components/portal/ProjectInvoicesPanel';
import {
  clientCustomerChatApi, clientProjectApi, mediaApi, getUserEmailFromToken, sortMessagesByTime,
  type ManufacturingProjectDto, type ProjectDesignDto, type MessageReactionSummaryDto,
  type ProjectMessageDto, type CustomerMessageDto,
} from '@/lib/api';
import { STAGES, STAGE_INDEX, stageDef, type StageKey } from '@/components/manufacturing/stages';
import { DESIGN_STAGES, designStageLabel } from '@/lib/portalChatConstants';

const DESIGN_STAGE_LABELS = DESIGN_STAGES.map((s) => s.label);
import { formatServerTime, isDifferentServerDay, formatChatDateDivider } from '@/lib/serverTime';
import { useCustomerChatStomp } from '@/hooks/useCustomerChatStomp';
import { useProjectStomp } from '@/hooks/useProjectStomp';
import { useAutoScrollChat } from '@/hooks/useAutoScrollChat';
import { useResizableWidth } from '@/hooks/useResizableWidth';

/**
 * WhatsApp-style layout for the CLIENT (customer-facing) portal. One-to-one
 * from the customer's own point of view — no customer switcher, just:
 * pinned General Chat + their own Projects, each project's Communication
 * (#announcements, read-only) and Designs, plus Resources
 * (Brief/Quote/Files/Invoices). No admin-only actions (Settings, Delete,
 * Request payment) — client can rename a design (name only) but not delete one.
 *
 * General Chat + its Threads, and the project/design layer, are all wired to
 * real APIs (clientCustomerChatApi / clientProjectApi). Resources
 * (Brief/Quote/Files/Invoices) remain mock previews.
 * Temp route: /portal/workspace-preview
 */

const PROJECT_RESOURCES: { key: string; icon: string; label: string; color: string; bg: string }[] = [
  { key: 'brief', icon: 'description', label: 'Project Brief', color: '#6d28d9', bg: 'rgba(109,40,217,0.1)' },
  { key: 'financials', icon: 'account_balance_wallet', label: 'Financial Overview', color: 'var(--p-primary)', bg: 'rgba(0,103,106,0.1)' },
  { key: 'quotation', icon: 'request_quote', label: 'Quotation', color: '#1d4ed8', bg: 'rgba(29,78,216,0.1)' },
  { key: 'invoices', icon: 'receipt_long', label: 'Invoices', color: '#b45309', bg: 'rgba(180,83,9,0.1)' },
  { key: 'files', icon: 'folder_open', label: 'Files', color: '#be185d', bg: 'rgba(190,24,101,0.1)' },
  { key: 'links', icon: 'link', label: 'File Links', color: '#0891b2', bg: 'rgba(8,145,178,0.1)' },
  { key: 'techpacks', icon: 'design_services', label: 'Tech Packs', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
];

type Level = { kind: 'home' } | { kind: 'project'; projectId: number };

type ActivePane =
  | { kind: 'none' }
  | { kind: 'general' }
  | { kind: 'threadsGeneral' }
  | { kind: 'threads'; projectId: number }
  | { kind: 'announcements'; projectId: number }
  | { kind: 'design'; projectId: number; designId: number }
  | { kind: 'resource'; projectId: number; resourceKey: string };

/** Encodes an ActivePane into the `?tab=` URL param (plus `&design=`/`&resource=` when relevant) so the current view is bookmarkable/shareable and survives a refresh. */
function paneToParams(pane: ActivePane): { tab: string; design?: string; resource?: string } {
  switch (pane.kind) {
    case 'threads': return { tab: 'threads' };
    case 'announcements': return { tab: 'announcements' };
    case 'design': return { tab: 'design', design: String(pane.designId) };
    case 'resource': return { tab: 'resource', resource: pane.resourceKey };
    default: return { tab: 'general' };
  }
}
/** Inverse of paneToParams — rebuilds an ActivePane for a project from URL params, defaulting to General Chat when params are missing/stale (never a blank pane). */
function panesFromParams(projectId: number, tab: string | null, design: string | null, resource: string | null): ActivePane {
  if (tab === 'threads') return { kind: 'threads', projectId };
  if (tab === 'announcements') return { kind: 'announcements', projectId };
  if (tab === 'design' && design) return { kind: 'design', projectId, designId: Number(design) };
  if (tab === 'resource' && resource) return { kind: 'resource', projectId, resourceKey: resource };
  return { kind: 'general' };
}

const KIND_ACCENT: Record<'chat' | 'project' | 'design', string> = {
  chat: '#7c3aed',
  project: '#2563eb',
  design: '#ea580c',
};

function KindTag({ kind }: { kind: 'chat' | 'project' | 'design' }) {
  const color = KIND_ACCENT[kind];
  const label = kind === 'chat' ? 'Chat' : kind === 'project' ? 'Project' : 'Design';
  return (
    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0" style={{ background: `${color}1a`, color }}>
      {label}
    </span>
  );
}

function UnreadDot({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="text-[11px] font-bold text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shrink-0" style={{ background: 'var(--p-primary)' }}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

/** Mobile-only back arrow shown at the start of every pane header — returns to the
 * sidebar list (WhatsApp-style single-pane navigation). Invisible on desktop (md+),
 * where the sidebar and the active pane are always both visible side-by-side. */
function MobileBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-black/5 shrink-0" aria-label="Back">
      <Sym name="arrow_back" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
    </button>
  );
}

function ListRow({ icon, iconBg, iconColor, title, subtitle, active, onClick, onContextMenu, onDoubleClick, unread, trailing, kindTag, pinned, tag }: {
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  active?: boolean;
  onClick: () => void;
  /** Right-click — opens the private-tag editor (see EntityTagMenu). */
  onContextMenu?: (e: React.MouseEvent) => void;
  /** Double-click — same tag editor, for trackpad/touch users without an easy right-click. */
  onDoubleClick?: (e: React.MouseEvent) => void;
  unread?: number;
  trailing?: React.ReactNode;
  kindTag?: 'chat' | 'project' | 'design';
  pinned?: boolean;
  /** This row's own private WhatsApp-style tag, if any — rendered next to the title. */
  tag?: string | null;
}) {
  const accent = kindTag ? KIND_ACCENT[kindTag] : undefined;
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu ? (e) => { e.preventDefault(); onContextMenu(e); } : undefined}
      onDoubleClick={onDoubleClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b"
      style={{
        borderColor: 'var(--p-outline-variant)',
        borderLeft: accent ? `3px solid ${accent}` : '3px solid transparent',
        background: active ? 'rgba(0,103,106,0.1)' : pinned ? 'var(--p-surface-container-high)' : undefined,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--p-surface-container-high)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = pinned ? 'var(--p-surface-container-high)' : 'transparent'; }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: iconBg ?? 'var(--p-surface-container-high)' }}>
        <Sym name={icon ?? 'folder_open'} className="text-[19px]" style={{ color: iconColor ?? 'var(--p-on-surface-variant)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-[14px] truncate" style={active ? { color: 'var(--p-primary)' } : undefined}>{title}</p>
          {kindTag && <KindTag kind={kindTag} />}
          {pinned && <Sym name="push_pin" className="text-[12px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />}
          <EntityTagPill tag={tag} />
        </div>
        {subtitle && <p className="text-[12px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{subtitle}</p>}
      </div>
      <UnreadDot count={unread} />
      {trailing}
    </button>
  );
}

function SectionLabel({ children, collapsible, collapsed, onToggle }: {
  children: React.ReactNode;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  if (collapsible) {
    return (
      <button onClick={onToggle} className="w-full flex items-center justify-between px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)', opacity: 0.85 }}>
        <span>{children}</span>
        <Sym name={collapsed ? 'expand_more' : 'expand_less'} className="text-[16px]" />
      </button>
    );
  }
  return (
    <p className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)', opacity: 0.7 }}>
      {children}
    </p>
  );
}

/** Read-only stage tracker chain — client never gets an interactive picker. */
function StageTracker({ stages, currentIndex }: { stages: string[]; currentIndex: number }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      {stages.map((s, i) => {
        const done = i < currentIndex;
        const on = i === currentIndex;
        return (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1"
              style={on ? { background: 'var(--p-primary)', color: '#fff' } : done ? { background: 'rgba(0,103,106,0.12)', color: 'var(--p-primary)' } : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
            >
              {done && <Sym name="check" className="text-[11px]" />}
              {s}
            </span>
            {i < stages.length - 1 && <span className="w-3 h-px shrink-0" style={{ background: 'var(--p-outline-variant)' }} />}
          </div>
        );
      })}
    </div>
  );
}

type MockMessageKind = 'text' | 'image' | 'voice' | 'file' | 'system';
type MockMessage = { id: number; kind: MockMessageKind; author: string; authorType?: string; aiGenerated?: boolean; mine?: boolean; time: string; createdAt?: string; text?: string; attachmentUrl?: string; attachmentUrls?: string[]; replyCount?: number; category?: string; reactions?: MessageReactionSummaryDto[] };

/** Avatar color/icon per author type — mirrors the real production MessageAvatar. */
function MessageAvatar({ type }: { type?: string }) {
  const bg = type === 'SYSTEM' ? 'var(--p-surface-container-high)'
    : type === 'AI' ? 'var(--p-tertiary)'
    : type === 'ADMIN' ? 'var(--p-secondary)'
    : 'var(--p-primary)';
  const iconColor = type === 'SYSTEM' ? 'var(--p-on-surface-variant)' : '#fff';
  const icon = type === 'SYSTEM' ? 'info' : type === 'AI' ? 'smart_toy' : 'person';
  return (
    <div className="w-9 h-9 rounded flex items-center justify-center shrink-0" style={{ background: bg }}>
      <Sym name={icon} className="text-[18px]" style={{ color: iconColor }} />
    </div>
  );
}

/** Centered date pill shown when a message starts a new calendar day. */
function DateDivider({ iso }: { iso?: string }) {
  return (
    <div className="relative flex items-center py-2 mb-2">
      <div className="flex-grow h-px" style={{ background: 'var(--p-outline-variant)' }} />
      <span className="mx-4 text-[12px] font-bold px-2" style={{ color: 'var(--p-on-surface-variant)', background: 'var(--p-surface-container-lowest)' }}>
        {formatChatDateDivider(iso)}
      </span>
      <div className="flex-grow h-px" style={{ background: 'var(--p-outline-variant)' }} />
    </div>
  );
}

function MessageBubble({
  m, onOpenThread, onOpenImage, onOpenFile, highlighted, canDelete, menuOpen, menuPosition, onOpenMenuAt, onMenuToggle, onDelete, onCopyLink, onReact, inThread, disableReply, showAvatar, groupStart,
}: {
  m: MockMessage;
  onOpenThread?: (m: MockMessage) => void;
  onOpenImage?: (url: string) => void;
  onOpenFile?: (url: string, fileName?: string) => void;
  highlighted?: boolean;
  canDelete?: boolean;
  menuOpen?: boolean;
  /** Click coordinates the currently-open menu should render at (set by onOpenMenuAt). */
  menuPosition?: { x: number; y: number } | null;
  /** Right-click (or long-press) handler — opens the WhatsApp-style actions menu at the click point. */
  onOpenMenuAt?: (x: number, y: number) => void;
  onMenuToggle?: () => void;
  onDelete?: () => void;
  onCopyLink?: () => void;
  onReact?: (emoji: string) => void;
  inThread?: boolean;
  disableReply?: boolean;
  showAvatar?: boolean;
  /** False when this message continues the same author's previous message (consecutive, no divider between) — collapses the avatar/name/time header, matching WhatsApp/Slack grouping. */
  groupStart?: boolean;
}) {
  if (m.kind === 'system') {
    return (
      <div className="self-center max-w-[80%] text-center px-3 py-1.5 rounded-full text-[12px]" style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}>
        {m.category && <span className="font-bold uppercase tracking-wide mr-1.5" style={{ color: 'var(--p-primary)' }}>{m.category} ·</span>}
        {m.text}
      </div>
    );
  }
  const isAi = m.authorType === 'AI' || !!m.aiGenerated;
  const align = m.mine ? 'self-end items-end' : 'self-start items-start';
  const bubbleBg = isAi ? 'var(--p-ai-bubble)' : m.mine ? 'var(--p-primary)' : 'var(--p-surface-container-high)';
  const bubbleColor = isAi || m.mine ? '#fff' : undefined;
  const radius = m.mine ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm';
  const isGroupStart = groupStart !== false;

  return (
    <div
      id={!inThread ? `msg-${m.id}` : undefined}
      className={`group relative flex flex-col gap-1 max-w-[65%] rounded-lg px-1 -mx-1 ${isGroupStart ? 'py-1 mt-1.5' : 'py-0.5'} transition-all duration-500 ${align}`}
      style={highlighted ? { background: 'rgba(0,103,106,0.15)', boxShadow: 'inset 0 0 0 2px var(--p-primary)' } : undefined}
      onContextMenu={onOpenMenuAt ? (e) => { e.preventDefault(); onOpenMenuAt(e.clientX, e.clientY); } : undefined}
    >
      {onMenuToggle && onDelete && onCopyLink && (
        <MessageHoverActions
          inThread={inThread}
          disableReply={disableReply}
          menuOpen={!!menuOpen}
          menuPosition={menuPosition}
          onMenuToggle={onMenuToggle}
          onReply={() => onOpenThread?.(m)}
          onDelete={onDelete}
          onCopyLink={onCopyLink}
          onReact={onReact}
          canDelete={canDelete}
        />
      )}
      {isGroupStart ? (
        <span className="flex items-center gap-1.5 px-1">
          {showAvatar && <MessageAvatar type={m.authorType} />}
          <span className="text-[11px] font-semibold" style={{ color: m.authorType === 'AI' ? 'var(--p-tertiary)' : m.authorType === 'ADMIN' ? 'var(--p-secondary)' : 'var(--p-on-surface-variant)' }}>{m.author}</span>
          {m.authorType === 'AI' && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white shrink-0" style={{ background: 'var(--p-tertiary)' }}>AI</span>
          )}
          <span className="text-[11px] font-semibold" style={{ color: 'var(--p-on-surface-variant)' }}>· {m.time}</span>
        </span>
      ) : (
        <span className="hidden group-hover:flex items-center px-1 -mb-0.5">
          <span className="text-[10px] font-medium" style={{ color: 'var(--p-on-surface-variant)' }}>{m.time}</span>
        </span>
      )}
      {m.kind === 'text' && (() => {
        const pay = parsePaymentCard(m.text);
        if (pay) return <PaymentCard data={pay} actionable />;
        const product = parseProductCard(m.text);
        if (product) return <ProductCard data={product} />;
        return (
          <div className={`${radius} px-4 py-2.5 text-[13px] ${isAi ? 'chat-bubble-ai chat-bubble-ai-text' : m.mine ? 'chat-bubble-mine' : ''}`} style={{ background: bubbleBg, color: bubbleColor }}>
            <RichMessageBody text={stripProductMarker(m.text) || m.text || ''} />
          </div>
        );
      })()}
      {m.kind === 'image' && (() => {
        const urls = m.attachmentUrls && m.attachmentUrls.length > 0 ? m.attachmentUrls : (m.attachmentUrl ? [m.attachmentUrl] : []);
        const gridWidth = urls.length <= 1 ? 'w-40' : urls.length === 2 ? 'w-64' : 'w-72';
        const cols = urls.length <= 1 ? 'grid-cols-1' : 'grid-cols-2';
        return (
          <div className={`${radius} overflow-hidden border ${gridWidth}`} style={{ borderColor: 'var(--p-outline-variant)' }}>
            {urls.length > 0 ? (
              <div className={`grid ${cols} gap-0.5`}>
                {urls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className={`w-full ${urls.length <= 1 ? 'h-32' : 'h-28'} object-cover cursor-zoom-in block`}
                    onClick={() => onOpenImage?.(url)}
                  />
                ))}
              </div>
            ) : (
              <div className="w-40 h-32 flex items-center justify-center" style={{ background: 'var(--p-surface-container-high)' }}>
                <Sym name="image" className="text-[32px]" style={{ color: 'var(--p-on-surface-variant)' }} />
              </div>
            )}
            {m.text && m.text !== '(attachment)' && <p className="text-[12px] px-2.5 py-1.5 break-words" style={{ background: bubbleBg, color: bubbleColor }}>{m.text}</p>}
          </div>
        );
      })()}
      {m.kind === 'voice' && (() => {
        const url = m.attachmentUrls?.[0] || m.attachmentUrl;
        if (!url) return null;
        return (
          <div className={`${radius} px-3 py-2.5 border`} style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)', minWidth: 220 }}>
            <audio controls preload="metadata" src={url} className="w-full h-9" style={{ borderRadius: 8 }} />
          </div>
        );
      })()}
      {m.kind === 'file' && (
        <button
          type="button"
          onClick={() => m.attachmentUrl && onOpenFile?.(m.attachmentUrl, m.text)}
          className={`${radius} flex items-center gap-2.5 px-3 py-2.5 border text-left`}
          style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
        >
          <Sym name="description" className="text-[22px]" style={{ color: 'var(--p-primary)' }} />
          <span className="text-[13px] font-medium">{m.text}</span>
          <Sym name="visibility" className="text-[16px] ml-2" style={{ color: 'var(--p-on-surface-variant)' }} />
        </button>
      )}
      {m.reactions && m.reactions.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap px-1">
          {m.reactions.map((r) => (
            <button
              key={r.emoji}
              type="button"
              title={r.readerNames?.join(', ')}
              onClick={() => onReact?.(r.emoji)}
              className="flex items-center gap-1 text-[12px] px-1.5 py-0.5 rounded-full border"
              style={r.reactedByMe
                ? { background: 'rgba(0,103,106,0.12)', borderColor: 'var(--p-primary)' }
                : { background: 'var(--p-surface-container-high)', borderColor: 'var(--p-outline-variant)' }}
            >
              <span>{r.emoji}</span>
              <span style={{ color: r.reactedByMe ? 'var(--p-primary)' : 'var(--p-on-surface-variant)' }}>{r.count}</span>
            </button>
          ))}
        </div>
      )}
      {m.replyCount ? (
        <button onClick={() => onOpenThread?.(m)} className="flex items-center gap-1.5 text-[12px] font-semibold px-1 hover:underline" style={{ color: 'var(--p-primary)' }}>
          <Sym name="forum" className="text-[15px]" /> {m.replyCount} repl{m.replyCount === 1 ? 'y' : 'ies'}
        </button>
      ) : null}
    </div>
  );
}

function isImageUrl(url?: string): boolean {
  return (!!url && /\.(png|jpe?g|gif|webp|svg)$/i.test(url.split('?')[0])) || !!url?.startsWith('data:image/');
}

// Mobile's voice recorder always uploads `.m4a`; covering the other common
// voice-note/audio container formats too so a recording from any source
// still gets the inline player instead of falling through to a plain file
// download link.
function isAudioUrl(url?: string): boolean {
  return !!url && /\.(m4a|mp3|wav|aac|ogg|webm)$/i.test(url.split('?')[0]);
}

function fileNameFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const named = new URL(url).searchParams.get('name');
    if (named) return named;
  } catch { /* not a valid absolute URL — fall through */ }
  return url.split('/').pop()?.split('?')[0];
}

/** Real chat message (customer-level or project-channel) -> the MockMessage shape MessageBubble renders. */
type ChatMessageLike = {
  id: number;
  authorType: string;
  authorName?: string;
  aiGenerated?: boolean;
  body?: string;
  attachmentUrl?: string;
  attachmentUrls?: string[];
  replyCount?: number;
  createdAt?: string;
  reactions?: MessageReactionSummaryDto[];
};

function toMockMessage(m: ChatMessageLike): MockMessage {
  const mine = m.authorType === 'CLIENT';
  const urls = m.attachmentUrls && m.attachmentUrls.length > 0 ? m.attachmentUrls : (m.attachmentUrl ? [m.attachmentUrl] : []);
  const firstUrl = urls[0];
  // A payment/product card can be posted as a SYSTEM message (e.g. Request Payment posts to
  // #announcements as SYSTEM) — it must still render as a real card, not the generic grey
  // system pill, so the marker check takes precedence over the system-type check.
  const hasCardMarker = !!m.body && (m.body.includes('[[payment:requested') || m.body.includes('[[product:'));
  const kind: MockMessageKind = (m.authorType === 'SYSTEM' || m.authorType === 'AI') && !hasCardMarker ? 'system'
    : firstUrl ? (isImageUrl(firstUrl) ? 'image' : isAudioUrl(firstUrl) ? 'voice' : 'file')
    : 'text';
  return {
    id: m.id,
    kind,
    author: m.authorName || (m.authorType === 'CLIENT' ? 'You' : m.authorType === 'ADMIN' ? 'Studio Sara' : 'System'),
    authorType: m.authorType,
    aiGenerated: m.aiGenerated,
    mine,
    time: formatServerTime(m.createdAt),
    createdAt: m.createdAt,
    text: kind === 'file' ? (fileNameFromUrl(firstUrl) || 'Attachment') : (m.body || undefined),
    attachmentUrl: firstUrl,
    attachmentUrls: urls,
    replyCount: m.replyCount || undefined,
    reactions: m.reactions,
  };
}

export default function ClientWorkspacePreview() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [level, setLevel] = useState<Level>({ kind: 'home' });
  const [active, setActive] = useState<ActivePane>({ kind: 'general' });
  const [urlResolved, setUrlResolved] = useState(false);
  // Last project `code` the inbound-URL-resolve effect actually applied — lets that effect
  // re-fire when ?project= changes to a NEW code (e.g. an @project chip click) without
  // re-firing on every pane/tab change the outbound state->URL sync effect makes.
  const resolvedProjectCodeRef = useRef<string | null>(null);
  const [designsCollapsed, setDesignsCollapsed] = useState(true);
  // Resources defaults OPEN (unlike Designs, which defaults collapsed) — it's the more
  // frequently used section. Collapsing it is still remembered per-project in localStorage.
  const [resourcesCollapsed, setResourcesCollapsed] = useState(false);
  const [thread, setThread] = useState<{ root: MockMessage; channelLabel: string } | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [addDesignOpen, setAddDesignOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<{ url: string; fileName?: string } | null>(null);
  const [renameDesignTarget, setRenameDesignTarget] = useState<{ id: number; name: string } | null>(null);
  const [renameProjectOpen, setRenameProjectOpen] = useState(false);
  // Mobile only: false = show the sidebar list full-screen (WhatsApp-style);
  // true = the chat/panel is open full-screen with a back button. Desktop (md+)
  // ignores this entirely — both panes are always visible side-by-side there.
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  // Header "more" dropdown on the chat screen — jump to a Resource tab or switch
  // design/announcements without leaving the chat pane (mainly useful on mobile,
  // where the sidebar list is hidden while a pane is open).
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const { width: sidebarWidth, startResize: startSidebarResize } = useResizableWidth('client-workspace-sidebar-width', 320, 260, 480);

  const { data: myProjects = [] } = useQuery({
    queryKey: ['client-projects'],
    queryFn: () => clientProjectApi.list(),
  });

  const projectSummary = level.kind === 'project' ? myProjects.find((p) => p.id === level.projectId) : undefined;

  const { data: projectDetail } = useQuery({
    queryKey: ['client-project-detail', projectSummary?.code],
    queryFn: () => clientProjectApi.getByCode(projectSummary!.code, undefined, { includeMessages: false, includeFinancials: true }),
    enabled: !!projectSummary,
  });

  const project: ManufacturingProjectDto | undefined = projectDetail ?? projectSummary;
  const projectDesigns: ProjectDesignDto[] = projectDetail?.designs ?? [];

  /** Fans out to project/design/invoice/quote search in parallel and flattens into one
   *  mixed @-mention result list — always scoped to the logged-in client's own data. */
  const searchAllMentions = async (q: string): Promise<MentionResult[]> => {
    const [projects, designs, invoices, quotes] = await Promise.all([
      clientProjectApi.searchForTag(q),
      clientProjectApi.searchDesignsForTag(q),
      clientProjectApi.searchInvoicesForTag(q),
      clientProjectApi.searchQuotesForTag(q),
    ]);
    return [
      ...projects.map((p): MentionResult => ({ type: 'project', marker: buildProjectTagMarker(p), label: p.title, sublabel: p.stage })),
      ...designs.map((d): MentionResult => ({ type: 'design', marker: buildDesignTagMarker({ id: d.id, name: d.name, stage: d.stage, projectCode: d.projectCode }), label: d.name, sublabel: [d.projectTitle, d.stage].filter(Boolean).join(' · ') })),
      ...invoices.map((i): MentionResult => ({ type: 'invoice', marker: buildInvoiceTagMarker({ id: i.id, reference: i.reference, title: i.title, amount: i.amount != null ? `${i.currency || ''} ${i.amount}`.trim() : undefined, status: i.status, projectCode: i.projectCode }), label: i.reference, sublabel: [i.amount != null ? `${i.currency || ''} ${i.amount}`.trim() : undefined, i.status].filter(Boolean).join(' · ') })),
      ...quotes.map((qt): MentionResult => ({ type: 'quote', marker: buildQuoteTagMarker({ id: qt.id, reference: qt.reference, title: qt.title, total: qt.total != null ? `${qt.currency || ''} ${qt.total}`.trim() : undefined, status: qt.status, projectCode: qt.projectCode }), label: qt.reference, sublabel: [qt.total != null ? `${qt.currency || ''} ${qt.total}`.trim() : undefined, qt.status].filter(Boolean).join(' · ') })),
    ];
  };

  const [fileTagPickerOpen, setFileTagPickerOpen] = useState(false);
  const fileTagResolveRef = useRef<((f: { url: string; name: string } | null) => void) | null>(null);
  const pickFileTagForComposer = (): Promise<{ url: string; name: string } | null> =>
    new Promise((resolve) => {
      fileTagResolveRef.current = resolve;
      setFileTagPickerOpen(true);
    });

  // Private WhatsApp-style tag editor — one shared popup for project/design rows. The
  // client only ever tags their own projects/designs (no "customer" concept on this side).
  const [tagMenu, setTagMenu] = useState<{
    position: { x: number; y: number };
    currentTag: string | null | undefined;
    onSave: (tag: string) => void;
  } | null>(null);

  const openProjectTagMenu = (e: React.MouseEvent, projectCode: string, currentTag: string | null | undefined) => {
    setTagMenu({
      position: { x: e.clientX, y: e.clientY },
      currentTag,
      onSave: async (tag) => {
        await clientProjectApi.setTag(projectCode, tag);
        qc.invalidateQueries({ queryKey: ['client-projects'] });
        qc.invalidateQueries({ queryKey: ['client-project-detail', projectCode] });
      },
    });
  };

  const openDesignTagMenu = (e: React.MouseEvent, projectCode: string, designId: number, currentTag: string | null | undefined) => {
    setTagMenu({
      position: { x: e.clientX, y: e.clientY },
      currentTag,
      onSave: async (tag) => {
        await clientProjectApi.setDesignTag(projectCode, designId, tag);
        qc.invalidateQueries({ queryKey: ['client-project-detail', projectCode] });
      },
    });
  };

  // Resolve ?project=<code>&tab=... (or bare ?tab=general, e.g. from a copied General
  // Chat message link) from the URL whenever it points somewhere we aren't currently
  // showing — covers a refresh/shared link (lands on that pane instead of resetting to
  // Home) AND an in-app navigate(...) to a new ?project= (e.g. clicking an @project chip
  // in a message) while already on this page, which React Router resolves in-place
  // without a remount. resolvedProjectCodeRef tracks the last code/tab we actually
  // resolved so this doesn't re-fire on every pane/tab change the effect below pushes
  // back into the URL.
  useEffect(() => {
    const projectCode = searchParams.get('project');
    if (!projectCode) {
      if (resolvedProjectCodeRef.current !== 'tab:general') {
        resolvedProjectCodeRef.current = 'tab:general';
        setLevel({ kind: 'home' });
        setActive({ kind: 'general' });
      }
      setUrlResolved(true);
      return;
    }
    if (myProjects.length === 0) return;
    if (projectCode === resolvedProjectCodeRef.current) return;
    const match = myProjects.find((p) => p.code === projectCode);
    if (!match) { setUrlResolved(true); return; }
    resolvedProjectCodeRef.current = projectCode;
    setLevel({ kind: 'project', projectId: match.id });
    setActive(panesFromParams(match.id, searchParams.get('tab'), searchParams.get('design'), searchParams.get('resource')));
    setMobilePanelOpen(true);
    setUrlResolved(true);
  }, [myProjects, searchParams]);

  // State -> URL sync, after the initial resolve above has run (so it never fights the
  // inbound resolve). Uses replace so pane switches don't spam browser history.
  useEffect(() => {
    if (!urlResolved) return;
    if (level.kind === 'home') {
      if (searchParams.has('project')) setSearchParams({}, { replace: true });
      return;
    }
    const code = myProjects.find((p) => p.id === level.projectId)?.code;
    if (!code) return;
    resolvedProjectCodeRef.current = code;
    const { tab, design, resource } = paneToParams(active);
    const next: Record<string, string> = { project: code, tab };
    if (design) next.design = design;
    if (resource) next.resource = resource;
    setSearchParams(next, { replace: true });
  }, [level, active, urlResolved, myProjects, searchParams, setSearchParams]);

  // Same per-project remembered collapse state as the admin workspace. Designs defaults
  // collapsed (stored '1' means "explicitly opened"); Resources defaults OPEN, so its stored
  // flag means the opposite — '1' means "explicitly collapsed" — a never-set key (new project,
  // or a browser that never touched this control) falls back to each section's own default
  // instead of both reading as collapsed.
  useEffect(() => {
    if (!project?.code) return;
    try {
      setDesignsCollapsed(localStorage.getItem(`sara-sidebar-designs-open-${project.code}`) !== '1');
      setResourcesCollapsed(localStorage.getItem(`sara-sidebar-resources-collapsed-${project.code}`) === '1');
    } catch { /* ignore */ }
  }, [project?.code]);

  const toggleDesignsCollapsed = () => {
    setDesignsCollapsed((prev) => {
      const next = !prev;
      if (project?.code) {
        try { localStorage.setItem(`sara-sidebar-designs-open-${project.code}`, next ? '0' : '1'); } catch { /* ignore */ }
      }
      return next;
    });
  };
  const toggleResourcesCollapsed = () => {
    setResourcesCollapsed((prev) => {
      const next = !prev;
      if (project?.code) {
        try { localStorage.setItem(`sara-sidebar-resources-collapsed-${project.code}`, next ? '1' : '0'); } catch { /* ignore */ }
      }
      return next;
    });
  };

  // Files tab — chat attachments only (no inquiry-form file merge on the client side).
  const { data: chatAttachments = [], isLoading: attachmentsLoading } = useQuery({
    queryKey: ['client-project-attachments', projectSummary?.code],
    queryFn: () => clientProjectApi.listAttachments(projectSummary!.code),
    enabled: !!projectSummary && active.kind === 'resource' && active.resourceKey === 'files',
  });
  // File Links tab (REQ-1) — client is read-only; links are admin-managed.
  const { data: resourceLinks = [], isLoading: resourceLinksLoading } = useQuery({
    queryKey: ['client-project-resource-links', projectSummary?.code],
    queryFn: () => clientProjectApi.listResourceLinks(projectSummary!.code),
    enabled: !!projectSummary && active.kind === 'resource' && active.resourceKey === 'links',
  });
  // Tech Packs tab (REQ-2) — read-only; linking is admin-side only.
  const { data: projectTechPacks = [], isLoading: projectTechPacksLoading } = useQuery({
    queryKey: ['client-project-tech-packs', projectSummary?.code],
    queryFn: () => clientProjectApi.listTechPacks(projectSummary!.code),
    enabled: !!projectSummary && active.kind === 'resource' && active.resourceKey === 'techpacks',
  });
  const realDesigns = projectDesigns.filter((d) => !d.system && !d.general);
  const announcementsDesign = projectDesigns.find((d) => d.system);

  const myEmail = getUserEmailFromToken() ?? undefined;
  const { typingUser: generalTypingUser, notifyTyping: notifyGeneralTyping, aiStream: generalAiStream } = useCustomerChatStomp(myEmail, 'client', 'You');

  const { data: generalMessages = [] } = useQuery({
    queryKey: ['client-customer-chat-messages'],
    queryFn: () => clientCustomerChatApi.listMessages(),
    select: sortMessagesByTime,
    enabled: active.kind === 'general',
    refetchInterval: 15_000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['client-customer-chat-unread-count'],
    queryFn: () => clientCustomerChatApi.unreadCount().then((r) => r.count),
    refetchInterval: 20_000,
  });

  // Opening General Chat marks it read server-side (see listMessages) — reflect that locally.
  useEffect(() => {
    if (active.kind === 'general') {
      qc.setQueryData(['client-customer-chat-unread-count'], 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.kind]);

  const { data: generalThreads = [] } = useQuery({
    queryKey: ['client-customer-chat-threads'],
    queryFn: () => clientCustomerChatApi.listThreads(),
    enabled: active.kind === 'threadsGeneral',
    refetchInterval: 15_000,
  });

  const sendGeneralMessage = useMutation({
    mutationFn: ({ body, attachmentUrls, parentMessageId }: { body: string; attachmentUrls?: string[]; parentMessageId?: number }) =>
      clientCustomerChatApi.postMessage(body, { attachmentUrls, parentMessageId }),
    onMutate: async (vars) => {
      if (vars.parentMessageId) return;
      const key = ['client-customer-chat-messages'];
      await qc.cancelQueries({ queryKey: key });
      const optimistic: CustomerMessageDto = {
        id: -Date.now(),
        customerEmail: '',
        authorType: 'CLIENT',
        authorName: 'You',
        body: vars.body,
        attachmentUrls: vars.attachmentUrls,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<CustomerMessageDto[]>(key, (old = []) => sortMessagesByTime([...old, optimistic]));
      return { optimisticId: optimistic.id };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['client-customer-chat-messages'] });
      if (vars.parentMessageId) qc.invalidateQueries({ queryKey: ['client-customer-chat-threads'] });
    },
    onError: (e: Error, _vars, context) => {
      if (context?.optimisticId != null) {
        qc.setQueryData<CustomerMessageDto[]>(['client-customer-chat-messages'], (old = []) =>
          old.filter((m) => m.id !== context.optimisticId));
      }
      toast.error(e.message || 'Failed to send message');
    },
  });

  const { typingUser: channelTypingUser, notifyTyping: notifyChannelTyping, aiStream: channelAiStream } =
    useProjectStomp(project?.code, 'client', 'You');

  const activeChannelDesignId = active.kind === 'announcements' ? announcementsDesign?.id
    : active.kind === 'design' ? active.designId
    : undefined;

  const { data: channelMessages = [] } = useQuery({
    queryKey: ['client-project-channel-messages', project?.code, activeChannelDesignId],
    queryFn: () => clientProjectApi.getChannelMessages(project!.code, activeChannelDesignId),
    select: sortMessagesByTime,
    enabled: !!project && activeChannelDesignId != null,
    refetchInterval: 15_000,
  });

  const { data: projectThreads = [] } = useQuery({
    queryKey: ['client-project-threads', project?.code],
    queryFn: () => clientProjectApi.listThreads(project!.code),
    enabled: !!project && active.kind === 'threads',
    refetchInterval: 15_000,
  });

  const sendChannelMessage = useMutation({
    mutationFn: ({ body, attachmentUrls, parentMessageId }: { body: string; attachmentUrls?: string[]; parentMessageId?: number }) =>
      clientProjectApi.postMessage(project!.code, body, { attachmentUrls, designId: activeChannelDesignId, parentMessageId }),
    onMutate: async (vars) => {
      if (vars.parentMessageId) return;
      const key = ['client-project-channel-messages', project?.code, activeChannelDesignId];
      await qc.cancelQueries({ queryKey: key });
      const optimistic: ProjectMessageDto = {
        id: -Date.now(),
        projectId: project?.id ?? 0,
        designId: activeChannelDesignId ?? null,
        authorType: 'CLIENT',
        authorName: 'You',
        body: vars.body,
        attachmentUrls: vars.attachmentUrls,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<ProjectMessageDto[]>(key, (old = []) => sortMessagesByTime([...old, optimistic]));
      return { optimisticId: optimistic.id };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['client-project-channel-messages', project?.code, activeChannelDesignId] });
      if (vars.parentMessageId) qc.invalidateQueries({ queryKey: ['client-project-threads', project?.code] });
    },
    onError: (e: Error, _vars, context) => {
      if (context?.optimisticId != null) {
        qc.setQueryData<ProjectMessageDto[]>(['client-project-channel-messages', project?.code, activeChannelDesignId], (old = []) =>
          old.filter((m) => m.id !== context.optimisticId));
      }
      toast.error(e.message || 'Failed to send message');
    },
  });

  const toFile = async (a: Attachment): Promise<File> => {
    if (a.file) return a.file;
    const blob = await (await fetch(a.url)).blob();
    return new File([blob], a.name, { type: blob.type });
  };

  /** All attachments upload first, then go out as one message with multiple attachmentUrls
   *  (Slack-style multi-image), instead of one message per file. */
  async function sendWithAttachments(
    attachments: Attachment[],
    text: string,
    send: (body: string, attachmentUrls?: string[]) => Promise<unknown>,
  ) {
    if (attachments.length === 0) {
      const body = text.trim();
      if (!body) return;
      await send(body);
      return;
    }
    const urls = await Promise.all(attachments.map(async (a) => mediaApi.upload(await toFile(a), 'projects')));
    const body = text.trim() || '(attachment)';
    await send(body, urls);
  }

  const uploadAndSendGeneral = (text: string, attachments: Attachment[], parentMessageId?: number) =>
    sendWithAttachments(attachments, text, (body, attachmentUrls) =>
      sendGeneralMessage.mutateAsync({ body, attachmentUrls, parentMessageId }));

  const uploadAndSendChannel = (text: string, attachments: Attachment[], parentMessageId?: number) =>
    sendWithAttachments(attachments, text, (body, attachmentUrls) =>
      sendChannelMessage.mutateAsync({ body, attachmentUrls, parentMessageId }));

  const renameDesignMutation = useMutation({
    mutationFn: ({ designId, name }: { designId: number; name: string }) =>
      clientProjectApi.renameDesign(project!.code, designId, name),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['client-project-detail', project?.code] });
      toast.success(`Renamed to "${d.name}"`);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to rename design'),
  });

  const renameProjectMutation = useMutation({
    mutationFn: (title: string) => clientProjectApi.renameProject(project!.code, title),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['client-project-detail', project?.code] });
      qc.invalidateQueries({ queryKey: ['client-projects'] });
      toast.success(`Renamed to "${p.title}"`);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to rename project'),
  });

  const deleteGeneralMessageMutation = useMutation({
    mutationFn: (messageId: number) => clientCustomerChatApi.deleteMessage(messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-customer-chat-messages'] });
      toast.success('Message deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete message'),
  });

  const deleteChannelMessageMutation = useMutation({
    mutationFn: (messageId: number) => clientProjectApi.deleteMessage(project!.code, messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-project-channel-messages', project?.code, activeChannelDesignId] });
      qc.invalidateQueries({ queryKey: ['client-project-threads', project?.code] });
      toast.success('Message deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete message'),
  });

  const canDeleteMessage = (m: MockMessage) => m.authorType === 'CLIENT';

  const handleDeleteMessage = (m: MockMessage) => {
    if (!canDeleteMessage(m)) return;
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    if (active.kind === 'general' || active.kind === 'threadsGeneral') {
      deleteGeneralMessageMutation.mutate(m.id);
    } else {
      deleteChannelMessageMutation.mutate(m.id);
    }
  };

  const copyMessageLink = (messageId: number) => {
    const isGeneral = active.kind === 'general' || active.kind === 'threadsGeneral';
    if (isGeneral) {
      const url = `${window.location.origin}/portal/workspace-preview?tab=general#msg-${messageId}`;
      navigator.clipboard?.writeText(url);
      toast.success('Link copied');
      return;
    }
    if (!project) return;
    const { tab, design, resource } = paneToParams(active);
    const params = new URLSearchParams({ project: project.code, tab });
    if (design) params.set('design', design);
    if (resource) params.set('resource', resource);
    const url = `${window.location.origin}/portal/workspace-preview?${params.toString()}#msg-${messageId}`;
    navigator.clipboard?.writeText(url);
    toast.success('Link copied');
  };

  /** Toggle "my" reaction on one message's summary list the same way the backend does:
   *  same emoji clicked again -> remove; a different emoji -> move my count over to it. */
  function applyOptimisticReaction(reactions: MessageReactionSummaryDto[] | undefined, emoji: string): MessageReactionSummaryDto[] {
    const list = reactions ? reactions.map((r) => ({ ...r })) : [];
    const mine = list.find((r) => r.reactedByMe);
    if (mine && mine.emoji === emoji) {
      mine.count = Math.max(0, mine.count - 1);
      mine.reactedByMe = false;
      return list.filter((r) => r.count > 0);
    }
    if (mine) {
      mine.count = Math.max(0, mine.count - 1);
      mine.reactedByMe = false;
    }
    const target = list.find((r) => r.emoji === emoji);
    if (target) {
      target.count += 1;
      target.reactedByMe = true;
    } else {
      list.push({ emoji, count: 1, reactedByMe: true });
    }
    return list.filter((r) => r.count > 0);
  }

  const reactGeneralMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      clientCustomerChatApi.toggleReaction(messageId, emoji),
    onMutate: async ({ messageId, emoji }) => {
      const key = ['client-customer-chat-messages'];
      await qc.cancelQueries({ queryKey: key });
      qc.setQueryData<CustomerMessageDto[]>(key, (old = []) =>
        old.map((m) => (m.id === messageId ? { ...m, reactions: applyOptimisticReaction(m.reactions, emoji) } : m)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-customer-chat-messages'] }),
    onError: (e: Error) => {
      qc.invalidateQueries({ queryKey: ['client-customer-chat-messages'] });
      toast.error(e.message || 'Failed to react');
    },
  });

  const reactChannelMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      clientProjectApi.toggleReaction(project!.code, messageId, emoji),
    onMutate: async ({ messageId, emoji }) => {
      const key = ['client-project-channel-messages', project?.code, activeChannelDesignId];
      await qc.cancelQueries({ queryKey: key });
      qc.setQueryData<ProjectMessageDto[]>(key, (old = []) =>
        old.map((m) => (m.id === messageId ? { ...m, reactions: applyOptimisticReaction(m.reactions, emoji) } : m)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-project-channel-messages', project?.code, activeChannelDesignId] }),
    onError: (e: Error) => {
      qc.invalidateQueries({ queryKey: ['client-project-channel-messages', project?.code, activeChannelDesignId] });
      toast.error(e.message || 'Failed to react');
    },
  });

  const handleReact = (m: MockMessage, emoji: string) => {
    if (active.kind === 'general' || active.kind === 'threadsGeneral') {
      reactGeneralMutation.mutate({ messageId: m.id, emoji });
    } else {
      reactChannelMutation.mutate({ messageId: m.id, emoji });
    }
  };

  const jumpToMessage = (messageId: number) => {
    setHighlightId(messageId);
    setTimeout(() => {
      document.getElementById(`msg-${messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
    setTimeout(() => setHighlightId((cur) => (cur === messageId ? null : cur)), 2200);
  };

  // Once the pane above resolves and the corresponding messages have loaded, scroll to
  // and highlight the #msg-<id> from the URL hash (set by copyMessageLink) — makes a
  // pasted message link actually land on that exact message, not just the right channel.
  useEffect(() => {
    if (!urlResolved) return;
    const match = window.location.hash.match(/^#msg-(\d+)$/);
    if (!match) return;
    const messageId = Number(match[1]);
    const messages = active.kind === 'general' ? generalMessages : channelMessages;
    if (!messages.some((m) => m.id === messageId)) return;
    history.replaceState(null, '', window.location.pathname + window.location.search);
    jumpToMessage(messageId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlResolved, active.kind, generalMessages, channelMessages]);

  const openProject = (projectId: number) => {
    setLevel({ kind: 'project', projectId });
    setActive({ kind: 'general' });
    setThread(null);
    setMobilePanelOpen(true);
  };
  const backToHome = () => {
    setLevel({ kind: 'home' });
    setActive({ kind: 'general' });
    setThread(null);
    setMobilePanelOpen(false);
  };
  const selectPane = (pane: ActivePane) => { setActive(pane); setThread(null); setMobilePanelOpen(true); };

  const activeDesign = active.kind === 'design' ? projectDesigns.find((d) => d.id === active.designId) : undefined;
  const activeResource = active.kind === 'resource' ? PROJECT_RESOURCES.find((r) => r.key === active.resourceKey) : undefined;
  const isChannelPane = active.kind === 'announcements' || active.kind === 'design';

  const activeMessages = active.kind === 'general' ? generalMessages.map(toMockMessage)
    : isChannelPane ? channelMessages.map(toMockMessage)
    : [];
  const channelLabel = active.kind === 'general' ? 'General Chat'
    : active.kind === 'announcements' ? '#announcements'
    : active.kind === 'design' ? (activeDesign?.name ?? '') : '';

  const activeChannelKey = active.kind === 'design' ? `design:${active.designId}`
    : active.kind === 'announcements' ? `announcements:${active.projectId}`
    : active.kind;
  // Scoped to whichever pane is actually open, same reasoning as typingVisible
  // below — General Chat's stream is keyed by customerEmail (no designId to
  // check), a design/announcements channel's stream carries designId and
  // must match the one currently open. Also excludes a thread-reply stream
  // (parentMessageId set) — that one only ever renders inside the thread
  // panel below, never the main pane, or a threaded AI reply would flash in
  // both places at once while it's still generating.
  const activeAiStreamText = active.kind === 'general'
    ? (generalAiStream && generalAiStream.parentMessageId == null ? generalAiStream.text : null)
    : active.kind === 'design'
      ? (channelAiStream && channelAiStream.parentMessageId == null
          && (channelAiStream.designId == null || channelAiStream.designId === activeChannelDesignId) ? channelAiStream.text : null)
      : null;
  // Same condition the typing bubble renders on (below) — it grows the scroll height without
  // adding a message, so the auto-scroll hook needs to know when it appears.
  const typingVisible = !!((active.kind === 'general' && generalTypingUser && !activeAiStreamText)
    || (active.kind === 'design' && channelTypingUser && !activeAiStreamText
        && (channelTypingUser.designId == null || channelTypingUser.designId === activeChannelDesignId)));
  const { containerRef: chatScrollRef, bottomRef: chatBottomRef, isAtBottom, newCount, scrollToBottom, handleScroll, resetToBottom } = useAutoScrollChat(activeMessages.length, typingVisible || !!activeAiStreamText);
  useEffect(() => {
    resetToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelKey]);

  const isGeneralChatThread = !!thread && thread.channelLabel === 'General Chat';
  const isChannelThread = !!thread && !isGeneralChatThread && isChannelPane;
  const threadReplies = isGeneralChatThread && thread
    ? generalMessages.filter((m) => m.parentMessageId === thread.root.id).map(toMockMessage)
    : isChannelThread && thread
      ? channelMessages.filter((m) => m.parentMessageId === thread.root.id).map(toMockMessage)
      : [];
  // The thread-panel twin of activeAiStreamText — only a delta tagged with
  // THIS thread's root message id, from whichever stream (General Chat or
  // channel) the open thread actually belongs to.
  const threadAiStreamText = !thread ? null
    : isGeneralChatThread
      ? (generalAiStream && generalAiStream.parentMessageId === thread.root.id ? generalAiStream.text : null)
      : isChannelThread
        ? (channelAiStream && channelAiStream.parentMessageId === thread.root.id ? channelAiStream.text : null)
        : null;

  return (
    <PortalShell active="dms">
      <div className="flex-1 flex overflow-hidden min-h-0">
        <aside
          className={`w-full md:w-[--sidebar-w] shrink-0 border-r md:flex flex-col overflow-hidden relative ${mobilePanelOpen ? 'hidden' : 'flex'}`}
          style={{ ['--sidebar-w' as string]: `${sidebarWidth}px`, borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}
        >
          {level.kind === 'home' && (
            <>
              <div className="h-14 px-4 flex items-center border-b shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <h2 className="font-display text-[17px] font-bold">Studio Sara</h2>
              </div>
              <div className="flex-1 overflow-y-auto py-1">
                <ListRow
                  icon="forum"
                  iconBg="rgba(0,103,106,0.12)"
                  iconColor="var(--p-primary)"
                  title="General Chat"
                  subtitle="Talk to the Studio Sara team · all your projects"
                  active={active.kind === 'general'}
                  unread={unreadCount}
                  onClick={() => selectPane({ kind: 'general' })}
                  kindTag="chat"
                  pinned
                />
                <ListRow
                  icon="list_alt"
                  title="General Chat Threads"
                  subtitle="Reply-threads in the General Chat"
                  active={active.kind === 'threadsGeneral'}
                  onClick={() => selectPane({ kind: 'threadsGeneral' })}
                />
                <SectionLabel>Your Projects · {myProjects.length}</SectionLabel>
                {myProjects.map((p) => (
                  <ListRow
                    key={p.id}
                    icon="folder_open"
                    title={p.title || p.code}
                    subtitle={`${p.code} · ${stageDef(p.currentStage).label}`}
                    tag={p.clientTag}
                    onClick={() => openProject(p.id)}
                    onContextMenu={(e) => openProjectTagMenu(e, p.code, p.clientTag)}
                    onDoubleClick={(e) => openProjectTagMenu(e, p.code, p.clientTag)}
                    kindTag="project"
                    trailing={<Sym name="chevron_right" className="text-[18px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />}
                  />
                ))}
              </div>
            </>
          )}

          {level.kind === 'project' && project && (
            <>
              <div className="border-b shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <div className="w-full flex items-center gap-1 px-3 pt-3 pb-1.5 group/projecttitle">
                  <button onClick={backToHome} className="flex items-center gap-3 min-w-0 flex-1 text-left hover:bg-black/[0.03] transition-colors rounded-lg -m-1 p-1">
                    <Sym name="arrow_back_ios" className="text-[16px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[14px] truncate leading-tight">{project.title}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{project.code}</p>
                      {project.assignedAgentName && (
                        <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--p-primary)' }}>
                          Your agent: {project.assignedAgentName}
                        </p>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    title="Rename project"
                    onClick={() => setRenameProjectOpen(true)}
                    className="p-1 rounded opacity-0 group-hover/projecttitle:opacity-100 hover:bg-black/5 transition-all shrink-0"
                  >
                    <Sym name="edit" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                  </button>
                </div>
                <div className="px-3 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,103,106,0.12)', color: 'var(--p-primary)' }}>
                    Stage: {stageDef(project.currentStage).label}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-1">
                <ListRow
                  icon="forum"
                  iconBg="rgba(0,103,106,0.12)"
                  iconColor="var(--p-primary)"
                  title="General Chat"
                  subtitle="with Studio Sara · all your projects"
                  active={active.kind === 'general'}
                  unread={unreadCount}
                  onClick={() => selectPane({ kind: 'general' })}
                  kindTag="chat"
                  pinned
                />

                <ListRow
                  icon="list_alt"
                  title="Threads"
                  subtitle="All reply-threads in this project"
                  active={active.kind === 'threads'}
                  onClick={() => selectPane({ kind: 'threads', projectId: project.id })}
                />

                <SectionLabel>Communication</SectionLabel>
                <ListRow
                  icon="campaign"
                  iconBg="rgba(0,103,106,0.12)"
                  iconColor="var(--p-primary)"
                  title="#announcements"
                  subtitle="Updates from Studio Sara · read-only"
                  active={active.kind === 'announcements'}
                  onClick={() => selectPane({ kind: 'announcements', projectId: project.id })}
                />

                <div className="flex items-center justify-between pr-2">
                  <SectionLabel collapsible collapsed={designsCollapsed} onToggle={toggleDesignsCollapsed}>Designs · {realDesigns.length}</SectionLabel>
                  <button type="button" onClick={() => setAddDesignOpen(true)} title="Start a new design" className="p-1 rounded hover:bg-black/5">
                    <Sym name="add" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
                  </button>
                </div>
                {!designsCollapsed && realDesigns.map((d) => (
                  <div key={d.id} className="relative group/design">
                    <ListRow
                      icon="palette"
                      title={d.name}
                      subtitle={`Stage: ${designStageLabel(d.stage)}`}
                      active={active.kind === 'design' && active.designId === d.id}
                      unread={d.unreadCount}
                      tag={d.clientTag}
                      onClick={() => selectPane({ kind: 'design', projectId: project.id, designId: d.id })}
                      onContextMenu={(e) => openDesignTagMenu(e, project.code, d.id, d.clientTag)}
                      onDoubleClick={(e) => openDesignTagMenu(e, project.code, d.id, d.clientTag)}
                      kindTag="design"
                    />
                    <button
                      type="button"
                      title="Rename chat"
                      onClick={(e) => { e.stopPropagation(); setRenameDesignTarget({ id: d.id, name: d.name }); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover/design:opacity-100 hover:bg-black/5 transition-all"
                    >
                      <Sym name="edit" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                    </button>
                  </div>
                ))}

                <SectionLabel collapsible collapsed={resourcesCollapsed} onToggle={toggleResourcesCollapsed}>Resources</SectionLabel>
                {!resourcesCollapsed && PROJECT_RESOURCES.map((r) => (
                  <ListRow
                    key={r.key}
                    icon={r.icon}
                    iconBg={r.bg}
                    iconColor={r.color}
                    title={r.label}
                    active={active.kind === 'resource' && active.resourceKey === r.key}
                    onClick={() => selectPane({ kind: 'resource', projectId: project.id, resourceKey: r.key })}
                  />
                ))}
              </div>
            </>
          )}
          <div
            onMouseDown={startSidebarResize}
            className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize z-10 hover:bg-black/10 active:bg-black/20"
            title="Drag to resize"
          />
        </aside>

        <main className={`flex-1 min-w-0 relative overflow-hidden md:flex ${mobilePanelOpen ? 'flex' : 'hidden'}`}>
          <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--p-surface-container-lowest)' }}>
            {active.kind === 'resource' && activeResource?.key === 'financials' && project ? (
              <>
                <div className="h-14 px-5 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MobileBackButton onClick={() => setMobilePanelOpen(false)} />
                  <Sym name={activeResource.icon} className="text-[20px]" style={{ color: activeResource.color }} />
                  <p className="font-bold text-[14px]">{activeResource.label}</p>
                </div>
                <FinancialOverviewPanel mode="client" projectCode={project.code} projectClosed={project.currentStage === 'DELIVERED'} />
              </>
            ) : active.kind === 'resource' && activeResource?.key === 'brief' && projectDetail ? (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                <ProjectBriefPanel project={projectDetail} clientMode />
              </div>
            ) : active.kind === 'resource' && activeResource?.key === 'quotation' && projectDetail && project ? (
              <>
                <div className="h-14 px-5 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MobileBackButton onClick={() => setMobilePanelOpen(false)} />
                  <Sym name={activeResource.icon} className="text-[20px]" style={{ color: activeResource.color }} />
                  <p className="font-bold text-[14px]">{activeResource.label}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                  <ClientProjectQuotationPanel project={projectDetail} projectCode={project.code} />
                </div>
              </>
            ) : active.kind === 'resource' && activeResource?.key === 'invoices' && projectDetail ? (
              <>
                <div className="h-14 px-5 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MobileBackButton onClick={() => setMobilePanelOpen(false)} />
                  <Sym name={activeResource.icon} className="text-[20px]" style={{ color: activeResource.color }} />
                  <p className="font-bold text-[14px]">{activeResource.label}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                  <ProjectInvoicesPanel project={projectDetail} clientMode />
                </div>
              </>
            ) : active.kind === 'resource' && activeResource?.key === 'files' && project ? (
              <>
                <div className="h-14 px-5 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MobileBackButton onClick={() => setMobilePanelOpen(false)} />
                  <Sym name={activeResource.icon} className="text-[20px]" style={{ color: activeResource.color }} />
                  <p className="font-bold text-[14px]">{activeResource.label}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                  <ProjectFilesPanel files={chatAttachments} isLoading={attachmentsLoading} />
                </div>
              </>
            ) : active.kind === 'resource' && activeResource?.key === 'links' && project ? (
              <>
                <div className="h-14 px-5 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MobileBackButton onClick={() => setMobilePanelOpen(false)} />
                  <Sym name={activeResource.icon} className="text-[20px]" style={{ color: activeResource.color }} />
                  <p className="font-bold text-[14px]">{activeResource.label}</p>
                </div>
                <ProjectResourceLinksPanel links={resourceLinks} isLoading={resourceLinksLoading} />
              </>
            ) : active.kind === 'resource' && activeResource?.key === 'techpacks' && project ? (
              <>
                <div className="h-14 px-5 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MobileBackButton onClick={() => setMobilePanelOpen(false)} />
                  <Sym name={activeResource.icon} className="text-[20px]" style={{ color: activeResource.color }} />
                  <p className="font-bold text-[14px]">{activeResource.label}</p>
                </div>
                <ProjectTechPacksPanel techPacks={projectTechPacks} isLoading={projectTechPacksLoading} />
              </>
            ) : active.kind === 'resource' && activeResource ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--p-on-surface-variant)' }}>
                <Sym name={activeResource.icon} className="text-[56px]" style={{ opacity: 0.4 }} />
                <p className="text-[15px] font-semibold" style={{ color: 'var(--p-on-surface)' }}>{activeResource.label}</p>
                <p className="text-[13px]">— mock preview, existing {activeResource.label} view renders here —</p>
              </div>
            ) : active.kind === 'threads' && project ? (
              <>
                <div className="h-14 px-5 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MobileBackButton onClick={() => setMobilePanelOpen(false)} />
                  <Sym name="list_alt" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                  <p className="font-bold text-[14px]">Threads</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {projectThreads.length === 0 ? (
                    <p className="text-center text-[13px] py-8" style={{ color: 'var(--p-on-surface-variant)' }}>No threads yet.</p>
                  ) : projectThreads.map((t) => (
                    <button
                      key={t.messageId}
                      onClick={() => {
                        const targetDesignId = t.designId ?? announcementsDesign?.id;
                        if (targetDesignId == null) return;
                        setActive(t.designId && t.designId === announcementsDesign?.id
                          ? { kind: 'announcements', projectId: project.id }
                          : { kind: 'design', projectId: project.id, designId: targetDesignId });
                        setThread({
                          root: { id: t.messageId, kind: 'text', author: t.rootAuthorName || 'Someone', time: formatServerTime(t.createdAt), text: t.snippet },
                          channelLabel: t.designName,
                        });
                        jumpToMessage(t.messageId);
                      }}
                      className="w-full flex items-start gap-3 p-3 rounded-xl border cursor-pointer hover:bg-black/[0.02] text-left"
                      style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--p-surface-container-high)' }}>
                        <Sym name="chat_bubble" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold">{t.lastReplyBy ? `${t.lastReplyBy} replied` : `${t.rootAuthorName ?? 'Someone'} started a thread`}</p>
                          {t.unread && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--p-primary)' }} />}
                        </div>
                        <p className="text-[13px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{t.snippet}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}>
                            <Sym name="tag" className="text-[12px]" /> {t.designName}
                          </span>
                          <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--p-on-surface-variant)' }}>
                            <Sym name="forum" className="text-[12px]" /> {t.replyCount} replies
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : active.kind === 'threadsGeneral' ? (
              <>
                <div className="h-14 px-5 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MobileBackButton onClick={() => setMobilePanelOpen(false)} />
                  <Sym name="list_alt" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                  <p className="font-bold text-[14px]">General Chat Threads</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {generalThreads.length === 0 ? (
                    <p className="text-center text-[13px] py-8" style={{ color: 'var(--p-on-surface-variant)' }}>No threads yet.</p>
                  ) : generalThreads.map((t) => (
                    <button
                      key={t.messageId}
                      onClick={() => {
                        const root = generalMessages.find((m) => m.id === t.messageId);
                        if (root) setThread({ root: toMockMessage(root), channelLabel: 'General Chat' });
                        jumpToMessage(t.messageId);
                      }}
                      className="w-full flex items-start gap-3 p-3 rounded-xl border cursor-pointer hover:bg-black/[0.02] text-left"
                      style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--p-surface-container-high)' }}>
                        <Sym name="chat_bubble" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold">{t.lastReplyBy ? `${t.lastReplyBy} replied` : `${t.rootAuthorName ?? 'Someone'} started a thread`}</p>
                          {t.unread && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--p-primary)' }} />}
                        </div>
                        <p className="text-[13px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{t.snippet}</p>
                        <span className="text-[11px] flex items-center gap-1 mt-1" style={{ color: 'var(--p-on-surface-variant)' }}>
                          <Sym name="forum" className="text-[12px]" /> {t.replyCount} replies
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="border-b shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <div className="h-14 px-5 flex items-center gap-3">
                    <MobileBackButton onClick={() => setMobilePanelOpen(false)} />
                    {active.kind === 'general' && (
                      <>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(0,103,106,0.12)' }}>
                          <Sym name="forum" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
                        </div>
                        <div>
                          <p className="font-bold text-[14px] leading-tight">General Chat</p>
                          <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>Studio Sara · all your projects</p>
                        </div>
                      </>
                    )}
                    {active.kind === 'announcements' && project && (
                      <>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(0,103,106,0.12)' }}>
                          <Sym name="campaign" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
                        </div>
                        <div>
                          <p className="font-bold text-[14px] leading-tight">#announcements</p>
                          <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>{project.title} · read-only</p>
                        </div>
                      </>
                    )}
                    {active.kind === 'design' && project && (
                      <>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(0,103,106,0.12)' }}>
                          <Sym name="palette" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
                        </div>
                        <div>
                          <p className="font-bold text-[14px] leading-tight">{activeDesign?.name}</p>
                          <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>{project.title}</p>
                        </div>
                      </>
                    )}
                    <div className="flex-1" />
                    {active.kind === 'general' || active.kind === 'threadsGeneral' ? (
                      <ChatSearchBar
                        onSearch={(q) => clientCustomerChatApi.searchMessages(q)}
                        onJumpTo={(messageId) => {
                          setActive({ kind: 'general' });
                          jumpToMessage(messageId);
                        }}
                      />
                    ) : isChannelPane && project ? (
                      <ChatSearchBar
                        onSearch={(q) => clientProjectApi.searchMessages(project.code, q)}
                        onJumpTo={(messageId, designId) => {
                          setActive(designId && designId === announcementsDesign?.id
                            ? { kind: 'announcements', projectId: project.id }
                            : designId
                              ? { kind: 'design', projectId: project.id, designId }
                              : active);
                          jumpToMessage(messageId);
                        }}
                      />
                    ) : null}
                    {project && (
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setChatMenuOpen((o) => !o)}
                          className="p-1.5 rounded-lg hover:bg-black/5"
                          aria-label="More"
                        >
                          <Sym name="more_vert" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                        </button>
                        {chatMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setChatMenuOpen(false)} />
                            <div
                              className="absolute right-0 top-9 w-56 rounded-xl border py-1.5 z-50 shadow-xl"
                              style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                            >
                              <p className="px-3 pt-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--p-on-surface-variant)' }}>Project resources</p>
                              {PROJECT_RESOURCES.map((r) => (
                                <button
                                  key={r.key}
                                  type="button"
                                  onClick={() => { setChatMenuOpen(false); selectPane({ kind: 'resource', projectId: project.id, resourceKey: r.key }); }}
                                  className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-3 hover:bg-black/5 transition-colors"
                                  style={{ color: 'var(--p-on-surface)' }}
                                >
                                  <Sym name={r.icon} className="text-[18px]" style={{ color: r.color }} />
                                  {r.label}
                                </button>
                              ))}
                              {projectDesigns.length > 0 && (
                                <>
                                  <div className="border-t my-1" style={{ borderColor: 'var(--p-outline-variant)' }} />
                                  <p className="px-3 pt-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--p-on-surface-variant)' }}>Switch chat</p>
                                  <button
                                    type="button"
                                    onClick={() => { setChatMenuOpen(false); selectPane({ kind: 'announcements', projectId: project.id }); }}
                                    className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-3 hover:bg-black/5 transition-colors"
                                    style={active.kind === 'announcements' ? { color: 'var(--p-primary)', fontWeight: 700 } : { color: 'var(--p-on-surface)' }}
                                  >
                                    <Sym name="campaign" className="text-[18px]" style={{ color: active.kind === 'announcements' ? 'var(--p-primary)' : 'var(--p-on-surface-variant)' }} />
                                    <span className="truncate flex-1">#announcements</span>
                                    {active.kind === 'announcements' && <Sym name="check" className="text-[16px]" />}
                                  </button>
                                  {projectDesigns.map((d) => (
                                    <button
                                      key={d.id}
                                      type="button"
                                      onClick={() => { setChatMenuOpen(false); selectPane({ kind: 'design', projectId: project.id, designId: d.id }); }}
                                      className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-3 hover:bg-black/5 transition-colors"
                                      style={active.kind === 'design' && active.designId === d.id ? { color: 'var(--p-primary)', fontWeight: 700 } : { color: 'var(--p-on-surface)' }}
                                    >
                                      <Sym name="palette" className="text-[18px]" style={{ color: active.kind === 'design' && active.designId === d.id ? 'var(--p-primary)' : 'var(--p-on-surface-variant)' }} />
                                      <span className="truncate flex-1">{d.name}</span>
                                      {active.kind === 'design' && active.designId === d.id && <Sym name="check" className="text-[16px]" />}
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {active.kind === 'design' && activeDesign && (
                    <div className="px-5 pb-2 flex items-center gap-2 flex-wrap">
                      <StageTracker
                        stages={DESIGN_STAGE_LABELS}
                        currentIndex={DESIGN_STAGE_LABELS.indexOf(designStageLabel(activeDesign.stage))}
                      />
                      {activeDesign.description && (
                        <span
                          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full max-w-full"
                          style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
                          title={activeDesign.description}
                        >
                          <Sym name="description" className="text-[13px] shrink-0" style={{ color: 'var(--p-primary)' }} />
                          <span className="truncate">{activeDesign.description}</span>
                        </span>
                      )}
                    </div>
                  )}
                  {active.kind === 'announcements' && project && (
                    <div className="px-5 pb-2">
                      <StageTracker stages={STAGES.map((s) => s.label)} currentIndex={STAGE_INDEX[(project.currentStage as StageKey) || 'INQUIRY'] ?? 0} />
                    </div>
                  )}
                </div>

                <div className="relative flex-1 min-h-0" style={{ background: 'var(--p-surface-container-lowest)' }}>
                  {/* Chat wallpaper — fixed behind the messages (not inside the scroller, so it
                      doesn't scroll away) and pointer-events-none so it never eats clicks. Same
                      watercolor asset + low opacity the inquiry/quote pages already use. */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.10]"
                    style={{
                      backgroundImage: 'url(/bg_images/watercolor-wallpaper-with-hand-drawn-elements.png)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <div
                    ref={chatScrollRef}
                    onScroll={handleScroll}
                    className="absolute inset-0 overflow-y-auto p-5 flex flex-col gap-0.5"
                  >
                    {activeMessages.map((m, i) => {
                      const prev = activeMessages[i - 1];
                      const newDay = i === 0 || isDifferentServerDay(m.createdAt, prev.createdAt);
                      const groupStart = newDay || m.kind === 'system' || prev.kind === 'system'
                        || prev.author !== m.author || prev.authorType !== m.authorType || !!prev.mine !== !!m.mine;
                      return (
                      <Fragment key={m.id}>
                        {newDay && <DateDivider iso={m.createdAt} />}
                        <MessageBubble
                          m={m}
                          groupStart={groupStart}
                          onOpenThread={(root) => setThread({ root, channelLabel })}
                          onOpenImage={setLightboxUrl}
                    onOpenFile={(url, fileName) => setFilePreview({ url, fileName })}
                          highlighted={highlightId === m.id}
                          canDelete={canDeleteMessage(m)}
                          menuOpen={menuOpenId === m.id}
                          menuPosition={menuPosition}
                          onOpenMenuAt={(x, y) => { setMenuOpenId(m.id); setMenuPosition({ x, y }); }}
                          onMenuToggle={() => { setMenuOpenId(null); setMenuPosition(null); }}
                          onDelete={() => handleDeleteMessage(m)}
                          onCopyLink={() => copyMessageLink(m.id)}
                          onReact={(emoji) => handleReact(m, emoji)}
                          disableReply={active.kind === 'announcements'}
                          showAvatar={!m.mine}
                        />
                      </Fragment>
                      );
                    })}
                    {activeAiStreamText != null && (
                      <MessageBubble
                        m={{
                          id: -1,
                          kind: 'text',
                          author: 'Studio Sara',
                          authorType: 'AI',
                          aiGenerated: true,
                          mine: false,
                          time: '',
                          text: activeAiStreamText || '…',
                        }}
                        showAvatar
                      />
                    )}
                    {typingVisible && (() => {
                      const who = active.kind === 'general' ? generalTypingUser : channelTypingUser;
                      const dot = who?.isAi ? 'var(--p-ai-bubble)' : 'var(--p-on-surface-variant)';
                      return (
                        <div className="self-start flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px]" style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}>
                          <span className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: dot, animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: dot, animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: dot, animationDelay: '300ms' }} />
                          </span>
                          {who?.authorName} is typing…
                        </div>
                      );
                    })()}
                    <div ref={chatBottomRef} />
                  </div>
                  {!isAtBottom && newCount > 0 && (
                    <button
                      type="button"
                      onClick={() => scrollToBottom()}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-white shadow-lg"
                      style={{ background: 'var(--p-primary)' }}
                    >
                      <Sym name="arrow_downward" className="text-[14px]" /> {newCount} new message{newCount === 1 ? '' : 's'}
                    </button>
                  )}
                </div>

                {active.kind === 'announcements' ? (
                  <div className="p-4 border-t text-center text-[12px] shrink-0" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
                    <Sym name="lock" className="text-[14px] align-middle mr-1" />
                    Announcements is update-only — reply in General Chat or a design chat instead.
                  </div>
                ) : (active.kind === 'general' || active.kind === 'design') && (
                  <div
                    className="px-3 pb-3 pt-2 shrink-0"
                    onKeyDown={() => {
                      if (active.kind === 'general') notifyGeneralTyping(true);
                      else notifyChannelTyping(true, activeChannelDesignId);
                    }}
                  >
                    <Composer
                      placeholder={active.kind === 'general' ? 'Message General Chat…' : `Message ${channelLabel}…`}
                      compact
                      showProductAttach
                      onSearchMentions={searchAllMentions}
                      onPickFileTag={project ? pickFileTagForComposer : undefined}
                      onSend={async (text, attachments) => {
                        if (active.kind === 'general') {
                          await uploadAndSendGeneral(text, attachments);
                          notifyGeneralTyping(false);
                        } else {
                          await uploadAndSendChannel(text, attachments);
                          notifyChannelTyping(false, activeChannelDesignId);
                        }
                        scrollToBottom('auto');
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <FileTagPickerModal
            open={fileTagPickerOpen}
            onClose={() => { setFileTagPickerOpen(false); fileTagResolveRef.current?.(null); fileTagResolveRef.current = null; }}
            onPick={(f) => { setFileTagPickerOpen(false); fileTagResolveRef.current?.(f); fileTagResolveRef.current = null; }}
            fetchAttachments={() => clientProjectApi.listAttachments(project!.code)}
          />
          <EntityTagMenu
            open={!!tagMenu}
            position={tagMenu?.position ?? null}
            currentTag={tagMenu?.currentTag}
            onSave={(tag) => tagMenu?.onSave(tag)}
            onClose={() => setTagMenu(null)}
          />

          {thread && (
            <div className="w-[360px] shrink-0 border-l flex flex-col" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
              <div className="h-14 px-4 border-b flex items-center gap-2 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <Sym name="forum" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] leading-tight">Thread</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{thread.channelLabel}</p>
                </div>
                <button onClick={() => setThread(null)} className="p-1 rounded hover:bg-black/5">
                  <Sym name="close" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Thread starter</p>
                <div className="flex flex-col p-3 rounded-xl border" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MessageBubble
                    m={{ ...thread.root, replyCount: undefined }}
                    onOpenImage={setLightboxUrl}
                    onOpenFile={(url, fileName) => setFilePreview({ url, fileName })}
                    inThread
                    canDelete={canDeleteMessage(thread.root)}
                    menuOpen={menuOpenId === thread.root.id}
                    menuPosition={menuPosition}
                    onOpenMenuAt={(x, y) => { setMenuOpenId(thread.root.id); setMenuPosition({ x, y }); }}
                    onMenuToggle={() => { setMenuOpenId(null); setMenuPosition(null); }}
                    onDelete={() => handleDeleteMessage(thread.root)}
                    onCopyLink={() => copyMessageLink(thread.root.id)}
                    onReact={(emoji) => handleReact(thread.root, emoji)}
                  />
                </div>
                <div className="flex items-center gap-2 py-1">
                  <span className="flex-1 h-px" style={{ background: 'var(--p-outline-variant)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>{threadReplies.length} replies</span>
                  <span className="flex-1 h-px" style={{ background: 'var(--p-outline-variant)' }} />
                </div>
                {threadReplies.map((r) => (
                  <div key={r.id} className="flex flex-col pl-3 border-l-2" style={{ borderColor: 'var(--p-outline-variant)' }}>
                    <MessageBubble
                      m={r}
                      onOpenImage={setLightboxUrl}
                    onOpenFile={(url, fileName) => setFilePreview({ url, fileName })}
                      inThread
                      canDelete={canDeleteMessage(r)}
                      menuOpen={menuOpenId === r.id}
                      menuPosition={menuPosition}
                      onOpenMenuAt={(x, y) => { setMenuOpenId(r.id); setMenuPosition({ x, y }); }}
                      onMenuToggle={() => { setMenuOpenId(null); setMenuPosition(null); }}
                      onDelete={() => handleDeleteMessage(r)}
                      onCopyLink={() => copyMessageLink(r.id)}
                      onReact={(emoji) => handleReact(r, emoji)}
                    />
                  </div>
                ))}
                {threadAiStreamText != null && (
                  <div className="flex flex-col pl-3 border-l-2" style={{ borderColor: 'var(--p-outline-variant)' }}>
                    <MessageBubble
                      m={{
                        id: -1,
                        kind: 'text',
                        author: 'Studio Sara',
                        authorType: 'AI',
                        aiGenerated: true,
                        mine: false,
                        time: '',
                        text: threadAiStreamText || '…',
                      }}
                    />
                  </div>
                )}
              </div>
              {(isGeneralChatThread || isChannelThread) && (
                <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <Composer
                    placeholder="Reply in thread…"
                    compact
                    showProductAttach
                    onSearchMentions={searchAllMentions}
                    onPickFileTag={project ? pickFileTagForComposer : undefined}
                    onSend={async (text, attachments) => {
                      if (isGeneralChatThread) {
                        await uploadAndSendGeneral(text, attachments, thread.root.id);
                      } else if (isChannelThread) {
                        await uploadAndSendChannel(text, attachments, thread.root.id);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <AddDesignModal
        open={addDesignOpen}
        onClose={() => setAddDesignOpen(false)}
        simple
        onCreated={async (name) => {
          if (!project) return;
          const created = await clientProjectApi.createDesign(project.code, name);
          await qc.invalidateQueries({ queryKey: ['client-project-detail', project.code] });
          selectPane({ kind: 'design', projectId: project.id, designId: created.id });
          toast.success(`Design "${name}" created`);
        }}
      />

      <RenameDesignModal
        open={renameDesignTarget != null}
        currentName={renameDesignTarget?.name || ''}
        onClose={() => setRenameDesignTarget(null)}
        onSave={async (name) => {
          if (renameDesignTarget) await renameDesignMutation.mutateAsync({ designId: renameDesignTarget.id, name });
        }}
      />

      <RenameDesignModal
        open={renameProjectOpen}
        currentName={project?.title || ''}
        heading="Rename project"
        placeholder="Project name"
        onClose={() => setRenameProjectOpen(false)}
        onSave={async (title) => {
          await renameProjectMutation.mutateAsync(title);
        }}
      />

      {lightboxUrl && <Lightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      <FilePreviewModal
        open={!!filePreview}
        url={filePreview?.url ?? null}
        fileName={filePreview?.fileName}
        onClose={() => setFilePreview(null)}
      />
    </PortalShell>
  );
}
