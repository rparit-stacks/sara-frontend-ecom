import { useEffect, useMemo, useState } from 'react';

/**
 * What open.studiosara.in shows. The WhatsApp bot (and anything else) links here: one address that works for everyone.
 *  - On a computer it goes straight to the same page on the website.
 *  - On a phone it tries to open the Studio Sara app on that page, and if the app does not open it goes to the website.
 * The paths are the website's own, plus the short ones the bot uses (/ask, /orders), which map to the website's nearest page.
 * The app side of the same links is sara-mobile/src/navigation/deepLink.ts. Keep the two tables in step.
 */

const WEBSITE = 'https://www.studiosara.in';

/** Bot paths the website does not have, mapped to its nearest page. Every other path is used as it is. */
const WEB_PATHS: Record<string, string> = {
  '/ask': '/',
  '/orders': '/dashboard',
};

export const websiteUrlFor = (pathname: string, search: string, hash: string) => {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const mapped = WEB_PATHS[clean.toLowerCase()] ?? clean;
  return `${WEBSITE}${mapped}${search}${hash}`;
};

export const appUrlFor = (pathname: string, search: string) => `studiosara://${pathname.replace(/^\/+/, '')}${search}`;

const device = () => {
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android' as const;
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios' as const;
  return 'desktop' as const;
};

export const OpenLink = () => {
  const { pathname, search, hash } = window.location;
  const web = useMemo(() => websiteUrlFor(pathname, search, hash), [pathname, search, hash]);
  const app = useMemo(() => appUrlFor(pathname, search), [pathname, search]);
  const kind = useMemo(device, []);
  const [seconds, setSeconds] = useState(kind === 'ios' ? 3 : 2);

  useEffect(() => {
    if (kind === 'desktop') {
      window.location.replace(web);
      return;
    }
    // Android ignores an address no app handles, so trying the app first is safe. iOS shows an error for it, so iOS waits for a tap.
    if (kind === 'android') window.location.href = app;
    let opened = false;
    const onHide = () => { if (document.visibilityState === 'hidden') opened = true; };
    document.addEventListener('visibilitychange', onHide);
    const tick = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    const go = window.setTimeout(() => { if (!opened) window.location.replace(web); }, (kind === 'ios' ? 3 : 2) * 1000);
    return () => { document.removeEventListener('visibilitychange', onHide); window.clearInterval(tick); window.clearTimeout(go); };
  }, [kind, app, web]);

  if (kind === 'desktop') return null;
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f6fbfa', fontFamily: 'system-ui, sans-serif', color: '#0f2a2a' }}>
      <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Studio Sara</p>
        <p style={{ margin: '12px 0 24px', color: '#4b6b6b', fontSize: 15 }}>
          {seconds > 0 ? `Opening in ${seconds}…` : 'Opening…'}
        </p>
        <a href={app} style={{ display: 'block', padding: '14px 16px', borderRadius: 12, background: '#2c9b8a', color: '#fff', fontWeight: 600, textDecoration: 'none' }}>Open in the app</a>
        <a href={web} style={{ display: 'block', marginTop: 12, padding: '14px 16px', borderRadius: 12, border: '1px solid #b9d8d3', color: '#0f2a2a', textDecoration: 'none' }}>Continue on the website</a>
      </div>
    </div>
  );
};
