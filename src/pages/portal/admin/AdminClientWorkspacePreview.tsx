import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import AddDesignModal from '@/components/portal/AddDesignModal';
import RenameDesignModal from '@/components/portal/RenameDesignModal';
import MessageHoverActions from '@/components/portal/MessageHoverActions';
import ChatSearchBar from '@/components/portal/ChatSearchBar';
import PaymentCard, { parsePaymentCard } from '@/components/portal/PaymentCard';
import ProductCard, { parseProductCard, stripProductMarker } from '@/components/portal/ProductCard';
import DesignStagePicker from '@/components/portal/DesignStagePicker';
import Lightbox from '@/components/portal/Lightbox';
import FilePreviewModal from '@/components/portal/FilePreviewModal';
import Composer, { type Attachment } from '@/components/portal/Composer';
import { RichMessageBody } from '@/components/portal/RichMessageBody';
import ProjectAssignModal from '@/components/portal/ProjectAssignModal';
import { Pill } from '@/components/portal/Pill';
import FinancialOverviewPanel from '@/components/portal/FinancialOverviewPanel';
import ProjectBriefPanel from '@/components/portal/ProjectBriefPanel';
import ProjectFilesPanel from '@/components/portal/ProjectFilesPanel';
import AdminProjectQuotationPanel from '@/components/portal/AdminProjectQuotationPanel';
import ProjectInvoicesPanel from '@/components/portal/ProjectInvoicesPanel';
import ProjectPaymentsPanel from '@/components/portal/ProjectPaymentsPanel';
import { STAGE_TONE, type Stage } from '@/components/portal/adminData';
import { highlightText } from '@/lib/highlightText';
import { projectApi, adminCustomerChatApi, manufacturingApi, mediaApi, type ManufacturingProjectDto, type CustomerMessageDto, type ProjectDesignDto, type ProjectMessageDto, type MessageReactionSummaryDto } from '@/lib/api';
import type { MentionResult } from '@/components/portal/Composer';
import FileTagPickerModal from '@/components/portal/FileTagPickerModal';
import EntityTagMenu, { EntityTagPill } from '@/components/portal/EntityTagMenu';
import { buildProjectTagMarker, buildDesignTagMarker, buildInvoiceTagMarker, buildQuoteTagMarker } from '@/components/portal/EntityTagCard';
import { STAGES, STAGE_INDEX, defaultStatusFor, stageDef, type StageKey } from '@/components/manufacturing/stages';
import { DESIGN_STAGES as REAL_DESIGN_STAGES, designStageLabel } from '@/lib/portalChatConstants';
import { formatServerTime, parseServerDate, formatServerDate, formatChatDateDivider, isDifferentServerDay } from '@/lib/serverTime';
import { getStoredAdminUser, isSuperAdmin } from '@/lib/adminAccess';
import { useCustomerChatStomp } from '@/hooks/useCustomerChatStomp';
import { useProjectStomp } from '@/hooks/useProjectStomp';
import { useAutoScrollChat } from '@/hooks/useAutoScrollChat';
import { useResizableWidth } from '@/hooks/useResizableWidth';

/**
 * WhatsApp-style Customer → Project → (Design / Thread / Resource) drill-down
 * for the admin portal, being built out one feature at a time on this temp
 * route before it replaces the real /portal-admin/projects screens.
 *
 * Feature 1 (DONE): Customer + Project lists are real data, from the same
 * projectApi.list() used by AdminProjects.tsx, grouped client-side by
 * clientEmail (matches the "By client" grouping already shipped there).
 *
 * Feature 2 (DONE): the customer-level "General Chat" (pinned, top of each
 * customer's sidebar) and its Threads are wired to the real
 * adminCustomerChatApi — send/receive/thread-reply all hit the backend.
 * Design-channel chat and #announcements below the project level are still
 * mock fixtures — those get wired in a later feature.
 *
 * Temp route: /portal-admin/workspace-preview
 */

const DESIGN_STAGES = REAL_DESIGN_STAGES.map((s) => s.label);

type MockDesign = { id: number; name: string; stage: string; unread?: number };

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Same 48h window as AdminProjects.tsx's "New" badge. */
const NEW_WINDOW_MS = 48 * 60 * 60 * 1000;
function isNewProject(createdAt?: string): boolean {
  const d = parseServerDate(createdAt);
  return !!d && Date.now() - d.getTime() < NEW_WINDOW_MS;
}

type CustomerGroup = { key: string; name: string; email: string; projects: ManufacturingProjectDto[] };

function groupByClient(projects: ManufacturingProjectDto[]): CustomerGroup[] {
  const map = new Map<string, CustomerGroup>();
  for (const p of projects) {
    const key = (p.clientEmail || p.clientName || 'unknown').toLowerCase();
    if (!map.has(key)) {
      map.set(key, { key, name: p.clientName || p.clientEmail || 'Unknown client', email: p.clientEmail || '—', projects: [] });
    }
    map.get(key)!.projects.push(p);
  }
  return [...map.values()].sort((a, b) => b.projects.length - a.projects.length);
}

/** Placeholder designs per project until Feature 3 wires up real design-channel data. */
function mockDesignsFor(project: ManufacturingProjectDto): MockDesign[] {
  const count = Math.max(1, project.designCount || 1);
  return Array.from({ length: count }, (_, i) => ({
    id: project.id * 100 + i,
    name: count === 1 ? 'Main Design' : `Design ${i + 1}`,
    stage: DESIGN_STAGES[i % DESIGN_STAGES.length],
  }));
}

/** Non-chat project resources — same set as AdminProjectSidebar's RESOURCES.
 *  Each gets its own signature color (icon + tinted background) so the list scans
 *  as distinct sections rather than one flat undifferentiated list. */
const PROJECT_RESOURCES: { key: string; icon: string; label: string; color: string; bg: string }[] = [
  { key: 'brief', icon: 'description', label: 'Project Brief', color: '#6d28d9', bg: 'rgba(109,40,217,0.1)' },
  { key: 'financials', icon: 'account_balance_wallet', label: 'Financial Overview', color: 'var(--p-primary)', bg: 'rgba(0,103,106,0.1)' },
  { key: 'quotation', icon: 'request_quote', label: 'Quotation', color: '#1d4ed8', bg: 'rgba(29,78,216,0.1)' },
  { key: 'invoices', icon: 'receipt_long', label: 'Invoices', color: '#b45309', bg: 'rgba(180,83,9,0.1)' },
  { key: 'payments', icon: 'payments', label: 'Payments', color: '#15803d', bg: 'rgba(21,128,61,0.1)' },
  { key: 'files', icon: 'folder_open', label: 'Files', color: '#be185d', bg: 'rgba(190,24,101,0.1)' },
];

type Level =
  | { kind: 'customers' }
  | { kind: 'customer'; customerKey: string }
  | { kind: 'project'; customerKey: string; projectId: number };

type ActivePane =
  | { kind: 'none' }
  | { kind: 'customerGeneral'; customerKey: string }
  | { kind: 'threadsGeneral'; customerKey: string }
  | { kind: 'threads'; customerKey: string; projectId: number }
  | { kind: 'announcements'; customerKey: string; projectId: number }
  | { kind: 'design'; customerKey: string; projectId: number; designId: number }
  | { kind: 'resource'; customerKey: string; projectId: number; resourceKey: string };

/** Encodes a project-level ActivePane into `?tab=`/`&design=`/`&resource=` — same
 * vocabulary as the client workspace, so the two stay consistent and any shared
 * documentation/support-link format works for both. Only project-level panes are
 * deep-linked (matching what's actually shareable); customer-level General Chat
 * has no project code to key off, so it's intentionally not part of the URL. */
function paneToParams(pane: ActivePane): { tab: string; design?: string; resource?: string } {
  switch (pane.kind) {
    case 'threads': return { tab: 'threads' };
    case 'announcements': return { tab: 'announcements' };
    case 'design': return { tab: 'design', design: String(pane.designId) };
    case 'resource': return { tab: 'resource', resource: pane.resourceKey };
    default: return { tab: 'general' };
  }
}
/** Inverse of paneToParams — rebuilds a project-level ActivePane from URL params,
 * defaulting to General Chat when params are missing/stale (never a blank pane). */
function panesFromParams(customerKey: string, projectId: number, tab: string | null, design: string | null, resource: string | null): ActivePane {
  if (tab === 'threads') return { kind: 'threads', customerKey, projectId };
  if (tab === 'announcements') return { kind: 'announcements', customerKey, projectId };
  if (tab === 'design' && design) return { kind: 'design', customerKey, projectId, designId: Number(design) };
  if (tab === 'resource' && resource) return { kind: 'resource', customerKey, projectId, resourceKey: resource };
  return { kind: 'customerGeneral', customerKey };
}

