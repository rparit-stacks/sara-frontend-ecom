import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faCheck,
  faWandMagicSparkles,
  faBoxOpen,
  faHashtag,
  faCartArrowDown,
  faHeartPulse,
  faMagnifyingGlassChart,
  faStamp,
  faCloudArrowUp,
  faLink,
  faHeadset,
  faRulerCombined,
  faPenToSquare,
  faPalette,
  faBolt,
  faRobot,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { PlanFeature, FeatureAnim } from '@/lib/planFeatures';

const ICONS: Record<string, IconDefinition> = {
  'wand-magic-sparkles': faWandMagicSparkles,
  'box-open': faBoxOpen,
  hashtag: faHashtag,
  'cart-arrow-down': faCartArrowDown,
  'heart-pulse': faHeartPulse,
  'magnifying-glass-chart': faMagnifyingGlassChart,
  stamp: faStamp,
  'cloud-arrow-up': faCloudArrowUp,
  link: faLink,
  headset: faHeadset,
  'ruler-combined': faRulerCombined,
  'pen-to-square': faPenToSquare,
  palette: faPalette,
};

// Infinite-loop transition used by most demo elements.
const loop = (duration: number, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  repeatType: 'reverse' as const,
  ease: 'easeInOut' as const,
});

/** A small animated visual per feature so the popup actually *shows* how it works. */
function FeatureAnimation({ anim }: { anim: FeatureAnim }) {
  switch (anim) {
    case 'product-listing':
      return (
        <Stage>
          <motion.div
            className="rounded-xl bg-white px-4 py-3 text-left text-xs shadow-md ring-1 ring-black/5"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 1, 1, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {['Title…', 'Description…', 'Price · GST', 'Variants'].map((t, i) => (
              <motion.p
                key={t}
                className="flex items-center gap-2 py-0.5 text-zinc-700"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: [0, 1], x: [-8, 0] }}
                transition={{ duration: 0.4, delay: i * 0.5, repeat: Infinity, repeatDelay: 2.4 }}
              >
                <FontAwesomeIcon icon={faCheck} className="h-3 w-3 text-emerald-500" /> {t}
              </motion.p>
            ))}
          </motion.div>
          <Sparkle />
        </Stage>
      );

    case 'mockup':
      return (
        <Stage>
          <div className="flex items-center gap-2">
            <Chip>design</Chip>
            <motion.span animate={{ scale: [1, 1.3, 1] }} transition={loop(0.9)} className="font-bold text-rose-500">+</motion.span>
            <Chip>cotton</Chip>
            <motion.span animate={{ scale: [1, 1.3, 1] }} transition={loop(0.9, 0.3)} className="font-bold text-rose-500">=</motion.span>
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-tr from-rose-500 to-fuchsia-600 text-white shadow-lg"
              animate={{ rotate: [0, 4, -4, 0], scale: [0.9, 1.05, 0.9] }}
              transition={loop(2)}
            >
              <FontAwesomeIcon icon={faWandMagicSparkles} />
            </motion.div>
          </div>
        </Stage>
      );

    case 'social-post':
      return (
        <Stage>
          <motion.div
            className="w-40 rounded-xl bg-white p-2 shadow-md ring-1 ring-black/5"
            animate={{ y: [0, -6, 0] }}
            transition={loop(2)}
          >
            <div className="h-16 rounded-lg bg-gradient-to-tr from-pink-400 to-orange-400" />
            <div className="mt-2 h-2 w-3/4 rounded bg-zinc-200" />
            <div className="mt-1 flex gap-1">
              {['#sale', '#new', '#ootd'].map((h, i) => (
                <motion.span
                  key={h}
                  className="rounded bg-pink-100 px-1 text-[8px] font-bold text-pink-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1] }}
                  transition={{ duration: 0.3, delay: 0.4 + i * 0.3, repeat: Infinity, repeatDelay: 2 }}
                >
                  {h}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </Stage>
      );

    case 'cart-recovery':
      return (
        <Stage>
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600"
              animate={{ x: [0, 24, 24, 0], opacity: [1, 1, 0.3, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <FontAwesomeIcon icon={faCartArrowDown} className="h-5 w-5" />
            </motion.div>
            <motion.div
              className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow"
              animate={{ scale: [0.8, 1, 1, 0.8], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" /> Come back — 10% off!
            </motion.div>
          </div>
        </Stage>
      );

    case 'fault-check':
      return (
        <Stage>
          <motion.div className="relative h-16 w-40 overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-black/5">
            <motion.div
              className="absolute inset-y-0 w-1 bg-emerald-400/70"
              animate={{ left: ['0%', '100%'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
            />
            <FontAwesomeIcon icon={faHeartPulse} className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-emerald-500" />
          </motion.div>
        </Stage>
      );

    case 'seo':
      return (
        <Stage>
          <div className="flex items-end gap-2">
            {[40, 28, 16].map((h, i) => (
              <motion.div
                key={i}
                className="flex w-9 flex-col items-center justify-end rounded-t bg-gradient-to-t from-indigo-500 to-violet-400 text-[9px] font-bold text-white"
                style={{ height: h }}
                animate={{ height: i === 0 ? [h, h + 14, h] : [h, h - 6, h] }}
                transition={loop(2, i * 0.2)}
              >
                #{i + 1}
              </motion.div>
            ))}
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={loop(1.2)}>
              <FontAwesomeIcon icon={faMagnifyingGlassChart} className="h-6 w-6 text-indigo-500" />
            </motion.div>
          </div>
        </Stage>
      );

    case 'watermark':
      return (
        <Stage>
          <div className="relative h-20 w-28 overflow-hidden rounded-lg bg-gradient-to-tr from-zinc-200 to-zinc-100 shadow ring-1 ring-black/5">
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 1.6 }}
              animate={{ opacity: [0, 0.85, 0.85], scale: [1.6, 1, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.6 }}
            >
              <FontAwesomeIcon icon={faStamp} className="h-3 w-3 text-zinc-700" />
              <span className="ml-1 text-[10px] font-black tracking-wide text-zinc-700">SARA</span>
            </motion.div>
          </div>
        </Stage>
      );

    case 'storage':
      return (
        <Stage>
          <motion.div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-lg"
            animate={{ y: [0, -6, 0] }}
            transition={loop(1.6)}
          >
            <FontAwesomeIcon icon={faCloudArrowUp} className="h-6 w-6" />
          </motion.div>
          <div className="ml-3 flex flex-col gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-16 rounded bg-sky-200"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={loop(1.2, i * 0.3)}
              />
            ))}
          </div>
        </Stage>
      );

    case 'payment-link':
      return (
        <Stage>
          <motion.div
            className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-md ring-1 ring-black/5"
            animate={{ scale: [1, 1.04, 1] }}
            transition={loop(1.4)}
          >
            <FontAwesomeIcon icon={faLink} className="h-3.5 w-3.5 text-violet-500" />
            pay.sara/abc123
          </motion.div>
          <div className="ml-2 flex gap-1">
            {['UPI', 'Cards', 'RP'].map((g, i) => (
              <motion.span
                key={g}
                className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-600"
                animate={{ y: [0, -3, 0] }}
                transition={loop(1, i * 0.2)}
              >
                {g}
              </motion.span>
            ))}
          </div>
        </Stage>
      );

    case 'chatbot':
      return (
        <Stage>
          <div className="w-44 space-y-1.5">
            <Bubble side="left" delay={0}><FontAwesomeIcon icon={faRobot} className="mr-1 h-3 w-3" />Hi! Track an order?</Bubble>
            <Bubble side="right" delay={0.8}>Where is #1042?</Bubble>
            <Bubble side="left" delay={1.6}>Out for delivery 🚚</Bubble>
          </div>
        </Stage>
      );

    case 'size-fit':
      return (
        <Stage>
          <motion.div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-lg"
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={loop(2)}
          >
            <FontAwesomeIcon icon={faRulerCombined} className="h-6 w-6" />
          </motion.div>
          <motion.div
            className="ml-3 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow"
            animate={{ opacity: [0, 1, 1], scale: [0.8, 1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Best fit: M
          </motion.div>
        </Stage>
      );

    case 'product-editor':
      return (
        <Stage>
          <div className="w-44 space-y-1.5">
            <Bubble side="right" delay={0}>Drop all prices 10%</Bubble>
            <Bubble side="left" delay={0.8}><FontAwesomeIcon icon={faBolt} className="mr-1 h-3 w-3 text-amber-500" />Done — 128 products updated</Bubble>
          </div>
        </Stage>
      );

    case 'store-themes':
      return (
        <Stage>
          <div className="flex gap-2">
            {['from-rose-400 to-pink-500', 'from-indigo-400 to-violet-500', 'from-amber-400 to-orange-500'].map((g, i) => (
              <motion.div
                key={g}
                className={`h-14 w-10 rounded-lg bg-gradient-to-b ${g} shadow`}
                animate={{ y: [0, -8, 0], scale: [1, 1.06, 1] }}
                transition={loop(1.6, i * 0.25)}
              />
            ))}
          </div>
        </Stage>
      );

    default:
      return null;
  }
}

// ---- small shared bits ----
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-50 to-white p-4 ring-1 ring-black/5 dark:from-zinc-800 dark:to-zinc-900">
      {children}
    </div>
  );
}
function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-rose-600 shadow ring-1 ring-black/10">{children}</span>;
}
function Sparkle() {
  return (
    <motion.div
      className="ml-3 text-amber-400"
      animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.3, 1] }}
      transition={loop(1.4)}
    >
      <FontAwesomeIcon icon={faWandMagicSparkles} className="h-6 w-6" />
    </motion.div>
  );
}
function Bubble({ side, delay, children }: { side: 'left' | 'right'; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 text-[11px] shadow ${
        side === 'right'
          ? 'ml-auto bg-violet-500 text-white'
          : 'mr-auto bg-white text-zinc-700 ring-1 ring-black/5'
      }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: [0, 1, 1], y: [8, 0, 0] }}
      transition={{ duration: 0.5, delay, repeat: Infinity, repeatDelay: 2.4 }}
    >
      {children}
    </motion.div>
  );
}

