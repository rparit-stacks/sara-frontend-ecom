import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  AlertCircle,
  History,
  Loader2,
  PlusCircle,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import {
  adminAiChatApi,
  type AiChatTurnResponse,
  type ChatInputType,
} from '@/lib/api';
import { AdminComposer } from './AdminComposer';
import { AdminHistoryPanel } from './AdminHistoryPanel';
import { AdminMessageBubble } from './AdminMessageBubble';
import { AdminOptionControls } from './AdminOptionControls';
import { buildAdminPageContext } from './pageContext';
import type { AdminChatMessage, AdminPendingInput } from './types';
import { makeAdminMsgId } from './types';

const THREAD_KEY = 'adminAiChatThreadId';

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

function pageLabel(pathname: string): string {
  const ctx = buildAdminPageContext(pathname);
  if (ctx.pageType === 'ORDER_DETAIL') return `Order #${ctx.orderId}`;
  if (ctx.pageType === 'PRODUCT_EDIT') return `Product #${ctx.productId}`;
  if (ctx.pageType === 'CMS') return 'CMS';
  if (ctx.pageType === 'USERS') return 'Users';
  if (ctx.pageType === 'DASHBOARD') return 'Dashboard';
  const seg = pathname.replace(/^\/admin-sara\/?/, '').split('/')[0];
  return seg ? seg.replace(/-/g, ' ') : 'Admin';
}

/**
 * Site-wide Admin AI — charcoal ops console with amber accents.
 * Mounted once in App.tsx so conversation survives /admin-sara navigation.
 */
export function AdminAiChatWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [pendingInput, setPendingInput] = useState<AdminPendingInput>({ kind: 'FREE_TEXT' });
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'history'>('chat');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [pulse, setPulse] = useState(false);

  const threadIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasGreetedRef = useRef(false);

  const pathname = location.pathname;
  const contextChip = pageLabel(pathname);

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
  }, [messages, isSending, pendingInput]);

  // Subtle pulse on FAB when landing on entity pages
  useEffect(() => {
    const ctx = buildAdminPageContext(pathname);
    if (ctx.pageType === 'ORDER_DETAIL' || ctx.pageType === 'PRODUCT_EDIT') {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1800);
      return () => clearTimeout(t);
    }
  }, [pathname]);

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
          adminPageContext: buildAdminPageContext(pathname),
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-slate-800 shadow-[0_12px_40px_-10px_rgba(15,23,42,0.25)] ring-1 ring-amber-400/50"
            aria-label="Open Admin AI"
          >
            <span
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white ${
                pulse ? 'animate-pulse' : ''
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>
            <span className="pr-1 text-left leading-tight">
              <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-amber-600">
                Ops AI
              </span>
              <span className="block text-sm font-semibold text-slate-800">Ask console</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed bottom-4 right-4 z-[60] flex h-[min(640px,calc(100vh-2rem))] w-[min(420px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_-16px_rgba(15,23,42,0.28)] ring-1 ring-slate-200"
          >
            {/* Soft amber wash */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-amber-100/80 via-amber-50/40 to-transparent"
              aria-hidden
            />

            {/* Header */}
            <header className="relative z-10 flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/25">
                <Zap className="h-5 w-5" fill="currentColor" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-semibold tracking-tight text-slate-900">
                    Admin Ops AI
                  </h2>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-200">
                    live
                  </span>
                </div>
                <p className="truncate text-[11px] text-slate-400">
                  Context · <span className="capitalize text-amber-700">{contextChip}</span>
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  title="History"
                  onClick={() => setViewMode((v) => (v === 'history' ? 'chat' : 'history'))}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-amber-700"
                >
                  <History className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="New chat"
                  onClick={handleNewChat}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-amber-700"
                >
                  <PlusCircle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Close"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-amber-700"
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
                  className="relative z-10 flex-1 space-y-3.5 overflow-y-auto bg-gradient-to-b from-amber-50/30 to-slate-50/80 px-3.5 py-4"
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
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-500 shadow-sm transition hover:border-amber-300 hover:text-amber-800 disabled:opacity-40"
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
        )}
      </AnimatePresence>
    </>
  );
}
