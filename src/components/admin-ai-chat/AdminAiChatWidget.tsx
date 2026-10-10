import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ADMIN_AI_ASK_EVENT, type AdminAiAskPayload } from './askAdminAi';
import {
  AlertCircle,
  History,
  Loader2,
  Maximize2,
  Minimize2,
  PlusCircle,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import {
  adminAiChatApi,
  type AdminPageBriefDto,
  type AdminPageContextDto,
  type AiChatTurnResponse,
  type ChatInputType,
} from '@/lib/api';
import { AdminComposer } from './AdminComposer';
import { AdminHistoryPanel } from './AdminHistoryPanel';
import { AdminMessageBubble } from './AdminMessageBubble';
import { AdminOptionControls } from './AdminOptionControls';
import { buildAdminPageContext, resolveAdminPageKey } from './pageContext';
import type { AdminChatMessage, AdminPendingInput } from './types';
import { makeAdminMsgId } from './types';
import { cn } from '@/lib/utils';

const THREAD_KEY = 'adminAiChatThreadId';
const EXPANDED_KEY = 'adminAiChatExpanded';

function loadThreadId(): string | null {
  try {
    return localStorage.getItem(THREAD_KEY);
  } catch {
    return null;
  }
}

function saveThreadId(id: string) {
  try {
    localStorage.setItem(THREAD_KEY, id);
  } catch {
    /* ignore */
  }
}

function clearThreadId() {
  try {
    localStorage.removeItem(THREAD_KEY);
  } catch {
    /* ignore */
  }
}

function loadExpanded(): boolean {
  try {
    return localStorage.getItem(EXPANDED_KEY) === '1';
  } catch {
    return false;
  }
}

function saveExpanded(expanded: boolean) {
  try {
    localStorage.setItem(EXPANDED_KEY, expanded ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function greeting(): AdminChatMessage {
  return {
    id: makeAdminMsgId(),
    role: 'assistant',
    text: "Ops console online. I can pull orders, run analytics, manage coupons/users, update CMS, create products & categories — always preview before write. What do you need?",
    createdAt: Date.now(),
    suggestedFollowUps: [
      'Orders today summary',
      'Create a coupon',
      'Add homepage banner',
      'Create a product',
    ],
  };
}

function toPending(inputType: ChatInputType, options: AiChatTurnResponse['options'], allowOther: boolean): AdminPendingInput {
  if (!options?.length || inputType === 'FREE_TEXT') return { kind: 'FREE_TEXT' };
  if (inputType === 'DROPDOWN') return { kind: 'DROPDOWN', options, allowOther };
  if (inputType === 'MULTI_SELECT') return { kind: 'MULTI_SELECT', options, allowOther };
  return { kind: 'BUTTONS', options, allowOther };
}

function pageLabel(
  pathname: string,
  brief: AdminPageBriefDto | null,
  overrideLabel?: string | null,
): string {
  if (overrideLabel?.trim()) return overrideLabel.trim();
  const ctx = buildAdminPageContext(pathname);
  if (ctx.pageType === 'ORDER_DETAIL') return `Order #${ctx.orderId}`;
  if (ctx.pageType === 'PRODUCT_EDIT') return `Product #${ctx.productId}`;
  if (brief?.title) return brief.title;
  if (ctx.pageType === 'CMS') return 'CMS';
  if (ctx.pageType === 'USERS') return 'Users';
  if (ctx.pageType === 'DASHBOARD') return 'Dashboard';
  const seg = pathname
    .replace(/^\/admin-sara\/?/, '')
    .replace(/^\/portal-admin\/?/, '')
    .split('/')[0];
  return seg ? seg.replace(/-/g, ' ') : 'Admin';
}

function mergeContext(
  pathname: string,
  override: Partial<AdminPageContextDto> | null | undefined,
): AdminPageContextDto {
  const base = buildAdminPageContext(pathname);
  if (!override) return base;
  return {
    ...base,
    ...override,
    route: override.route ?? base.route ?? pathname,
    pageKey: override.pageKey ?? base.pageKey,
  };
}

/**
 * Site-wide Admin AI — charcoal/amber ops console.
 * Mounted once in App.tsx so conversation survives /admin-sara navigation.
 */
export function AdminAiChatWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(loadExpanded);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [pendingInput, setPendingInput] = useState<AdminPendingInput>({ kind: 'FREE_TEXT' });
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'history'>('chat');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [contextOverride, setContextOverride] = useState<Partial<AdminPageContextDto> | null>(null);
  const [contextLabel, setContextLabel] = useState<string | null>(null);
  const contextOverrideRef = useRef<Partial<AdminPageContextDto> | null>(null);
  contextOverrideRef.current = contextOverride;
  const [pulse, setPulse] = useState(false);

  const threadIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasGreetedRef = useRef(false);
  const briefCacheRef = useRef<Map<string, AdminPageBriefDto>>(new Map());
  const [pageBrief, setPageBrief] = useState<AdminPageBriefDto | null>(null);

  const pathname = location.pathname;
  const pageKey = resolveAdminPageKey(pathname);
  const contextChip = pageLabel(pathname, pageBrief, contextLabel);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      saveExpanded(next);
      return next;
    });
  }, []);

  const loadThreadHistory = useCallback((threadIdToLoad: string) => {
    setIsHistoryLoading(true);
    return adminAiChatApi
      .getHistory(threadIdToLoad)
      .then((history) => {
        hasGreetedRef.current = history.messages.length > 0;
        setMessages(
          history.messages.map((m) => ({
            id: makeAdminMsgId(),
            role: m.role === 'USER' ? 'user' : 'assistant',
            text: m.content,
            createdAt: new Date(m.createdAt).getTime(),
            visualCards: m.metadata?.visualCards ?? undefined,
            table: m.metadata?.table ?? undefined,
          }))
        );
        setPendingInput({ kind: 'FREE_TEXT' });
      })
      .catch(() => {
        clearThreadId();
        threadIdRef.current = null;
      })
      .finally(() => setIsHistoryLoading(false));
  }, []);

  useEffect(() => {
    const existing = loadThreadId();
    threadIdRef.current = existing;
    if (existing) loadThreadHistory(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOpen && !hasGreetedRef.current && !isHistoryLoading && messages.length === 0) {
      hasGreetedRef.current = true;
      setMessages([greeting()]);
    }
  }, [isOpen, messages.length, isHistoryLoading]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending, pendingInput, isExpanded]);

  useEffect(() => {
    if (!isOpen || !isExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
        saveExpanded(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isExpanded]);

  // Subtle pulse on FAB when landing on entity pages
  useEffect(() => {
    const ctx = buildAdminPageContext(pathname);
    if (ctx.pageType === 'ORDER_DETAIL' || ctx.pageType === 'PRODUCT_EDIT') {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1800);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  // Fetch page brief only when Ops AI is open (or page key changes while open). Cache by key.
  useEffect(() => {
    if (!isOpen) return;
    const cached = briefCacheRef.current.get(pageKey);
    if (cached) {
      setPageBrief(cached);
      return;
    }
    let cancelled = false;
    adminAiChatApi
      .getPageBrief({ key: pageKey, route: pathname })
      .then((brief) => {
        if (cancelled) return;
        briefCacheRef.current.set(pageKey, brief);
        setPageBrief(brief);
      })
      .catch(() => {
        if (!cancelled) setPageBrief(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, pageKey, pathname]);

  const applyResponse = useCallback((response: AiChatTurnResponse) => {
    threadIdRef.current = response.threadId;
    saveThreadId(response.threadId);

    const assistantMessage: AdminChatMessage = {
      id: makeAdminMsgId(),
      role: 'assistant',
      text: response.replyText,
      createdAt: Date.now(),
      visualCards: response.visualCards,
      table: response.table,
      suggestedFollowUps: response.suggestedFollowUps,
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setPendingInput(toPending(response.inputType, response.options, response.allowOther));
    setLoadError(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string, imageUrls?: string[]) => {
      const trimmed = text.trim();
      if ((!trimmed && !imageUrls?.length) || isSending) return;

      setPendingInput({ kind: 'FREE_TEXT' });
      setIsSending(true);
      setLoadError(null);

      const userMsg: AdminChatMessage = {
        id: makeAdminMsgId(),
        role: 'user',
        text: trimmed,
        createdAt: Date.now(),
        imageUrls,
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const response = await adminAiChatApi.sendMessage({
          threadId: threadIdRef.current,
          userMessage: trimmed,
          uploadedImageUrls: imageUrls?.length ? imageUrls : null,
          adminPageContext: mergeContext(pathname, contextOverrideRef.current),
        });
        applyResponse(response);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Request failed.';
        setLoadError(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: makeAdminMsgId(),
            role: 'system',
            text: `Error: ${msg}`,
            createdAt: Date.now(),
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [applyResponse, isSending, pathname]
  );

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  // One-click prompts from entity buttons (see askAdminAi / AskAdminAiButton).
  useEffect(() => {
    const onAsk = (e: Event) => {
      const raw = (e as CustomEvent<string | AdminAiAskPayload>).detail;
      const payload: AdminAiAskPayload =
        typeof raw === 'string' ? { prompt: raw } : raw || { prompt: '' };
      const prompt = payload.prompt?.trim();
      if (!prompt) return;
      if (payload.context) {
        setContextOverride(payload.context);
        contextOverrideRef.current = payload.context;
      }
      if (payload.label) setContextLabel(payload.label);
      setIsOpen(true);
      setViewMode('chat');
      window.setTimeout(() => sendMessageRef.current(prompt), 150);
    };
    window.addEventListener(ADMIN_AI_ASK_EVENT, onAsk);
    return () => window.removeEventListener(ADMIN_AI_ASK_EVENT, onAsk);
  }, []);

  const handleNewChat = async () => {
    const current = threadIdRef.current;
    if (current) {
      try {
        await adminAiChatApi.deleteThread(current);
      } catch {
        /* soft-fail — still reset UI */
      }
    }
    clearThreadId();
    threadIdRef.current = null;
    hasGreetedRef.current = true;
    setMessages([greeting()]);
    setPendingInput({ kind: 'FREE_TEXT' });
    setViewMode('chat');
    setLoadError(null);
  };

  const handleSelectSession = (threadId: string) => {
    threadIdRef.current = threadId;
    saveThreadId(threadId);
    setViewMode('chat');
    loadThreadHistory(threadId);
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const followUps =
    pendingInput.kind === 'FREE_TEXT' && !isSending
      ? lastAssistant?.suggestedFollowUps ?? []
      : [];

  const headerBtn =
    'rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-800';

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 text-slate-800 shadow-[0_12px_40px_-10px_rgba(15,23,42,0.25)] ring-1 ring-amber-400/45"
            aria-label="Open Admin AI"
          >
            <span
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white',
                pulse && 'animate-pulse',
              )}
            >
              <Terminal className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>
            <span className="pr-0.5 text-left leading-tight">
              <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-amber-600">
                Ops AI
              </span>
              <span className="block text-sm font-semibold text-slate-800">Ask console</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded backdrop */}
      <AnimatePresence>
        {isOpen && isExpanded && (
          <motion.button
            type="button"
            aria-label="Collapse Ops AI"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[59] bg-slate-900/25 backdrop-blur-[1px]"
            onClick={() => {
              setIsExpanded(false);
              saveExpanded(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Panel — expanded uses a flex center shell so it stays truly viewport-centered */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="ops-ai-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'fixed z-[60]',
              isExpanded
                ? 'inset-0 flex items-center justify-center p-3 sm:p-6 pointer-events-none'
                : 'bottom-4 right-4 pointer-events-none',
            )}
          >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'pointer-events-auto flex flex-col overflow-hidden bg-white ring-1 ring-slate-200/90',
              isExpanded
                ? 'h-[min(85vh,820px)] w-full max-w-[860px] rounded-[18px] shadow-[0_32px_90px_-20px_rgba(15,23,42,0.35)]'
                : 'h-[min(640px,calc(100vh-2rem))] w-[min(420px,calc(100vw-1.5rem))] rounded-2xl shadow-[0_24px_80px_-16px_rgba(15,23,42,0.28)]',
            )}
          >
            {/* Soft amber wash */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-100/70 via-amber-50/30 to-transparent"
              aria-hidden
            />
            {/* Copper accent line */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-600/80 via-amber-400 to-amber-600/40"
              aria-hidden
            />

            {/* Header */}
            <header className="relative z-10 flex items-center gap-3 border-b border-slate-100/90 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/20">
                <Zap className="h-5 w-5" fill="currentColor" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-semibold tracking-tight text-slate-900">
                    Ops AI
                  </h2>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-200/80">
                    live
                  </span>
                </div>
                <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                  <span className="shrink-0 text-[11px] text-slate-400">Context</span>
                  <span
                    className="truncate rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium capitalize text-amber-800 ring-1 ring-amber-200/70"
                    title={pageBrief?.purpose || contextChip}
                  >
                    {contextChip}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                  aria-label={isExpanded ? 'Collapse Ops AI' : 'Expand Ops AI'}
                  onClick={toggleExpanded}
                  className={headerBtn}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  title="History"
                  onClick={() => setViewMode((v) => (v === 'history' ? 'chat' : 'history'))}
                  className={cn(headerBtn, viewMode === 'history' && 'bg-amber-50 text-amber-800')}
                >
                  <History className="h-4 w-4" />
                </button>
                <button type="button" title="New chat" onClick={handleNewChat} className={headerBtn}>
                  <PlusCircle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Close"
                  onClick={() => setIsOpen(false)}
                  className={headerBtn}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {viewMode === 'history' ? (
              <AdminHistoryPanel
                activeThreadId={threadIdRef.current}
                onSelect={handleSelectSession}
                onBack={() => setViewMode('chat')}
              />
            ) : (
              <>
                <div
                  ref={scrollRef}
                  className={cn(
                    'relative z-10 flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-amber-50/25 to-slate-50/70',
                    isExpanded ? 'px-5 py-5' : 'px-3.5 py-4',
                  )}
                >
                  {isHistoryLoading && (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-500/60" />
                    </div>
                  )}
                  {!isHistoryLoading &&
                    messages.map((m) =>
                      m.role === 'system' ? (
                        <div
                          key={m.id}
                          className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100"
                        >
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {m.text}
                        </div>
                      ) : (
                        <AdminMessageBubble key={m.id} message={m} />
                      )
                    )}

                  {isSending && (
                    <div className="flex items-center gap-2 pl-1 text-xs text-slate-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                      Running tools…
                    </div>
                  )}

                  {pendingInput.kind !== 'FREE_TEXT' && (
                    <AdminOptionControls
                      pending={pendingInput}
                      disabled={isSending}
                      onSelect={(label, value) => sendMessage(value || label)}
                      onOther={() => setPendingInput({ kind: 'FREE_TEXT' })}
                    />
                  )}

                  {followUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {followUps.slice(0, 4).map((q) => (
                        <button
                          key={q}
                          type="button"
                          disabled={isSending}
                          onClick={() => sendMessage(q)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-500 shadow-sm transition hover:border-amber-300 hover:text-amber-800 disabled:opacity-40"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {loadError && (
                  <p className="border-t border-red-100 bg-red-50 px-3 py-1.5 text-[11px] text-red-700">
                    {loadError}
                  </p>
                )}

                <AdminComposer
                  onSend={sendMessage}
                  disabled={isSending || pendingInput.kind !== 'FREE_TEXT'}
                  placeholder={
                    pendingInput.kind !== 'FREE_TEXT'
                      ? 'Pick an option above…'
                      : `Ask about ${contextChip}…`
                  }
                />
              </>
            )}
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
