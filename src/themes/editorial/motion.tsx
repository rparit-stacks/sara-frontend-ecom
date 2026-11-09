import { ReactNode, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';

const EASE = [0.2, 0.7, 0.1, 1] as const;

/**
 * One line of a headline slides up out of a mask. Use one per line, staggered with delay.
 * The viewport check runs on the mask, not on the moving text: text hidden below its own mask
 * counts as off-screen and would never be revealed.
 */
export const Line = ({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -5% 0px' });
  return (
    <span ref={ref} className={`block overflow-hidden pb-[0.1em] ${className}`}>
      <motion.span
        className="block"
        initial={false}
        animate={reduce || seen ? { y: 0 } : { y: '110%' }}
        transition={{ duration: 1, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
};

/** Fades and rises a little as it enters the viewport. */
export const Rise = ({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
};

const WEAVE = 'repeating-linear-gradient(45deg, hsl(var(--primary) / 0.1) 0 2px, transparent 2px 9px), repeating-linear-gradient(-45deg, hsl(var(--foreground) / 0.05) 0 2px, transparent 2px 9px)';

/** Shown in place of a picture that is missing or fails to load: a woven swatch with the item's initial. */
const Placeholder = ({ label }: { label: string }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-center" style={{ backgroundImage: WEAVE }}>
    <span className="font-serif text-[clamp(3rem,9vw,6.5rem)] font-light italic leading-none text-primary/70" style={{ fontVariationSettings: "'opsz' 144" }}>
      {(label.trim()[0] || 'S').toUpperCase()}
    </span>
    <span className="ed-kicker mt-3 max-w-[80%] truncate !text-[10px] text-muted-foreground">Photo coming soon</span>
  </div>
);

/** A photograph that is uncovered like a page being turned, then drifts slowly as the page scrolls. */
export const Photo = ({
  src, alt = '', className = '', drift = 7, delay = 0, aspect = 'aspect-[4/5]',
}: { src?: string; alt?: string; className?: string; drift?: number; delay?: number; aspect?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [broken, setBroken] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${drift}%`, `${drift}%`]);
  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden bg-muted ${aspect} ${className}`}
      initial={reduce ? false : { clipPath: 'inset(100% 0 0 0)' }}
      whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
      viewport={{ once: true, margin: '0px 0px -6% 0px' }}
      transition={{ duration: 1.15, ease: [0.76, 0, 0.24, 1], delay }}
    >
      {!src || broken ? (
        <Placeholder label={alt} />
      ) : (
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
          style={reduce ? undefined : { y, scale: 1 + (drift * 2.4) / 100 }}
        />
      )}
    </motion.div>
  );
};

/** A line of text that scrolls sideways forever. */
export const Marquee = ({ items }: { items: string[] }) => {
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <span key={i} className="flex items-center whitespace-nowrap font-serif text-[clamp(1.5rem,3.2vw,2.75rem)] font-light italic tracking-[-0.02em]">
          <span className="px-8">{t}</span>
          <span className="text-primary">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="ed-marquee overflow-hidden border-y ed-rule py-4" aria-hidden>
      <div className="ed-marquee-track">{row}{row}</div>
    </div>
  );
};
