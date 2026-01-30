import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { recordVisit } from '@/lib/api';

/** Records a page visit once per hour per visitor (no double count in same hour). Skips admin panel. */
export default function VisitTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname.startsWith('/admin-sara')) return;
    recordVisit();
  }, [pathname]);
  return null;
}
