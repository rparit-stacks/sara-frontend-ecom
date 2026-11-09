import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Image as ImageIcon, MonitorPlay } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrowserFrame, ScrollShot } from './ScrollShot';
import type { ListingPreview } from './catalog';

/** The big stage: page tabs, a browser window that scrolls the chosen page, a caption, and an optional live preview. */
export const Showcase = ({ previews, themeId, host }: { previews: ListingPreview[]; themeId?: string; host: string }) => {
  const [index, setIndex] = useState(0);
  const [live, setLive] = useState(false);
  const current = previews[index];
  const previewUrl = themeId ? `${current.path}${current.path.includes('?') ? '&' : '?'}theme-preview=${themeId}` : '';

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Pages">
          {previews.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
              className={cn('relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors', i === index ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {i === index && <motion.span layoutId="showcase-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }} />}
              <span className="relative">{p.label}</span>
            </button>
          ))}
        </div>
        {themeId && (
        <div className="flex rounded-full border bg-muted/50 p-0.5 text-sm">
          <button type="button" onClick={() => setLive(false)} className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5', !live ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
            <ImageIcon className="h-3.5 w-3.5" /> Screenshots
          </button>
          <button type="button" onClick={() => setLive(true)} className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5', live ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
            <MonitorPlay className="h-3.5 w-3.5" /> Live preview
          </button>
        </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${current.id}-${live}`}
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.2, 0.7, 0.1, 1] }}
        >
          <BrowserFrame url={`${host}${current.path === '/' ? '' : current.path}`}>
            {live && themeId ? (
              <iframe title={`${current.label} live preview`} src={previewUrl} loading="lazy" className="block h-[560px] w-full bg-white sm:h-[640px]" />
            ) : (
              <ScrollShot tall={current.tall} still={current.image} alt={`${current.label}`} className="aspect-[16/10]" />
            )}
          </BrowserFrame>
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <AnimatePresence mode="wait">
          <motion.p key={current.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="max-w-2xl text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{current.label}. </span>
            {current.caption}
          </motion.p>
        </AnimatePresence>
        {live && themeId && (
          <a href={previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            Open in a new tab <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10">
        {previews.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setIndex(i)} aria-label={p.label}
            className={cn('relative aspect-[16/10] overflow-hidden rounded-md border transition-all', i === index ? 'ring-2 ring-primary ring-offset-2' : 'opacity-60 hover:opacity-100')}>
            <img src={p.image} alt="" className="h-full w-full object-cover object-top" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
};
