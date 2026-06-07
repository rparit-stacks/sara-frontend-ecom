import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faWandMagicSparkles, faLayerGroup, faLock, faServer, faAnglesLeft, faCircleCheck, faArrowRight,
} from '@fortawesome/free-solid-svg-icons';

// Bump this version whenever you add a new "What's new" item — even users who
// clicked "Don't show again" will see it once more for the new version.
const WHATS_NEW_VERSION = '2026-06-1';
const DISMISS_KEY = 'adminWhatsNewDismissedVersion';   // persistent: "Don't show again"
const SESSION_KEY = 'adminWhatsNewShownSession';        // per session: auto-show once

interface NewItem {
  icon: any;
  title: string;
  text: string;
  to?: string; // optional deep-link
}

const ITEMS: NewItem[] = [
  {
    icon: faLayerGroup,
    title: 'New: Subscription Plans',
    text: 'Three plans — 🌱 Spark, 🔥 Ignite, 🚀 Orbit — billed monthly as a 6 or 12-month pack. Tap any feature’s ⓘ to see how it works.',
    to: '/admin-sara/subscriptions/plans',
  },
  {
    icon: faLock,
    title: 'New: Premium Features section',
    text: 'A preview page for every premium feature in the sidebar — see exactly what each one does before you unlock it.',
  },
  {
    icon: faServer,
    title: 'New: Maintenance plan',
    text: 'One fully-managed plan: the entire Orbit feature set + multi-server hosting + done-for-you upkeep. 3 / 6 / 12-month billing.',
    to: '/admin-sara/subscriptions/maintenance',
  },
  {
    icon: faAnglesLeft,
    title: 'Improved: Collapsible sidebar',
    text: 'Fold any section by clicking its title, or shrink the whole sidebar to icons — your choice is remembered.',
  },
];

/**
 * "What's new" intro shown when the admin panel opens.
 * - Closing with X (or outside): shows again next time.
 * - "Don't show again": remembered (per version) and never shown again.
 */
export function WhatsNewDialog() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let dismissed = '';
    let shownThisSession = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) || '';
      shownThisSession = sessionStorage.getItem(SESSION_KEY) === WHATS_NEW_VERSION;
    } catch { /* ignore */ }
    // Show once per browser session (so route changes don't re-pop), unless the
    // user permanently dismissed this version with "Don't show again".
    if (dismissed !== WHATS_NEW_VERSION && !shownThisSession) {
      setOpen(true);
      try { sessionStorage.setItem(SESSION_KEY, WHATS_NEW_VERSION); } catch { /* ignore */ }
    }
  }, []);

  const dontShowAgain = () => {
    try {
      localStorage.setItem(DISMISS_KEY, WHATS_NEW_VERSION);
    } catch { /* ignore */ }
    setOpen(false);
  };

  const goTo = (to?: string) => {
    if (!to) return;
    setOpen(false);
    navigate(to);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[94vw] max-w-2xl gap-0 overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl [&>button]:hidden">
        {/* X — closes but does NOT remember; shows again next time */}
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

          <div className="relative z-10 max-h-[84vh] overflow-y-auto px-6 py-8 sm:px-10">
            {/* Hero */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30"
              >
                <FontAwesomeIcon icon={faWandMagicSparkles} className="h-7 w-7" />
              </motion.div>
              <h2 className="text-3xl font-bold tracking-tight">What’s new in your store</h2>
              <p className="mx-auto mt-2 max-w-lg text-[15px] text-muted-foreground">
                We’ve added some powerful new features. Here’s a quick tour — explore them anytime from the sidebar.
              </p>
            </div>

            {/* Items */}
            <div className="mt-6 space-y-3">
              {ITEMS.map((it, i) => (
                <motion.div
                  key={it.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.07 }}
                  className="flex items-start gap-3.5 rounded-2xl bg-white/70 p-4 ring-1 ring-black/[0.05] backdrop-blur dark:bg-white/5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950">
                    <FontAwesomeIcon icon={it.icon} className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{it.title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{it.text}</p>
                    {it.to && (
                      <button
                        onClick={() => goTo(it.to)}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Open <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-7 flex flex-col items-center gap-3">
              <Button
                size="lg"
                className="w-full gap-2 rounded-full bg-gradient-to-tr from-rose-600 to-red-600 sm:w-auto sm:px-10"
                onClick={() => setOpen(false)}
              >
                <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" /> I understand
              </Button>
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
