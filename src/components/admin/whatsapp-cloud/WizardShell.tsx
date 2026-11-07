import { ReactNode } from 'react';
import { Check, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface WizardStep {
  id: string;
  label: string;
  hint?: string;
  /** Shown as a red dot when the step has problems. */
  problem?: boolean;
}

/** A big window with the steps on the left, the step in the middle, an optional side panel, and the buttons at the bottom. */
export const WizardShell = ({
  open, onOpenChange, page = false, title, subtitle, steps, current, onStep, aside, footer, children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Fill the page instead of floating over it. */
  page?: boolean;
  title: string;
  subtitle?: string;
  steps: WizardStep[];
  current: number;
  onStep: (i: number) => void;
  aside?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) => {
  const body = (
    <>
      <div className={cn('border-b bg-muted/30 px-6 py-4', !page && 'pr-12')}>
        {page ? <h2 className="text-xl font-semibold">{title}</h2> : <DialogTitle className="text-xl">{title}</DialogTitle>}
        {subtitle && (page ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : <DialogDescription className="mt-1">{subtitle}</DialogDescription>)}
        {!subtitle && !page && <DialogDescription className="sr-only">{title}</DialogDescription>}
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b p-3 md:w-60 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-4" aria-label="Steps">
          {steps.map((s, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onStep(i)}
                className={cn(
                  'flex min-w-[140px] items-start gap-3 rounded-lg px-3 py-2 text-left transition md:min-w-0',
                  active ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted/60',
                )}
              >
                <span className={cn(
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  active && 'border-primary bg-primary text-primary-foreground',
                  done && !active && 'border-emerald-500 bg-emerald-500 text-white',
                )}>
                  {done && !active ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {s.label}
                    {s.problem && <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-label="Needs attention" />}
                  </span>
                  {s.hint && <span className="hidden text-xs md:block">{s.hint}</span>}
                </span>
              </button>
            );
          })}
        </nav>

        <div className={cn('grid min-h-0 flex-1', aside ? 'lg:grid-cols-[1fr_360px]' : '')}>
          <div className={cn('min-h-0 p-6', !page && 'overflow-y-auto')}>{children}</div>
          {aside && <aside className={cn('border-l bg-muted/20 p-5 lg:block', page ? 'hidden lg:block' : 'hidden overflow-y-auto')}><div className={page ? 'sticky top-4' : ''}>{aside}</div></aside>}
        </div>
      </div>

      <div className={cn('flex flex-wrap items-center justify-between gap-2 border-t bg-background px-6 py-3', page && 'sticky bottom-0 z-10')}>{footer}</div>
    </>
  );

  if (page) return <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">{body}</div>;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] w-[96vw] max-w-[1280px] flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">{body}</DialogContent>
    </Dialog>
  );
};

/** A short "why this step matters" note. */
export const WhyBox = ({ title, children, tone = 'info' }: { title: string; children: ReactNode; tone?: 'info' | 'warn' }) => (
  <div className={cn('flex gap-3 rounded-xl border p-3 text-sm', tone === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-sky-200 bg-sky-50 text-sky-900')}>
    <Info className="mt-0.5 h-4 w-4 shrink-0" />
    <div>
      <p className="font-semibold">{title}</p>
      <div className="mt-0.5 text-[13px] leading-relaxed opacity-90">{children}</div>
    </div>
  </div>
);

/** A titled section of a step. */
export const Section = ({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) => (
  <section className="space-y-3">
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
    </div>
    {children}
  </section>
);
