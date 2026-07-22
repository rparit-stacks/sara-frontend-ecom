import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { acquireStomp, releaseStomp, subscribeTopic } from '@/lib/stompClient';

export type ProjectStreamMode = 'admin' | 'client';

/**
 * STOMP replacement for useProjectEventStream — subscribes to
 * /topic/project/{code} and invalidates/refetches the same TanStack Query keys
 * on "message" / "design" / "project" events. Keeps the existing echo-skip
 * window so a locally-sent (optimistic) message isn't clobbered by its own
 * broadcast round-trip.
 */
export function useProjectStomp(
  projectCode: string | undefined,
  mode: ProjectStreamMode = 'admin',
  skipMessageInvalidationUntil?: () => number,
) {
  const qc = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!projectCode) return;

    const token =
      mode === 'client'
        ? localStorage.getItem('authToken')
        : localStorage.getItem('adminToken');
    if (!token) return;

    const shellKey = mode === 'client' ? 'client-project-shell' : 'admin-project-shell';
    const messagesKey = mode === 'client' ? 'client-project-messages' : 'admin-project-messages';
    const threadsKey = mode === 'client' ? 'client-threads' : 'admin-threads';
    const filesKey = mode === 'client' ? 'client-project-files' : 'admin-project-files';
    const financialsKey =
      mode === 'admin' ? 'admin-project-financials' : 'client-project-financials';

    const refetchMessages = (designId?: number) => {
      if (skipMessageInvalidationUntil && Date.now() < skipMessageInvalidationUntil()) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (designId != null && designId > 0) {
          void qc.refetchQueries({ queryKey: [messagesKey, projectCode, designId], type: 'active' });
        } else {
          void qc.refetchQueries({ queryKey: [messagesKey, projectCode], type: 'active' });
        }
      }, 100);
    };

    const client = acquireStomp(mode);
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
        void qc.invalidateQueries({ queryKey: [financialsKey, projectCode] });
        if (mode === 'client') {
          void qc.invalidateQueries({ queryKey: ['client-projects'] });
          void qc.invalidateQueries({ queryKey: ['client-portal-aggregate'] });
        }
      } else if (event === 'message') {
        let designId: number | undefined;
        const payload = data as { designId?: number } | null;
        if (payload && payload.designId != null && payload.designId > 0) {
          designId = payload.designId;
        }
        void qc.invalidateQueries({ queryKey: [shellKey, projectCode] });
        void qc.invalidateQueries({ queryKey: [threadsKey, projectCode] });
        void qc.invalidateQueries({ queryKey: [filesKey, projectCode] });
        refetchMessages(designId);
      }
    });

    return () => {
      unsubscribe();
      releaseStomp();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [projectCode, mode, qc, skipMessageInvalidationUntil]);
}
