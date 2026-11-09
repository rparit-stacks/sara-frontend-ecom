import { createContext, ReactNode, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { findTheme, THEMES } from './registry';
import type { ThemePlugin } from './types';

const SERVER_KEY = 'sara-server-theme';
const OFF = new Set(['classic', 'off', 'none']);
/** Parts of the site that never wear a storefront theme. */
const EXCLUDED = /^\/(admin[a-z-]*|portal)(\/|$)/i;
const REFRESH_MS = 5 * 60 * 1000;

interface ThemeContextValue {
  themes: ThemePlugin[];
  /** The plugin that is switched on, or null for the classic storefront. */
  active: ThemePlugin | null;
  /** True when the page was opened with ?theme-preview= (marketplace previews): nothing is saved, no switch is shown. */
  preview: boolean;
  setPathname: (path: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themes: [], active: null, preview: false, setPathname: () => {},
});

const safe = {
  get: (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

const previewId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return findTheme(new URLSearchParams(window.location.search).get('theme-preview'))?.id ?? null;
};

const cachedServerId = (): string | null => {
  const v = safe.get(SERVER_KEY);
  return v && !OFF.has(v) ? findTheme(v)?.id ?? null : null;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [preview] = useState<string | null>(previewId);
  const [serverId, setServerId] = useState<string | null>(cachedServerId);
  const [pathname, setPathname] = useState<string>(() => (typeof window === 'undefined' ? '/' : window.location.pathname));

  // Ask the server which theme is live (it checks the trial, the purchase and the on/off switch).
  useEffect(() => {
    if (preview) return;
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/marketplace/storefront-theme`, { headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const body = (await res.json()) as { theme?: string | null };
        const id = findTheme(body.theme)?.id ?? null;
        safe.set(SERVER_KEY, id ?? 'classic');
        if (!stop) setServerId(id);
      } catch { /* keep what we had */ }
    };
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { stop = true; window.clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [preview]);

  const activeId = preview ?? serverId;
  const active = findTheme(activeId);
  const scoped = !!active && !EXCLUDED.test(pathname);

  // Set the scope on <html> before paint so the classic look never flashes.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (scoped && active) root.dataset.themePlugin = active.id;
    else delete root.dataset.themePlugin;
    if (preview) root.dataset.themePreview = '1';
    else delete root.dataset.themePreview;
  }, [scoped, active, preview]);

  const value = useMemo(
    () => ({ themes: THEMES, active, preview: !!preview, setPathname }),
    [active, preview],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/** Place inside the router: tells the theme which page is showing, so admin and portal pages stay unthemed. */
export const ThemeRoute = () => {
  const { pathname } = useLocation();
  const { setPathname } = useTheme();
  useEffect(() => setPathname(pathname), [pathname, setPathname]);
  return null;
};

export const useTheme = () => useContext(ThemeContext);
