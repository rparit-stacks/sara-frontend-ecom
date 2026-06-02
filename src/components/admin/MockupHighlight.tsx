import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faXmark, faPlus, faEquals, faBolt, faIndianRupeeSign, faClock } from '@fortawesome/free-solid-svg-icons';

const FABRICS = ['Cotton', 'Linen', 'Silk', 'Denim'];

const BENEFITS = [
  { icon: faBolt, title: 'Seconds, not days', text: 'A ready, on-brand mockup instantly — no back-and-forth with a designer.' },
  { icon: faIndianRupeeSign, title: 'Save designer fees', text: 'No Photoshop, no freelancer bills. It’s included free in your Premium plan.' },
  { icon: faClock, title: '10 every month', text: 'Generate up to 10 fresh mockups a month. Credits refresh automatically.' },
];

/** Visual "how it works" popup for the AI mockup generator (Premium perk). */
export function MockupHighlight({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-2xl gap-0 overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl [&>button]:hidden">
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

          <div className="relative z-10 max-h-[86vh] overflow-y-auto px-6 py-8 sm:px-10">
            {/* Header */}
            <div className="text-center">
              <span className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="h-6 w-6" />
              </span>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">AI Mockup Generator</h2>
              <p className="mx-auto mt-2 max-w-md text-[15px] text-muted-foreground">
                Give a design and a fabric name — get a studio-quality, branded product mockup. No designer. No Photoshop.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-rose-700">
                Premium · 10 free / month
              </span>
            </div>

            {/* Visual equation: design + fabric = mockup (full images, not cropped) */}
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {/* design */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <a href="/bg_vectors/design.png" target="_blank" rel="noreferrer" title="Open full image"
                   className="flex h-40 w-40 items-center justify-center rounded-2xl bg-white p-3 shadow-md ring-1 ring-black/10 transition hover:ring-rose-300">
                  <img src="/bg_vectors/design.png" alt="Your design" className="max-h-full max-w-full object-contain" />
                </a>
                <span className="mt-1.5 text-xs font-medium text-muted-foreground">Your design</span>
              </motion.div>

              <FontAwesomeIcon icon={faPlus} className="h-5 w-5 shrink-0 text-rose-500" />

              {/* fabric */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="flex h-40 w-32 flex-col items-center justify-center rounded-2xl bg-white px-2 text-center shadow-md ring-1 ring-black/10">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Fabric</span>
                  <span className="text-xl font-bold text-rose-600">Cotton</span>
                  <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                    {FABRICS.slice(1).map((f) => (
                      <span key={f} className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-500">{f}</span>
                    ))}
                  </div>
                </div>
                <span className="mt-1.5 text-xs font-medium text-muted-foreground">Pick a fabric</span>
              </motion.div>

              <FontAwesomeIcon icon={faEquals} className="h-5 w-5 shrink-0 text-rose-500" />

              {/* mockup — full image visible (object-contain) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="flex flex-col items-center"
              >
                <a href="/bg_vectors/mockup.png" target="_blank" rel="noreferrer" title="Open full image"
                   className="relative flex h-44 w-44 items-center justify-center rounded-2xl bg-white p-2 shadow-lg ring-2 ring-rose-400 transition hover:ring-rose-500">
                  <img src="/bg_vectors/mockup.png" alt="Generated mockup" className="max-h-full max-w-full object-contain" />
                  <span className="absolute bottom-1.5 right-1.5 rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-bold text-white shadow">
                    AI mockup
                  </span>
                </a>
                <span className="mt-1.5 text-xs font-semibold text-rose-600">Branded mockup ✨</span>
              </motion.div>
            </div>

            {/* Full preview of the generated mockup */}
            <div className="mt-5">
              <p className="mb-2 text-center text-xs font-medium text-muted-foreground">Full preview</p>
              <a href="/bg_vectors/mockup.png" target="_blank" rel="noreferrer"
                 className="block overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/10">
                <img src="/bg_vectors/mockup.png" alt="Full AI mockup preview" className="mx-auto max-h-[42vh] w-auto object-contain" />
              </a>
            </div>

            {/* Benefits */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {BENEFITS.map((b) => (
                <div key={b.title} className="rounded-2xl bg-white/70 p-4 text-center ring-1 ring-black/[0.05] backdrop-blur dark:bg-white/5">
                  <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950">
                    <FontAwesomeIcon icon={b.icon} className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold">{b.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{b.text}</p>
                </div>
              ))}
            </div>

            <Button
              className="mt-6 w-full rounded-full bg-gradient-to-tr from-rose-600 to-red-600"
              onClick={() => onOpenChange(false)}
            >
              Got it — included in Premium
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
