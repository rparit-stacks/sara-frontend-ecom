import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Loader2, Lock, Power, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { marketplaceApi, MarketplaceItemState } from '@/lib/api';
import { formatInr } from '@/data/platformPayments';
import { cn } from '@/lib/utils';
import { BuyQrDialog } from './BuyQrDialog';

/** Counts down the trial's ON-time. The server says how many seconds are left; we only tick from there, and only while the theme is on. */
const useCountdown = (secondsLeft: number, fetchedAt: number, running: boolean) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (secondsLeft <= 0 || !running) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [secondsLeft, running]);
  // Paused: the server's number is already the time left, and it does not move.
  const left = running ? Math.max(0, secondsLeft - Math.floor((now - fetchedAt) / 1000)) : secondsLeft;
  return {
    left,
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
  };
};

const Unit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex-1 rounded-lg border bg-background py-2.5 text-center">
    <motion.p key={value} initial={{ y: -6, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }} className="text-2xl font-semibold tabular-nums leading-none">
      {String(value).padStart(2, '0')}
    </motion.p>
    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
  </div>
);

/** The buying box on a product page: price, start the trial, the countdown, buy, and the on/off switch. */
export const PurchasePanel = ({
  item, name, canManage, fetchedAt, offlineReason, onRetry,
}: {
  item: MarketplaceItemState; name: string; canManage: boolean; fetchedAt: number;
  /** Set when the server could not be reached: the buttons still show, the trial one waits. */
  offlineReason?: string; onRetry?: () => void;
}) => {
  const queryClient = useQueryClient();
  const [buyOpen, setBuyOpen] = useState(false);
  const running = item.status === 'TRIAL' && item.enabled;
  const countdown = useCountdown(item.secondsLeft, fetchedAt, running);
  const trialPercent = useMemo(() => Math.round(((item.trialDays * 86400 - countdown.left) / (item.trialDays * 86400)) * 100), [item.trialDays, countdown.left]);

  const refresh = (next: MarketplaceItemState) => {
    queryClient.setQueryData(['marketplace', item.key], next);
    queryClient.invalidateQueries({ queryKey: ['marketplace'] });
  };
  const trial = useMutation({
    mutationFn: () => marketplaceApi.startTrial(item.key),
    onSuccess: (next) => { refresh(next); toast.success(`Your ${item.trialDays}-day trial has started. ${name} is live on your shop.`); },
    onError: (e: any) => toast.error(e?.message || 'Could not start the trial'),
  });
  const toggle = useMutation({
    mutationFn: (on: boolean) => marketplaceApi.setEnabled(item.key, on),
    onSuccess: (next) => { refresh(next); toast.success(next.enabled ? `${name} is now live on your shop` : 'Back to your classic look'); },
    onError: (e: any) => toast.error(e?.message || 'Could not change the switch'),
  });

  const owned = item.status === 'OWNED';
  const onTrial = item.status === 'TRIAL';
  const ended = item.status === 'TRIAL_ENDED';
  const usable = owned || onTrial;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">One-time price</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight">{formatInr(item.priceInr)}</p>
        </div>
        {owned ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Purchased</span>
        ) : onTrial ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"><Clock className="h-3.5 w-3.5" /> {running ? 'On trial' : 'Trial paused'}</span>
        ) : ended ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Trial ended</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" /> {item.trialDays} days free</span>
        )}
      </div>

      {onTrial && (
        <div className="mt-5">
          <div className="flex gap-2">
            <Unit value={countdown.days} label="Days" />
            <Unit value={countdown.hours} label="Hours" />
            <Unit value={countdown.minutes} label="Min" />
            <Unit value={countdown.seconds} label="Sec" />
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${trialPercent}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {running
              ? <>Counting down while it is switched on. It would run out on {item.trialEndsAt ? new Date(item.trialEndsAt + 'Z').toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'a later date'} if you leave it on.</>
              : <>The timer is paused. It only runs while the theme is switched on, and carries on from here.</>}
          </p>
        </div>
      )}
      {ended && (
        <p className="mt-5 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800">
          Your {item.trialDays} days of free use are up, so your shop is back to its classic look. Buy the theme to bring it back.
        </p>
      )}

      <div className="mt-5 space-y-2.5">
        {item.status === 'AVAILABLE' && (
          <Button className="h-11 w-full gap-2" disabled={!!offlineReason || !canManage || trial.isPending} onClick={() => trial.mutate()}>
            {trial.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Start {item.trialDays}-day free trial
          </Button>
        )}
        {!owned && (
          <Button variant={item.status === 'AVAILABLE' ? 'outline' : 'default'} className="h-11 w-full gap-2" onClick={() => setBuyOpen(true)}>
            <ShoppingBag className="h-4 w-4" /> Buy for {formatInr(item.priceInr)}
          </Button>
        )}
      </div>

      {(item.status !== 'AVAILABLE') && (
        <div className={cn('mt-5 flex items-center justify-between gap-4 rounded-xl border p-4', item.live ? 'border-primary/40 bg-primary/5' : 'bg-muted/40')}>
          <div className="flex items-start gap-3">
            {usable ? <Power className={cn('mt-0.5 h-4 w-4', item.live ? 'text-primary' : 'text-muted-foreground')} /> : <Lock className="mt-0.5 h-4 w-4 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium">{item.live ? 'Live on your shop' : 'Switched off'}</p>
              <p className="text-xs text-muted-foreground">{usable ? 'Turn it on or off any time.' : 'Buy it to switch it on.'}</p>
            </div>
          </div>
          <Switch checked={item.live} disabled={!canManage || toggle.isPending || (!usable && !item.enabled)} onCheckedChange={(on) => toggle.mutate(on)} aria-label={`Switch ${name} on or off`} />
        </div>
      )}

      {offlineReason && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          <p className="font-medium">The trial status could not be loaded.</p>
          <p className="mt-0.5 opacity-80">{offlineReason}</p>
          {onRetry && <button type="button" onClick={onRetry} className="mt-1.5 font-semibold underline underline-offset-2">Try again</button>}
        </div>
      )}
      {!canManage && !offlineReason && <p className="mt-4 text-xs text-muted-foreground">You can look around, but starting a trial or changing the switch needs the "Manage marketplace" permission.</p>}
      <BuyQrDialog open={buyOpen} onOpenChange={setBuyOpen} name={`${name} theme`} amount={item.priceInr} />
    </div>
  );
};
