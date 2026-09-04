import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { acquireStomp, releaseStomp, subscribeTopic } from '@/lib/stompClient';

export type CustomerChatMode = 'admin' | 'client';

const TYPING_STOP_AFTER_MS = 4000;
const TYPING_SEND_THROTTLE_MS = 2000;

/**
 * STOMP subscription for the customer-level General Chat — mirrors
 * useProjectStomp's pattern but keyed by customerEmail (topic
 * /topic/customer/{email}, published by ProjectRealtimeBroadcaster.publishCustomer)
 * instead of project code. Invalidates/refetches the same TanStack Query keys
 * used by AdminClientWorkspacePreview / ClientWorkspacePreview.
 *
 * Also relays the ephemeral "typing" event (TypingIndicatorController on the
 * backend) — nothing is persisted, a dropped frame just means the dot
 * disappears a little late.
 */
export function useCustomerChatStomp(
  customerEmail: string | undefined,
  mode: CustomerChatMode = 'admin',
  authorName?: string,
) {
  const qc = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentAt = useRef(0);
  const clientRef = useRef<ReturnType<typeof acquireStomp> | null>(null);
  const [typingUser, setTypingUser] = useState<{ authorName: string; isAdmin: boolean; isAi?: boolean } | null>(null);
  // Live-growing preview of the Portal AI's reply as it's actually generated
  // (see MfgAdminAiAutoResponderService.deltaStreamListener on the backend) —
  // purely cosmetic, cleared the instant `ai-done`/`ai-error` arrives and
  // handed off to the real persisted message the subsequent refetch picks up.
  // `parentMessageId` (absent for a main-channel reply) lets the consumer show
  // the preview only inside the ThreadPanel it belongs to, not the main pane.
  const [aiStream, setAiStream] = useState<{ text: string; parentMessageId?: number } | null>(null);
  const aiStreamTextRef = useRef('');

  useEffect(() => {
    if (!customerEmail) return;

    const token = mode === 'client'
      ? localStorage.getItem('authToken')
      : localStorage.getItem('adminToken');
    if (!token) return;

    const messagesKey = mode === 'client' ? 'client-customer-chat-messages' : 'customer-chat-messages';
    const threadsKey = mode === 'client' ? 'client-customer-chat-threads' : 'customer-chat-threads';
    const messagesQueryKey = mode === 'client' ? [messagesKey] : [messagesKey, customerEmail];
    const threadsQueryKey = mode === 'client' ? [threadsKey] : [threadsKey, customerEmail];

    const refetchMessages = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void qc.refetchQueries({ queryKey: messagesQueryKey, type: 'active' });
        void qc.refetchQueries({ queryKey: threadsQueryKey, type: 'active' });
      }, 100);
    };

    const client = acquireStomp(mode);
    clientRef.current = client;
    const unsubscribe = subscribeTopic(client, `/topic/customer/${customerEmail}`, (frame) => {
      let event = '';
      let data: unknown = null;
      try {
        const parsed = JSON.parse(frame.body) as { event?: string; data?: unknown };
        event = parsed.event ?? '';
        data = parsed.data;
      } catch {
        return;
      }
      if (event === 'message') {
        refetchMessages();
      } else if (event.startsWith('ai-')) {
        const kind = event.slice(3);
        const payload = data as { text?: string; parentMessageId?: number } | null;
        const parentMessageId = payload?.parentMessageId != null ? payload.parentMessageId : undefined;
        if (kind === 'delta') {
          aiStreamTextRef.current += payload?.text || '';
          setAiStream({ text: aiStreamTextRef.current, parentMessageId });
        } else if (kind === 'reset') {
          aiStreamTextRef.current = '';
          setAiStream({ text: '', parentMessageId });
        } else if (kind === 'done' || kind === 'error') {
          aiStreamTextRef.current = '';
          setAiStream(null);
          if (kind === 'done') refetchMessages();
        }
      } else if (event === 'typing') {
        const payload = data as { isTyping?: boolean; authorName?: string; isAdmin?: boolean; isAi?: boolean } | null;
        if (!payload) return;
        // Ignore our own echoed typing event (the sender knows it's typing already). The AI
        // composing an auto-reply is flagged isAi and is never a self-echo — it's published
        // server-side as the team, so an admin watching the chat must still see it.
        const isSelf = payload.isAi ? false : mode === 'admin' ? !!payload.isAdmin : !payload.isAdmin;
        if (isSelf) return;
        if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
        if (payload.isTyping) {
          setTypingUser({ authorName: payload.authorName || 'Someone', isAdmin: !!payload.isAdmin, isAi: !!payload.isAi });
          typingStopTimerRef.current = setTimeout(() => setTypingUser(null), TYPING_STOP_AFTER_MS);
        } else {
          setTypingUser(null);
        }
      }
    });

    return () => {
      unsubscribe();
      releaseStomp();
      clientRef.current = null;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      setTypingUser(null);
      aiStreamTextRef.current = '';
      setAiStream(null);
    };
  }, [customerEmail, mode, qc]);

  /** Call on every keystroke in the composer — throttled, and auto-sends "stopped" after a pause. */
  const notifyTyping = useCallback((isTyping: boolean) => {
    if (!customerEmail) return;
    const client = clientRef.current;
    if (!client || !client.connected) return;
    const now = Date.now();
    if (isTyping && now - lastTypingSentAt.current < TYPING_SEND_THROTTLE_MS) return;
    lastTypingSentAt.current = now;
    client.publish({
      destination: `/app/typing/customer/${customerEmail}`,
      body: JSON.stringify({ isTyping, authorName }),
    });
  }, [customerEmail, authorName]);

  return { typingUser, notifyTyping, aiStream };
}
