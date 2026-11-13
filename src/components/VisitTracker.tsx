import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { recordVisit, sendVisitPing } from '@/lib/api';

const isAdminPath = (p: string) => p.startsWith('/admin-sara') || p.startsWith('/portal-admin');

/**
 * Visitor tracking, own server only:
 *  - one visit row per visitor per hour (existing daily/weekly counts)
 *  - a live heartbeat: on every page open, every 20s while the tab is visible, and a "leaving" beacon when the
 *    tab is closed or hidden, so "on the site now" is accurate to a few seconds.
 * Admin screens, logged-in admins and browsers opted out in Logs are never counted.
 */
export default function VisitTracker() {
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    if (isAdminPath(pathname)) return;
    recordVisit();
    if (document.visibilityState === 'visible') sendVisitPing(pathname);
  }, [pathname]);

  useEffect(() => {
    const beat = () => {
      if (document.visibilityState === 'visible' && !isAdminPath(pathRef.current)) sendVisitPing(pathRef.current);
    };
    const timer = window.setInterval(beat, 20_000);
    const onVisibility = () => {
      if (isAdminPath(pathRef.current)) return;
      if (document.visibilityState === 'visible') sendVisitPing(pathRef.current);
      else sendVisitPing(pathRef.current, true);
    };
    const onLeave = () => {
      if (!isAdminPath(pathRef.current)) sendVisitPing(pathRef.current, true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onLeave);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onLeave);
    };
  }, []);

  return null;
}
