import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles,
  faBolt,
  faComments,
  faImages,
  faReceipt,
  faLanguage,
  faCoins,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { aiProductApi } from '@/lib/api';

// Honest, but enthusiastically framed — every claim maps to something the AI actually does.
const PERKS = [
  { icon: faComments, title: 'Just chat — it builds the product', text: 'Describe it in plain English; the assistant asks a few quick questions and fills the rest.' },
  { icon: faImages, title: 'Upload photos, done', text: 'Drop your product images in the chat — they’re attached automatically.' },
  { icon: faReceipt, title: 'Smart HSN & GST', text: 'Suggests the right HSN code and sets the matching GST for you.' },
  { icon: faBolt, title: 'Variants & details, auto-drafted', text: 'Sizes, colors with prices, a clean description and detail sections — all drafted for you to confirm.' },
  { icon: faLanguage, title: 'You stay in control', text: 'Nothing goes live until you review the preview and hit Create.' },
];

export function AiIntroDialog({
  open,
  onOpenChange,
  onStart,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStart: () => void; // open the chat (called when credits available)
}) {
  const { data: status } = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => aiProductApi.status(),
    enabled: open,
  });

  const credits = Number((status as any)?.credits ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-3xl gap-0 overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl [&>button]:hidden">
        {/* Custom close — sits above the z-10 content so it's always clickable */}
        <button
          type="button"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-zinc-600 shadow-md ring-1 ring-black/5 backdrop-blur transition hover:bg-white hover:text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-300"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </button>
        <div className="relative bg-gradient-to-b from-slate-50 via-white to-rose-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-red-950/40">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-rose-300/20 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-rose-300/20 blur-3xl" />
          </div>

          <div className="relative z-10 max-h-[82vh] overflow-y-auto px-6 py-8 sm:px-10">
            {/* Hero */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30"
              >
                <FontAwesomeIcon icon={faWandMagicSparkles} className="h-7 w-7" />
              </motion.div>
              <h2 className="text-3xl font-bold tracking-tight">Create products with AI</h2>
              <p className="mx-auto mt-2 max-w-lg text-[15px] text-muted-foreground">
                Turn a few sentences into a ready-to-publish product. Faster than the form, and it handles the boring
                parts — HSN, GST, variants and a polished description.
              </p>
              {credits > 0 && (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                  <FontAwesomeIcon icon={faCoins} className="h-3.5 w-3.5" /> {credits} credits left
                </span>
              )}
            </div>

            {/* Perks */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {PERKS.map((p) => (
                <div key={p.title} className="flex gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-black/[0.05] backdrop-blur dark:bg-white/5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950">
                    <FontAwesomeIcon icon={p.icon} className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* If has credits: start. Else: a simple no-credits notice. */}
            {credits > 0 ? (
              <div className="mt-7 flex justify-center">
                <Button
                  size="lg"
                  className="gap-2 rounded-full bg-gradient-to-tr from-rose-600 to-red-600 px-8"
                  onClick={() => { onOpenChange(false); onStart(); }}
                >
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="h-4 w-4" /> Start creating
                </Button>
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-dashed border-rose-300 bg-rose-50/60 p-5 text-center dark:border-rose-900 dark:bg-rose-950/20">
                <p className="text-sm font-semibold">No AI credits available right now</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Credit top-ups are being set up — please contact the administrator to enable AI product creation.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
