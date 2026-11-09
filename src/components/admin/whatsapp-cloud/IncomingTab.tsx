import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { whatsappCloudApi } from '@/lib/api';
import { ErrorNote, fmtDateTime, formatPhone, timeAgo, useDebounced } from './shared';

const SIZE = 25;
const TYPES = ['text', 'image', 'video', 'audio', 'document', 'sticker', 'button', 'interactive', 'location', 'reaction'];

type SortKey = 'receivedAt' | 'name' | 'from' | 'text';

const SortHead = ({
  label, field, sort, dir, onSort, className,
}: { label: string; field: SortKey; sort: SortKey; dir: 'asc' | 'desc'; onSort: (f: SortKey) => void; className?: string }) => (
  <TableHead className={className}>
    <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1 font-medium hover:text-foreground">
      {label}
      {sort === field ? (dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
    </button>
  </TableHead>
);

const dayStart = (d: string) => (d ? new Date(`${d}T00:00:00`).toISOString() : undefined);
const nextDayStart = (d: string) => (d ? new Date(new Date(`${d}T00:00:00`).getTime() + 864e5).toISOString() : undefined);

/** Messages customers sent to the business number: search, filter and sort. */
export const IncomingTab = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('all');
  const [optOut, setOptOut] = useState('all');
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  const [sort, setSort] = useState<SortKey>('receivedAt');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');

  const q = useDebounced(search.trim());
  const from = useDebounced(phone.replace(/\D/g, ''));

  const onSort = (field: SortKey) => {
    if (sort === field) setDir(dir === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setDir(field === 'receivedAt' ? 'desc' : 'asc'); }
    setPage(0);
  };

  const filtered = !!(search || phone || type !== 'all' || optOut !== 'all' || since || until);
  const clear = () => { setSearch(''); setPhone(''); setType('all'); setOptOut('all'); setSince(''); setUntil(''); setPage(0); };
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0); };

  const query = useQuery({
    queryKey: ['waCloudInbound', page, q, from, type, optOut, since, until, sort, dir],
    queryFn: () => whatsappCloudApi.listInbound({
      page, size: SIZE, q: q || undefined, from: from || undefined,
      type: type === 'all' ? undefined : type,
      optedOut: optOut === 'all' ? undefined : optOut,
      since: dayStart(since), until: nextDayStart(until), sort, dir,
    }),
    refetchInterval: 30_000,
  });
  const data = query.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Input value={search} onChange={(e) => reset(setSearch)(e.target.value)} placeholder="Search name or message" className="w-56" />
        <Input value={phone} onChange={(e) => reset(setPhone)(e.target.value)} placeholder="Number" className="w-40" />
        <Select value={type} onValueChange={reset(setType)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={optOut} onValueChange={reset(setOptOut)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Opt-out" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Opted out: any</SelectItem>
            <SelectItem value="true">Opted out only</SelectItem>
            <SelectItem value="false">Not opted out</SelectItem>
          </SelectContent>
        </Select>
        <label className="text-xs text-muted-foreground">From
          <Input type="date" value={since} onChange={(e) => reset(setSince)(e.target.value)} className="mt-1 w-40" />
        </label>
        <label className="text-xs text-muted-foreground">To
          <Input type="date" value={until} onChange={(e) => reset(setUntil)(e.target.value)} className="mt-1 w-40" />
        </label>
        {filtered && <Button variant="ghost" size="sm" onClick={clear}><X className="mr-1 h-4 w-4" /> Clear</Button>}
        <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
        {data && <span className="pb-2 text-sm text-muted-foreground">{data.totalElements} messages</span>}
      </div>

      {query.isError && <ErrorNote error={query.error} />}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHead label="Sender" field="name" sort={sort} dir={dir} onSort={onSort} />
              <SortHead label="Number" field="from" sort={sort} dir={dir} onSort={onSort} className="w-44" />
              <SortHead label="Message" field="text" sort={sort} dir={dir} onSort={onSort} />
              <SortHead label="Received" field="receivedAt" sort={sort} dir={dir} onSort={onSort} className="w-44" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.content ?? []).map((m) => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap font-medium">{m.name || <span className="text-muted-foreground">No name</span>}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">{formatPhone(m.from)}</TableCell>
                <TableCell className="max-w-xl">
                  {m.text ? <span className="whitespace-pre-wrap break-words">{m.text}</span>
                    : <span className="text-muted-foreground">[{m.type}]</span>}
                  {m.optedOut && <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-700">Opted out</span>}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm" title={fmtDateTime(m.receivedAt)}>{timeAgo(m.receivedAt)}</TableCell>
              </TableRow>
            ))}
            {data && data.content.length === 0 && (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                {filtered ? 'No messages match these filters.' : 'No incoming messages yet.'}
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {data.totalPages}</span>
          <Button variant="outline" size="icon" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
};