/** "How it works" popup for a single plan feature, with a live animated demo. */
export function FeatureInfoDialog({
  feature,
  open,
  onOpenChange,
}: {
  feature: PlanFeature | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!feature) return null;
  const icon = ICONS[feature.icon] ?? faWandMagicSparkles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-lg gap-0 overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl [&>button]:hidden">
        <button
          type="button"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-zinc-600 shadow-md ring-1 ring-black/5 backdrop-blur transition hover:bg-white hover:text-zinc-900"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </button>

        <div className="relative bg-gradient-to-b from-rose-50 via-white to-rose-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-red-950/30">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-16 top-8 h-60 w-60 rounded-full bg-rose-300/20 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-60 w-60 rounded-full bg-rose-300/20 blur-3xl" />
          </div>

          <div className="relative z-10 max-h-[86vh] overflow-y-auto px-6 py-8 sm:px-8">
            {/* Header */}
            <div className="text-center">
              <span className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30">
                <FontAwesomeIcon icon={icon} className="h-6 w-6" />
              </span>
              <h2 className="flex items-center justify-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                {feature.label}
                {feature.beta && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">Beta soon</span>
                )}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{feature.short}</p>
            </div>

            {/* Animated demo */}
            <div className="mt-5">
              <FeatureAnimation anim={feature.anim} />
            </div>

            {/* How it works */}
            <p className="mt-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{feature.how}</p>

            <ol className="mt-4 space-y-2">
              {feature.steps.map((step, i) => (
                <li key={step} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
