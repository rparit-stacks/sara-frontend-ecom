import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { acquireStomp, releaseStomp, subscribeTopic } from '@/lib/stompClient';

export type ProjectStreamMode = 'admin' | 'client';

const TYPING_STOP_AFTER_MS = 4000;
const TYPING_SEND_THROTTLE_MS = 2000;

/**
 * Single STOMP subscription for project-level realtime updates — subscribes to
 * /topic/project/{code} and, on "design"/"project"/"message" events, invalidates
 * or refetches the TanStack Query keys the workspace pages actually use. Also
 * relays the ephemeral "typing" event (TypingIndicatorController) and exposes
 * notifyTyping to publish it back, per design channel.
 *
 * This merges what were two separate hooks during the workspace-preview build
 * (one for the production pages, one for the temp preview pages, which had
 * drifted to different — and for the client side, actually broken — cache-key
 * assumptions). There is now exactly one project-level realtime hook.
 */
export function useProjectStomp(
  projectCode: string | undefined,
  mode: ProjectStreamMode = 'admin',
  authorName?: string,
  /** Optional echo-skip window — while now() is before this, incoming "message"
   *  events are ignored (an optimistic local send already updated the cache). */
  skipMessageInvalidationUntil?: () => number,
) {
  const qc = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentAt = useRef(0);
  const clientRef = useRef<ReturnType<typeof acquireStomp> | null>(null);
  const [typingUser, setTypingUser] = useState<{ authorName: string; isAdmin: boolean; isAi?: boolean; designId?: number } | null>(null);

  useEffect(() => {
    if (!projectCode) return;

    const token = mode === 'client' ? localStorage.getItem('authToken') : localStorage.getItem('adminToken');
    if (!token) return;

    const shellKey = mode === 'client' ? 'client-project-detail' : 'project-detail';
    const messagesKey = mode === 'client' ? 'client-project-channel-messages' : 'project-channel-messages';
    const threadsKey = mode === 'client' ? 'client-project-threads' : 'project-threads';

    const refetchMessages = (designId?: number) => {
      if (skipMessageInvalidationUntil && Date.now() < skipMessageInvalidationUntil()) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (designId != null && designId > 0) {
          void qc.refetchQueries({ queryKey: [messagesKey, projectCode, designId], type: 'active' });
        } else {
          void qc.refetchQueries({ queryKey: [messagesKey, projectCode], type: 'active' });
        }
        void qc.refetchQueries({ queryKey: [threadsKey, projectCode], type: 'active' });
      }, 100);
    };

    const client = acquireStomp(mode);
    clientRef.current = client;
    const unsubscribe = subscribeTopic(client, `/topic/project/${projectCode}`, (frame) => {
      let event = '';
      let data: unknown = null;
      try {
        const parsed = JSON.parse(frame.body) as { event?: string; data?: unknown };
        event = parsed.event ?? '';
        data = parsed.data;
      } catch {
        return;
      }

      if (event === 'design' || event === 'project') {
        void qc.invalidateQueries({ queryKey: [shellKey, projectCode] });
        void qc.invalidateQueries({ queryKey: ['financial-overview', mode, projectCode] });
        if (mode === 'client') {
          void qc.invalidateQueries({ queryKey: ['client-projects'] });
          void qc.invalidateQueries({ queryKey: ['client-portal-aggregate'] });
        }
      } else if (event === 'message') {
        const payload = data as { designId?: number } | null;
        const designId = payload?.designId != null && payload.designId > 0 ? payload.designId : undefined;
        void qc.invalidateQueries({ queryKey: [shellKey, projectCode] });
        refetchMessages(designId);
      } else if (event === 'typing') {
        const payload = data as { isTyping?: boolean; authorName?: string; isAdmin?: boolean; isAi?: boolean; designId?: number } | null;
        if (!payload) return;
        // The AI composing an auto-reply is flagged isAi and is never a self-echo — it's
        // published server-side as the team, so an admin watching the chat must still see it.
        const isSelf = payload.isAi ? false : mode === 'admin' ? !!payload.isAdmin : !payload.isAdmin;
        if (isSelf) return;
        if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
        if (payload.isTyping) {
          setTypingUser({ authorName: payload.authorName || 'Someone', isAdmin: !!payload.isAdmin, isAi: !!payload.isAi, designId: payload.designId });
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
    };
  }, [projectCode, mode, qc, skipMessageInvalidationUntil]);

  /** Call on every keystroke in the composer — throttled, and auto-sends "stopped" after a pause. */
  const notifyTyping = useCallback((isTyping: boolean, designId?: number) => {
    if (!projectCode) return;
    const client = clientRef.current;
    if (!client || !client.connected) return;
    const now = Date.now();
    if (isTyping && now - lastTypingSentAt.current < TYPING_SEND_THROTTLE_MS) return;
    lastTypingSentAt.current = now;
    client.publish({
      destination: `/app/typing/project/${projectCode}`,
      body: JSON.stringify({ isTyping, authorName, designId }),
    });
  }, [projectCode, authorName]);

  return { typingUser, notifyTyping };
}
