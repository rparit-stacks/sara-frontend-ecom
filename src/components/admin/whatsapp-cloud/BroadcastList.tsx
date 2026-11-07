import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Loader2, Megaphone, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { whatsappCloudApi, WaCloudBroadcast } from '@/lib/api';
import { cn } from '@/lib/utils';
import { BroadcastStatusBadge, ErrorNote, fmtDateTime, timeAgo } from './shared';
import { ProgressBar, progressOf, useBroadcastActions } from './broadcastActions';

const LANES: Array<{ id: string; label: string; hint: string }> = [
  { id: 'ALL', label: 'All', hint: 'Every broadcast' },
  { id: 'RUNNING', label: 'Sending now', hint: 'Messages are going out' },
  { id: 'SCHEDULED', label: 'Scheduled', hint: 'Waiting for their time' },
  { id: 'DRAFT', label: 'Drafts', hint: 'Saved, not started' },
  { id: 'PAUSED', label: 'Paused', hint: 'Stopped for now' },
  { id: 'COMPLETED', label: 'Finished', hint: 'All messages created' },
  { id: 'CANCELLED', label: 'Cancelled', hint: 'Stopped for good' },
];

export const BroadcastList = ({ canEdit }: { canEdit: boolean }) => {
  const navigate = useNavigate();
  const [lane, setLane] = useState('ALL');
  const { buttons, dialog } = useBroadcastActions();
  const query = useQuery({
    queryKey: ['waCloudBroadcasts', 'all'],
    queryFn: () => whatsappCloudApi.listBroadcasts(0, 100),
    placeholderData: (prev) => prev,
    refetchInterval: (q) => ((q.state.data?.content ?? []).some((b) => b.status === 'RUNNING') ? 8_000 : 30_000),
  });

  const all = query.data?.content ?? [];
  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: all.length };
    all.forEach((b) => { m[b.status] = (m[b.status] ?? 0) + 1; });
    return m;
  }, [all]);
  const shown = lane === 'ALL' ? all : all.filter((b) => b.status === lane);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {LANES.map((l) => (
            <button key={l.id} type="button" onClick={() => setLane(l.id)} title={l.hint}
              className={cn('flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition', lane === l.id ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted/60')}>
              {l.label}
              <span className={cn('rounded-full px-1.5 text-xs tabular-nums', lane === l.id ? 'bg-primary-foreground/20' : 'bg-muted')}>{counts[l.id] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={cn('h-4 w-4', query.isFetching && 'animate-spin')} /> Refresh
          </Button>
          {canEdit && <Button size="sm" className="gap-2" onClick={() => navigate('/admin-sara/whatsapp/broadcasts/new')}><Plus className="h-4 w-4" /> New broadcast</Button>}
        </div>
      </div>

      {query.isError && <ErrorNote error={query.error} />}
      {query.isLoading && <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}

      {!query.isLoading && shown.length === 0 && (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">{lane === 'ALL' ? 'No broadcasts yet' : 'Nothing here'}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {lane === 'ALL' ? 'A broadcast sends one template to many customers. Create your first one and send yourself a test before it goes out.' : 'No broadcast is in this state right now.'}
          </p>
          {canEdit && lane === 'ALL' && <Button className="mt-4 gap-2" onClick={() => navigate('/admin-sara/whatsapp/broadcasts/new')}><Plus className="h-4 w-4" /> Create a broadcast</Button>}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {shown.map((b: WaCloudBroadcast) => {
          const p = progressOf(b);
          return (
            <Link key={b.id} to={`/admin-sara/whatsapp/broadcasts/${b.id}`} className="flex flex-col gap-3 rounded-2xl border bg-background p-4 transition hover:border-primary/50 hover:shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground"><code>{b.templateKey}</code> · {b.kind === 'COLLECTION_LAUNCH' ? 'Collection launch' : 'Campaign'}</p>
                </div>
                <BroadcastStatusBadge status={b.status} />
              </div>
              <div>
                <ProgressBar b={b} />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {b.messagesCreated === 0 ? 'Not started' : `${p.reached} reached · ${p.waiting} waiting · ${p.failed} failed · ${b.messagesCreated} total`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{b.allContacts ? 'All who agreed' : b.tags?.length ? `Tags: ${b.tags.join(', ')}` : `${b.recipientsListed} numbers`}</span>
                {b.status === 'SCHEDULED' && b.scheduledAt ? <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {fmtDateTime(b.scheduledAt)}</span> : <span>Created {timeAgo(b.createdAt)}</span>}
              </div>
              {canEdit && <div className="flex gap-1 border-t pt-3">{buttons(b)}</div>}
            </Link>
          );
        })}
      </div>
      {dialog}
    </div>
  );
};