function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-white"
      style={{ width: size, height: size, background: 'var(--p-primary)', fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

function UnreadDot({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span
      className="text-[11px] font-bold text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shrink-0"
      style={{ background: 'var(--p-primary)' }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/** Kind → accent color, used both for the left outline stripe and the small tag pill.
 *  chat (General Chat) = violet, project = blue, design = orange. Visually disambiguates
 *  "what will clicking this row navigate to" at a glance. */
const KIND_ACCENT: Record<'chat' | 'project' | 'design', string> = {
  chat: '#7c3aed',
  project: '#2563eb',
  design: '#ea580c',
};

function KindTag({ kind }: { kind: 'chat' | 'project' | 'design' }) {
  const color = KIND_ACCENT[kind];
  const label = kind === 'chat' ? 'Chat' : kind === 'project' ? 'Project' : 'Design';
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
      style={{ background: `${color}1a`, color }}
    >
      {label}
    </span>
  );
}

/** One list row shared by every sidebar level — customer, project, or a project's chats/resources.
 *  `kindTag` also draws a colored left-outline stripe so chat/project/design rows are visually distinct. */
/** Mobile-only back arrow shown at the start of every pane header — returns to the
 * sidebar (WhatsApp-style single-pane navigation). Invisible on desktop (md+), where
 * the sidebar and the active pane are always both visible side-by-side. */
function MobileBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-black/5 shrink-0" aria-label="Back">
      <Sym name="arrow_back" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
    </button>
  );
}

function ListRow({ icon, iconBg, iconColor, leading, title, titleBadges, subtitle, active, onClick, onContextMenu, onDoubleClick, unread, trailing, kindTag, pinned, tag }: {
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  leading?: React.ReactNode;
  title: string;
  titleBadges?: React.ReactNode;
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
      {leading ?? (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: iconBg ?? 'var(--p-surface-container-high)' }}
        >
          <Sym name={icon ?? 'folder_open'} className="text-[19px]" style={{ color: iconColor ?? 'var(--p-on-surface-variant)' }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-[14px] truncate" style={active ? { color: 'var(--p-primary)' } : undefined}>{title}</p>
          {titleBadges}
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
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide"
        style={{ color: 'var(--p-on-surface-variant)', opacity: 0.85 }}
      >
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

/** One chat message, rendered by "kind" — mirrors the real message-type inventory:
 *  text, image attachment, file attachment, product card, payment card, system/announcement. */
type MockMessageKind = 'text' | 'image' | 'file' | 'system';
type MockMessage = {
  id: number;
  kind: MockMessageKind;
  author: string;
  authorType?: string;
  aiGenerated?: boolean;
  mine?: boolean;
  time: string;
  createdAt?: string;
  text?: string;
  attachmentUrl?: string;
  attachmentUrls?: string[];
  replyCount?: number;
  category?: string;
  reactions?: MessageReactionSummaryDto[];
};

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
        {m.category && (
          <span className="font-bold uppercase tracking-wide mr-1.5" style={{ color: 'var(--p-primary)' }}>{m.category} ·</span>
        )}
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
        if (pay) return <PaymentCard data={pay} />;
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
        <button
          onClick={() => onOpenThread?.(m)}
          className="flex items-center gap-1.5 text-[12px] font-semibold px-1 hover:underline"
          style={{ color: 'var(--p-primary)' }}
        >
          <Sym name="forum" className="text-[15px]" /> {m.replyCount} repl{m.replyCount === 1 ? 'y' : 'ies'}
        </button>
      ) : null}
    </div>
  );
}


function isImageUrl(url?: string): boolean {
  return !!url && /\.(png|jpe?g|gif|webp|svg)$/i.test(url.split('?')[0]) || !!url?.startsWith('data:image/');
}

function fileNameFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const named = new URL(url).searchParams.get('name');
    if (named) return named;
  } catch { /* not a valid absolute URL — fall through */ }
  return url.split('/').pop()?.split('?')[0];
}

