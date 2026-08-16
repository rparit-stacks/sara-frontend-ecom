import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Sparkles, RotateCcw, AlertCircle, MoreVertical, PlusCircle, Eraser, History, Maximize2, Minimize2, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { aiChatApi, type AiChatTurnResponse, type PageContextDto } from '@/lib/api';
import { useChatPageContext } from '@/context/ChatPageContext';
import { MessageBubble } from './MessageBubble';
import { OptionChips } from './OptionChips';
import { Composer } from './Composer';
import { TypingDots } from './TypingDots';
import { InlineAuthForm } from './InlineAuthForm';
import { ProactivePopup } from './ProactivePopup';
import { SessionHistoryPanel } from './SessionHistoryPanel';
import type { ChatMessage, PendingInput, AuthStage } from './types';
import { AI_CHAT_ASK_EVENT, type AiChatAskDetail } from '@/lib/aiChatBridge';

const THREAD_ID_STORAGE_PREFIX = 'aiChatThreadId';

/**
 * The "active thread" pointer is scoped by login identity (guest vs. a specific account) —
 * a single fixed key would let a stale authenticated threadId get reused as if it were a
 * fresh guest thread right after logout, or let one account's active thread leak into a
 * different account's session on the same browser. Each identity gets its own remembered
 * "last active session" pointer; switching identity (login/logout/different account) always
 * starts from that identity's own pointer, never another's.
 */
function activeThreadStorageKey(): string {
  const email = localStorage.getItem('authEmail');
  return email ? `${THREAD_ID_STORAGE_PREFIX}:${email.toLowerCase()}` : `${THREAD_ID_STORAGE_PREFIX}:guest`;
}

function loadThreadId(): string | null {
  try {
    return localStorage.getItem(activeThreadStorageKey());
  } catch {
    return null;
  }
}

function saveThreadId(threadId: string) {
  try {
    localStorage.setItem(activeThreadStorageKey(), threadId);
  } catch {
    // Storage unavailable (private browsing, quota) — thread just won't persist across visits.
  }
}

function clearActiveThreadId() {
  try {
    localStorage.removeItem(activeThreadStorageKey());
  } catch {
    // ignore
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const SYNC_CHANNEL_NAME = 'ai-chat-sync';

type SyncMessage =
  | { type: 'NEW_MESSAGES'; threadId: string; messages: ChatMessage[]; tabId: string }
  | { type: 'THREAD_CHANGED'; threadId: string; tabId: string };

/**
 * Keeps every same-origin tab's chat panel in sync in real time — without this, each tab held
 * fully independent React state and only ever saw its OWN sendMessage results, so a card/reply
 * produced in Tab A never appeared in Tab B (not even after Tab B's history reload, since two
 * tabs on the same threadId would otherwise silently diverge). BroadcastChannel needs no server
 * change; it's a same-origin-only browser API, so no other site can listen in.
 */
function useChatSyncChannel() {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef(makeId());

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    channelRef.current = channel;
    return () => channel.close();
  }, []);

  const broadcastNewMessages = useCallback((threadId: string, messages: ChatMessage[]) => {
    channelRef.current?.postMessage({
      type: 'NEW_MESSAGES',
      threadId,
      messages,
      tabId: tabIdRef.current,
    } satisfies SyncMessage);
  }, []);

  const broadcastThreadChanged = useCallback((threadId: string) => {
    channelRef.current?.postMessage({
      type: 'THREAD_CHANGED',
      threadId,
      tabId: tabIdRef.current,
    } satisfies SyncMessage);
  }, []);

  const subscribe = useCallback((onMessage: (msg: SyncMessage) => void) => {
    const channel = channelRef.current;
    if (!channel) return () => {};
    const handler = (event: MessageEvent<SyncMessage>) => {
      if (event.data.tabId === tabIdRef.current) return; // ignore our own broadcasts
      onMessage(event.data);
    };
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
  }, []);

  return { broadcastNewMessages, broadcastThreadChanged, subscribe };
}

