import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import PortalShell from '@/components/portal/PortalShell';
import ClientProjectSidebar from '@/components/portal/ClientProjectSidebar';
import ClientProjectQuotationPanel from '@/components/portal/ClientProjectQuotationPanel';
import ProjectBriefPanel from '@/components/portal/ProjectBriefPanel';
import ProjectInvoicesPanel from '@/components/portal/ProjectInvoicesPanel';
import AddDesignModal from '@/components/portal/AddDesignModal';
import RenameDesignModal from '@/components/portal/RenameDesignModal';
import ProjectFilesPanel from '@/components/portal/ProjectFilesPanel';
import Composer, { Attachment } from '@/components/portal/Composer';
import Lightbox from '@/components/portal/Lightbox';
import RichMessageBody from '@/components/portal/RichMessageBody';
import PaymentCard, { parsePaymentCard } from '@/components/portal/PaymentCard';
import ProductCard, { parseProductCard, stripProductMarker } from '@/components/portal/ProductCard';
import ThreadListItem from '@/components/portal/ThreadListItem';
import ThreadPanel from '@/components/portal/ThreadPanel';
import AnnouncementCategoryBadge from '@/components/portal/AnnouncementCategoryBadge';
import ChatSearchBar from '@/components/portal/ChatSearchBar';
import MessageHoverActions from '@/components/portal/MessageHoverActions';
import { Sym } from '@/components/portal/Sym';
import { STAGES, STAGE_INDEX, type StageKey } from '@/components/manufacturing/stages';
import { defaultActiveDesignId, designStageLabel } from '@/lib/portalChatConstants';
import { useProjectMessagePolling } from '@/hooks/useProjectEventStream';
import { useProjectStomp } from '@/hooks/useProjectStomp';
import { usePrefetchProductPicker } from '@/hooks/usePrefetchProductPicker';
import { clientProjectApi, getUserEmailFromToken, mediaApi, type ProjectMessageDto, type WorkspaceView, type ManufacturingProjectDetailDto } from '@/lib/api';
import { formatServerTime, formatServerDate } from '@/lib/serverTime';

type DisplayMessage = ProjectMessageDto & { pending?: boolean };

function formatMsgTime(iso?: string) {
  if (!iso) return 'now';
  return formatServerTime(iso) || 'now';
}

function formatDateDivider(iso?: string) {
  return formatServerDate(iso);
}

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i.test(url) || url.startsWith('data:image/');
}

function MessageAvatar({ type }: { type: string }) {
  const isSystem = type === 'SYSTEM';
  const isAdmin = type === 'ADMIN';
  return (
    <div
      className="w-9 h-9 rounded shrink-0 flex items-center justify-center text-white"
      style={{
        background: isSystem ? 'var(--p-surface-container-high)' : isAdmin ? 'var(--p-secondary)' : 'var(--p-primary)',
        color: isSystem ? 'var(--p-on-surface-variant)' : '#fff',
      }}
    >
      <Sym name={isSystem ? 'info' : 'person'} className="text-[18px]" />
    </div>
  );
}

const WORKSPACE_VIEWS: WorkspaceView[] = ['channels', 'threads', 'quotation', 'brief', 'invoices', 'files'];

