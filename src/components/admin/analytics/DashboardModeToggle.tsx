import { LayoutDashboard, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export type DashboardMode = 'normal' | 'advanced';

interface Props {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
}

/**
 * Segmented switch to flip between the classic dashboard and the 3D advanced
 * analytics dashboard. Styled with the theme primary; the active pill slides.
 */
export function DashboardModeToggle({ mode, onChange }: Props) {
  const options: { key: DashboardMode; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'normal', label: 'Normal', icon: LayoutDashboard },
    { key: 'advanced', label: 'Advanced', icon: Sparkles },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = mode === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className="relative px-4 py-2 rounded-full text-sm font-semibold transition-colors"
          >
            {active && (
              <motion.span
                layoutId="dash-mode-pill"
                className="absolute inset-0 rounded-full bg-primary shadow-sm"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-1.5 ${active ? 'text-white' : 'text-muted-foreground'}`}>
              <Icon className="w-4 h-4" />
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
