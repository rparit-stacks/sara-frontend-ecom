import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { askAboutEntity, askAdminAi, type AdminAiAskPayload } from './askAdminAi';

type EntityAsk = Parameters<typeof askAboutEntity>[0];

type Props = {
  /** Structured entity ask (preferred). */
  entity?: EntityAsk;
  /** Or a raw prompt / payload. */
  ask?: string | AdminAiAskPayload;
  label?: string;
  title?: string;
  size?: 'icon' | 'sm' | 'default';
  variant?: 'ghost' | 'outline' | 'secondary' | 'default';
  className?: string;
  /** Show even without STORE_ADMIN_AI_OPEN (not recommended). */
  force?: boolean;
};

/**
 * Amber AI affordance — opens Ops AI with a contextual prompt about this row/page.
 * Hidden when the admin cannot open Ops AI.
 */
export function AskAdminAiButton({
  entity,
  ask,
  label = 'Ask AI',
  title = 'Ask Ops AI about this',
  size = 'icon',
  variant = 'ghost',
  className,
  force = false,
}: Props) {
  const { ready, hasAny, isMainAdmin, unscopedFullAccess } = useAdminPermissions();
  const canOpen = force || isMainAdmin || unscopedFullAccess || hasAny('STORE_ADMIN_AI_OPEN');
  if (!ready || !canOpen) return null;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (entity) askAboutEntity(entity);
    else if (ask) askAdminAi(ask);
  };

  if (size === 'icon') {
    return (
      <Button
        type="button"
        variant={variant}
        size="icon"
        className={cn(
          'h-8 w-8 shrink-0 text-amber-700 hover:text-amber-800 hover:bg-amber-50',
          className,
        )}
        title={title}
        aria-label={title}
        onClick={onClick}
      >
        <Sparkles className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size === 'default' ? 'default' : 'sm'}
      className={cn(
        'gap-1.5 text-amber-800 border-amber-300/80 hover:bg-amber-50',
        className,
      )}
      title={title}
      onClick={onClick}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
