import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Drag-to-resize width for a panel (e.g. the WhatsApp-style workspace sidebar).
 * Clamped to [min, max] — the user can stretch or shrink it, but never past
 * those bounds. Persists the chosen width to localStorage per `storageKey` so
 * it's remembered across visits.
 */
export function useResizableWidth(storageKey: string, defaultWidth: number, min: number, max: number) {
  const [width, setWidth] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey));
      if (saved >= min && saved <= max) return saved;
    } catch { /* ignore */ }
    return defaultWidth;
  });
  const draggingRef = useRef(false);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const next = Math.min(max, Math.max(min, startWidth + (ev.clientX - startX)));
      setWidth(next);
    };
    const onMouseUp = () => {
      draggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setWidth((current) => {
        try { localStorage.setItem(storageKey, String(current)); } catch { /* ignore */ }
        return current;
      });
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [width, min, max, storageKey]);

  // Re-clamp if min/max ever change (e.g. responsive breakpoint).
  useEffect(() => {
    setWidth((w) => Math.min(max, Math.max(min, w)));
  }, [min, max]);

  return { width, startResize };
}
