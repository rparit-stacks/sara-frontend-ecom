import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pause, Play, RotateCcw, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { whatsappCloudApi, WaCloudBroadcast } from '@/lib/api';
import { cn } from '@/lib/utils';

export type BroadcastAction = 'start' | 'pause' | 'resume' | 'cancel';

const CONFIRM: Record<BroadcastAction, string> = {
  start: 'This starts sending now to everyone in the audience.',
  pause: 'No new messages will be created. Messages already waiting will still go out.',
  resume: 'Sending continues from where it stopped.',
  cancel: 'Sending stops, including messages that are still waiting. This cannot be undone.',
};

/** The buttons a broadcast can have in its current state, with a confirmation before anything happens. */
export const useBroadcastActions = () => {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<{ b: WaCloudBroadcast; action: BroadcastAction } | null>(null);
  const act = useMutation({
    mutationFn: ({ b, action }: { b: WaCloudBroadcast; action: BroadcastAction }) => whatsappCloudApi.broadcastAction(b.id, action),
    onSuccess: (_, v) => {
      toast.success({ start: 'Broadcast started', pause: 'Broadcast paused', resume: 'Broadcast resumed', cancel: 'Broadcast cancelled' }[v.action]);
      setConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['waCloudBroadcasts'] });
      queryClient.invalidateQueries({ queryKey: ['waCloudBroadcast'] });
    },
    onError: (e: any) => { toast.error(e?.message || 'That did not work'); setConfirm(null); },
  });

  const buttons = (b: WaCloudBroadcast, size: 'sm' | 'default' = 'sm') => {
    const btn = (action: BroadcastAction, label: string, icon: JSX.Element, danger = false) => (
      <Button key={action} size={size} variant={danger ? 'ghost' : 'outline'} className={cn('gap-1.5', danger && 'text-red-600 hover:text-red-700')}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirm({ b, action }); }}>
        {icon}{label}
      </Button>
    );
    const cancel = btn('cancel', 'Cancel', <Square className="h-3.5 w-3.5" />, true);
    if (b.status === 'DRAFT' || b.status === 'SCHEDULED') return <>{btn('start', 'Start now', <Play className="h-3.5 w-3.5" />)}{cancel}</>;
    if (b.status === 'RUNNING') return <>{btn('pause', 'Pause', <Pause className="h-3.5 w-3.5" />)}{cancel}</>;
    if (b.status === 'PAUSED') return <>{btn('resume', 'Resume', <RotateCcw className="h-3.5 w-3.5" />)}{cancel}</>;
    return null;
  };

  const dialog = (
    <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirm && `${confirm.action.charAt(0).toUpperCase()}${confirm.action.slice(1)} “${confirm.b.name}”?`}</AlertDialogTitle>
          <AlertDialogDescription>{confirm && CONFIRM[confirm.action]}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not now</AlertDialogCancel>
          <AlertDialogAction onClick={() => confirm && act.mutate(confirm)} className={confirm?.action === 'cancel' ? 'bg-red-600 hover:bg-red-700' : ''}>
            {act.isPending ? 'Working…' : 'Yes, continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { buttons, dialog };
};

export const progressOf = (b: WaCloudBroadcast) => {
  const c = b.counts ?? {};
  const reached = (c.DELIVERED ?? 0) + (c.READ ?? 0);
  const failed = (c.FAILED ?? 0) + (c.SKIPPED ?? 0);
  const sent = c.SENT ?? 0;
  const waiting = (c.QUEUED ?? 0) + (c.SENDING ?? 0);
  return { reached, failed, sent, waiting, total: Math.max(b.messagesCreated, 1) };
};

export const ProgressBar = ({ b }: { b: WaCloudBroadcast }) => {
  const p = progressOf(b);
  const pct = (n: number) => `${Math.min(100, (n / p.total) * 100)}%`;
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
      <div className="bg-emerald-500" style={{ width: pct(p.reached) }} />
      <div className="bg-sky-400" style={{ width: pct(p.sent) }} />
      <div className="bg-amber-300" style={{ width: pct(p.waiting) }} />
      <div className="bg-red-400" style={{ width: pct(p.failed) }} />
    </div>
  );
};
