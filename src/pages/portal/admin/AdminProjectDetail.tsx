import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell from '@/components/portal/AdminShell';
import AdminProjectSidebar from '@/components/portal/AdminProjectSidebar';
import AdminProjectQuotationPanel from '@/components/portal/AdminProjectQuotationPanel';
import ProjectBriefPanel from '@/components/portal/ProjectBriefPanel';
import ProjectInvoicesPanel from '@/components/portal/ProjectInvoicesPanel';
import AddDesignModal from '@/components/portal/AddDesignModal';
import RenameDesignModal from '@/components/portal/RenameDesignModal';
import ProjectFilesPanel from '@/components/portal/ProjectFilesPanel';
import Composer, { Attachment } from '@/components/portal/Composer';
import Lightbox from '@/components/portal/Lightbox';
import RichMessageBody from '@/components/portal/RichMessageBody';
import PaymentCard, { parsePaymentCard, formatMessagePreview } from '@/components/portal/PaymentCard';
import MessageHoverActions from '@/components/portal/MessageHoverActions';
import { Sym } from '@/components/portal/Sym';
import { STAGES, STAGE_INDEX, defaultStatusFor, statusLabelFor, type StageKey } from '@/components/manufacturing/stages';
import { useProjectEventStream, useProjectMessagePolling } from '@/hooks/useProjectEventStream';
import { mediaApi, projectApi, manufacturingApi, type ProjectMessageDto, type WorkspaceView, type ManufacturingProjectDetailDto } from '@/lib/api';

type DisplayMessage = ProjectMessageDto & { pending?: boolean };