/** Real customer-chat message -> the MockMessage shape MessageBubble already renders. */
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
  const mine = m.authorType === 'ADMIN';
  const urls = m.attachmentUrls && m.attachmentUrls.length > 0 ? m.attachmentUrls : (m.attachmentUrl ? [m.attachmentUrl] : []);
  const firstUrl = urls[0];
  // A payment/product card can be posted as a SYSTEM message (e.g. Request Payment posts to
  // #announcements as SYSTEM) — it must still render as a real card, not the generic grey
  // system pill, so the marker check takes precedence over the system-type check.
  const hasCardMarker = !!m.body && (m.body.includes('[[payment:requested') || m.body.includes('[[product:'));
  const kind: MockMessageKind = (m.authorType === 'SYSTEM' || m.authorType === 'AI') && !hasCardMarker ? 'system'
    : firstUrl ? (isImageUrl(firstUrl) ? 'image' : 'file')
    : 'text';
  return {
    id: m.id,
    kind,
    author: m.authorName || (m.authorType === 'CLIENT' ? 'Client' : m.authorType === 'ADMIN' ? 'Admin' : 'System'),
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

const THREAD_REPLIES: Record<number, MockMessage[]> = {
  4: [
    { id: 41, kind: 'text', author: 'Client', time: '9:22 AM', text: 'Great, also can we tweak the collar a bit?' },
    { id: 42, kind: 'text', author: 'You', mine: true, time: '9:25 AM', text: 'Sure — sending an updated sketch today.' },
    { id: 43, kind: 'text', author: 'Client', time: '9:40 AM', text: 'Perfect, thanks!' },
  ],
  2: [
    { id: 21, kind: 'text', author: 'Client', time: 'Yesterday', text: 'Sounds great, when can we expect the Winter Jackets quote?' },
    { id: 22, kind: 'text', author: 'You', mine: true, time: 'Yesterday', text: 'By end of week.' },
  ],
};

export default function AdminClientWorkspacePreview() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [level, setLevel] = useState<Level>({ kind: 'customers' });
  const [active, setActive] = useState<ActivePane>({ kind: 'none' });
  const [urlResolved, setUrlResolved] = useState(false);
  // Last project `code` the inbound-URL-resolve effect actually applied — lets that effect
  // re-fire when ?project= changes to a NEW code (e.g. an @project chip click) without
  // re-firing on every pane/tab change the outbound state->URL sync effect makes.
  const resolvedProjectCodeRef = useRef<string | null>(null);
  // Mobile only: false = show the sidebar (whichever drill-down level is active)
  // full-screen; true = the chat/panel is open full-screen with a back button.
  // Desktop (md+) ignores this — sidebar and main pane are always side-by-side.
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  // Designs/Resources sidebar sections: collapsed by default for every project, but if
  // the user expands one for a given project it's remembered (per-project, localStorage)
  // — switching to a different project starts collapsed again unless that project was
  // itself expanded before.
  const [designsCollapsed, setDesignsCollapsed] = useState(true);
  const [resourcesCollapsed, setResourcesCollapsed] = useState(true);
  const [thread, setThread] = useState<{ root: MockMessage; channelLabel: string } | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { width: sidebarWidth, startResize: startSidebarResize } = useResizableWidth('admin-workspace-sidebar-width', 340, 260, 480);
  const [renameDesignTarget, setRenameDesignTarget] = useState<{ id: number; name: string; imageUrl?: string | null } | null>(null);
  const [settingsTitleDraft, setSettingsTitleDraft] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [addDesignOpen, setAddDesignOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<{ url: string; fileName?: string } | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [customerView, setCustomerView] = useState<'byClient' | 'flat'>('byClient');
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<number>>(new Set());
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payLabel, setPayLabel] = useState('');
  const [payDescription, setPayDescription] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const superAdmin = isSuperAdmin(getStoredAdminUser());

  const { data: allProjects = [], isLoading } = useQuery({
    queryKey: ['admin-projects-all'],
    queryFn: () => projectApi.list(),
  });

  const groups = useMemo(() => groupByClient(allProjects), [allProjects]);
  const filteredGroups = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        projects: stageFilter === 'All' ? g.projects : g.projects.filter((p) => p.currentStage === stageFilter),
      }))
      .filter((g) => g.projects.length > 0)
      .filter((g) => {
        if (!q) return true;
        return g.name.toLowerCase().includes(q)
          || g.email.toLowerCase().includes(q)
          || g.projects.some((p) =>
            (p.title || '').toLowerCase().includes(q)
            || p.code.toLowerCase().includes(q)
            || (p.inquiryReference || '').toLowerCase().includes(q));
      });
  }, [groups, clientSearch, stageFilter]);

  const flatFilteredProjects = useMemo(
    () => filteredGroups.flatMap((g) => g.projects).sort((a, b) => {
      const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return tb - ta;
    }),
    [filteredGroups],
  );

  const selectedProjects = flatFilteredProjects.filter((p) => selectedProjectIds.has(p.id));
  const allFlatSelected = flatFilteredProjects.length > 0 && flatFilteredProjects.every((p) => selectedProjectIds.has(p.id));

  const toggleAllFlat = () => {
    setSelectedProjectIds(allFlatSelected ? new Set() : new Set(flatFilteredProjects.map((p) => p.id)));
  };
  const toggleOneFlat = (id: number) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const deleteFlatMut = useMutation({
    mutationFn: (code: string) => projectApi.deleteProject(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-projects-all'] });
      toast.success('Project deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete project'),
  });

  const confirmDeleteFlat = (e: React.MouseEvent, code: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Delete project "${name}" (${code})? This permanently removes all its channels and messages. This cannot be undone.`)) {
      deleteFlatMut.mutate(code);
    }
  };

  const customerEmails = useMemo(
    () => groups.map((g) => g.email).filter((e) => e && e !== '—'),
    [groups],
  );
  const { data: unreadCounts = {} } = useQuery({
    queryKey: ['customer-chat-unread-counts', customerEmails],
    queryFn: () => adminCustomerChatApi.unreadCounts(customerEmails),
    enabled: customerEmails.length > 0,
    refetchInterval: 20_000,
  });
  const { data: customerTags = {} } = useQuery({
    queryKey: ['admin-customer-tags', customerEmails],
    queryFn: () => projectApi.getCustomerTags(customerEmails),
    enabled: customerEmails.length > 0,
  });

  const customerKey =
    (level.kind !== 'customers' ? level.customerKey : undefined)
    ?? ((active.kind === 'customerGeneral' || active.kind === 'threadsGeneral') ? active.customerKey : undefined);
  const customer = customerKey ? groups.find((g) => g.key === customerKey) : undefined;
  const project = level.kind === 'project'
    ? customer?.projects.find((p) => p.id === level.projectId)
    : undefined;

  // Resolve ?project=<code>&tab=... (or ?customer=<email>&tab=general) from the URL
  // whenever it points somewhere we aren't currently showing — covers a refresh/shared
  // link (lands on that project+pane, or that customer's General Chat, instead of
  // resetting to the customer list) AND an in-app navigate(...) to a new ?project=/
  // ?customer= (e.g. clicking an @project chip, or opening a copied message link) while
  // already on this page, which React Router resolves in-place without a remount.
  // `resolvedProjectCodeRef` tracks the last code/email we actually resolved so this
  // doesn't re-fire on every pane/tab change the effect below pushes back into the URL.
  // Mirrors the same pattern in ClientWorkspacePreview.tsx.
  useEffect(() => {
    if (isLoading) return;
    const projectCode = searchParams.get('project');
    const customerEmailParam = searchParams.get('customer');
    if (!projectCode && !customerEmailParam) {
      setUrlResolved(true);
      return;
    }
    if (allProjects.length === 0) {
      setUrlResolved(true);
      return;
    }
    if (projectCode) {
      if (projectCode === resolvedProjectCodeRef.current) return;
      const match = allProjects.find((p) => p.code === projectCode);
      if (!match) { setUrlResolved(true); return; }
      resolvedProjectCodeRef.current = projectCode;
      const customerKey = (match.clientEmail || match.clientName || 'unknown').toLowerCase();
      setLevel({ kind: 'project', customerKey, projectId: match.id });
      setActive(panesFromParams(customerKey, match.id, searchParams.get('tab'), searchParams.get('design'), searchParams.get('resource')));
      setMobilePanelOpen(true);
      setUrlResolved(true);
      return;
    }
    if (customerEmailParam) {
      const resolveKey = `customer:${customerEmailParam.toLowerCase()}`;
      if (resolveKey === resolvedProjectCodeRef.current) return;
      const match = groups.find((g) => g.email.toLowerCase() === customerEmailParam.toLowerCase());
      if (!match) { setUrlResolved(true); return; }
      resolvedProjectCodeRef.current = resolveKey;
      setLevel({ kind: 'customer', customerKey: match.key });
      setActive({ kind: 'customerGeneral', customerKey: match.key });
      setMobilePanelOpen(true);
      setUrlResolved(true);
    }
  }, [allProjects, groups, searchParams, isLoading]);

  // Home (customer list): never leave the main pane blank — open the first client's
  // General Chat once projects have loaded and nothing else is selected.
  useEffect(() => {
    if (!urlResolved) return;
    if (level.kind !== 'customers') return;
    if (active.kind !== 'none') return;
    if (groups.length === 0) return;
    setActive({ kind: 'customerGeneral', customerKey: groups[0].key });
  }, [urlResolved, level.kind, active.kind, groups]);

  // State -> URL sync, after the initial resolve above has run (so it never fights the
  // one-time inbound resolve). Uses replace so pane switches don't spam browser history.
  useEffect(() => {
    if (!urlResolved) return;
    if (level.kind !== 'project') {
      if (searchParams.has('project')) setSearchParams({}, { replace: true });
      return;
    }
    const code = allProjects.find((p) => p.id === level.projectId)?.code;
    if (!code) return;
    resolvedProjectCodeRef.current = code;
    const { tab, design, resource } = paneToParams(active);
    const next: Record<string, string> = { project: code, tab };
    if (design) next.design = design;
    if (resource) next.resource = resource;
    setSearchParams(next, { replace: true });
  }, [level, active, urlResolved, allProjects, searchParams, setSearchParams]);

  // Re-derive collapse state whenever the selected project changes — read this
  // project's own remembered state (default collapsed if never expanded before).
  useEffect(() => {
    if (!project?.code) return;
    try {
      setDesignsCollapsed(localStorage.getItem(`sara-sidebar-designs-open-${project.code}`) !== '1');
      setResourcesCollapsed(localStorage.getItem(`sara-sidebar-resources-open-${project.code}`) !== '1');
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
        try { localStorage.setItem(`sara-sidebar-resources-open-${project.code}`, next ? '0' : '1'); } catch { /* ignore */ }
      }
      return next;
    });
  };

  const hasRealEmail = !!customer?.email && customer.email !== '—';
  const customerEmail = customer?.email;

  /** Fans out to project/design/invoice/quote search in parallel and flattens into one
   *  mixed @-mention result list — scoped to whichever customer's workspace is open. */
  const searchAllMentions = async (q: string): Promise<MentionResult[]> => {
    if (!customerEmail) return [];
    const [projects, designs, invoices, quotes] = await Promise.all([
      projectApi.searchForTag(q, customerEmail),
      projectApi.searchDesignsForTag(q, customerEmail),
      projectApi.searchInvoicesForTag(q, customerEmail),
      projectApi.searchQuotesForTag(q, customerEmail),
    ]);
    return [
      ...projects.map((p): MentionResult => ({ type: 'project', marker: buildProjectTagMarker(p), label: p.title, sublabel: p.stage })),
      ...designs.map((d): MentionResult => ({ type: 'design', marker: buildDesignTagMarker({ id: d.id, name: d.name, stage: d.stage, projectCode: d.projectCode }), label: d.name, sublabel: [d.projectTitle, d.stage].filter(Boolean).join(' · ') })),
      ...invoices.map((i): MentionResult => ({ type: 'invoice', marker: buildInvoiceTagMarker({ id: i.id, reference: i.reference, title: i.title, amount: i.amount != null ? `${i.currency || ''} ${i.amount}`.trim() : undefined, status: i.status, projectCode: i.projectCode }), label: i.reference, sublabel: [i.amount != null ? `${i.currency || ''} ${i.amount}`.trim() : undefined, i.status].filter(Boolean).join(' · ') })),
      ...quotes.map((qt): MentionResult => ({ type: 'quote', marker: buildQuoteTagMarker({ id: qt.id, reference: qt.reference, title: qt.title, total: qt.total != null ? `${qt.currency || ''} ${qt.total}`.trim() : undefined, status: qt.status, projectCode: qt.projectCode }), label: qt.reference, sublabel: [qt.total != null ? `${qt.currency || ''} ${qt.total}`.trim() : undefined, qt.status].filter(Boolean).join(' · ') })),
    ];
  };

  // Private WhatsApp-style tag editor — one shared popup for customer/project/design rows.
  const [tagMenu, setTagMenu] = useState<{
    position: { x: number; y: number };
    currentTag: string | null | undefined;
    onSave: (tag: string) => void;
  } | null>(null);

  const openCustomerTagMenu = (e: React.MouseEvent, customerEmail: string) => {
    setTagMenu({
      position: { x: e.clientX, y: e.clientY },
      currentTag: customerTags[customerEmail.toLowerCase()],
      onSave: async (tag) => {
        await projectApi.setCustomerTag(customerEmail, tag);
        qc.invalidateQueries({ queryKey: ['admin-customer-tags', customerEmails] });
      },
    });
  };

  const openProjectTagMenu = (e: React.MouseEvent, projectCode: string, currentTag: string | null | undefined) => {
    setTagMenu({
      position: { x: e.clientX, y: e.clientY },
      currentTag,
      onSave: async (tag) => {
        await projectApi.setTag(projectCode, tag);
        qc.invalidateQueries({ queryKey: ['admin-projects-all'] });
        qc.invalidateQueries({ queryKey: ['project-detail', projectCode] });
      },
    });
  };

  const openDesignTagMenu = (e: React.MouseEvent, projectCode: string, designId: number, currentTag: string | null | undefined) => {
    setTagMenu({
      position: { x: e.clientX, y: e.clientY },
      currentTag,
      onSave: async (tag) => {
        await projectApi.setDesignTag(projectCode, designId, tag);
        qc.invalidateQueries({ queryKey: ['project-detail', projectCode] });
      },
    });
  };

  const [fileTagPickerOpen, setFileTagPickerOpen] = useState(false);
  const fileTagResolveRef = useRef<((f: { url: string; name: string } | null) => void) | null>(null);
  const pickFileTagForComposer = (): Promise<{ url: string; name: string } | null> =>
    new Promise((resolve) => {
      fileTagResolveRef.current = resolve;
      setFileTagPickerOpen(true);
    });

  const { typingUser: generalTypingUser, notifyTyping: notifyGeneralTyping } =
    useCustomerChatStomp(hasRealEmail ? customerEmail : undefined, 'admin', 'Admin');

  const { data: generalMessages = [] } = useQuery({
    queryKey: ['customer-chat-messages', customerEmail],
    queryFn: () => adminCustomerChatApi.listMessages(customerEmail!),
    enabled: hasRealEmail && active.kind === 'customerGeneral',
    refetchInterval: 15_000,
  });

  // Opening General Chat marks it read server-side (see listMessages) — reflect that locally.
  useEffect(() => {
    if (hasRealEmail && active.kind === 'customerGeneral') {
      qc.setQueryData(['customer-chat-unread-counts', customerEmails], (old: Record<string, number> | undefined) =>
        old ? { ...old, [customerEmail!.toLowerCase()]: 0 } : old);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRealEmail, active.kind === 'customerGeneral' ? customerEmail : undefined]);

  const { data: generalThreads = [] } = useQuery({
    queryKey: ['customer-chat-threads', customerEmail],
    queryFn: () => adminCustomerChatApi.listThreads(customerEmail!),
    enabled: hasRealEmail && active.kind === 'threadsGeneral',
    refetchInterval: 15_000,
  });

  const sendGeneralMessage = useMutation({
    mutationFn: ({ body, attachmentUrls, parentMessageId }: { body: string; attachmentUrls?: string[]; parentMessageId?: number }) =>
      adminCustomerChatApi.postMessage(customerEmail!, body, { attachmentUrls, parentMessageId }),
    onMutate: async (vars) => {
      if (vars.parentMessageId) return; // thread replies aren't in the main list — nothing to show optimistically
      const key = ['customer-chat-messages', customerEmail];
      await qc.cancelQueries({ queryKey: key });
      const optimistic: CustomerMessageDto = {
        id: -Date.now(),
        customerEmail: customerEmail!,
        authorType: 'ADMIN',
        authorName: 'Admin Team',
        body: vars.body,
        attachmentUrls: vars.attachmentUrls,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<CustomerMessageDto[]>(key, (old = []) => [...old, optimistic]);
      return { optimisticId: optimistic.id };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['customer-chat-messages', customerEmail] });
      if (vars.parentMessageId) qc.invalidateQueries({ queryKey: ['customer-chat-threads', customerEmail] });
    },
    onError: (e: Error, _vars, context) => {
      if (context?.optimisticId != null) {
        qc.setQueryData<CustomerMessageDto[]>(['customer-chat-messages', customerEmail], (old = []) =>
          old.filter((m) => m.id !== context.optimisticId));
      }
      toast.error(e.message || 'Failed to send message');
    },
  });

  // Feature 3 — real project detail (designs list) + per-channel messages + project threads.
  const { typingUser: channelTypingUser, notifyTyping: notifyChannelTyping } =
    useProjectStomp(project?.code, 'admin', 'Admin');

  const { data: projectDetail } = useQuery({
    queryKey: ['project-detail', project?.code],
    queryFn: () => projectApi.getByCode(project!.code, undefined, { includeMessages: false, includeFinancials: true }),
    enabled: !!project,
  });
  const projectDesigns: ProjectDesignDto[] = projectDetail?.designs ?? [];

  // Files tab — chat attachments + (admin-only) files uploaded on the original inquiry form.
  const { data: chatAttachments = [], isLoading: attachmentsLoading } = useQuery({
    queryKey: ['project-attachments', project?.code],
    queryFn: () => projectApi.listAttachments(project!.code),
    enabled: !!project && active.kind === 'resource' && active.resourceKey === 'files',
  });
  const { data: briefInquiry } = useQuery({
    queryKey: ['project-inquiry-files', projectDetail?.inquiryId],
    queryFn: () => manufacturingApi.getInquiry(projectDetail!.inquiryId!),
    enabled: !!projectDetail?.inquiryId && active.kind === 'resource' && active.resourceKey === 'files',
  });
  const allProjectFiles: ProjectMessageDto[] = useMemo(() => {
    const isUrl = (v: unknown) => typeof v === 'string' && (/^data:/.test(v) || /^(https?:)?\/\//.test(v));
    const formFiles: ProjectMessageDto[] = [];
    let n = 0;
    for (const v of Object.values(briefInquiry?.values ?? {})) {
      for (const one of Array.isArray(v) ? v : [v]) {
        if (isUrl(one)) {
          formFiles.push({
            id: -(++n),
            authorType: 'SYSTEM',
            authorName: 'Inquiry form',
            attachmentUrl: one as string,
            createdAt: projectDetail?.createdAt || briefInquiry?.createdAt,
          } as ProjectMessageDto);
        }
      }
    }
    return [...chatAttachments, ...formFiles];
  }, [chatAttachments, briefInquiry, projectDetail?.createdAt]);
  const announcementsDesign = projectDesigns.find((d) => d.system);
  const realDesigns = projectDesigns.filter((d) => !d.system && !d.general);

  const requestPaymentMutation = useMutation({
    mutationFn: () => projectApi.requestPayment(project!.code, Number(payAmount), {
      label: payLabel.trim() || undefined,
      description: payDescription.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-channel-messages', project?.code, announcementsDesign?.id] });
      toast.success('Payment requested');
      setPayModal(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to request payment'),
  });

  const activeChannelDesignId = active.kind === 'announcements' ? announcementsDesign?.id
    : active.kind === 'design' ? active.designId
    : undefined;

  const { data: channelMessages = [] } = useQuery({
    queryKey: ['project-channel-messages', project?.code, activeChannelDesignId],
    queryFn: () => projectApi.getChannelMessages(project!.code, activeChannelDesignId),
    enabled: !!project && activeChannelDesignId != null,
    refetchInterval: 15_000,
  });

  // Manufacturing Admin AI auto-reply status for the active channel — drives the locked
  // composer + "Join" button. Polled so a takeover/auto-resume from elsewhere reflects here.
  const { data: generalAiStatus } = useQuery({
    queryKey: ['general-ai-status', customerEmail],
    queryFn: () => adminCustomerChatApi.aiStatus(customerEmail!),
    enabled: !!customerEmail && active.kind === 'customerGeneral',
    refetchInterval: 10_000,
  });
  const { data: channelAiStatus } = useQuery({
    queryKey: ['channel-ai-status', project?.code, activeChannelDesignId],
    queryFn: () => projectApi.aiStatus(project!.code, activeChannelDesignId),
    enabled: !!project && active.kind === 'design',
    refetchInterval: 10_000,
  });
  const aiActive = active.kind === 'customerGeneral' ? (generalAiStatus?.aiActive ?? false)
    : active.kind === 'design' ? (channelAiStatus?.aiActive ?? false)
    : false;
  const joinChannelMutation = useMutation({
    mutationFn: () => active.kind === 'customerGeneral'
      ? adminCustomerChatApi.stopAi(customerEmail!)
      : projectApi.stopAi(project!.code, activeChannelDesignId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['general-ai-status', customerEmail] });
      qc.invalidateQueries({ queryKey: ['channel-ai-status', project?.code, activeChannelDesignId] });
      qc.invalidateQueries({ queryKey: active.kind === 'customerGeneral'
        ? ['customer-chat-messages', customerEmail]
        : ['project-channel-messages', project?.code, activeChannelDesignId] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to join chat'),
  });

  const { data: projectThreads = [] } = useQuery({
    queryKey: ['project-threads', project?.code],
    queryFn: () => projectApi.listThreads(project!.code),
    enabled: !!project && active.kind === 'threads',
    refetchInterval: 15_000,
  });

  const sendChannelMessage = useMutation({
    mutationFn: ({ body, attachmentUrls, parentMessageId }: { body: string; attachmentUrls?: string[]; parentMessageId?: number }) =>
      projectApi.postMessage(project!.code, body, { attachmentUrls, designId: activeChannelDesignId, parentMessageId }),
    onMutate: async (vars) => {
      if (vars.parentMessageId) return;
      const key = ['project-channel-messages', project?.code, activeChannelDesignId];
      await qc.cancelQueries({ queryKey: key });
      const optimistic: ProjectMessageDto = {
        id: -Date.now(),
        projectId: project?.id ?? 0,
        designId: activeChannelDesignId ?? null,
        authorType: 'ADMIN',
        authorName: 'Admin Team',
        body: vars.body,
        attachmentUrls: vars.attachmentUrls,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<ProjectMessageDto[]>(key, (old = []) => [...old, optimistic]);
      return { optimisticId: optimistic.id };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['project-channel-messages', project?.code, activeChannelDesignId] });
      if (vars.parentMessageId) qc.invalidateQueries({ queryKey: ['project-threads', project?.code] });
    },
    onError: (e: Error, _vars, context) => {
      if (context?.optimisticId != null) {
        qc.setQueryData<ProjectMessageDto[]>(['project-channel-messages', project?.code, activeChannelDesignId], (old = []) =>
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

  const renameProjectMutation = useMutation({
    mutationFn: (title: string) => projectApi.renameProject(project!.code, title),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['admin-projects-all'] });
      qc.invalidateQueries({ queryKey: ['project-detail', project?.code] });
      toast.success(`Project renamed to "${p.title}"`);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to rename project'),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectApi.deleteProject(project!.code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-projects-all'] });
      toast.success('Project deleted');
      setSettingsOpen(false);
      setDeleteConfirm('');
      backToCustomer();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete project'),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ stage, status }: { stage: string; status: string }) =>
      projectApi.updateStage(project!.code, stage, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-detail', project?.code] });
      qc.invalidateQueries({ queryKey: ['admin-projects-all'] });
      toast.success('Stage updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update stage'),
  });

  const updateDesignStageMutation = useMutation({
    mutationFn: ({ designId, stage }: { designId: number; stage: string }) =>
      projectApi.updateDesignStage(project!.code, designId, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-detail', project?.code] });
      toast.success('Design stage updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update design stage'),
  });

  const renameDesignMutation = useMutation({
    mutationFn: ({ designId, name, imageUrl }: { designId: number; name: string; imageUrl?: string }) =>
      projectApi.renameDesign(project!.code, designId, name, imageUrl),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['project-detail', project?.code] });
      toast.success(`Renamed to "${d.name}"`);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to rename design'),
  });

  const deleteDesignMutation = useMutation({
    mutationFn: (designId: number) => projectApi.deleteDesign(project!.code, designId),
    onSuccess: (_r, designId) => {
      qc.invalidateQueries({ queryKey: ['project-detail', project?.code] });
      if (active.kind === 'design' && active.designId === designId && project && customer) {
        selectPane({ kind: 'customerGeneral', customerKey: customer.key });
      }
      toast.success('Design channel deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete design'),
  });

  const deleteGeneralMessageMutation = useMutation({
    mutationFn: (messageId: number) => adminCustomerChatApi.deleteMessage(customerEmail!, messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-chat-messages', customerEmail] });
      toast.success('Message deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete message'),
  });

  const deleteChannelMessageMutation = useMutation({
    mutationFn: (messageId: number) => projectApi.deleteMessage(project!.code, messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-channel-messages', project?.code, activeChannelDesignId] });
      qc.invalidateQueries({ queryKey: ['project-threads', project?.code] });
      toast.success('Message deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete message'),
  });

  const handleDeleteMessage = (m: MockMessage) => {
    if (m.authorType === 'SYSTEM' || m.authorType === 'AI') return;
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    if (active.kind === 'customerGeneral' || active.kind === 'threadsGeneral') {
      deleteGeneralMessageMutation.mutate(m.id);
    } else {
      deleteChannelMessageMutation.mutate(m.id);
    }
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
      adminCustomerChatApi.toggleReaction(customerEmail!, messageId, emoji),
    onMutate: async ({ messageId, emoji }) => {
      const key = ['customer-chat-messages', customerEmail];
      await qc.cancelQueries({ queryKey: key });
      qc.setQueryData<CustomerMessageDto[]>(key, (old = []) =>
        old.map((m) => (m.id === messageId ? { ...m, reactions: applyOptimisticReaction(m.reactions, emoji) } : m)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-chat-messages', customerEmail] }),
    onError: (e: Error) => {
      qc.invalidateQueries({ queryKey: ['customer-chat-messages', customerEmail] });
      toast.error(e.message || 'Failed to react');
    },
  });

  const reactChannelMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      projectApi.toggleReaction(project!.code, messageId, emoji),
    onMutate: async ({ messageId, emoji }) => {
      const key = ['project-channel-messages', project?.code, activeChannelDesignId];
      await qc.cancelQueries({ queryKey: key });
      qc.setQueryData<ProjectMessageDto[]>(key, (old = []) =>
        old.map((m) => (m.id === messageId ? { ...m, reactions: applyOptimisticReaction(m.reactions, emoji) } : m)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-channel-messages', project?.code, activeChannelDesignId] }),
    onError: (e: Error) => {
      qc.invalidateQueries({ queryKey: ['project-channel-messages', project?.code, activeChannelDesignId] });
      toast.error(e.message || 'Failed to react');
    },
  });

  const handleReact = (m: MockMessage, emoji: string) => {
    if (active.kind === 'customerGeneral' || active.kind === 'threadsGeneral') {
      reactGeneralMutation.mutate({ messageId: m.id, emoji });
    } else {
      reactChannelMutation.mutate({ messageId: m.id, emoji });
    }
  };

  const copyMessageLink = (messageId: number) => {
    const isGeneral = active.kind === 'customerGeneral' || active.kind === 'threadsGeneral';
    if (isGeneral) {
      if (!customerEmail) return;
      const params = new URLSearchParams({ customer: customerEmail, tab: 'general' });
      const url = `${window.location.origin}/portal-admin/workspace-preview?${params.toString()}#msg-${messageId}`;
      navigator.clipboard?.writeText(url);
      toast.success('Link copied');
      return;
    }
    if (!project) return;
    const { tab, design, resource } = paneToParams(active);
    const params = new URLSearchParams({ project: project.code, tab });
    if (design) params.set('design', design);
    if (resource) params.set('resource', resource);
    const url = `${window.location.origin}/portal-admin/workspace-preview?${params.toString()}#msg-${messageId}`;
    navigator.clipboard?.writeText(url);
    toast.success('Link copied');
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
    const messages = active.kind === 'customerGeneral' ? generalMessages : channelMessages;
    if (!messages.some((m) => m.id === messageId)) return;
    history.replaceState(null, '', window.location.pathname + window.location.search);
    jumpToMessage(messageId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlResolved, active.kind, generalMessages, channelMessages]);

  const openCustomer = (customerKey: string) => {
    setLevel({ kind: 'customer', customerKey });
    setActive({ kind: 'customerGeneral', customerKey });
    setThread(null);
    setMobilePanelOpen(true);
  };

  const openProject = (customerKey: string, projectId: number) => {
    setLevel({ kind: 'project', customerKey, projectId });
    setActive({ kind: 'customerGeneral', customerKey });
    setThread(null);
    setMobilePanelOpen(true);
  };

  const backToCustomers = () => {
    const key = level.kind !== 'customers' ? level.customerKey
      : (active.kind === 'customerGeneral' || active.kind === 'threadsGeneral' ? active.customerKey : groups[0]?.key);
    setLevel({ kind: 'customers' });
    setActive(key ? { kind: 'customerGeneral', customerKey: key } : { kind: 'none' });
    setThread(null);
    setMobilePanelOpen(false);
  };
  const backToCustomer = () => {
    if (level.kind === 'project') {
      setLevel({ kind: 'customer', customerKey: level.customerKey });
      setActive({ kind: 'customerGeneral', customerKey: level.customerKey });
      setThread(null);
      setMobilePanelOpen(false);
    }
  };

  const selectPane = (pane: ActivePane) => { setActive(pane); setThread(null); setMoreOpen(false); setMobilePanelOpen(true); };

  /** Mobile back-button target: from a project's chat/resource pane, go back to that
   * customer's project list; from a customer's General Chat, go back to the customer list. */
  const mobilePaneBack = () => (level.kind === 'project' ? backToCustomer() : setMobilePanelOpen(false));

  const activeDesign = active.kind === 'design'
    ? realDesigns.find((d) => d.id === active.designId)
    : undefined;
  const activeResource = active.kind === 'resource'
    ? PROJECT_RESOURCES.find((r) => r.key === active.resourceKey)
    : undefined;

  const isChannelPane = active.kind === 'announcements' || active.kind === 'design';
  const activeMessages = active.kind === 'customerGeneral' ? generalMessages.map(toMockMessage)
    : isChannelPane ? channelMessages.map(toMockMessage)
    : [];
  const channelLabel = active.kind === 'customerGeneral' ? 'General Chat'
    : active.kind === 'announcements' ? '#announcements'
    : active.kind === 'design' ? (activeDesign?.name ?? '') : '';

  const activeChannelKey = active.kind === 'design' ? `design:${active.designId}`
    : active.kind === 'announcements' ? `announcements:${active.projectId}`
    : active.kind === 'customerGeneral' ? `general:${active.customerKey}`
    : active.kind;
  // Same condition the typing bubble renders on (below) — it grows the scroll height without
  // adding a message, so the auto-scroll hook needs to know when it appears.
  const typingVisible = !!((active.kind === 'customerGeneral' && generalTypingUser)
    || (active.kind === 'design' && channelTypingUser
        && (channelTypingUser.designId == null || channelTypingUser.designId === activeChannelDesignId)));
  const { containerRef: chatScrollRef, bottomRef: chatBottomRef, isAtBottom, newCount, scrollToBottom, handleScroll, resetToBottom } = useAutoScrollChat(activeMessages.length, typingVisible);
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
      : thread ? (THREAD_REPLIES[thread.root.id] ?? []) : [];

  if (customerView === 'flat' && level.kind === 'customers') {
    return (
      <AdminShell title="Clients" workspace>
        <div className="flex-1 flex flex-col overflow-hidden min-h-0" style={{ background: 'var(--p-surface-container-lowest)' }}>
          <div className="h-14 px-5 flex items-center justify-between border-b shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-[17px] font-bold">All Projects</h2>
              <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}>
                {flatFilteredProjects.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg px-3 h-9 w-64" style={{ background: 'var(--p-surface-container-high)' }}>
                <Sym name="search" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                <input
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search projects, clients, code…"
                  className="flex-1 bg-transparent border-none outline-none text-[13px]"
                />
              </div>
              <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--p-surface-container-high)' }}>
                <button
                  type="button"
                  title="Group by client"
                  onClick={() => setCustomerView('byClient')}
                  className="p-1.5 rounded-md"
                  style={{ color: 'var(--p-on-surface-variant)' }}
                >
                  <Sym name="groups" className="text-[16px]" />
                </button>
                <button
                  type="button"
                  title="All projects"
                  className="p-1.5 rounded-md"
                  style={{ background: 'var(--p-primary)', color: '#fff' }}
                >
                  <Sym name="list" className="text-[16px]" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 py-2.5 border-b shrink-0 flex items-center justify-between gap-3" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <div className="flex gap-1.5 overflow-x-auto">
              {['All' as const, ...STAGES.map((s) => s.key)].map((s) => (
                <button
                  key={s}
                  onClick={() => setStageFilter(s)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0"
                  style={s === stageFilter
                    ? { background: 'var(--p-primary)', color: '#fff' }
                    : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
                >
                  {s === 'All' ? 'All' : stageDef(s).label}
                </button>
              ))}
            </div>
            {superAdmin && selectedProjectIds.size > 0 && (
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--p-primary)' }}>{selectedProjectIds.size} selected</span>
                <button
                  type="button"
                  onClick={() => setAssignOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1.5"
                  style={{ background: 'var(--p-primary)' }}
                >
                  <Sym name="person_add" className="text-[15px]" /> Assign to admin
                </button>
                <button type="button" onClick={() => setSelectedProjectIds(new Set())} className="text-[12px] underline" style={{ color: 'var(--p-on-surface-variant)' }}>Clear</button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr style={{ background: 'var(--p-surface-container-low)' }}>
                  {superAdmin && (
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={allFlatSelected} onChange={toggleAllFlat} aria-label="Select all projects" />
                    </th>
                  )}
                  {['Project', 'Client', 'Designs', 'Stage', 'Progress', 'Value', 'Updated'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={superAdmin ? 9 : 8} className="text-center py-16">
                      <Sym name="progress_activity" className="text-[24px] animate-spin inline-block" style={{ color: 'var(--p-on-surface-variant)' }} />
                    </td>
                  </tr>
                ) : flatFilteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={superAdmin ? 9 : 8} className="text-center py-16 text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>No projects match.</td>
                  </tr>
                ) : flatFilteredProjects.map((p, i) => (
                  <tr
                    key={p.code}
                    onClick={() => {
                      const key = (p.clientEmail || p.clientName || 'unknown').toLowerCase();
                      openProject(key, p.id);
                    }}
                    className="cursor-pointer hover:bg-black/[0.02]"
                    style={{
                      borderTop: i > 0 ? '1px solid var(--p-outline-variant)' : undefined,
                      background: isNewProject(p.createdAt) ? 'color-mix(in srgb, var(--p-primary) 6%, transparent)' : selectedProjectIds.has(p.id) ? 'rgba(0,103,106,0.04)' : undefined,
                    }}
                  >
                    {superAdmin && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedProjectIds.has(p.id)} onChange={() => toggleOneFlat(p.id)} aria-label={`Select ${p.code}`} />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[13px]">{highlightText(p.title?.trim() || 'Untitled project', clientSearch)}</p>
                        {isNewProject(p.createdAt) && (
                          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: 'var(--p-primary)' }}>New</span>
                        )}
                        {p.source === 'CUSTOM_DESIGN' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 bg-[#00676a]/10 text-[#00676a]">Custom Design</span>
                        )}
                      </div>
                      <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                        {highlightText(p.code, clientSearch)} · {highlightText(p.inquiryReference || '', clientSearch)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[13px]">{highlightText(p.clientName || p.brand || '—', clientSearch)}</td>
                    <td className="px-4 py-3 text-[13px]">{p.designCount ?? 1}</td>
                    <td className="px-4 py-3"><Pill label={stageDef(p.currentStage).label} tone={STAGE_TONE[stageDef(p.currentStage).label as Stage]} /></td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--p-surface-container-high)' }}>
                          <div className="h-full rounded-full" style={{ width: `${p.progressPercent ?? 0}%`, background: 'var(--p-primary)' }} />
                        </div>
                        <span className="text-[11px] font-bold w-8">{p.progressPercent ?? 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-[13px]">{p.valueDisplay || 'TBD'}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{formatServerDate(p.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {superAdmin && (
                        <button
                          type="button"
                          title="Delete project"
                          onClick={(e) => confirmDeleteFlat(e, p.code, p.title || p.brand || p.code)}
                          disabled={deleteFlatMut.isPending}
                          className="p-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Sym name="delete" className="text-[18px]" style={{ color: '#b42318' }} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ProjectAssignModal
          open={assignOpen}
          projectIds={selectedProjects.map((p) => p.id)}
          projectLabels={selectedProjects.map((p) => p.title?.trim() || p.code)}
          onClose={() => setAssignOpen(false)}
          onAssigned={() => {
            qc.invalidateQueries({ queryKey: ['admin-projects-all'] });
            toast.success('Projects assigned — notification email sent');
            setSelectedProjectIds(new Set());
          }}
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Clients" workspace>
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left sidebar — drill-down: Customers -> Customer(General+Projects) -> Project(everything in it) */}
        <aside
          className={`w-full md:w-[--sidebar-w] shrink-0 border-r md:flex flex-col overflow-hidden relative ${mobilePanelOpen ? 'hidden' : 'flex'}`}
          style={{ ['--sidebar-w' as string]: `${sidebarWidth}px`, borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}
        >
          {level.kind === 'customers' && (
            <>
              <div className="h-14 px-4 flex items-center justify-between border-b shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <h2 className="font-display text-[17px] font-bold">Clients</h2>
                <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--p-surface-container-high)' }}>
                  <button
                    type="button"
                    title="Group by client"
                    onClick={() => setCustomerView('byClient')}
                    className="p-1.5 rounded-md"
                    style={customerView === 'byClient' ? { background: 'var(--p-primary)', color: '#fff' } : { color: 'var(--p-on-surface-variant)' }}
                  >
                    <Sym name="groups" className="text-[16px]" />
                  </button>
                  <button
                    type="button"
                    title="All projects"
                    onClick={() => setCustomerView('flat')}
                    className="p-1.5 rounded-md"
                    style={customerView === 'flat' ? { background: 'var(--p-primary)', color: '#fff' } : { color: 'var(--p-on-surface-variant)' }}
                  >
                    <Sym name="list" className="text-[16px]" />
                  </button>
                </div>
              </div>
              <div className="px-3 py-2 border-b shrink-0 space-y-2" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <div className="flex items-center gap-2 rounded-lg px-3 h-9" style={{ background: 'var(--p-surface-container-high)' }}>
                  <Sym name="search" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                  <input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Search clients, projects, code…"
                    className="flex-1 bg-transparent border-none outline-none text-[13px]"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {['All' as const, ...STAGES.map((s) => s.key)].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStageFilter(s)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0"
                      style={s === stageFilter
                        ? { background: 'var(--p-primary)', color: '#fff' }
                        : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
                    >
                      {s === 'All' ? 'All' : stageDef(s).label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <Sym name="progress_activity" className="text-[24px] animate-spin" style={{ color: 'var(--p-on-surface-variant)' }} />
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <p className="text-center text-[13px] py-10" style={{ color: 'var(--p-on-surface-variant)' }}>No clients found.</p>
                ) : filteredGroups.map((g) => (
                  <ListRow
                    key={g.key}
                    leading={<Avatar initials={initialsOf(g.name)} />}
                    title={g.name}
                    subtitle={`${g.projects.length} project${g.projects.length === 1 ? '' : 's'} · ${g.email}`}
                    unread={unreadCounts[g.email.toLowerCase()]}
                    tag={customerTags[g.email.toLowerCase()]}
                    active={(active.kind === 'customerGeneral' || active.kind === 'threadsGeneral') && active.customerKey === g.key}
                    onClick={() => openCustomer(g.key)}
                    onContextMenu={(e) => openCustomerTagMenu(e, g.email)}
                    onDoubleClick={(e) => openCustomerTagMenu(e, g.email)}
                  />
                ))}
              </div>
            </>
          )}

          {level.kind === 'customer' && customer && (
            <>
              <div className="border-b shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <button
                  onClick={backToCustomers}
                  className="w-full flex items-center gap-3 px-3 h-14 text-left hover:bg-black/[0.03] transition-colors"
                >
                  <Sym name="arrow_back_ios" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                  <Avatar initials={initialsOf(customer.name)} size={32} />
                  <div className="min-w-0">
                    <p className="font-bold text-[14px] truncate leading-tight">{customer.name}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{customer.email}</p>
                  </div>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-1">
                {/* The one and only General Chat lives at customer level — pinned, tagged as a Chat. */}
                <ListRow
                  icon="forum"
                  iconBg="rgba(0,103,106,0.12)"
                  iconColor="var(--p-primary)"
                  title="General Chat"
                  subtitle="Customer-level conversation · all projects"
                  active={active.kind === 'customerGeneral' && active.customerKey === customer.key}
                  unread={unreadCounts[customer.email.toLowerCase()]}
                  onClick={() => selectPane({ kind: 'customerGeneral', customerKey: customer.key })}
                  kindTag="chat"
                  pinned
                />
                <ListRow
                  icon="list_alt"
                  title="General Chat Threads"
                  subtitle="Reply-threads in the General Chat"
                  active={active.kind === 'threadsGeneral' && active.customerKey === customer.key}
                  onClick={() => selectPane({ kind: 'threadsGeneral', customerKey: customer.key })}
                />

                <SectionLabel>Projects · {customer.projects.length}</SectionLabel>

                {customer.projects.map((p) => (
                  <ListRow
                    key={p.id}
                    icon="folder_open"
                    title={p.title || p.code}
                    titleBadges={
                      <>
                        {isNewProject(p.createdAt) && (
                          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: 'var(--p-primary)' }}>New</span>
                        )}
                        {p.source === 'CUSTOM_DESIGN' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 bg-[#00676a]/10 text-[#00676a]">Custom Design</span>
                        )}
                      </>
                    }
                    subtitle={`${p.code} · ${stageDef(p.currentStage).label} · ${p.progressPercent ?? 0}% · ${p.valueDisplay || 'TBD'} · Updated ${formatServerDate(p.updatedAt)}`}
                    tag={p.adminTag}
                    onClick={() => openProject(customer.key, p.id)}
                    onContextMenu={(e) => openProjectTagMenu(e, p.code, p.adminTag)}
                    onDoubleClick={(e) => openProjectTagMenu(e, p.code, p.adminTag)}
                    kindTag="project"
                    trailing={<Sym name="chevron_right" className="text-[18px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />}
                  />
                ))}
              </div>
            </>
          )}

          {level.kind === 'project' && customer && project && (
            <>
              <div className="border-b shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <button
                  onClick={backToCustomer}
                  className="w-full flex items-center gap-3 px-3 h-14 text-left hover:bg-black/[0.03] transition-colors"
                >
                  <Sym name="arrow_back_ios" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[14px] truncate leading-tight">{project.title || project.code}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{project.code} · via {customer.name}</p>
                  </div>
                </button>
                <div className="px-3 pb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,103,106,0.12)', color: 'var(--p-primary)' }}>
                    Project stage: {stageDef(project.currentStage).label}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); setSettingsTitleDraft(project.title || ''); }} title="Project settings" className="p-1 rounded hover:bg-black/5">
                    <Sym name="settings" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignOpen(true)}
                  className="w-full px-3 pb-2.5 flex items-center gap-1.5 text-left hover:bg-black/[0.03] transition-colors"
                  title="Manage who's assigned to this project"
                >
                  <Sym name="person" className="text-[14px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
                  <span className="text-[11px] truncate flex-1" style={{ color: 'var(--p-on-surface-variant)' }}>
                    {project.assignedAgents && project.assignedAgents.length > 0
                      ? `Assigned: ${project.assignedAgents.map((a) => a.name).join(', ')}`
                      : 'Unassigned — tap to assign'}
                  </span>
                  <Sym name="chevron_right" className="text-[14px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-1">
                {/* General Chat is customer-level and stays pinned here too, so it's always one click away. */}
                <ListRow
                  icon="forum"
                  iconBg="rgba(0,103,106,0.12)"
                  iconColor="var(--p-primary)"
                  title="General Chat"
                  subtitle={`with ${customer.name} · all projects`}
                  active={active.kind === 'customerGeneral'}
                  onClick={() => selectPane({ kind: 'customerGeneral', customerKey: customer.key })}
                  kindTag="chat"
                  pinned
                />

                <ListRow
                  icon="list_alt"
                  title="Threads"
                  subtitle="All reply-threads across this project"
                  active={active.kind === 'threads'}
                  onClick={() => selectPane({ kind: 'threads', customerKey: customer.key, projectId: project.id })}
                />

                <SectionLabel>Communication</SectionLabel>
                <ListRow
                  icon="campaign"
                  iconBg="rgba(0,103,106,0.12)"
                  iconColor="var(--p-primary)"
                  title="#announcements"
                  subtitle="System updates · stage changes · read-only"
                  active={active.kind === 'announcements'}
                  onClick={() => selectPane({ kind: 'announcements', customerKey: customer.key, projectId: project.id })}
                />

                <div className="flex items-center justify-between pr-2">
                  <SectionLabel
                    collapsible
                    collapsed={designsCollapsed}
                    onToggle={toggleDesignsCollapsed}
                  >
                    Designs · {realDesigns.length}
                  </SectionLabel>
                  <button type="button" onClick={() => setAddDesignOpen(true)} title="Add design" className="p-1 rounded hover:bg-black/5">
                    <Sym name="add" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
                  </button>
                </div>
                {!designsCollapsed && realDesigns.map((d) => {
                  const isActive = active.kind === 'design' && active.designId === d.id;
                  const canDelete = realDesigns.length > 1;
                  return (
                    <div key={d.id} className="relative group/design">
                      <ListRow
                        icon="palette"
                        title={d.name}
                        subtitle={`Stage: ${designStageLabel(d.stage)}`}
                        active={isActive}
                        unread={d.unreadCount}
                        tag={d.adminTag}
                        onClick={() => selectPane({ kind: 'design', customerKey: customer.key, projectId: project.id, designId: d.id })}
                        onContextMenu={(e) => openDesignTagMenu(e, project.code, d.id, d.adminTag)}
                        onDoubleClick={(e) => openDesignTagMenu(e, project.code, d.id, d.adminTag)}
                        kindTag="design"
                      />
                      <button
                        type="button"
                        title="Rename design"
                        onClick={(e) => { e.stopPropagation(); setRenameDesignTarget({ id: d.id, name: d.name, imageUrl: d.imageUrl }); }}
                        className={`absolute top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover/design:opacity-100 hover:bg-black/5 transition-all ${canDelete ? 'right-8' : 'right-2'}`}
                      >
                        <Sym name="edit" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          title="Delete design channel"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete design channel "${d.name}"? All messages in this channel will be removed.`)) {
                              deleteDesignMutation.mutate(d.id);
                            }
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover/design:opacity-100 hover:bg-red-50 transition-all"
                        >
                          <Sym name="delete" className="text-[16px]" style={{ color: '#b42318' }} />
                        </button>
                      )}
                    </div>
                  );
                })}

                <SectionLabel
                  collapsible
                  collapsed={resourcesCollapsed}
                  onToggle={toggleResourcesCollapsed}
                >
                  Resources
                </SectionLabel>
                {!resourcesCollapsed && PROJECT_RESOURCES.map((r) => (
                  <ListRow
                    key={r.key}
                    icon={r.icon}
                    iconBg={r.bg}
                    iconColor={r.color}
                    title={r.label}
                    active={active.kind === 'resource' && active.resourceKey === r.key}
                    onClick={() => selectPane({ kind: 'resource', customerKey: customer.key, projectId: project.id, resourceKey: r.key })}
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

        {/* Center pane — chat / resource mock */}
        <main className={`flex-1 min-w-0 relative overflow-hidden md:flex ${mobilePanelOpen ? 'flex' : 'hidden'}`}>
          <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--p-surface-container-lowest)' }}>
            {active.kind === 'none' ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--p-on-surface-variant)' }}>
                <Sym name="forum" className="text-[56px]" style={{ opacity: 0.4 }} />
                <p className="text-[14px]">{isLoading || !urlResolved ? 'Loading conversations…' : 'No clients yet'}</p>
              </div>
            ) : active.kind === 'resource' && activeResource?.key === 'financials' && project ? (
              <>
                <div className="h-14 px-5 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MobileBackButton onClick={mobilePaneBack} />
                  <Sym name={activeResource.icon} className="text-[20px]" style={{ color: activeResource.color }} />
                  <p className="font-bold text-[14px]">{activeResource.label}</p>
                </div>
                <FinancialOverviewPanel mode="admin" projectCode={project.code} projectClosed={project.currentStage === 'DELIVERED'} />
              </>
            ) : active.kind === 'resource' && activeResource?.key === 'brief' && projectDetail ? (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                <ProjectBriefPanel project={projectDetail} />
              </div>
            ) : active.kind === 'resource' && activeResource?.key === 'quotation' && projectDetail && project ? (
              <>
                <div className="h-14 px-5 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MobileBackButton onClick={mobilePaneBack} />
                  <Sym name={activeResource.icon} className="text-[20px]" style={{ color: activeResource.color }} />
                  <p className="font-bold text-[14px]">{activeResource.label}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                  <AdminProjectQuotationPanel inquiryId={projectDetail.inquiryId} projectCode={project.code} />
                </div>
              </>
            ) : active.kind === 'resource' && activeResource?.key === 'invoices' && projectDetail ? (
              <>
                <div className="h-14 px-5 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MobileBackButton onClick={mobilePaneBack} />
                  <Sym name={activeResource.icon} className="text-[20px]" style={{ color: activeResource.color }} />
                  <p className="font-bold text-[14px]">{activeResource.label}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                  <ProjectInvoicesPanel project={projectDetail} />
                </div>
              </>
            ) : active.kind === 'resource' && activeResource?.key === 'payments' && project ? (
              <ProjectPaymentsPanel mode="admin" project={project} />
            ) : active.kind === 'resource' && activeResource?.key === 'files' && project ? (
              <>
                <div className="h-14 px-5 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MobileBackButton onClick={mobilePaneBack} />
                  <Sym name={activeResource.icon} className="text-[20px]" style={{ color: activeResource.color }} />
                  <p className="font-bold text-[14px]">{activeResource.label}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                  <ProjectFilesPanel files={allProjectFiles} isLoading={attachmentsLoading} />
                </div>
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
                  <MobileBackButton onClick={mobilePaneBack} />
                  <Sym name="list_alt" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                  <p className="font-bold text-[14px]">Threads</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {projectThreads.length === 0 ? (
                    <p className="text-center text-[13px] py-10" style={{ color: 'var(--p-on-surface-variant)' }}>No threads yet.</p>
                  ) : projectThreads.map((t) => (
                    <button
                      key={t.messageId}
                      onClick={() => {
                        const targetDesignId = t.designId ?? announcementsDesign?.id;
                        if (targetDesignId == null) return;
                        setActive(t.designId && t.designId === announcementsDesign?.id
                          ? { kind: 'announcements', customerKey: customer!.key, projectId: project.id }
                          : { kind: 'design', customerKey: customer!.key, projectId: project.id, designId: targetDesignId });
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
            ) : active.kind === 'threadsGeneral' && customer ? (
              <>
                <div className="h-14 px-5 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <MobileBackButton onClick={mobilePaneBack} />
                  <Sym name="list_alt" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                  <p className="font-bold text-[14px]">General Chat Threads</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {generalThreads.length === 0 ? (
                    <p className="text-center text-[13px] py-10" style={{ color: 'var(--p-on-surface-variant)' }}>No threads yet.</p>
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
                    <MobileBackButton onClick={mobilePaneBack} />
                    {active.kind === 'customerGeneral' && customer && (
                      <>
                        <Avatar initials={initialsOf(customer.name)} size={32} />
                        <div>
                          <p className="font-bold text-[14px] leading-tight">{customer.name}</p>
                          <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>General Chat · all projects</p>
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
                          <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>{project.title} · {project.code} · read-only</p>
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
                          <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>{project.title} · {project.code}</p>
                        </div>
                      </>
                    )}
                    <div className="flex-1" />
                    <div className="flex items-center gap-3" style={{ color: 'var(--p-on-surface-variant)' }}>
                      {(active.kind === 'customerGeneral' || active.kind === 'threadsGeneral') && customer && hasRealEmail ? (
                        <ChatSearchBar
                          onSearch={(q) => adminCustomerChatApi.searchMessages(customerEmail!, q)}
                          onJumpTo={(messageId) => {
                            setActive({ kind: 'customerGeneral', customerKey: customer.key });
                            jumpToMessage(messageId);
                          }}
                        />
                      ) : isChannelPane && project ? (
                        <ChatSearchBar
                          onSearch={(q) => projectApi.searchMessages(project.code, q)}
                          onJumpTo={(messageId, designId) => {
                            setActive(designId && designId === announcementsDesign?.id
                              ? { kind: 'announcements', customerKey: customer!.key, projectId: project.id }
                              : designId
                                ? { kind: 'design', customerKey: customer!.key, projectId: project.id, designId }
                                : active);
                            jumpToMessage(messageId);
                          }}
                        />
                      ) : null}
                      {isChannelPane && project && (
                        <button
                          type="button"
                          onClick={() => {
                            setPayLabel('');
                            setPayDescription('');
                            setPayModal(true);
                          }}
                          title="Request payment"
                          className="p-1.5 rounded-full hover:bg-black/5"
                        >
                          <Sym name="payments" className="text-[20px]" />
                        </button>
                      )}
                      {project && (
                      <div className="relative">
                        <button
                          onClick={() => setMoreOpen((v) => !v)}
                          title="More"
                          className="p-1.5 rounded-full hover:bg-black/5"
                          style={moreOpen ? { background: 'rgba(0,103,106,0.12)', color: 'var(--p-primary)' } : undefined}
                        >
                          <Sym name="more_vert" className="text-[20px]" />
                        </button>
                        {moreOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                            <div
                              className="absolute right-0 top-10 w-56 rounded-lg border py-1.5 z-50 shadow-xl"
                              style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                            >
                              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Jump to resource</p>
                              {PROJECT_RESOURCES.map((r) => (
                                <button
                                  key={r.key}
                                  onClick={() => selectPane({ kind: 'resource', customerKey: customer!.key, projectId: project.id, resourceKey: r.key })}
                                  className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-3 hover:bg-black/5"
                                >
                                  <Sym name={r.icon} className="text-[18px]" style={{ color: r.color }} /> {r.label}
                                </button>
                              ))}
                              <div className="border-t my-1" style={{ borderColor: 'var(--p-outline-variant)' }} />
                              <button
                                onClick={() => { setMoreOpen(false); setSettingsOpen(true); setSettingsTitleDraft(project?.title || ''); }}
                                className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-3 hover:bg-black/5"
                              >
                                <Sym name="settings" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} /> Project settings
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      )}
                    </div>
                  </div>
                  {active.kind === 'design' && activeDesign && (
                    <div className="px-5 pb-2 flex items-center gap-2 flex-wrap">
                      <DesignStagePicker
                        stage={activeDesign.stage}
                        disabled={updateDesignStageMutation.isPending}
                        onChange={(stage) => updateDesignStageMutation.mutate({ designId: activeDesign.id, stage })}
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
                      <div className="flex items-center gap-1 overflow-x-auto py-1">
                        {STAGES.map((st, i) => {
                          const curIdx = STAGE_INDEX[(project.currentStage as StageKey) || 'INQUIRY'] ?? 0;
                          const done = i < curIdx;
                          const cur = i === curIdx;
                          return (
                            <div key={st.key} className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={updateStageMutation.isPending}
                                onClick={() => updateStageMutation.mutate({ stage: st.key, status: defaultStatusFor(st.key) })}
                                className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1 disabled:opacity-50"
                                style={cur
                                  ? { background: 'var(--p-primary)', color: '#fff' }
                                  : done
                                    ? { background: 'rgba(0,103,106,0.12)', color: 'var(--p-primary)' }
                                    : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
                              >
                                {done && <Sym name="check" className="text-[11px]" />}
                                {st.label}
                              </button>
                              {i < STAGES.length - 1 && <span className="w-3 h-px shrink-0" style={{ background: 'var(--p-outline-variant)' }} />}
                            </div>
                          );
                        })}
                      </div>
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
                    {typingVisible && (() => {
                      const who = active.kind === 'customerGeneral' ? generalTypingUser : channelTypingUser;
                      const dot = who?.isAi ? 'var(--p-ai-bubble)' : 'var(--p-on-surface-variant)';
                      return (
                        <div className="self-start flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px]" style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}>
                          <span className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: dot, animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: dot, animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: dot, animationDelay: '300ms' }} />
                          </span>
                          {who?.isAi ? 'Sara AI is replying…' : `${who?.authorName} is typing…`}
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
                    Announcements is update-only — use General Chat or a design channel to reply.
                  </div>
                ) : (active.kind === 'customerGeneral' || active.kind === 'design') && aiActive ? (
                  <div
                    className="mx-3 mb-3 mt-2 px-3 py-2.5 rounded-xl shrink-0 flex items-center justify-between gap-3"
                    style={{ background: 'rgba(109,40,217,0.08)' }}
                  >
                    <span className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                      <Sym name="auto_awesome" className="text-[16px]" style={{ color: 'var(--p-ai-bubble)' }} />
                      Sara AI is replying on your behalf right now.
                    </span>
                    <button
                      type="button"
                      onClick={() => joinChannelMutation.mutate()}
                      disabled={joinChannelMutation.isPending}
                      className="px-3 py-1.5 rounded-full text-[12px] font-semibold text-white shrink-0 disabled:opacity-60"
                      style={{ background: 'var(--p-ai-bubble)' }}
                    >
                      {joinChannelMutation.isPending ? 'Joining…' : 'Join chat'}
                    </button>
                  </div>
                ) : (active.kind === 'customerGeneral' || active.kind === 'design') && (
                  <div
                    className="px-3 pb-3 pt-2 shrink-0"
                    onKeyDown={() => {
                      if (active.kind === 'customerGeneral') notifyGeneralTyping(true);
                      else notifyChannelTyping(true, activeChannelDesignId);
                    }}
                  >
                    <Composer
                      placeholder={active.kind === 'customerGeneral' ? 'Message General Chat…' : `Message ${channelLabel}…`}
                      compact
                      showProductAttach
                      onSearchMentions={customerEmail ? searchAllMentions : undefined}
                      onPickFileTag={project ? pickFileTagForComposer : undefined}
                      onRequestPayment={isChannelPane && project ? () => {
                        setPayLabel('');
                        setPayDescription('');
                        setPayModal(true);
                      } : undefined}
                      onSend={async (text, attachments) => {
                        if (active.kind === 'customerGeneral') {
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
            fetchAttachments={() => projectApi.listAttachments(project!.code)}
          />
          <EntityTagMenu
            open={!!tagMenu}
            position={tagMenu?.position ?? null}
            currentTag={tagMenu?.currentTag}
            onSave={(tag) => tagMenu?.onSave(tag)}
            onClose={() => setTagMenu(null)}
          />

          {/* Thread panel — right-side sliding drawer */}
          {thread && (
            <div
              className="w-[380px] shrink-0 border-l flex flex-col"
              style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
            >
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
                  <span className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                    {(threadReplies.length)} replies
                  </span>
                  <span className="flex-1 h-px" style={{ background: 'var(--p-outline-variant)' }} />
                </div>

                {threadReplies.map((r) => (
                  <div key={r.id} className="flex flex-col pl-3 border-l-2" style={{ borderColor: 'var(--p-outline-variant)' }}>
                    <MessageBubble
                      m={r}
                      onOpenImage={setLightboxUrl}
                    onOpenFile={(url, fileName) => setFilePreview({ url, fileName })}
                      inThread
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
              </div>

              {(isGeneralChatThread || isChannelThread) && (
                <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <Composer
                    placeholder="Reply in thread…"
                    compact
                    showProductAttach
                    onSearchMentions={customerEmail ? searchAllMentions : undefined}
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

      {/* Project settings modal (mock) */}
      {settingsOpen && project && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => { setSettingsOpen(false); setDeleteConfirm(''); }}
        >
          <div className="w-[420px] rounded-2xl p-5" style={{ background: 'var(--p-surface-container-lowest)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[16px]">Project Settings</h3>
              <button onClick={() => { setSettingsOpen(false); setDeleteConfirm(''); }}><Sym name="close" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>General</p>
                <div className="flex items-center gap-2 rounded-lg px-3 h-10 border" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <input
                    value={settingsTitleDraft}
                    onChange={(e) => setSettingsTitleDraft(e.target.value)}
                    placeholder={project.title || project.code}
                    className="flex-1 bg-transparent border-none outline-none text-[13px]"
                  />
                  <button
                    type="button"
                    disabled={!settingsTitleDraft.trim() || settingsTitleDraft.trim() === project.title || renameProjectMutation.isPending}
                    onClick={() => renameProjectMutation.mutate(settingsTitleDraft.trim())}
                    title="Save name"
                  >
                    <Sym name={renameProjectMutation.isPending ? 'progress_activity' : 'save'} className={`text-[16px] ${renameProjectMutation.isPending ? 'animate-spin' : ''}`} style={{ color: 'var(--p-primary)' }} />
                  </button>
                </div>
              </div>

              {superAdmin && (
                <div className="pt-2 border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <p className="text-[12px] font-bold uppercase tracking-wide mb-1" style={{ color: '#b42318' }}>Danger zone</p>
                  <p className="text-[11px] mb-2" style={{ color: 'var(--p-on-surface-variant)' }}>
                    This permanently removes the project, its threads, designs and messages. This cannot be undone.
                    Type <b>{project.code}</b> to confirm.
                  </p>
                  <input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={project.code}
                    className="w-full mb-2 px-3 py-2 rounded-lg text-[13px] outline-none border"
                    style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                  />
                  <button
                    type="button"
                    disabled={deleteConfirm.trim() !== project.code || deleteProjectMutation.isPending}
                    onClick={() => deleteProjectMutation.mutate()}
                    className="text-[13px] font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-40"
                    style={{ background: '#b42318' }}
                  >
                    {deleteProjectMutation.isPending ? 'Deleting…' : 'Delete project permanently'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AddDesignModal
        open={addDesignOpen}
        onClose={() => setAddDesignOpen(false)}
        onCreated={async (name, imageUrl, description) => {
          if (!project) return;
          const created = await projectApi.createDesign(project.code, name, imageUrl, description);
          await qc.invalidateQueries({ queryKey: ['project-detail', project.code] });
          selectPane({ kind: 'design', customerKey: customer!.key, projectId: project.id, designId: created.id });
          toast.success(`Design "${name}" created`);
        }}
      />

      <RenameDesignModal
        open={renameDesignTarget != null}
        currentName={renameDesignTarget?.name || ''}
        currentImageUrl={renameDesignTarget?.imageUrl}
        showImageUpload
        heading="Edit design"
        placeholder="Design name"
        onClose={() => setRenameDesignTarget(null)}
        onSave={async (name, imageUrl) => {
          if (renameDesignTarget) await renameDesignMutation.mutateAsync({ designId: renameDesignTarget.id, name, imageUrl });
        }}
      />

      {payModal && project && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setPayModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 border rounded-2xl shadow-2xl p-6" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
            <h3 className="font-display text-[18px] mb-1">Request payment</h3>
            <p className="text-[13px] mb-4" style={{ color: 'var(--p-on-surface-variant)' }}>
              A secure pay link is created for <b>{project.clientEmail || 'the client'}</b> and posted as a card in Announcements. They'll be notified.
            </p>
            <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Amount (INR)</label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="e.g. 9060"
              className="w-full h-10 px-3 rounded-lg border text-[14px] mb-4 outline-none focus:ring-2 focus:ring-[#00676a]/20"
              style={{ borderColor: 'var(--p-outline-variant)' }}
            />
            <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Label (optional)</label>
            <input
              value={payLabel}
              onChange={(e) => setPayLabel(e.target.value)}
              placeholder="e.g. Advance for Linen Wrap Dress"
              className="w-full h-10 px-3 rounded-lg border text-[14px] mb-4 outline-none focus:ring-2 focus:ring-[#00676a]/20"
              style={{ borderColor: 'var(--p-outline-variant)' }}
            />
            <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Description (optional)</label>
            <textarea
              value={payDescription}
              onChange={(e) => setPayDescription(e.target.value)}
              placeholder="What this payment is for — shown to the client on the pay page"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-[14px] mb-4 outline-none resize-none focus:ring-2 focus:ring-[#00676a]/20"
              style={{ borderColor: 'var(--p-outline-variant)' }}
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setPayModal(false)} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--p-outline)' }}>Cancel</button>
              <button
                type="button"
                disabled={requestPaymentMutation.isPending || !(Number(payAmount) > 0)}
                onClick={() => requestPaymentMutation.mutate()}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--p-primary)' }}
              >
                {requestPaymentMutation.isPending ? 'Sending…' : 'Request payment'}
              </button>
            </div>
          </div>
        </>
      )}

      {lightboxUrl && <Lightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      <FilePreviewModal
        open={!!filePreview}
        url={filePreview?.url ?? null}
        fileName={filePreview?.fileName}
        onClose={() => setFilePreview(null)}
      />

      {project && (
        <ProjectAssignModal
          open={assignOpen}
          projectIds={[project.id]}
          projectLabels={[project.title?.trim() || project.code]}
          onClose={() => setAssignOpen(false)}
          onAssigned={() => {
            qc.invalidateQueries({ queryKey: ['project-detail', project.code] });
            toast.success('Project assigned — notification email sent');
          }}
        />
      )}
    </AdminShell>
  );
}
