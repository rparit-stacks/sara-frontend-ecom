import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faWandMagicSparkles, faArrowRight, faArrowLeft, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FeatureAnimation } from '@/components/admin/FeatureInfoDialog';
import type { FeatureAnim } from '@/lib/planFeatures';

// Bump this version whenever you change the steps below — even users who clicked
// "Don't show again" will see the tour once more for the new version.
const WHATS_NEW_VERSION = '2026-06-1';
const DISMISS_KEY = 'adminWhatsNewDismissedVersion';   // persistent: "Don't show again"
const SEEN_LOGIN_KEY = 'adminWhatsNewSeenLoginTime';    // shown once per login session

interface Step {
  anim?: FeatureAnim;        // live demo animation (reused from the feature popups)
  badge: string;
  title: string;
  text: string;
  to?: string;               // optional deep-link
}

// First step is a welcome; the rest each showcase a feature with its live animation.
const STEPS: Step[] = [
  {
    badge: 'What’s new',
    title: 'Your store just got more powerful',
    text: 'We’ve shipped a few big upgrades. Here’s a 60-second tour of what’s new — tap Next to see each one in action.',
  },
  {
    anim: 'product-listing',
    badge: 'New',
    title: 'AI Product Listing',
    text: 'Just chat — the assistant drafts the title, price, GST, variants and description. A ready-to-sell product in seconds.',
    to: '/admin-sara/products',
  },
  {
    anim: 'social-post',
    badge: 'New',
    title: 'AI Social Post Generator',
    text: 'Turn any product into an Instagram / Facebook creative — styled image, caption and smart hashtags, instantly.',
  },
  {
    anim: 'cart-recovery',
    badge: 'New',
    title: 'AI Abandoned Cart Recovery',
    text: 'Customers who leave get an automatic WhatsApp/email nudge with a smart discount — recovered sales on autopilot.',
  },
];

/**
 * Multi-step "What's new" tour shown when the admin panel opens.
 * - Close with X (or outside): shows again next session.
 * - "Don't show again": remembered per version, never shown again.
 */
export function WhatsNewDialog() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1); // slide direction

  useEffect(() => {
    let dismissed = '';
    let loginTime = '';
    let seenForLogin = '';
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) || '';
      loginTime = localStorage.getItem('adminLoginTime') || '';
      seenForLogin = localStorage.getItem(SEEN_LOGIN_KEY) || '';
    } catch { /* ignore */ }

    // Permanently dismissed for this version → never show.
    if (dismissed === WHATS_NEW_VERSION) return;

    // Show once per login: only if we haven't already shown it for THIS login
    // session (so route changes within a session don't re-pop, but a fresh
    // login does). The seen key stores "<loginTime>:<version>".
    const seenTag = `${loginTime}:${WHATS_NEW_VERSION}`;
    if (seenForLogin !== seenTag) {
      setOpen(true);
      try { localStorage.setItem(SEEN_LOGIN_KEY, seenTag); } catch { /* ignore */ }
    }
  }, []);

  const isLast = step === STEPS.length - 1;
  const cur = STEPS[step];

  const next = () => { setDir(1); setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => { setDir(-1); setStep((s) => Math.max(s - 1, 0)); };

  const dontShowAgain = () => {
    try { localStorage.setItem(DISMISS_KEY, WHATS_NEW_VERSION); } catch { /* ignore */ }
    setOpen(false);
  };
  const goTo = (to?: string) => { if (!to) return; setOpen(false); navigate(to); };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[94vw] max-w-xl gap-0 overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl [&>button]:hidden">
        {/* X — closes but does NOT remember; shows again next session */}
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-zinc-600 shadow-md ring-1 ring-black/5 backdrop-blur transition hover:bg-white hover:text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-300"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </button>

        <div className="relative bg-gradient-to-b from-slate-50 via-white to-rose-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-red-950/40">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-rose-300/20 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
          </div>

          <div className="relative z-10 px-6 py-8 sm:px-10">
            {/* Sliding step content */}
            <div className="relative min-h-[360px]">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  initial={{ opacity: 0, x: dir * 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -60 }}
                  transition={{ duration: 0.32, ease: 'easeInOut' }}
                  className="flex flex-col items-center text-center"
                >
                  {step === 0 ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30"
                    >
                      <FontAwesomeIcon icon={faWandMagicSparkles} className="h-7 w-7" />
                    </motion.div>
                  ) : (
                    // Live animated demo of the feature
                    <div className="mb-4 w-full max-w-sm">
                      {cur.anim && <FeatureAnimation anim={cur.anim} />}
                    </div>
                  )}

                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                    {cur.badge}
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{cur.title}</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{cur.text}</p>

                  {cur.to && (
                    <button
                      onClick={() => goTo(cur.to)}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Open this <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                    </button>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress dots */}
            <div className="mt-2 flex items-center justify-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to step ${i + 1}`}
                  onClick={() => { setDir(i > step ? 1 : -1); setStep(i); }}
                  className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-rose-600' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'}`}
                />
              ))}
            </div>

            {/* Nav buttons */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={back} disabled={step === 0} className="gap-2">
                <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" /> Back
              </Button>

              {isLast ? (
                <Button className="gap-2 rounded-full bg-gradient-to-tr from-rose-600 to-red-600 px-7" onClick={() => setOpen(false)}>
                  <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" /> I understand
                </Button>
              ) : (
                <Button className="gap-2 rounded-full bg-gradient-to-tr from-rose-600 to-red-600 px-7" onClick={next}>
                  Next <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={dontShowAgain}
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Don’t show this again
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