function greetingMessage(): ChatMessage {
  return {
    id: makeId(),
    role: 'assistant',
    text: "Hi! I'm Studio Sara's assistant. Ask me about products, fabrics, your orders, or anything else — I'm happy to help.",
    createdAt: Date.now(),
  };
}

/**
 * Site-wide floating AI chat widget (replaces FloatingWhatsApp).
 * Closed = pill button.
 * Compact = corner card (current look).
 * Expanded = large centered modal with history sidebar (Razorpay-style).
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingInput, setPendingInput] = useState<PendingInput>({ kind: 'FREE_TEXT' });
  const [isSending, setIsSending] = useState(false);
  const [authStage, setAuthStage] = useState<AuthStage>({ stage: 'none' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingRetryText, setPendingRetryText] = useState<string | null>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'history'>('chat');
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('authToken'));
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const threadIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasGreetedRef = useRef(false);
  const pendingAskRef = useRef<{ message: string; displayText?: string } | null>(null);
  const sendMessageRef = useRef<
    ((text: string, imageUrls?: string[], pageContext?: PageContextDto | null, displayText?: string) => Promise<void>) | null
  >(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const getPageContext = useChatPageContext();
  const { broadcastNewMessages, broadcastThreadChanged, subscribe } = useChatSyncChannel();

  // Keep login flag in sync so the history sidebar appears after in-chat OTP / logout.
  useEffect(() => {
    const sync = () => setIsLoggedIn(!!localStorage.getItem('authToken'));
    window.addEventListener('storage', sync);
    window.addEventListener('auth:loggedOut', sync);
    window.addEventListener('auth:loggedIn', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('auth:loggedOut', sync);
      window.removeEventListener('auth:loggedIn', sync);
    };
  }, []);

  // Cart / product pages can open the widget with a ready-made prompt via openAiChatAsk().
  useEffect(() => {
    const onAsk = (event: Event) => {
      const detail = (event as CustomEvent<AiChatAskDetail>).detail;
      const message = detail?.message?.trim();
      if (!message) return;
      pendingAskRef.current = {
        message,
        displayText: detail.displayText?.trim() || undefined,
      };
      setViewMode('chat');
      setIsExpanded(detail.expand !== false);
      setIsOpen(true);
    };
    window.addEventListener(AI_CHAT_ASK_EVENT, onAsk);
    return () => window.removeEventListener(AI_CHAT_ASK_EVENT, onAsk);
  }, []);

  // Lock page scroll while the expanded modal is open.
  useEffect(() => {
    if (!isOpen || !isExpanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, isExpanded]);

  /** Fetches and renders a thread's saved history — used both on mount (restoring the last
   *  active session) and when switching to a different session from the history list. */
  const loadThreadHistory = useCallback((threadIdToLoad: string) => {
    setIsHistoryLoading(true);
    return aiChatApi
      .getHistory(threadIdToLoad)
      .then((history) => {
        hasGreetedRef.current = history.messages.length > 0; // history exists — skip the canned greeting
        setMessages(
          history.messages.map((m) => ({
            id: makeId(),
            role: m.role === 'USER' ? 'user' : 'assistant',
            text: m.content,
            createdAt: new Date(m.createdAt).getTime(),
            visualCards: m.metadata?.visualCards ?? undefined,
            table: m.metadata?.table ?? undefined,
            portalRedirect: m.metadata?.portalRedirect ?? undefined,
          }))
        );
      })
      .catch((err) => {
        console.error('[AiChat] getHistory failed', err);
      })
      .finally(() => setIsHistoryLoading(false));
  }, []);

  useEffect(() => {
    const existingThreadId = loadThreadId();
    threadIdRef.current = existingThreadId;
    if (!existingThreadId) return;
    loadThreadHistory(existingThreadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOpen && !hasGreetedRef.current && !isHistoryLoading && messages.length === 0) {
      hasGreetedRef.current = true;
      setMessages([greetingMessage()]);
    }
  }, [isOpen, messages.length, isHistoryLoading]);

  // Cross-tab sync: another tab on the SAME thread just sent/received messages — mirror them
  // here instead of staying stale until this tab happens to reload.
  useEffect(() => {
    return subscribe((msg) => {
      if (msg.threadId !== threadIdRef.current) return;
      if (msg.type === 'NEW_MESSAGES') {
        hasGreetedRef.current = true;
        setMessages((prev) => [...prev, ...msg.messages]);
      } else if (msg.type === 'THREAD_CHANGED') {
        // Guest→login attach happened in another tab — reload history for continuity.
        threadIdRef.current = msg.threadId;
      }
    });
  }, [subscribe]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending, authStage]);

  const handleMessageScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollToBottom(distanceFromBottom > 100);
  };

  const scrollToLatest = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
    setShowScrollToBottom(false);
  };

  const applyResponse = useCallback((response: AiChatTurnResponse): ChatMessage => {
    const previousThreadId = threadIdRef.current;
    threadIdRef.current = response.threadId;
    saveThreadId(response.threadId);
    if (previousThreadId && previousThreadId !== response.threadId) {
      broadcastThreadChanged(response.threadId);
    }

    const assistantMessage: ChatMessage = {
      id: makeId(),
      role: 'assistant',
      text: response.replyText,
      createdAt: Date.now(),
      visualCards: response.visualCards,
      table: response.table,
      suggestedFollowUps: response.suggestedFollowUps,
      portalRedirect: response.portalRedirect,
      justLinkedToAccount: response.justLinkedToAccount,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    if (response.authPrompt) {
      setAuthStage({ stage: 'awaiting-email', reason: response.authPrompt.message });
      setPendingInput({ kind: 'FREE_TEXT' });
      return assistantMessage;
    }

    setAuthStage({ stage: 'none' });
    if (response.inputType === 'FREE_TEXT') {
      setPendingInput({ kind: 'FREE_TEXT' });
    } else {
      setPendingInput({
        kind: response.inputType,
        options: response.options,
        allowOther: response.allowOther,
      });
    }
    return assistantMessage;
  }, [broadcastThreadChanged]);

  const sendMessage = useCallback(
    async (
      text: string,
      imageUrls?: string[],
      pageContext?: PageContextDto | null,
      displayText?: string
    ) => {
      const hasImages = imageUrls && imageUrls.length > 0;
      if ((!text.trim() && !hasImages) || isSending) return;

      setLoadError(null);
      const userMessage: ChatMessage = {
        id: makeId(),
        role: 'user',
        text,
        displayText: displayText?.trim() || undefined,
        imageUrls,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);
      setPendingInput({ kind: 'FREE_TEXT' }); // hide chips while waiting

      try {
        const baseContext = pageContext ?? getPageContext() ?? { pageType: 'OTHER' as const };
        const response = await aiChatApi.sendMessage({
          threadId: threadIdRef.current,
          userMessage: text,
          uploadedImageUrls: imageUrls,
          pageContext: {
            ...baseContext,
            clientType: 'WEB',
            siteOrigin: typeof window !== 'undefined' ? window.location.origin : baseContext.siteOrigin,
          },
        });
        const assistantMessage = applyResponse(response);
        // Other tabs on this same thread only ever see their OWN sendMessage results — mirror
        // this exchange to them in real time instead of leaving them stale until a reload.
        broadcastNewMessages(response.threadId, [userMessage, assistantMessage]);
        setPendingRetryText(null);
      } catch (err) {
        console.error('[AiChat] sendMessage failed', err);
        setLoadError("Sorry, I couldn't send that. Please try again.");
        setPendingRetryText(text);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, applyResponse, getPageContext, broadcastNewMessages]
  );

  sendMessageRef.current = sendMessage;

  // Flush a queued ask (from Cart "Breakdown with AI", etc.) once the panel is ready.
  useEffect(() => {
    if (!isOpen || isSending || isHistoryLoading || authStage.stage !== 'none') return;
    const pending = pendingAskRef.current;
    if (!pending) return;
    pendingAskRef.current = null;
    const timer = window.setTimeout(() => {
      void sendMessageRef.current?.(pending.message, undefined, undefined, pending.displayText);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [isOpen, isSending, isHistoryLoading, authStage.stage]);

  const retryLastMessage = () => {
    if (pendingRetryText) {
      // Remove the failed user message duplicate isn't needed since it was already appended;
      // just resend the same text as a fresh turn.
      const text = pendingRetryText;
      setPendingRetryText(null);
      setLoadError(null);
      sendMessage(text);
    }
  };

  const handleOptionSelect = (label: string) => {
    sendMessage(label);
  };

  const handleOther = () => {
    setPendingInput({ kind: 'FREE_TEXT' });
  };

  const handleRequestOtp = async (email: string) => {
    setAuthError(null);
    setAuthStage({ stage: 'verifying' });
    try {
      await aiChatApi.requestOtp(email, threadIdRef.current);
      setAuthStage({ stage: 'awaiting-otp', email, reason: '' });
    } catch (err) {
      console.error('[AiChat] requestOtp failed', err);
      setAuthError("Couldn't send the code. Please check the email and try again.");
      setAuthStage({ stage: 'awaiting-email', reason: '' });
    }
  };

  const handleVerifyOtp = async (otp: string, email: string) => {
    setAuthError(null);
    setAuthStage({ stage: 'verifying' });
    try {
      const result = await aiChatApi.verifyOtp(email, otp, threadIdRef.current);
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('authEmail', result.email);
      setIsLoggedIn(true);
      threadIdRef.current = result.threadId;
      saveThreadId(result.threadId);
      setAuthStage({ stage: 'none' });
      // Continue the conversation now that we're authenticated — nudge the assistant forward.
      await sendMessage('I just logged in — please continue with what I asked.');
    } catch (err) {
      console.error('[AiChat] verifyOtp failed', err);
      setAuthError('That code looks wrong or expired. Please try again.');
      setAuthStage({ stage: 'awaiting-otp', email, reason: '' });
    }
  };

  const currentAuthEmail = authStage.stage === 'awaiting-otp' ? authStage.email : '';

  // Follow-up suggestions only make sense right after the assistant's OWN latest reply — once
  // the user sends anything else, those suggestions are stale and shouldn't linger.
  const lastMessage = messages[messages.length - 1];
  const lastAssistantFollowUps =
    lastMessage?.role === 'assistant' ? lastMessage.suggestedFollowUps ?? [] : [];

  const SOFT_BYE_MESSAGES = [
    "Thanks for stopping by! I'll be right here if you need anything else. 👋",
    "Glad I could help — come back anytime, I'm always around! 😊",
    "Take care! Reopen this chat whenever you need me. ✨",
  ];

  /** A friendly closing note — only after a real exchange (not on an empty/just-greeted panel),
   *  and only once per open (won't stack up on repeated close/reopen with nothing new said). */
  const handleClose = () => {
    const hadRealConversation = messages.some((m) => m.role === 'user');
    const alreadySaidBye = lastMessage?.role === 'assistant' && lastMessage.id.startsWith('bye-');
    if (viewMode === 'chat' && hadRealConversation && !alreadySaidBye && !isSending) {
      const bye = SOFT_BYE_MESSAGES[Math.floor(Math.random() * SOFT_BYE_MESSAGES.length)];
      setMessages((prev) => [
        ...prev,
        { id: `bye-${makeId()}`, role: 'assistant', text: bye, createdAt: Date.now() },
      ]);
    }
    setViewMode('chat');
    setIsExpanded(false);
    setIsOpen(false);
  };

  /** "Clear": only clears the VIEW — inserts a divider and scrolls to it. Nothing is deleted;
   *  scrolling back up still shows every earlier message, same as clearing a terminal screen. */
  const handleClear = () => {
    setMessages((prev) => [
      ...prev,
      { id: makeId(), role: 'divider', text: 'Conversation cleared', createdAt: Date.now() },
    ]);
  };

  /** Clears local widget state back to blank — used both by "New chat" (which also deletes
   *  the old thread server-side) and by the logout listener (which must NOT delete anything;
   *  the session stays saved under the account for next time they log back in). */
  const resetToBlankState = () => {
    threadIdRef.current = null;
    clearActiveThreadId();
    hasGreetedRef.current = false;
    setMessages([]);
    setPendingInput({ kind: 'FREE_TEXT' });
    setAuthStage({ stage: 'none' });
    setLoadError(null);
  };

  /** "New chat": permanently deletes the current thread server-side and starts a fresh one —
   *  unlike Clear, this is destructive and cannot be scrolled back to. */
  const handleNewChat = async () => {
    const oldThreadId = threadIdRef.current;
    resetToBlankState();
    if (oldThreadId) {
      aiChatApi.deleteThread(oldThreadId).catch((err) => {
        console.error('[AiChat] deleteThread failed', err);
      });
    }
  };

  // On logout, the active-thread pointer must switch from this account's identity back to a
  // fresh guest one — otherwise the account's threadId would linger and either get reused as
  // if it were a guest thread, or (worse) leak into whatever guest/account logs in next on the
  // same browser. The session itself is untouched server-side; only the LOCAL pointer resets.
  useEffect(() => {
    const handleLoggedOut = () => {
      resetToBlankState();
      setIsLoggedIn(false);
    };
    window.addEventListener('auth:loggedOut', handleLoggedOut);
    return () => window.removeEventListener('auth:loggedOut', handleLoggedOut);
  }, []);

  /** Switches the active session to a different one of the customer's own saved chats. */
  const handleSelectSession = (selectedThreadId: string) => {
    threadIdRef.current = selectedThreadId;
    saveThreadId(selectedThreadId);
    setPendingInput({ kind: 'FREE_TEXT' });
    setAuthStage({ stage: 'none' });
    setLoadError(null);
    setViewMode('chat');
    loadThreadHistory(selectedThreadId);
  };

  const showSidebarHistory = isExpanded && isLoggedIn;

  const chatBody = (
    <>
      <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleMessageScroll}
        className="h-full space-y-4 overflow-y-auto px-4 py-4"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {authStage.stage !== 'none' && (
          <InlineAuthForm
            authStage={authStage}
            onSubmitEmail={handleRequestOtp}
            onSubmitOtp={(otp) => handleVerifyOtp(otp, currentAuthEmail)}
            onResend={() => currentAuthEmail && handleRequestOtp(currentAuthEmail)}
            error={authError}
          />
        )}

        {isSending && (
          <div className="flex items-center gap-2.5 pl-9">
            <TypingDots />
          </div>
        )}

        {!isSending &&
          authStage.stage === 'none' &&
          (pendingInput.kind === 'BUTTONS' ||
            pendingInput.kind === 'DROPDOWN' ||
            pendingInput.kind === 'MULTI_SELECT') && (
            <OptionChips
              pending={pendingInput}
              onSelect={handleOptionSelect}
              onOther={handleOther}
            />
          )}

        {!isSending &&
          authStage.stage === 'none' &&
          pendingInput.kind === 'FREE_TEXT' &&
          lastAssistantFollowUps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex flex-wrap gap-2 pl-9"
            >
              {lastAssistantFollowUps.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  className="rounded-full bg-secondary/60 px-3.5 py-1.5 text-xs font-medium text-foreground/80 shadow-soft ring-1 ring-black/[0.06] transition-all hover:-translate-y-0.5 hover:bg-secondary"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}

        {loadError && (
          <div className="ml-9 flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-md bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{loadError}</span>
            <button
              onClick={retryLastMessage}
              className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/15 px-2 py-1 font-medium hover:bg-destructive/25"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showScrollToBottom && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            onClick={scrollToLatest}
            className="absolute bottom-3 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground shadow-lg ring-1 ring-black/10 transition-colors hover:bg-secondary"
            aria-label="Scroll to latest message"
            title="Latest message"
          >
            <ArrowDown className="h-4.5 w-4.5" />
          </motion.button>
        )}
      </AnimatePresence>
      </div>

      {authStage.stage === 'none' && pendingInput.kind === 'FREE_TEXT' && (
        <Composer onSend={sendMessage} disabled={isSending} autoFocus />
      )}
    </>
  );

  return (
    <>
      <ProactivePopup
        chatIsOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        onVisibilityChange={setIsHighlighted}
      />

      {/* Dim backdrop — never closes chat; only the X does (better reading focus). */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[65] ${
              isExpanded ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-black/20 sm:bg-transparent sm:pointer-events-none'
            }`}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key={isExpanded ? 'panel-expanded' : 'panel-compact'}
            role="dialog"
            aria-modal="true"
            aria-label="Studio Sara chat"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={
              isExpanded
                ? 'fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 pointer-events-none'
                : 'fixed inset-0 z-[70] flex flex-col pointer-events-none sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[680px] sm:w-[440px]'
            }
          >
            <div
              className={
                isExpanded
                  ? 'pointer-events-auto flex h-[min(860px,92vh)] w-full max-w-[980px] flex-col overflow-hidden rounded-2xl bg-background shadow-2xl ring-1 ring-black/[0.08] sm:rounded-3xl'
                  : 'pointer-events-auto flex h-full w-full flex-col overflow-hidden bg-background sm:rounded-3xl sm:shadow-2xl sm:ring-1 sm:ring-black/[0.06]'
              }
            >
              {/* Header */}
              <div
                className={`flex shrink-0 items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary to-primary/85 px-4 py-3.5 text-primary-foreground ${
                  isExpanded ? '' : 'sm:rounded-t-3xl'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                    <Sparkles className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">Studio Sara</p>
                    <p className="text-[11px] leading-tight text-primary-foreground/80">
                      {isSending ? 'Typing…' : 'Online now'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded((v) => !v);
                      setViewMode('chat');
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15"
                    aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15"
                        aria-label="Chat options"
                      >
                        <MoreVertical className="h-4.5 w-4.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[80] w-48">
                      <DropdownMenuItem onClick={handleNewChat} className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        New chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleClear} className="gap-2">
                        <Eraser className="h-4 w-4" />
                        Clear screen
                      </DropdownMenuItem>
                      {isLoggedIn && (
                        <DropdownMenuItem onClick={() => setViewMode('history')} className="gap-2">
                          <History className="h-4 w-4" />
                          Chat history
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          setIsExpanded((v) => !v);
                          setViewMode('chat');
                        }}
                        className="gap-2"
                      >
                        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <button
                    onClick={handleClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15"
                    aria-label="Close chat"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1">
                {showSidebarHistory && (
                  <div className="hidden h-full md:block">
                    <SessionHistoryPanel
                      variant="sidebar"
                      activeThreadId={threadIdRef.current}
                      onSelect={handleSelectSession}
                    />
                  </div>
                )}

                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  {viewMode === 'history' ? (
                    <>
                      <div
                        className={`flex min-h-0 flex-1 flex-col ${showSidebarHistory ? 'md:hidden' : ''}`}
                      >
                        <SessionHistoryPanel
                          activeThreadId={threadIdRef.current}
                          onSelect={handleSelectSession}
                          onBack={() => setViewMode('chat')}
                        />
                      </div>
                      {showSidebarHistory && (
                        <div className="hidden min-h-0 flex-1 flex-col md:flex">{chatBody}</div>
                      )}
                    </>
                  ) : (
                    chatBody
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="pill"
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={
              isHighlighted
                ? { opacity: 1, y: 0, scale: [1, 1.04, 1] }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={{ opacity: 0, y: 12 }}
            transition={isHighlighted ? { scale: { duration: 1.2, repeat: Infinity } } : undefined}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-20 right-4 z-[65] flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/85 px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/30 md:bottom-6 md:right-6 ${
              isHighlighted ? 'ring-4 ring-primary/25' : ''
            }`}
            aria-label="Open chat with Studio Sara"
          >
            <MessageCircle className="h-4.5 w-4.5" />
            Chat with us
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
