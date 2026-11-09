import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * A picture of a whole page in a window, scrolling slowly down and back like a person reading it. A normal-sized
 * picture is shown still. Hovering pauses the scroll.
 */
export const ScrollShot = ({
  tall, still, alt, className = '', seconds = 18, paused = false,
}: { tall?: string; still: string; alt: string; className?: string; seconds?: number; paused?: boolean }) => {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [distance, setDistance] = useState(0);
  const [hover, setHover] = useState(false);

  const measure = () => {
    if (!box.current || !img.current) return;
    setDistance(Math.max(0, img.current.offsetHeight - box.current.offsetHeight));
  };
  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tall]);

  const scrolling = !!tall && !reduce && distance > 0 && !paused && !hover;
  // Time scales with how far it has to go, so short and long pages move at the same speed.
  const duration = Math.max(seconds * 0.6, Math.min(seconds * 2.2, (distance / 1000) * seconds));

  return (
    <div ref={box} className={`relative overflow-hidden bg-muted ${className}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {tall ? (
        <motion.img
          key={tall}
          ref={img}
          src={tall}
          alt={alt}
          onLoad={measure}
          className="block w-full"
          draggable={false}
          animate={scrolling ? { y: [0, -distance, -distance, 0, 0] } : { y: hover ? undefined : 0 }}
          transition={scrolling ? { duration: duration * 2 + 3, times: [0, 0.46, 0.5, 0.96, 1], ease: 'easeInOut', repeat: Infinity } : { duration: 0.4 }}
        />
      ) : (
        <motion.img
          key={still}
          src={still}
          alt={alt}
          className="block w-full"
          draggable={false}
          initial={{ scale: 1.03 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: [0.2, 0.7, 0.1, 1] }}
        />
      )}
    </div>
  );
};

/** A browser window drawn around a picture, with a fake address bar. */
export const BrowserFrame = ({ url, children, className = '' }: { url: string; children: React.ReactNode; className?: string }) => (
  <div className={`overflow-hidden rounded-xl border border-border bg-card shadow-[0_30px_80px_-30px_rgba(11,37,48,0.45)] ${className}`}>
    <div className="flex items-center gap-3 border-b border-border bg-muted/60 px-4 py-2.5">
      <div className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
      </div>
      <div className="mx-auto flex min-w-0 max-w-md flex-1 items-center justify-center rounded-md bg-background px-3 py-1 text-[11px] text-muted-foreground">
        <span className="truncate">{url}</span>
      </div>
      <span className="w-12" />
    </div>
    {children}
  </div>
);
