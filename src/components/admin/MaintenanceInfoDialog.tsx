import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import {
  Wrench,
  Bug,
  Shield,
  ShieldCheck,
  Database,
  Gauge,
  Save,
  Server,
  HardDrive,
  Activity,
  Scaling,
  Lock,
  Globe,
  Headset,
  Siren,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import { MaintenanceDemo } from './maintenanceDemos';
import type { MaintFeature } from '@/pages/admin/maintenanceData';

const ICONS: Record<string, LucideIcon> = {
  wrench: Wrench,
  bug: Bug,
  shield: Shield,
  'shield-check': ShieldCheck,
  database: Database,
  gauge: Gauge,
  save: Save,
  server: Server,
  'hard-drive': HardDrive,
  activity: Activity,
  scaling: Scaling,
  lock: Lock,
  globe: Globe,
  headset: Headset,
  siren: Siren,
  'clipboard-list': ClipboardList,
};

/** "How it works" popup for a single maintenance feature, with a live animated demo. */
export function MaintenanceInfoDialog({
  feature,
  open,
  onOpenChange,
}: {
  feature: MaintFeature | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!feature) return null;
  const Icon = ICONS[feature.icon] ?? Wrench;

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
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{feature.title}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{feature.short}</p>
            </div>

            {/* Animated demo */}
            <div className="mt-5">
              <MaintenanceDemo anim={feature.anim} />
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
