import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faLock, faClock, faArrowRight } from '@fortawesome/free-solid-svg-icons';

/**
 * Shown whenever a store admin tries to use a premium feature that hasn't been
 * unlocked by a plan yet. Purely informational — sends them to the Plans page.
 */
export function PaidPlanDialog({
  open,
  onOpenChange,
  featureName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  featureName?: string;
}) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-md gap-0 overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl [&>button]:hidden">
        <button
          type="button"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-zinc-600 shadow-md ring-1 ring-black/5 backdrop-blur transition hover:bg-white hover:text-zinc-900"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </button>

        <div className="relative bg-gradient-to-b from-rose-50 via-white to-rose-50 px-6 py-8 text-center dark:from-zinc-900 dark:via-zinc-900 dark:to-red-950/30">
          <span className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30">
            <FontAwesomeIcon icon={faLock} className="h-7 w-7" />
          </span>
          <h2 className="text-xl font-bold tracking-tight">This is a paid plan feature</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {featureName ? <span className="font-medium text-foreground">{featureName}</span> : 'This feature'} is part
            of our premium plans. Check our plans to unlock it for your store.
          </p>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <FontAwesomeIcon icon={faClock} className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              After payment, it may take some time for the feature to become active on your store. You’ll be notified
              once it’s ready.
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              className="w-full bg-gradient-to-tr from-rose-600 to-red-600"
              onClick={() => {
                onOpenChange(false);
                navigate('/admin-sara/subscriptions/plans');
              }}
            >
              Check our Plans <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
