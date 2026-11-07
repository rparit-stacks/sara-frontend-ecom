import { ReactNode } from 'react';
import { Check, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStep {
  id: string;
  label: string;
  hint?: string;
  /** Shown as a red dot when the step has problems. */
  problem?: boolean;
}

/**
 * A full-screen editor for multi-step tasks: a top bar with the title, a step bar and a close button,
 * one wide column for the step, an optional preview on the right, and the buttons in a bottom bar.
 */
export const WizardShell = ({
  open = true, onClose, title, subtitle, steps, current, onStep, aside, footer, children, wide = false,
}: {
  open?: boolean;
  onClose?: () => void;
  title: string;
  subtitle?: string;
  steps: WizardStep[];
  current: number;
  onStep: (i: number) => void;
  aside?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  /** A wider column, for steps that show several options side by side. */
  wide?: boolean;
  // kept so existing callers still compile
  onOpenChange?: (o: boolean) => void;
  page?: boolean;
}) => {
  if (!open) return null;
  const active = steps[current];
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background" role="dialog" aria-label={title}>
      <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-8">
        <button type="button" onClick={onClose} className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h2 className="font-sans truncate font-sans text-base font-semibold leading-tight">{title}</h2>
          <p className="truncate text-xs text-muted-foreground md:hidden">Step {current + 1} of {steps.length}: {active?.label}</p>
          {subtitle && <p className="hidden truncate text-xs text-muted-foreground md:block">{subtitle}</p>}
        </div>

        <ol className="ml-auto hidden items-center md:flex" aria-label="Steps">
          {steps.map((s, i) => {
            const done = i < current;
            const isActive = i === current;
            return (
              <li key={s.id} className="flex items-center">
                {i > 0 && <span className={cn('mx-2 h-px w-5 lg:w-8', done || isActive ? 'bg-primary/50' : 'bg-border')} />}
                <button type="button" onClick={() => onStep(i)} title={s.hint}
                  className={cn('flex items-center gap-2 whitespace-nowrap rounded-full px-2 py-1 text-sm transition', isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  <span className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium',
                    isActive && 'border-primary bg-primary text-primary-foreground',
                    done && 'border-primary/60 bg-primary/10 text-primary',
                  )}>
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={cn('hidden lg:inline', isActive && 'font-medium')}>{s.label}</span>
                  {s.problem && <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-label="Needs attention" />}
                </button>
              </li>
            );
          })}
        </ol>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className={cn('mx-auto w-full px-5 py-8 md:px-8 md:py-10', wide ? 'max-w-5xl' : 'max-w-3xl')}>{children}</div>
        </main>
        {aside && <aside className="hidden w-[400px] shrink-0 overflow-y-auto border-l bg-muted/30 p-6 xl:block 2xl:w-[460px]">{aside}</aside>}
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t bg-background px-4 py-3 md:px-8 lg:pr-64">{footer}</footer>
    </div>
  );
};

/** A short note on why a step matters. Quiet on purpose: a thin accent, not a coloured box. */
export const WhyBox = ({ title, children, tone = 'info' }: { title: string; children: ReactNode; tone?: 'info' | 'warn' }) => (
  <div className={cn('flex gap-3 border-l-2 py-1 pl-4 text-sm', tone === 'warn' ? 'border-amber-500' : 'border-primary/40')}>
    <Info className={cn('mt-0.5 h-4 w-4 shrink-0', tone === 'warn' ? 'text-amber-600' : 'text-muted-foreground')} />
    <div>
      <p className="font-medium">{title}</p>
      <div className="mt-0.5 leading-relaxed text-muted-foreground">{children}</div>
    </div>
  </div>
);

/** A titled section of a step. */
export const Section = ({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) => (
  <section className="space-y-3">
    <div>
      <h3 className="font-sans text-base font-semibold">{title}</h3>
      {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
    </div>
    {children}
  </section>
);

/** The one main heading of a step: what the person is doing here. Everything else on the step is quieter. */
export const StepHead = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-8">
    <h2 className="font-sans text-2xl font-semibold tracking-tight">{title}</h2>
    {subtitle && <p className="mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p>}
  </div>
);
