import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { acquireStomp, releaseStomp, subscribeTopic } from '@/lib/stompClient';
import { presenceApi } from '@/lib/api';
import { getStoredAdminUser } from '@/lib/adminAccess';

/**
 * Central admin-presence state for the manufacturing portal admin app.
 *
 * Presence is MANUAL: the admin toggles themselves online/offline from the
 * header. While online we send a heartbeat every HEARTBEAT_MS so the backend
 * doesn't auto-drop us — the backend flips us back offline on its own after
 * 10 minutes with no heartbeat (closed tab, sleep, crash, dead network), so
 * there's nothing to warn the admin about before leaving.
 *
 * `onlineAdminIds` is the live set of everyone currently online (for dots on
 * lists); `myOnline` is the current admin's own effective status.
 */
interface AdminPresenceValue {
  onlineAdminIds: Set<number>;
  myOnline: boolean;
  myAdminId: number | null;
  setMyOnline: (online: boolean) => Promise<void>;
  toggling: boolean;
}

const AdminPresenceContext = createContext<AdminPresenceValue | null>(null);

const HEARTBEAT_MS = 45_000; // well under the backend's 10-minute stale window

export function AdminPresenceProvider({ children }: { children: ReactNode }) {
  const [onlineAdminIds, setOnlineAdminIds] = useState<Set<number>>(new Set());
  const [myOnline, setMyOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const myAdminId = getStoredAdminUser()?.id ?? null;
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- connect + live presence feed --------------------------------------
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    let cancelled = false;

    // Seed: who's online + my own status.
    presenceApi
      .getOnline()
      .then((res) => {
        if (!cancelled) setOnlineAdminIds(new Set(res.onlineAdminIds ?? []));
      })
      .catch(() => {});
    presenceApi
      .getMyStatus()
      .then((res) => {
        if (!cancelled) setMyOnline(!!res.online);
      })
      .catch(() => {});

    const client = acquireStomp('admin');
    const unsubscribe = subscribeTopic(client, '/topic/presence', (frame) => {
      try {
        const { adminId, online } = JSON.parse(frame.body) as {
          adminId: number;
          online: boolean;
        };
        setOnlineAdminIds((prev) => {
          const next = new Set(prev);
          if (online) next.add(adminId);
          else next.delete(adminId);
          return next;
        });
        if (adminId === myAdminId) setMyOnline(online);
      } catch {
        /* ignore malformed frame */
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      releaseStomp();
    };
  }, [myAdminId]);

  // --- heartbeat while online --------------------------------------------
  useEffect(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (!myOnline) return;
    // Fire one immediately, then on an interval.
    void presenceApi.heartbeat().catch(() => {});
    heartbeatRef.current = setInterval(() => {
      void presenceApi.heartbeat().catch(() => {});
    }, HEARTBEAT_MS);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    };
  }, [myOnline]);

  const changeMyOnline = useCallback(async (online: boolean) => {
    setToggling(true);
    try {
      const res = await presenceApi.setMyStatus(online);
      setMyOnline(!!res.online);
    } finally {
      setToggling(false);
    }
  }, []);

  return (
    <AdminPresenceContext.Provider
      value={{ onlineAdminIds, myOnline, myAdminId, setMyOnline: changeMyOnline, toggling }}
    >
      {children}
    </AdminPresenceContext.Provider>
  );
}

/**
 * Access presence anywhere under the provider. Falls back to an empty/no-op
 * value when used outside a provider (e.g. non-admin pages), so components can
 * call it unconditionally without crashing.
 */
export function useAdminPresenceContext(): AdminPresenceValue {
  const ctx = useContext(AdminPresenceContext);
  if (ctx) return ctx;
  return {
    onlineAdminIds: new Set(),
    myOnline: false,
    myAdminId: null,
    setMyOnline: async () => {},
    toggling: false,
  };
}