export default function ClientProjectDetail() {
  const { code } = useParams();
  const qc = useQueryClient();
  const feedRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const view: WorkspaceView = (WORKSPACE_VIEWS as string[]).includes(tabParam || '') ? (tabParam as WorkspaceView) : 'channels';
  const setView = useCallback((v: WorkspaceView) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (v === 'channels') next.delete('tab'); else next.set('tab', v);
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  const [activeDesignId, setActiveDesignId] = useState<number | undefined>();
  const [openThreadId, setOpenThreadId] = useState<number | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [threadTab, setThreadTab] = useState<'all' | 'unread'>('all');
  const [pendingMessages, setPendingMessages] = useState<DisplayMessage[]>([]);
  const [designModal, setDesignModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: number; name: string } | null>(null);
  const [renameProjectOpen, setRenameProjectOpen] = useState(false);
  // Mobile only: false = show the design/resource list full-screen (WhatsApp-style);
  // true = a chat/panel is open full-screen with a back button. Desktop ignores this
  // entirely — both the list and the panel are always visible side-by-side there.
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  // Header "more" dropdown on the chat screen: jump to Brief/Quote/Files/Invoices
  // or switch design/announcements — without leaving the chat (mainly for mobile,
  // where the sidebar list is hidden while a chat is open).
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const skipSseRef = useRef(0);

  useProjectStomp(code, 'client', () => skipSseRef.current);
  useProjectMessagePolling(code, activeDesignId, view === 'channels', 'client');
  usePrefetchProductPicker();

  const { data: shell, isLoading: shellLoading, isError } = useQuery({
    queryKey: ['client-project-shell', code],
    queryFn: () => clientProjectApi.getByCode(code!, undefined, { includeMessages: false, includeFinancials: false }),
    enabled: !!code,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!shell?.designs?.length || activeDesignId != null) return;
    const id = defaultActiveDesignId(shell.designs);
    if (id != null) setActiveDesignId(id);
  }, [shell?.designs, activeDesignId]);

  const needsFinancials = view === 'quotation' || view === 'invoices' || view === 'brief';
  const { data: financials } = useQuery({
    queryKey: ['client-project-financials', code],
    queryFn: () => clientProjectApi.getByCode(code!, undefined, { includeMessages: false, includeFinancials: true }),
    enabled: !!code && needsFinancials,
    staleTime: 60_000,
    select: (d) => ({ quotes: d.quotes, invoices: d.invoices, valueDisplay: d.valueDisplay }),
  });

  const { data: messages = [], isFetching: messagesFetching } = useQuery({
    queryKey: ['client-project-messages', code, activeDesignId],
    queryFn: () => clientProjectApi.getChannelMessages(code!, activeDesignId),
    enabled: !!code && activeDesignId != null,
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const project = useMemo(
    () => (shell ? { ...shell, ...financials, messages } : undefined),
    [shell, financials, messages],
  );

  const { data: threads = [] } = useQuery({
    queryKey: ['client-threads', code],
    queryFn: () => clientProjectApi.listThreads(code!),
    enabled: !!code,
    staleTime: 30_000,
  });

  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery({
    queryKey: ['client-project-files', code],
    queryFn: () => clientProjectApi.listAttachments(code!),
    enabled: !!code && view === 'files',
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!code || activeDesignId == null || view !== 'channels' || messagesFetching) return;
    qc.invalidateQueries({ queryKey: ['client-project-shell', code] });
    qc.invalidateQueries({ queryKey: ['client-threads', code] });
  }, [messagesFetching, code, activeDesignId, view, qc]);

  const activeDesign = shell?.designs?.find((d) => d.id === activeDesignId) || shell?.designs?.find((d) => !d.system) || shell?.designs?.[0];
  const isAnnouncements = !!activeDesign?.system;
  const isDesignChannel = !!(activeDesign && !activeDesign.system && !activeDesign.general);
  const channelName = activeDesign?.name || 'Chat';
  const projectTitle = shell?.title?.trim() || 'Untitled project';
  const clientDisplayName = shell?.clientName || getUserEmailFromToken()?.split('@')[0] || 'You';

  const serverPosts = useMemo(
    () => (project?.messages || []).filter((m) => !m.parentMessageId),
    [project?.messages],
  );

  const posts: DisplayMessage[] = useMemo(() => {
    const pending = pendingMessages.filter((p) => !serverPosts.some((s) => s.body === p.body && s.pending !== true));
    return [...serverPosts, ...pending];
  }, [serverPosts, pendingMessages]);

  const threadRoot = posts.find((p) => p.id === openThreadId) || null;
  const threadReplies = useMemo(
    () => (project?.messages || []).filter((m) => m.parentMessageId === openThreadId),
    [project?.messages, openThreadId],
  );

  const threadsUnread = threads.filter((t) => t.unread).length;
  const shownThreads = threads.filter((t) => threadTab === 'all' || t.unread);

  const designMutation = useMutation({
    mutationFn: ({ name }: { name: string }) => clientProjectApi.createDesign(code!, name),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['client-project-shell', code] });
      setActiveDesignId(d.id);
      setView('channels');
      toast.success(`Chat "${d.name}" created`);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create chat'),
  });

  const renameMutation = useMutation({
    mutationFn: ({ designId, name }: { designId: number; name: string }) =>
      clientProjectApi.renameDesign(code!, designId, name),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['client-project-shell', code] });
      toast.success(`Renamed to "${d.name}"`);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to rename'),
  });

  const renameProjectMutation = useMutation({
    mutationFn: (title: string) => clientProjectApi.renameProject(code!, title),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['client-project-shell', code] });
      qc.invalidateQueries({ queryKey: ['client-projects'] });
      toast.success(`Project renamed to "${p.title}"`);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to rename project'),
  });

  const postMutation = useMutation({
    mutationFn: (data: { body: string; attachmentUrl?: string; parentMessageId?: number; tempId: number }) =>
      clientProjectApi.postMessage(code!, data.body, {
        attachmentUrl: data.attachmentUrl,
        designId: activeDesignId,
        parentMessageId: data.parentMessageId,
      }),
    onSuccess: (res, vars) => {
      setPendingMessages((xs) => xs.filter((p) => p.id !== vars.tempId));
      qc.setQueryData<ProjectMessageDto[]>(['client-project-messages', code, activeDesignId], (prev) => {
        if (!prev) return [res];
        if (prev.some((m) => m.id === res.id)) return prev;
        return [...prev, res];
      });
      if (vars.parentMessageId) qc.invalidateQueries({ queryKey: ['client-threads', code] });
    },
    onError: (_e, vars) => {
      setPendingMessages((xs) => xs.filter((p) => p.id !== vars.tempId));
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: number) => clientProjectApi.deleteMessage(code!, messageId),
    onSuccess: (_r, messageId) => {
      if (openThreadId === messageId) setOpenThreadId(null);
      qc.invalidateQueries({ queryKey: ['client-project-messages', code] });
      qc.invalidateQueries({ queryKey: ['client-threads', code] });
      toast.success('Message deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete message'),
  });

  useEffect(() => {
    if (view === 'channels' && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [posts.length, activeDesignId, view]);

  const uploadAndSend = async (text: string, atts: Attachment[], parentMessageId?: number) => {
    if (!code || !activeDesignId || isAnnouncements) return;

    const toFile = async (a: Attachment): Promise<File> => {
      if (a.file) return a.file;
      const blob = await (await fetch(a.url)).blob();
      return new File([blob], a.name, { type: blob.type });
    };

    // Each attachment is sent as its own message. If there's text, it rides along with
    // the first attachment; the rest go as attachment-only messages. No attachments ->
    // a single text message.
    const plans: { body: string; att?: Attachment; tempId: number }[] = [];
    if (atts.length === 0) {
      const body = text.trim();
      if (!body) return;
      plans.push({ body, tempId: -Date.now() });
    } else {
      atts.forEach((att, i) => {
        plans.push({
          body: i === 0 ? (text.trim() || '(attachment)') : '(attachment)',
          att,
          tempId: -(Date.now() + i),
        });
      });
    }

    if (!parentMessageId) {
      setPendingMessages((xs) => [
        ...xs,
        ...plans.map((p) => ({
          id: p.tempId,
          projectId: project?.id || 0,
          designId: activeDesignId,
          authorType: 'CLIENT' as const,
          authorName: clientDisplayName,
          body: p.att ? 'Uploading attachment…' : p.body,
          createdAt: new Date().toISOString(),
          pending: true,
          replyCount: 0,
        })),
      ]);
    }

    skipSseRef.current = Date.now() + 2500 + plans.length * 500;

    // Upload + post each plan independently so one failure doesn't block the others.
    await Promise.all(
      plans.map(async (p) => {
        try {
          const attachmentUrl = p.att ? await mediaApi.upload(await toFile(p.att), 'projects') : undefined;
          await new Promise<void>((resolve) => {
            postMutation.mutate(
              { body: p.body, attachmentUrl, parentMessageId, tempId: p.tempId },
              {
                onError: () => {
                  setPendingMessages((xs) => xs.filter((x) => x.id !== p.tempId));
                  resolve();
                },
                onSuccess: () => resolve(),
              },
            );
          });
        } catch (e) {
          setPendingMessages((xs) => xs.filter((x) => x.id !== p.tempId));
          toast.error(e instanceof Error ? e.message : `Failed to send ${p.att?.name ?? 'message'}`);
        }
      }),
    );

    if (parentMessageId) {
      setOpenThreadId(parentMessageId);
      clientProjectApi.markThreadRead(code, parentMessageId).catch(() => {});
    }
  };

  const openThread = async (messageId: number) => {
    setOpenThreadId(messageId);
    setMenuOpen(null);
    if (code) {
      await clientProjectApi.markThreadRead(code, messageId);
      qc.invalidateQueries({ queryKey: ['client-threads', code] });
    }
  };

  const handleDeleteMessage = (post: DisplayMessage) => {
    if (post.pending || post.authorType !== 'CLIENT') return;
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    deleteMessageMutation.mutate(post.id);
  };

  const copyMessageLink = (messageId: number) => {
    const url = `${window.location.origin}/portal/projects/${code}#msg-${messageId}`;
    navigator.clipboard?.writeText(url);
    toast.success('Link copied');
  };

  const jumpToMessage = async (messageId: number, designId?: number | null) => {
    if (designId) setActiveDesignId(designId);
    setView('channels');
    await openThread(messageId);
    setHighlightId(messageId);
    setTimeout(() => {
      document.getElementById(`msg-${messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
    setTimeout(() => setHighlightId(null), 2200);
  };

  const renderMessage = (post: DisplayMessage, inThread = false) => {
    const isSystem = post.authorType === 'SYSTEM';
    const isAdmin = post.authorType === 'ADMIN';
    const att = post.attachmentUrl;
    const attIsImg = att && isImageUrl(att);
    const highlighted = highlightId === post.id;
    const canDelete = post.authorType === 'CLIENT' && !post.pending;
    return (
      <div
        id={!inThread ? `msg-${post.id}` : undefined}
        key={post.id}
        className={`group flex gap-3 items-start -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 transition-all duration-500 relative rounded ${isSystem ? 'opacity-85' : ''}`}
        style={highlighted ? { background: 'rgba(0,103,106,0.15)', boxShadow: 'inset 0 0 0 2px var(--p-primary)' } : undefined}
        onMouseEnter={(e) => { if (!inThread && !highlighted) e.currentTarget.style.background = 'var(--p-surface-container-low)'; }}
        onMouseLeave={(e) => { if (!highlighted) e.currentTarget.style.background = 'transparent'; }}
      >
        <MessageAvatar type={post.authorType} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`font-bold text-[15px] ${isSystem ? 'italic' : ''}`} style={isAdmin ? { color: 'var(--p-secondary)' } : isSystem ? { color: 'var(--p-on-surface-variant)' } : undefined}>
              {post.authorName || (isSystem ? 'System' : isAdmin ? post.authorName || 'Studio Sara' : 'You')}
            </span>
            <span className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{formatMsgTime(post.createdAt)}</span>
            {isSystem && post.announcementCategory ? <AnnouncementCategoryBadge category={post.announcementCategory} /> : null}
            {post.pending && (
              <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--p-primary)' }}>
                <Sym name="cloud_upload" className="text-[14px] animate-pulse" /> Sending…
              </span>
            )}
          </div>
          {(() => {
            const pay = parsePaymentCard(post.body);
            const product = parseProductCard(post.body);
            if (pay) return <PaymentCard data={pay} actionable />;
            if (product) return <ProductCard data={product} />;
            const textBody = stripProductMarker(post.body);
            if (textBody && textBody !== '(attachment)') {
              return isSystem
                ? <p className="text-[14px] leading-relaxed mb-2 break-words whitespace-pre-wrap">{textBody}</p>
                : <RichMessageBody text={textBody} className="mb-2" />;
            }
            return null;
          })()}
          {attIsImg && (
            <div className="flex flex-wrap gap-2 mb-2">
              <button onClick={() => setLightbox(att!)} className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg border overflow-hidden cursor-zoom-in hover:ring-2 transition-all" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <img className="w-full h-full object-cover" src={att} alt="" />
              </button>
            </div>
          )}
          {att && !attIsImg && (
            <a href={att} target="_blank" rel="noreferrer" className="mt-1 max-w-sm border rounded-lg p-3 flex items-center gap-3 hover:border-current transition-colors" style={{ borderColor: 'var(--p-outline-variant)' }}>
              <Sym name="attach_file" style={{ color: 'var(--p-primary)' }} />
              <span className="font-bold text-[14px] truncate flex-1">{att.split('/').pop()}</span>
            </a>
          )}
          {!inThread && !isSystem && !post.pending && (post.replyCount ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => openThread(post.id)}
              className="inline-flex items-center gap-1.5 mt-1 px-2 py-1 rounded-md text-[12px] font-semibold transition-colors hover:bg-black/5"
              style={{ color: 'var(--p-primary)' }}
            >
              <Sym name="forum" className="text-[14px]" />
              {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
        <MessageHoverActions
          inThread={inThread}
          isSystem={isSystem}
          pending={post.pending}
          canDelete={canDelete}
          menuOpen={menuOpen === post.id}
          onMenuToggle={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
          onReply={() => openThread(post.id)}
          onDelete={() => handleDeleteMessage(post)}
          onCopyLink={() => copyMessageLink(post.id)}
        />
      </div>
    );
  };

  if (shellLoading && !shell) {
    return (
      <PortalShell active="home">
        <div className="flex-1 flex items-center justify-center"><Sym name="progress_activity" className="text-[28px] animate-spin" /></div>
      </PortalShell>
    );
  }

  if (isError || !shell) {
    return (
      <PortalShell active="home">
        <div className="flex-1 flex items-center justify-center text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>Project not found.</div>
      </PortalShell>
    );
  }

  const currentStage = (shell.currentStage as StageKey) || 'INQUIRY';
  const curIdx = STAGE_INDEX[currentStage] ?? 0;
  const workspaceProject = project ?? { ...shell, messages: messages ?? [] };

  return (
    <PortalShell active="home">
      <ClientProjectSidebar
        mobileHidden={mobilePanelOpen}
        projectTitle={projectTitle}
        projectCode={shell.code}
        assignedAgentName={shell.assignedAgentName}
        designs={shell.designs || []}
        activeDesignId={activeDesignId}
        onSelectDesign={(id) => { setActiveDesignId(id); setMobilePanelOpen(true); }}
        onAddDesign={() => setDesignModal(true)}
        onRenameDesign={(id, name) => setRenameTarget({ id, name })}
        onRenameProject={() => setRenameProjectOpen(true)}
        view={view}
        onViewChange={(v) => { setView(v); setMobilePanelOpen(true); }}
        threadsUnread={threadsUnread}
      />

      {view === 'threads' ? (
        <main className={`flex-1 flex-col min-w-0 overflow-hidden ${mobilePanelOpen ? 'flex' : 'hidden md:flex'}`} style={{ background: 'var(--p-surface-container-lowest)' }}>
          <div className="h-14 px-4 sm:px-6 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button type="button" onClick={() => setMobilePanelOpen(false)} className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-black/5 shrink-0" aria-label="Back">
                <Sym name="arrow_back" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
              </button>
              <Sym name="list_alt" className="text-[18px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
              <h2 className="font-display text-[18px] truncate">Threads</h2>
              {threadsUnread > 0 && <span className="text-[12px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--p-primary)' }}>{threadsUnread} new</span>}
            </div>
            <div className="flex gap-2">
              {(['all', 'unread'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setThreadTab(t)} className="px-3 py-1.5 rounded-full text-[13px] font-semibold capitalize" style={t === threadTab ? { background: 'var(--p-primary)', color: '#fff' } : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
            <div className="max-w-2xl mx-auto space-y-3">
              {shownThreads.map((t) => (
                <ThreadListItem
                  key={t.messageId}
                  thread={t}
                  timeLabel={formatMsgTime(t.lastReplyAt || t.createdAt)}
                  onClick={() => jumpToMessage(t.messageId, t.designId)}
                />
              ))}
              {shownThreads.length === 0 && (
                <div className="text-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
                  <Sym name="forum" className="text-[40px]" />
                  <p className="mt-2 text-[14px]">{threadTab === 'unread' ? 'No unread threads.' : 'No threads yet — message in a chat to start.'}</p>
                </div>
              )}
            </div>
          </div>
        </main>
      ) : view === 'brief' ? (
        <main className={`flex-1 flex-col min-w-0 overflow-hidden ${mobilePanelOpen ? 'flex' : 'hidden md:flex'}`} style={{ background: 'var(--p-surface-container-lowest)' }}>
          <div className="h-14 px-4 sm:px-6 border-b flex items-center gap-2 sm:gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <button type="button" onClick={() => setMobilePanelOpen(false)} className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-black/5 shrink-0" aria-label="Back">
              <Sym name="arrow_back" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            </button>
            <Sym name="description" className="text-[18px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
            <h2 className="font-display text-[18px] truncate">Project Brief</h2>
          </div>
          <ProjectBriefPanel project={workspaceProject} clientMode />
        </main>
      ) : view === 'invoices' ? (
        <main className={`flex-1 flex-col min-w-0 overflow-hidden ${mobilePanelOpen ? 'flex' : 'hidden md:flex'}`} style={{ background: 'var(--p-surface-container-lowest)' }}>
          <div className="h-14 px-4 sm:px-6 border-b flex items-center gap-2 sm:gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <button type="button" onClick={() => setMobilePanelOpen(false)} className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-black/5 shrink-0" aria-label="Back">
              <Sym name="arrow_back" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            </button>
            <Sym name="receipt_long" className="text-[18px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
            <h2 className="font-display text-[18px] truncate">Invoices</h2>
          </div>
          <ProjectInvoicesPanel project={workspaceProject} clientMode />
        </main>
      ) : view === 'quotation' ? (
        <main className={`flex-1 flex-col min-w-0 overflow-hidden ${mobilePanelOpen ? 'flex' : 'hidden md:flex'}`} style={{ background: 'var(--p-surface-container-lowest)' }}>
          <div className="h-14 px-4 sm:px-6 border-b flex items-center gap-2 sm:gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <button type="button" onClick={() => setMobilePanelOpen(false)} className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-black/5 shrink-0" aria-label="Back">
              <Sym name="arrow_back" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            </button>
            <Sym name="request_quote" className="text-[18px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
            <h2 className="font-display text-[18px] truncate">Quotation</h2>
          </div>
          <ClientProjectQuotationPanel project={workspaceProject} projectCode={shell.code} />
        </main>
      ) : view === 'files' ? (
        <main className={`flex-1 flex-col min-w-0 overflow-hidden ${mobilePanelOpen ? 'flex' : 'hidden md:flex'}`} style={{ background: 'var(--p-surface-container-lowest)' }}>
          <div className="h-14 px-4 sm:px-6 border-b flex items-center gap-2 sm:gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <button type="button" onClick={() => setMobilePanelOpen(false)} className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-black/5 shrink-0" aria-label="Back">
              <Sym name="arrow_back" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            </button>
            <Sym name="folder_open" className="text-[18px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
            <h2 className="font-display text-[18px] truncate">Files</h2>
          </div>
          <ProjectFilesPanel files={attachments} isLoading={attachmentsLoading} />
        </main>
      ) : (
        <>
          <main className={`flex-1 flex-col min-w-0 overflow-hidden relative ${mobilePanelOpen ? 'flex' : 'hidden md:flex'}`} style={{ background: 'var(--p-surface-container-lowest)' }}>
            <div className="border-b shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
              <div className="h-14 px-4 sm:px-6 flex items-center gap-2 min-w-0">
                <button type="button" onClick={() => setMobilePanelOpen(false)} className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-black/5 shrink-0" aria-label="Back">
                  <Sym name="arrow_back" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                </button>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Sym name="tag" className="text-[18px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
                  <h2 className="font-display text-[16px] sm:text-[18px] truncate">{channelName}</h2>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <ChatSearchBar
                    onSearch={(q) => clientProjectApi.searchMessages(code!, q)}
                    onJumpTo={(messageId, designId) => jumpToMessage(messageId, designId ?? undefined)}
                  />
                  {messagesFetching && (
                    <Sym name="progress_activity" className="text-[18px] animate-spin shrink-0" style={{ color: 'var(--p-primary)' }} />
                  )}
                </div>
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
                        {[
                          { icon: 'description', label: 'Brief', v: 'brief' as WorkspaceView },
                          { icon: 'request_quote', label: 'Quotation', v: 'quotation' as WorkspaceView },
                          { icon: 'folder_open', label: 'Files', v: 'files' as WorkspaceView },
                          { icon: 'receipt_long', label: 'Invoices', v: 'invoices' as WorkspaceView },
                        ].map((r) => (
                          <button
                            key={r.v}
                            type="button"
                            onClick={() => { setChatMenuOpen(false); setView(r.v); setMobilePanelOpen(true); }}
                            className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-3 hover:bg-black/5 transition-colors"
                            style={{ color: 'var(--p-on-surface)' }}
                          >
                            <Sym name={r.icon} className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                            {r.label}
                          </button>
                        ))}
                        {(shell.designs?.length ?? 0) > 1 && (
                          <>
                            <div className="border-t my-1" style={{ borderColor: 'var(--p-outline-variant)' }} />
                            <p className="px-3 pt-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--p-on-surface-variant)' }}>Switch chat</p>
                            {shell.designs!.map((d) => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => { setChatMenuOpen(false); setActiveDesignId(d.id); setView('channels'); setMobilePanelOpen(true); }}
                                className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-3 hover:bg-black/5 transition-colors"
                                style={d.id === activeDesignId ? { color: 'var(--p-primary)', fontWeight: 700 } : { color: 'var(--p-on-surface)' }}
                              >
                                <Sym name={d.system ? 'campaign' : 'palette'} className="text-[18px]" style={{ color: d.id === activeDesignId ? 'var(--p-primary)' : 'var(--p-on-surface-variant)' }} />
                                <span className="truncate flex-1">{d.system && '#'}{d.name}</span>
                                {d.id === activeDesignId && <Sym name="check" className="text-[16px]" />}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {(isDesignChannel || isAnnouncements) && (
                <div className="px-4 sm:px-6 pb-3 flex items-center gap-2 overflow-x-auto min-w-0">
                  {isDesignChannel && activeDesign && (
                    <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border" style={{ borderColor: 'var(--p-outline)', color: 'var(--p-primary)' }}>
                      <Sym name="flag" className="text-[13px]" /> {designStageLabel(activeDesign.stage)}
                    </span>
                  )}
                  {isAnnouncements && (
                    <div className="flex items-center gap-1 min-w-0">
                      {STAGES.map((st, i) => {
                        const done = i < curIdx;
                        const cur = i === curIdx;
                        return (
                          <div key={st.key} className="flex items-center gap-1 shrink-0">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap" style={cur ? { background: 'var(--p-primary)', color: '#fff' } : done ? { background: 'var(--p-secondary-container)', color: 'var(--p-on-secondary-container)' } : { background: 'var(--p-surface-container)', color: 'var(--p-on-surface-variant)' }}>
                              {done && <Sym name="check" className="text-[12px]" />}{st.label}
                            </span>
                            {i < STAGES.length - 1 && <div className="w-4 h-px shrink-0" style={{ background: 'var(--p-outline-variant)' }} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div ref={feedRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 chat-feed-bg">
              <div className="pb-6 border-b mb-6" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <h1 className="font-display text-[24px] sm:text-[28px] mb-2" style={{ color: 'var(--p-primary)' }}># {channelName}</h1>
                {activeDesign?.description && (
                  <div className="mb-3 max-w-xl border rounded-lg p-3 flex gap-2" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
                    <Sym name="description" className="text-[18px] shrink-0 mt-0.5" style={{ color: 'var(--p-primary)' }} />
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--p-on-surface)' }}>{activeDesign.description}</p>
                  </div>
                )}
                <p className="text-[14px] max-w-xl" style={{ color: 'var(--p-on-surface-variant)' }}>
                  {isAnnouncements
                    ? 'Announcements from Studio Sara — payment requests and project updates appear here.'
                    : 'Coordinate with the Studio Sara team on sampling, tech packs and production updates.'}
                </p>
              </div>
              {posts.length > 0 && (
                <div className="relative flex items-center py-2 mb-2">
                  <div className="flex-grow h-px" style={{ background: 'var(--p-outline-variant)' }} />
                  <span className="mx-4 text-[12px] font-bold px-2" style={{ color: 'var(--p-on-surface-variant)', background: 'var(--p-surface-container-lowest)' }}>{formatDateDivider(posts[0].createdAt)}</span>
                  <div className="flex-grow h-px" style={{ background: 'var(--p-outline-variant)' }} />
                </div>
              )}
              <div className="space-y-1">{posts.map((post) => renderMessage(post))}</div>
            </div>

            {!isAnnouncements && (
              <div className="px-4 sm:px-6 pb-4 pt-2">
                <Composer placeholder={`Message #${channelName.replace(/\s+/g, '-')}`} showProductAttach onSend={(t, a) => uploadAndSend(t, a)} />
              </div>
            )}
          </main>

          <ThreadPanel
            open={!!openThreadId}
            channelName={channelName}
            threadRoot={threadRoot}
            threadReplies={threadReplies}
            showComposer={!isAnnouncements}
            onClose={() => setOpenThreadId(null)}
            onSend={(t, a) => uploadAndSend(t, a, threadRoot!.id)}
            formatTime={formatMsgTime}
            className={`above-bottom-nav ${openThreadId ? 'flex' : 'hidden'} w-full sm:w-[min(420px,100vw)] lg:w-[380px] fixed md:absolute lg:relative right-0 top-12 md:top-0 z-20 lg:z-auto transition-transform duration-200 ${openThreadId ? 'translate-x-0' : 'translate-x-full'}`}
          />
        </>
      )}

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      <AddDesignModal
        open={designModal}
        simple
        onClose={() => setDesignModal(false)}
        onCreated={async (name) => { await designMutation.mutateAsync({ name }); }}
      />
      <RenameDesignModal
        open={renameTarget != null}
        currentName={renameTarget?.name || ''}
        onClose={() => setRenameTarget(null)}
        onSave={async (name) => {
          if (renameTarget) await renameMutation.mutateAsync({ designId: renameTarget.id, name });
        }}
      />
      <RenameDesignModal
        open={renameProjectOpen}
        currentName={projectTitle}
        heading="Rename project"
        placeholder="Project name"
        onClose={() => setRenameProjectOpen(false)}
        onSave={async (title) => { await renameProjectMutation.mutateAsync(title); }}
      />
    </PortalShell>
  );
}
