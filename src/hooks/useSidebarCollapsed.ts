import { useCallback, useEffect, useState } from 'react';

const KEY = 'adminSidebarCollapsed';
const EVENT = 'admin-sidebar-collapsed';

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Shared collapsed state for the admin sidebar. Persists to localStorage and
 * syncs across components (sidebar + layout) via a window event — no context
 * provider needed.
 */
export function useSidebarCollapsed(): [boolean, (v: boolean) => void, () => void] {
  const [collapsed, setCollapsed] = useState<boolean>(read);

  useEffect(() => {
    const sync = () => setCollapsed(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync); // other tabs
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const set = useCallback((v: boolean) => {
    try {
      localStorage.setItem(KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
    setCollapsed(v);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const toggle = useCallback(() => set(!read()), [set]);

  return [collapsed, set, toggle];
}
