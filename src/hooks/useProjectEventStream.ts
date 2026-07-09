import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';

export type ProjectStreamMode = 'admin' | 'client';

function parseSseChunk(chunk: string): { eventName: string; data: string } {
  const normalized = chunk.replace(/\r/g, '');
  let eventName = '';
  let data = '';
  for (const line of normalized.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  return { eventName, data };
}

/** SSE push for instant message/design updates (replaces slow polling feel). */
export function useProjectEventStream(
  projectCode: string | undefined,
  mode: ProjectStreamMode = 'admin',
  /** Skip message refetch briefly after local send (avoids echo refetch). */
  skipMessageInvalidationUntil?: () => number,
) {
  const qc = useQueryClient();
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failCountRef = useRef(0);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  useEffect(() => {
    if (!projectCode) return;
    let cancelled = false;
    const ctrl = new AbortController();

    const shellKey = mode === 'client' ? 'client-project-shell' : 'admin-project-shell';
    const messagesKey = mode === 'client' ? 'client-project-messages' : 'admin-project-messages';
    const threadsKey = mode === 'client' ? 'client-threads' : 'admin-threads';
    const filesKey = mode === 'client' ? 'client-project-files' : 'admin-project-files';

    const eventsPath =
      mode === 'client'
        ? `/api/portal/projects/${encodeURIComponent(projectCode)}/events`
        : `/api/admin/manufacturing/projects/${encodeURIComponent(projectCode)}/events`;

    const token =
      mode === 'client'
        ? localStorage.getItem('authToken')
        : localStorage.getItem('adminToken');

    if (!token) return;

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

    const connect = async () => {
      if (cancelled) return;
      let cleanEnd = false;
      try {
        const res = await fetch(`${API_BASE_URL}${eventsPath}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          if (res.status === 401 || res.status === 403) return;
          failCountRef.current += 1;
          const delay = Math.min(30_000, 2000 * failCountRef.current);
          retryRef.current = setTimeout(connect, delay);
          return;
        }

        failCountRef.current = 0;
        const reader = res.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = '';

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) { cleanEnd = true; break; }
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split(/\n\n/);
          buffer = parts.pop() || '';
          for (const chunk of parts) {
            const { eventName, data } = parseSseChunk(chunk);
            if (eventName === 'error') return;
            if (eventName === 'design' || eventName === 'project') {
              void qc.invalidateQueries({ queryKey: [shellKey, projectCode] });
              if (mode === 'client') void qc.invalidateQueries({ queryKey: ['client-projects'] });
            } else if (eventName === 'message') {
              let designId: number | undefined;
              if (data) {
                try {
                  const payload = JSON.parse(data) as { designId?: number };
                  if (payload.designId != null && payload.designId > 0) designId = payload.designId;
                } catch {
                  /* ignore malformed payload */
                }
              }
              void qc.invalidateQueries({ queryKey: [shellKey, projectCode] });
              void qc.invalidateQueries({ queryKey: [threadsKey, projectCode] });
              void qc.invalidateQueries({ queryKey: [filesKey, projectCode] });
              refetchMessages(designId);
            }
          }
        }
      } catch {
        /* aborted or network error */
      } finally {
        readerRef.current = null;
      }
      if (!cancelled) {
        // A clean stream end is the server's normal ~90s emitter timeout, not a
        // failure — reconnect quickly so live updates stay seamless. Only apply
        // exponential backoff on actual errors.
        if (cleanEnd) {
          failCountRef.current = 0;
          retryRef.current = setTimeout(connect, 500);
        } else {
          failCountRef.current += 1;
          const delay = Math.min(30_000, 2000 * failCountRef.current);
          retryRef.current = setTimeout(connect, delay);
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const reader = readerRef.current;
      if (reader) {
        void reader.cancel().catch(() => {});
        readerRef.current = null;
      }
      ctrl.abort();
    };
  }, [projectCode, mode, qc, skipMessageInvalidationUntil]);
}

/** Safety net when SSE drops — keeps chat fresh without full page refresh. */
export function useProjectMessagePolling(
  projectCode: string | undefined,
  activeDesignId: number | undefined,
  enabled: boolean,
  mode: ProjectStreamMode = 'admin',
  intervalMs = 4000,
) {
  const qc = useQueryClient();
  const messagesKey = mode === 'client' ? 'client-project-messages' : 'admin-project-messages';

  useEffect(() => {
    if (!enabled || !projectCode || activeDesignId == null) return;
    const id = setInterval(() => {
      void qc.refetchQueries({
        queryKey: [messagesKey, projectCode, activeDesignId],
        type: 'active',
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [enabled, projectCode, activeDesignId, messagesKey, intervalMs, qc]);
}
