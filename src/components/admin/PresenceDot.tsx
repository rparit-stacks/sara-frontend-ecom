import { cn } from '@/lib/utils';

interface PresenceDotProps {
  online: boolean;
  /** Show the "Online"/"Offline" text label next to the dot. */
  withLabel?: boolean;
  className?: string;
}

/**
 * Small status dot for admin presence. Green (pulsing) = online, grey = offline.
 * Driven by useAdminPresence(). Independent of account status (Active/Inactive).
 */
export default function PresenceDot({ online, withLabel = false, className }: PresenceDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex h-2.5 w-2.5">
        {online && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
        )}
        <span
          className={cn(
            'relative inline-flex h-2.5 w-2.5 rounded-full',
            online ? 'bg-green-500' : 'bg-gray-300',
          )}
        />
      </span>
      {withLabel && (
        <span className={cn('text-xs font-medium', online ? 'text-green-600' : 'text-gray-400')}>
          {online ? 'Online' : 'Offline'}
        </span>
      )}
    </span>
  );
}