function formatMsgTime(iso?: string) {
  if (!iso) return 'now';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateDivider(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
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

export default function PortalAdminProjectDetail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const feedRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<WorkspaceView>('channels');
  const [activeDesignId, setActiveDesignId] = useState<number | undefined>();
  const [openThreadId, setOpenThreadId] = useState<number | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [designModal, setDesignModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: number; name: string } | null>(null);
  const [renameProjectOpen, setRenameProjectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payLabel, setPayLabel] = useState('');
  const [threadTab, setThreadTab] = useState<'all' | 'unread'>('all');
  const [pendingMessages, setPendingMessages] = useState<DisplayMessage[]>([]);
  const skipSseRef = useRef(0);

  useProjectEventStream(code, 'admin', () => skipSseRef.current);
  useProjectMessagePolling(code, activeDesignId, view === 'channels', 'admin');

  const { data: shell, isLoading: shellLoading, isError } = useQuery({
    queryKey: ['admin-project-shell', code],
    queryFn: () => projectApi.getByCode(code!, undefined, { includeMessages: false, includeFinancials: false }),
    enabled: !!code,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!shell?.designs?.length || activeDesignId != null) return;
    const first = shell.designs.find((d) => !d.system) ?? shell.designs[0];
    setActiveDesignId(first.id);
  }, [shell?.designs, activeDesignId]);

  const { data: financials } = useQuery({
    queryKey: ['admin-project-financials', code],
    queryFn: () => projectApi.getByCode(code!, undefined, { includeMessages: false, includeFinancials: true }),
    enabled: !!code && !!shell,
    staleTime: 60_000,
    select: (d) => ({ quotes: d.quotes, invoices: d.invoices, valueDisplay: d.valueDisplay }),
  });

  const { data: messages = [], isFetching: messagesFetching } = useQuery({
    queryKey: ['admin-project-messages', code, activeDesignId],
    queryFn: () => projectApi.getChannelMessages(code!, activeDesignId),
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
    queryKey: ['admin-threads', code],
    queryFn: () => projectApi.listThreads(code!),
    enabled: !!code,
    staleTime: 30_000,
  });

  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery({
    queryKey: ['admin-project-files', code],
    queryFn: () => projectApi.listAttachments(code!),
    enabled: !!code && view === 'files',
    staleTime: 30_000,
  });

  // Files the client uploaded on the original inquiry form live in the inquiry's
  // answers, not as chat attachments. Surface them in the Files tab too.
  const { data: briefInquiry } = useQuery({
    queryKey: ['project-inquiry-files', shell?.inquiryId],
    queryFn: () => manufacturingApi.getInquiry(shell!.inquiryId),
    enabled: !!shell?.inquiryId && view === 'files',
    staleTime: 60_000,
  });

  const allFiles = useMemo(() => {
    const isUrl = (v: unknown): v is string =>
      typeof v === 'string' && (/^data:/.test(v) || /^(https?:)?\/\//.test(v));
    const formFiles: ProjectMessageDto[] = [];
    if (briefInquiry?.values) {
      let i = 0;
      for (const v of Object.values(briefInquiry.values)) {
        for (const one of Array.isArray(v) ? v : [v]) {
          if (isUrl(one)) {
            formFiles.push({
              id: -(++i), // synthetic negative id (not a real message)
              projectId: 0,
              type: 'SYSTEM',
              body: '',
              authorName: 'Inquiry form',
              attachmentUrl: one,
              createdAt: shell?.createdAt || briefInquiry.createdAt,
            } as ProjectMessageDto);
          }
        }
      }
    }
    // Chat attachments first (newest), then original form uploads.
    return [...attachments, ...formFiles];
  }, [attachments, briefInquiry, shell?.createdAt]);

  useEffect(() => {
    if (!code || activeDesignId == null || view !== 'channels' || messagesFetching) return;
    qc.invalidateQueries({ queryKey: ['admin-project-shell', code] });
    qc.invalidateQueries({ queryKey: ['admin-threads', code] });
  }, [messagesFetching, code, activeDesignId, view, qc]);

  const activeDesign = shell?.designs?.find((d) => d.id === activeDesignId) || shell?.designs?.find((d) => !d.system) || shell?.designs?.[0];
  const channelName = activeDesign?.name || shell?.title || 'Chat';

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

  const stageMutation = useMutation({
    mutationFn: ({ stage, status }: { stage: StageKey; status: string }) =>
      projectApi.updateStage(code!, stage, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-project-shell', code] });
      toast.success('Stage updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update stage'),
  });

  const designMutation = useMutation({
    mutationFn: ({ name, imageUrl, description }: { name: string; imageUrl?: string; description?: string }) =>
      projectApi.createDesign(code!, name, imageUrl, description),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['admin-project-shell', code] });
      setActiveDesignId(d.id);
      setView('channels');
      toast.success(`Design "${d.name}" created`);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create design'),
  });

  const renameMutation = useMutation({
    mutationFn: ({ designId, name }: { designId: number; name: string }) =>
      projectApi.renameDesign(code!, designId, name),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['admin-project-shell', code] });
      toast.success(`Renamed to "${d.name}"`);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to rename'),
  });

  const renameProjectMutation = useMutation({
    mutationFn: (title: string) => projectApi.renameProject(code!, title),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['admin-project-shell', code] });
      toast.success(`Project renamed to "${p.title}"`);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to rename project'),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectApi.deleteProject(code!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-projects'] });
      toast.success('Project deleted');
      navigate('/portal-admin/projects');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete project'),
  });

  const postMutation = useMutation({
    mutationFn: (data: { body: string; attachmentUrl?: string; parentMessageId?: number; tempId: number }) =>
      projectApi.postMessage(code!, data.body, {
        attachmentUrl: data.attachmentUrl,
        designId: activeDesignId,
        parentMessageId: data.parentMessageId,
      }),
    onSuccess: (res, vars) => {
      setPendingMessages((xs) => xs.filter((p) => p.id !== vars.tempId));
      qc.setQueryData<ProjectMessageDto[]>(['admin-project-messages', code, activeDesignId], (prev) => {
        if (!prev) return [res];
        if (prev.some((m) => m.id === res.id)) return prev;
        const next = [...prev, res];
        if (vars.parentMessageId) {
          return next.map((m) =>
            m.id === vars.parentMessageId ? { ...m, replyCount: (m.replyCount ?? 0) + 1 } : m,
          );
        }
        return next;
      });
      if (vars.parentMessageId) qc.invalidateQueries({ queryKey: ['admin-threads', code] });
    },
    onError: (_e, vars) => {
      setPendingMessages((xs) => xs.filter((p) => p.id !== vars.tempId));
    },
  });

  const requestPaymentMutation = useMutation({
    mutationFn: ({ amount, label }: { amount: number; label?: string }) =>
      projectApi.requestPayment(code!, amount, { label }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-project-shell', code] });
      qc.invalidateQueries({ queryKey: ['admin-project-messages', code] });
      setPayModal(false);
      setPayAmount('');
      setPayLabel('');
      toast.success('Payment requested — card posted to Announcements');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to request payment'),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: number) => projectApi.deleteMessage(code!, messageId),
    onSuccess: (_r, messageId) => {
      if (openThreadId === messageId) setOpenThreadId(null);
      qc.invalidateQueries({ queryKey: ['admin-project-messages', code] });
      qc.invalidateQueries({ queryKey: ['admin-threads', code] });
      toast.success('Message deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete message'),
  });

  const deleteDesignMutation = useMutation({
    mutationFn: (designId: number) => projectApi.deleteDesign(code!, designId),
    onSuccess: (_r, designId) => {
      if (activeDesignId === designId) setActiveDesignId(undefined);
      qc.invalidateQueries({ queryKey: ['admin-project-messages', code] });
      toast.success('Design channel deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete design'),
  });

  useEffect(() => {
    if (view === 'channels' && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [posts.length, activeDesignId, view]);

  const uploadAndSend = async (text: string, atts: Attachment[], parentMessageId?: number) => {
    if (!code || !activeDesignId) return;
    const tempId = -Date.now();
    const optimistic: DisplayMessage = {
      id: tempId,
      projectId: shell?.id || 0,
      designId: activeDesignId,
      authorType: 'ADMIN',
      authorName: 'Admin Team',
      body: text.trim() || (atts.length ? 'Uploading attachment…' : ''),
      createdAt: new Date().toISOString(),
      pending: true,
      replyCount: 0,
    };
    if (!parentMessageId) setPendingMessages((xs) => [...xs, optimistic]);

    try {
      let attachmentUrl: string | undefined;
      if (atts.length > 0) {
        const f = atts[0].file;
        const file = f || await (async () => {
          const fileRes = await fetch(atts[0].url);
          const blob = await fileRes.blob();
          return new File([blob], atts[0].name, { type: blob.type });
        })();
        attachmentUrl = await mediaApi.upload(file, 'projects');
      }
      const body = text.trim() || (attachmentUrl ? '(attachment)' : '');
      if (!body && !attachmentUrl) {
        setPendingMessages((xs) => xs.filter((p) => p.id !== tempId));
        return;
      }
      skipSseRef.current = Date.now() + 2500;
      postMutation.mutate(
        { body, attachmentUrl, parentMessageId, tempId },
        { onError: () => setPendingMessages((xs) => xs.filter((p) => p.id !== tempId)) },
      );
      if (parentMessageId) {
        setOpenThreadId(parentMessageId);
        projectApi.markThreadRead(code, parentMessageId).catch(() => {});
      }
    } catch (e) {
      setPendingMessages((xs) => xs.filter((p) => p.id !== tempId));
      toast.error(e instanceof Error ? e.message : 'Failed to send');
    }
  };

  const openThread = async (messageId: number) => {
    setOpenThreadId(messageId);
    setMenuOpen(null);
    if (code) {
      projectApi.markThreadRead(code, messageId).catch(() => {});
      if (view === 'threads') qc.invalidateQueries({ queryKey: ['admin-threads', code] });
    }
  };

  const handleDeleteMessage = (post: DisplayMessage) => {
    if (post.pending || post.authorType === 'SYSTEM') return;
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    deleteMessageMutation.mutate(post.id);
  };

  const handleDeleteDesign = (designId: number) => {
    const d = shell?.designs?.find((x) => x.id === designId);
    if (!window.confirm(`Delete design channel "${d?.name}"? All messages in this channel will be removed.`)) return;
    deleteDesignMutation.mutate(designId);
  };

  const copyMessageLink = (messageId: number) => {
    const url = `${window.location.origin}/portal-admin/projects/${code}#msg-${messageId}`;
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
    return (
      <div
        id={!inThread ? `msg-${post.id}` : undefined}
        key={post.id}
        className={`group flex gap-3 items-start -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 transition-all duration-500 relative rounded ${isSystem ? 'opacity-85' : ''}`}
        style={highlighted ? { background: 'rgba(146,70,35,0.15)', boxShadow: 'inset 0 0 0 2px var(--p-primary)' } : undefined}
        onMouseEnter={(e) => { if (!inThread && !highlighted) e.currentTarget.style.background = 'var(--p-surface-container-low)'; }}
        onMouseLeave={(e) => { if (!highlighted) e.currentTarget.style.background = 'transparent'; }}
      >
        <MessageAvatar type={post.authorType} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`font-bold text-[15px] ${isSystem ? 'italic' : ''}`} style={isAdmin ? { color: 'var(--p-secondary)' } : isSystem ? { color: 'var(--p-on-surface-variant)' } : undefined}>
              {post.authorName || (isSystem ? 'System' : 'Client')}
            </span>
            <span className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{formatMsgTime(post.createdAt)}</span>
            {post.pending && (
              <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--p-primary)' }}>
                <Sym name="cloud_upload" className="text-[14px] animate-pulse" /> Sending…
              </span>
            )}
          </div>
          {(() => {
            const pay = parsePaymentCard(post.body);
            if (pay) return <PaymentCard data={pay} />;
            if (post.body && post.body !== '(attachment)') {
              return isSystem
                ? <p className="text-[14px] leading-relaxed mb-2 break-words">{post.body}</p>
                : <RichMessageBody text={post.body} className="mb-2" />;
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
      <AdminShell title="Project" workspace>
        <div className="flex-1 flex items-center justify-center"><Sym name="progress_activity" className="text-[28px] animate-spin" /></div>
      </AdminShell>
    );
  }

  if (isError || !shell) {
    return (
      <AdminShell title="Project" workspace>
        <div className="flex-1 flex items-center justify-center text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>Project not found.</div>
      </AdminShell>
    );
  }

  const workspaceProject = project ?? { ...shell, ...financials, messages: messages ?? [] };
  const currentStage = (shell.currentStage as StageKey) || 'INQUIRY';
  const curIdx = STAGE_INDEX[currentStage] ?? 0;
  const firstQuoteRef = workspaceProject.quotes?.[0]?.reference;

  return (
    <AdminShell title={shell.title || shell.code} workspace>
      <AdminProjectSidebar
        projectCode={shell.code}
        projectTitle={shell.title}
        inquiryId={shell.inquiryId}
        quoteReference={firstQuoteRef}
        designs={shell.designs || []}
        activeDesignId={activeDesignId}
        onSelectDesign={setActiveDesignId}
        onAddDesign={() => setDesignModal(true)}
        onDeleteDesign={handleDeleteDesign}
        onRenameDesign={(id, name) => setRenameTarget({ id, name })}
        onRenameProject={() => setRenameProjectOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        view={view}
        onViewChange={setView}
        threadsUnread={threadsUnread}
      />

      {view === 'threads' ? (
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
          <div className="h-14 px-6 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <div className="flex items-center gap-3">
              <Sym name="list_alt" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
              <h2 className="font-display text-[18px]">Threads</h2>
              {threadsUnread > 0 && <span className="text-[12px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--p-primary)' }}>{threadsUnread} new</span>}
            </div>
            <div className="flex gap-2">
              {(['all', 'unread'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setThreadTab(t)} className="px-3 py-1.5 rounded-full text-[13px] font-semibold capitalize" style={t === threadTab ? { background: 'var(--p-primary)', color: '#fff' } : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="max-w-3xl space-y-3">
              {shownThreads.map((t) => (
                <button
                  key={t.messageId}
                  type="button"
                  onClick={() => jumpToMessage(t.messageId, t.designId)}
                  className="w-full text-left border rounded-xl p-4 transition-all hover:shadow-sm"
                  style={{ background: t.unread ? 'var(--p-surface-container-low)' : 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sym name="tag" className="text-[15px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
                      <span className="font-bold text-[14px] truncate">{t.designName}</span>
                      {t.unread ? (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded text-white shrink-0" style={{ background: 'var(--p-primary)' }}>Unread</span>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase shrink-0" style={{ color: 'var(--p-on-surface-variant)' }}>Seen</span>
                      )}
                    </div>
                    <span className="text-[11px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }}>{formatMsgTime(t.lastReplyAt || t.createdAt)}</span>
                  </div>
                  <p className="text-[14px] mb-2 break-words" style={{ color: 'var(--p-on-surface)' }}>
                    <span className="font-semibold">{t.rootAuthorName || 'User'}:</span> {formatMessagePreview(t.snippet)}
                  </p>
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--p-primary)' }}>
                    <Sym name="forum" className="text-[14px]" />
                    <span className="font-semibold">{t.replyCount} {t.replyCount === 1 ? 'reply' : 'replies'}</span>
                    {t.lastReplyBy && <span style={{ color: 'var(--p-on-surface-variant)' }}>· last by {t.lastReplyBy}</span>}
                  </div>
                </button>
              ))}
              {shownThreads.length === 0 && (
                <div className="text-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
                  <Sym name="forum" className="text-[40px]" />
                  <p className="mt-2 text-[14px]">{threadTab === 'unread' ? 'No unread threads.' : 'No threads yet — post in a design channel to start.'}</p>
                </div>
              )}
            </div>
          </div>
        </main>
      ) : view === 'brief' ? (
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
          <div className="h-14 px-6 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <Sym name="description" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            <h2 className="font-display text-[18px]">Project Brief</h2>
          </div>
          <ProjectBriefPanel project={workspaceProject} />
        </main>
      ) : view === 'invoices' ? (
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
          <div className="h-14 px-6 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <Sym name="receipt_long" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            <h2 className="font-display text-[18px]">Invoices</h2>
          </div>
          <ProjectInvoicesPanel project={workspaceProject} />
        </main>
      ) : view === 'quotation' ? (
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
          <AdminProjectQuotationPanel inquiryId={shell.inquiryId} projectCode={shell.code} />
        </main>
      ) : view === 'files' ? (
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
          <div className="h-14 px-6 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <Sym name="folder_open" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            <h2 className="font-display text-[18px]">Files</h2>
          </div>
          <ProjectFilesPanel files={allFiles} isLoading={attachmentsLoading} />
        </main>
      ) : (
        <>
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative" style={{ background: 'var(--p-surface-container-lowest)' }}>
            <div className="border-b shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
              <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Sym name="tag" className="text-[18px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
                  <h2 className="font-display text-[16px] sm:text-[18px] truncate">{channelName}</h2>
                </div>
                {messagesFetching && (
                  <Sym name="progress_activity" className="text-[18px] animate-spin shrink-0" style={{ color: 'var(--p-primary)' }} />
                )}
                <button
                  type="button"
                  onClick={() => setPayModal(true)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-semibold border flex items-center gap-1.5"
                  style={{ borderColor: 'var(--p-outline)', color: 'var(--p-primary)' }}
                >
                  <Sym name="payments" className="text-[16px]" /> <span className="hidden sm:inline">Request payment</span>
                </button>
              </div>
              <div className="px-4 sm:px-6 pb-3 flex items-center gap-1 overflow-x-auto">
                {STAGES.map((st, i) => {
                  const done = i < curIdx;
                  const cur = i === curIdx;
                  return (
                    <div key={st.key} className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => stageMutation.mutate({ stage: st.key, status: defaultStatusFor(st.key) })} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap" style={cur ? { background: 'var(--p-primary)', color: '#fff' } : done ? { background: 'var(--p-secondary-container)', color: 'var(--p-on-secondary-container)' } : { background: 'var(--p-surface-container)', color: 'var(--p-on-surface-variant)' }}>
                        {done && <Sym name="check" className="text-[12px]" />}{st.label}
                      </button>
                      {i < STAGES.length - 1 && <div className="w-4 h-px shrink-0" style={{ background: 'var(--p-outline-variant)' }} />}
                    </div>
                  );
                })}
                <span className="text-[10px] ml-1 opacity-60" style={{ color: 'var(--p-on-surface-variant)' }}>{statusLabelFor(currentStage, shell.currentStatus)}</span>
              </div>
            </div>

            <div ref={feedRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              <div className="pb-6 border-b mb-6" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <h1 className="font-display text-[24px] sm:text-[28px] mb-2" style={{ color: 'var(--p-primary)' }}># {channelName}</h1>
                {activeDesign?.description && (
                  <div className="mb-3 max-w-xl border rounded-lg p-3 flex gap-2" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
                    <Sym name="description" className="text-[18px] shrink-0 mt-0.5" style={{ color: 'var(--p-primary)' }} />
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--p-on-surface)' }}>{activeDesign.description}</p>
                  </div>
                )}
                <p className="text-[14px] max-w-xl" style={{ color: 'var(--p-on-surface-variant)' }}>
                  Coordinate production, sampling and tech-pack approvals here. Use the formatting toolbar to style messages and threads for every update.
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

            <div className="px-4 sm:px-6 pb-4 pt-2">
              <Composer placeholder={`Message #${channelName.replace(/\s+/g, '-')}`} onSend={(t, a) => uploadAndSend(t, a)} />
            </div>
          </main>

          <aside
            className={`${openThreadId ? 'flex' : 'hidden'} flex-col w-full sm:w-96 lg:w-[340px] border-l shrink-0 absolute lg:relative right-0 top-0 bottom-0 z-20 lg:z-auto thread-panel-bg transition-transform duration-200 ${openThreadId ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ borderColor: 'var(--p-outline-variant)', boxShadow: openThreadId ? '0 0 40px rgba(0,0,0,0.08)' : undefined }}
          >
            <div className="h-14 px-4 border-b flex items-center justify-between shrink-0 backdrop-blur-sm" style={{ borderColor: 'var(--p-outline-variant)', background: 'rgba(255,255,255,0.7)' }}>
              <div>
                <h3 className="font-bold text-[16px] flex items-center gap-2">
                  <Sym name="forum" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
                  Thread
                </h3>
                <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}># {channelName}</p>
              </div>
              <button type="button" onClick={() => setOpenThreadId(null)} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
                <Sym name="close" style={{ color: 'var(--p-on-surface-variant)' }} />
              </button>
            </div>
            {threadRoot && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
                    {renderMessage(threadRoot, true)}
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px" style={{ background: 'var(--p-outline-variant)' }} />
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>
                      {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--p-outline-variant)' }} />
                  </div>
                  {threadReplies.map((r) => (
                    <div key={r.id} className="rounded-lg px-1 -mx-1 hover:bg-black/[0.02] transition-colors">
                      {renderMessage(r, true)}
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t backdrop-blur-sm" style={{ borderColor: 'var(--p-outline-variant)', background: 'rgba(255,255,255,0.85)' }}>
                  <Composer placeholder="Reply in thread…" compact onSend={(t, a) => uploadAndSend(t, a, threadRoot.id)} />
                </div>
              </>
            )}
          </aside>
        </>
      )}

      <AddDesignModal
        open={designModal}
        onClose={() => setDesignModal(false)}
        onCreated={async (name, imageUrl, description) => { await designMutation.mutateAsync({ name, imageUrl, description }); }}
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
        currentName={shell.title?.trim() || 'Untitled project'}
        heading="Rename project"
        placeholder="Project name"
        onClose={() => setRenameProjectOpen(false)}
        onSave={async (title) => { await renameProjectMutation.mutateAsync(title); }}
      />

      {settingsOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => { setSettingsOpen(false); setDeleteConfirm(''); }} />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
              <h3 className="font-display text-[18px]">Project settings</h3>
              <button onClick={() => { setSettingsOpen(false); setDeleteConfirm(''); }} className="p-1 rounded hover:bg-black/5">
                <Sym name="close" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-7">
              {/* General */}
              <section>
                <p className="text-[12px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--p-on-surface-variant)' }}>General</p>
                <div className="flex items-center justify-between gap-3 border rounded-xl px-4 py-3" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold truncate">{shell.title?.trim() || 'Untitled project'}</p>
                    <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{shell.code}</p>
                  </div>
                  <button
                    onClick={() => { setSettingsOpen(false); setRenameProjectOpen(true); }}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border shrink-0"
                    style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}
                  >
                    Rename
                  </button>
                </div>
              </section>

              {/* Notifications */}
              <ProjectNotificationSettings code={shell.code} />

              {/* Danger zone */}
              <section>
                <p className="text-[12px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--p-error)' }}>Danger zone</p>
                <div className="border rounded-xl px-4 py-4" style={{ borderColor: 'var(--p-error)' }}>
                  <p className="text-[14px] font-semibold mb-1">Delete this project</p>
                  <p className="text-[12px] mb-3" style={{ color: 'var(--p-on-surface-variant)' }}>
                    This permanently removes the project, its threads, designs and messages. This cannot be undone.
                    Type <b>{shell.code}</b> to confirm.
                  </p>
                  <input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={shell.code}
                    className="w-full mb-3 px-3 py-2 rounded-lg text-[13px] outline-none border"
                    style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                  />
                  <button
                    disabled={deleteConfirm.trim() !== shell.code || deleteProjectMutation.isPending}
                    onClick={() => deleteProjectMutation.mutate()}
                    className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-40"
                    style={{ background: 'var(--p-error)' }}
                  >
                    {deleteProjectMutation.isPending ? 'Deleting…' : 'Delete project permanently'}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {payModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setPayModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 border rounded-2xl shadow-2xl p-6" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
            <h3 className="font-display text-[18px] mb-1">Request payment</h3>
            <p className="text-[13px] mb-4" style={{ color: 'var(--p-on-surface-variant)' }}>
              A secure pay link is created for <b>{shell.clientEmail || 'the client'}</b> and posted as a card in Announcements. They’ll be notified.
            </p>
            <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Amount (INR)</label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="e.g. 9060"
              className="w-full h-10 px-3 rounded-lg border text-[14px] mb-4 outline-none focus:ring-2 focus:ring-[#924623]/20"
              style={{ borderColor: 'var(--p-outline-variant)' }}
            />
            <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Label (optional)</label>
            <input
              value={payLabel}
              onChange={(e) => setPayLabel(e.target.value)}
              placeholder="e.g. Advance for Linen Wrap Dress"
              className="w-full h-10 px-3 rounded-lg border text-[14px] mb-4 outline-none focus:ring-2 focus:ring-[#924623]/20"
              style={{ borderColor: 'var(--p-outline-variant)' }}
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setPayModal(false)} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--p-outline)' }}>Cancel</button>
              <button
                type="button"
                disabled={requestPaymentMutation.isPending || !(Number(payAmount) > 0)}
                onClick={() => requestPaymentMutation.mutate({ amount: Number(payAmount), label: payLabel.trim() || undefined })}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--p-primary)' }}
              >
                {requestPaymentMutation.isPending ? 'Sending…' : 'Request payment'}
              </button>
            </div>
          </div>
        </>
      )}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </AdminShell>
  );
}

// ---------------------------------------------------------------------------
// Per-project notification preferences. Notifications are currently delivered
// by EMAIL only; these toggles let admins choose which events email the client.
// Persisted in localStorage for now (per project); a backend prefs table can
// replace the storage layer later without changing this UI.
// ---------------------------------------------------------------------------
const NOTIFY_EVENTS: { key: string; label: string; desc: string }[] = [
  { key: 'status_update', label: 'Stage / status updates', desc: 'When the project stage or status changes.' },
  { key: 'new_message', label: 'New announcements', desc: 'When a new message is posted to the client.' },
  { key: 'quote_sent', label: 'Quotation sent', desc: 'When a quotation is shared with the client.' },
  { key: 'invoice_sent', label: 'Invoice / payment request', desc: 'When an invoice or pay link is sent.' },
];

function ProjectNotificationSettings({ code }: { code: string }) {
  const storageKey = `sara-project-notify-${code}`;
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    // default: all on
    return Object.fromEntries(NOTIFY_EVENTS.map((e) => [e.key, true]));
  });

  const toggle = (key: string) => {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <section>
      <p className="text-[12px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Notifications</p>
      <p className="text-[12px] mb-3 flex items-center gap-1.5" style={{ color: 'var(--p-on-surface-variant)' }}>
        <Sym name="mail" className="text-[15px]" /> Delivered by email
      </p>
      <div className="border rounded-xl divide-y" style={{ borderColor: 'var(--p-outline-variant)' }}>
        {NOTIFY_EVENTS.map((ev) => (
          <label key={ev.key} className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <div className="min-w-0">
              <p className="text-[14px] font-medium">{ev.label}</p>
              <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{ev.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(ev.key)}
              className="relative w-11 h-6 rounded-full transition-colors shrink-0"
              style={{ background: prefs[ev.key] ? 'var(--p-primary)' : 'var(--p-surface-container-high)' }}
            >
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: prefs[ev.key] ? '22px' : '2px' }} />
            </button>
          </label>
        ))}
      </div>
    </section>
  );
}
