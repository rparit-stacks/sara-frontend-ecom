import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface LockedCardProps {
  children: ReactNode;
  /** Optional header (title/label) shown CLEAR — never blurred — so the user
   *  knows what the locked card is for. */
  header?: ReactNode;
  /** When true, content is blurred and locked behind the upgrade overlay. */
  locked?: boolean;
  className?: string;
}

/**
 * Wraps any dashboard widget. When `locked`, the real content is blurred and
 * non-interactive, with a lock overlay + "Unlock" button that routes to the
 * maintenance/upgrade page. The `header` stays sharp so the user can read what
 * the card is for even while its data is hidden.
 */
export function LockedCard({ children, header, locked = true, className = '' }: LockedCardProps) {
  const navigate = useNavigate();

  if (!locked) return <>{children}</>;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border bg-white shadow-sm ${className}`}>
      {/* Clear header */}
      {header && <div className="relative z-20 px-6 pt-6">{header}</div>}

      <div className="relative">
        {/* Real content, blurred & inert */}
        <div className="pointer-events-none select-none blur-[6px] saturate-50 opacity-80" aria-hidden>
          {children}
        </div>

        {/* Lock overlay (covers only the content area, not the header) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate('/admin-sara/maintenance')}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/40 backdrop-blur-[2px] cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Lock className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate('/admin-sara/maintenance'); }}
            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
          >
            Unlock
          </button>
          <p className="text-xs text-muted-foreground font-medium">Premium feature</p>
        </motion.div>
      </div>
    </div>
  );
}
