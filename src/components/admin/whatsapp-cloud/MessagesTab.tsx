import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Loader2, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { whatsappCloudApi, WaCloudMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  ErrorNote, MessageStatusBadge, failureHint, fmtDateTime, formatPhone, timeAgo, useDebounced,
} from './shared';

const STATUSES = ['QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED'];
const RANGES = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

const rangeStart = (range: string): string | undefined => {
  const now = new Date();
  if (range === 'today') {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (range === '7d') return new Date(Date.now() - 7 * 864e5).toISOString();
  if (range === '30d') return new Date(Date.now() - 30 * 864e5).toISOString();
  return undefined;
};

type SortKey = 'createdAt' | 'to' | 'templateKey' | 'status';

const SortHead = ({
  label, field, sort, dir, onSort, className,
}: {
  label: string; field: SortKey; sort: SortKey; dir: 'asc' | 'desc'; onSort: (f: SortKey) => void; className?: string;
}) => (
  <TableHead className={className}>
    <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1 font-medium hover:text-foreground">
      {label}
      {sort === field ? (dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
    </button>
  </TableHead>
);

const MessageDrawer = ({
  message, canEdit, onClose,
}: { message: WaCloudMessage | null; canEdit: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const events = useQuery({
    queryKey: ['waCloudMessageEvents', message?.id],
    queryFn: () => whatsappCloudApi.getMessageEvents(message!.id),
    enabled: !!message,
  });
  const retry = useMutation({
    mutationFn: () => whatsappCloudApi.retryMessage(message!.id),
    onSuccess: () => {
      toast.success('Message queued again');
      queryClient.invalidateQueries({ queryKey: ['waCloudMessages'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || 'Could not retry'),
  });

  const rows: Array<[string, string]> = message
    ? [
        ['To', formatPhone(message.to)],
        ['Template', message.templateKey],
        ['Created', fmtDateTime(message.createdAt)],
        ['Sent', fmtDateTime(message.sentAt)],
        ['Delivered', fmtDateTime(message.deliveredAt)],
        ['Read', fmtDateTime(message.readAt)],
        ['Priority', message.priority],
        ['Attempts', String(message.attempts)],
      ]
    : [];
  const hint = message ? failureHint(message.errorCode, message.errorMessage, message.skipReason) : '';

  return (
    <Sheet open={!!message} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {message && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                Message <MessageStatusBadge status={message.status} />
              </SheetTitle>
              <SheetDescription className="break-all">ID {message.id}</SheetDescription>
            </SheetHeader>

            {hint && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <p className="font-medium">{hint}</p>
                {message.errorCode && <p className="mt-1 text-xs opacity-80">Code {message.errorCode}{message.errorMessage ? ` · ${message.errorMessage}` : ''}</p>}
              </div>
            )}

            <dl className="mt-4 divide-y rounded-lg border text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-3 py-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium break-all">{v}</dd>
                </div>
              ))}
            </dl>

            <h4 className="mt-6 mb-2 text-sm font-semibold">Timeline</h4>
            {events.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : events.isError ? (
              <ErrorNote error={events.error} />
            ) : (
              <ol className="relative space-y-3 border-l pl-4">
                {(events.data ?? []).map((e) => (
                  <li key={e.id} className="text-sm">
                    <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                    <div className="flex items-center gap-2">
                      <MessageStatusBadge status={e.status} />
                      <span className="text-xs text-muted-foreground">{fmtDateTime(e.at)}</span>
                    </div>
                    {(e.errorCode || e.detail) && <p className="mt-0.5 text-xs text-muted-foreground">{e.errorCode} {e.detail}</p>}
                  </li>
                ))}
                {(events.data ?? []).length === 0 && <li className="text-sm text-muted-foreground">No events yet.</li>}
              </ol>
            )}

            {canEdit && message.status === 'FAILED' && (
              <Button className="mt-6 w-full gap-2" onClick={() => retry.mutate()} disabled={retry.isPending}>
                {retry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Try sending again
              </Button>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export const MessagesTab = ({ canEdit }: { canEdit: boolean }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [range, setRange] = useState('all');
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortKey>('createdAt');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [auto, setAuto] = useState(false);
  const [selected, setSelected] = useState<WaCloudMessage | null>(null);
  const q = useDebounced(search.trim());

  useEffect(() => setPage(0), [q, status, range, pageSize, sort, dir]);

  const query = useQuery({
    queryKey: ['waCloudMessages', q, status, range, pageSize, page, sort, dir],
    queryFn: () =>
      whatsappCloudApi.listMessages({
        q: q || undefined,
        status: status === 'all' ? undefined : status,
        from: rangeStart(range),
        size: pageSize,
        page,
        sort,
        dir,
      }),
    placeholderData: (prev) => prev,
    refetchInterval: auto ? 30_000 : false,
  });

  const onSort = (field: SortKey) => {
    if (sort === field) setDir(dir === 'asc' ? 'desc' : 'asc');
    else {
      setSort(field);
      setDir(field === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const data = query.data;
  const total = data?.totalElements ?? 0;
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, page * pageSize + (data?.content.length ?? 0));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by phone number, template or error…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="lg:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="lg:w-40"><SelectValue placeholder="When" /></SelectTrigger>
          <SelectContent>{RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
          <SelectTrigger className="lg:w-32"><SelectValue /></SelectTrigger>
          <SelectContent>{[10, 15, 25].map((n) => <SelectItem key={n} value={String(n)}>{n} per page</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="wa-auto" checked={auto} onCheckedChange={setAuto} />
            <Label htmlFor="wa-auto" className="text-xs text-muted-foreground whitespace-nowrap">Auto refresh</Label>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={cn('h-4 w-4', query.isFetching && 'animate-spin')} /> Refresh
          </Button>
        </div>
      </div>

      {query.isError && <ErrorNote error={query.error} />}

      <div className="overflow-hidden rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <SortHead label="When" field="createdAt" sort={sort} dir={dir} onSort={onSort} />
              <SortHead label="To" field="to" sort={sort} dir={dir} onSort={onSort} />
              <SortHead label="Template" field="templateKey" sort={sort} dir={dir} onSort={onSort} className="hidden md:table-cell" />
              <SortHead label="Status" field="status" sort={sort} dir={dir} onSort={onSort} />
              <TableHead className="hidden lg:table-cell">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
            ) : (data?.content.length ?? 0) === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground">No messages found{q || status !== 'all' || range !== 'all' ? ' for these filters' : ' yet'}.</TableCell></TableRow>
            ) : (
              data!.content.map((m) => (
                <TableRow key={m.id} className="cursor-pointer" onClick={() => setSelected(m)}>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm font-medium">{timeAgo(m.createdAt)}</div>
                    <div className="text-xs text-muted-foreground">{fmtDateTime(m.createdAt)}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">{formatPhone(m.to)}</TableCell>
                  <TableCell className="hidden md:table-cell"><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{m.templateKey}</code></TableCell>
                  <TableCell><MessageStatusBadge status={m.status} /></TableCell>
                  <TableCell className="hidden max-w-[260px] truncate text-sm text-muted-foreground lg:table-cell">
                    {failureHint(m.errorCode, m.errorMessage, m.skipReason) || (m.readAt ? `Read ${timeAgo(m.readAt)}` : m.deliveredAt ? `Delivered ${timeAgo(m.deliveredAt)}` : '')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[88px] text-center">Page {page + 1} of {Math.max(1, data?.totalPages ?? 1)}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => p + 1)} disabled={!data || page + 1 >= data.totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <MessageDrawer message={selected} canEdit={canEdit} onClose={() => setSelected(null)} />
    </div>
  );
};
