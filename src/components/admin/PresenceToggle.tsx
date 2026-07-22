import { useAdminPresenceContext } from '@/context/AdminPresenceContext';
import { cn } from '@/lib/utils';

interface PresenceToggleProps {
  /** 'full' shows the pill button with label; 'compact' is icon-tight for sidebars. */
  variant?: 'full' | 'compact';
  className?: string;
}

/**
 * The logged-in admin's manual online/offline switch, for the header.
 * Green = online, grey = offline. Manual only — clicking flips the intent;
 * the backend keeps them online only while the connection stays alive.
 */
export default function PresenceToggle({ variant = 'full', className }: PresenceToggleProps) {
  const { myOnline, setMyOnline, toggling, myAdminId } = useAdminPresenceContext();

  // No identity (not an admin session) => nothing to toggle.
  if (myAdminId == null) return null;

  const toggle = () => {
    if (toggling) return;
    void setMyOnline(!myOnline);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={toggling}
      title={myOnline ? 'You are Online — click to go Offline' : 'You are Offline — click to go Online'}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border transition-colors disabled:opacity-60',
        variant === 'full' ? 'px-3 h-9 text-[13px]' : 'px-2 h-8 text-[12px]',
        myOnline
          ? 'border-green-500/40 bg-green-500/10 text-green-600 hover:bg-green-500/15'
          : 'border-gray-300 bg-transparent text-gray-500 hover:bg-black/5',
        className,
      )}
    >
      <span className="relative flex h-2.5 w-2.5">
        {myOnline && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
        )}
        <span
          className={cn(
            'relative inline-flex h-2.5 w-2.5 rounded-full',
            myOnline ? 'bg-green-500' : 'bg-gray-300',
          )}
        />
      </span>
      <span className="font-medium">
        {toggling ? '…' : myOnline ? 'Online' : 'Offline'}
      </span>
    </button>
  );
}
