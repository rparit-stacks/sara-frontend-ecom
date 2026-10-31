import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronLeft, ChevronRight, History, Loader2, Lock, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { runtimeConfigApi, RuntimeConfigAuditItem } from '@/lib/api';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const ValueChip = ({ value, empty }: { value: string | null; empty: string }) => (
  <code
    className="max-w-full truncate rounded bg-muted px-2 py-1 font-mono text-[12px] text-foreground/80"
    title={value ?? undefined}
  >
    {value === null || value === '' ? <span className="italic text-muted-foreground">{empty}</span> : value}
  </code>
);

const AuditRow = ({ entry }: { entry: RuntimeConfigAuditItem }) => (
  <div className="grid gap-3 px-4 py-4 hover:bg-muted/40 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)] md:items-center">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="break-all text-sm font-semibold">{entry.key.slice(entry.key.lastIndexOf('.') + 1)}</span>
        {entry.secret && (
          <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px] font-medium">
            <Lock className="h-3 w-3" /> Secret
          </Badge>
        )}
        {entry.category && (
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
            {entry.category}
          </Badge>
        )}
      </div>
      <p className="mt-1 break-all font-mono text-[11px] leading-snug text-muted-foreground">{entry.key}</p>
    </div>

    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <ValueChip value={entry.oldValue} empty="empty" />
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      <ValueChip value={entry.newValue} empty="empty" />
    </div>

    <div className="text-xs text-muted-foreground md:text-right">
      <p className="font-medium text-foreground/80">{entry.changedBy ?? 'unknown'}</p>
      <p className="mt-0.5">{fmtTime(entry.changedAt)}</p>
    </div>
  </div>
);

export const RuntimeConfigAudit = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  // Debounce typing so each keystroke does not hit the API.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['runtime-config-audit', query, page],
    queryFn: () => runtimeConfigApi.audit(query, page),
    placeholderData: keepPreviousData,
  });

  const rows = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by key or admin email"
            className="h-10 bg-background pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {data ? `${data.totalElements} change${data.totalElements === 1 ? '' : 's'}` : ''}
          {isFetching && !isLoading ? ' · updating…' : ''}
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {isError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Could not load the audit log. You need the View runtime config permission.
        </p>
      )}
      {!isLoading && !isError && rows.length === 0 && (
        <div className="rounded-xl border bg-card py-16 text-center">
          <History className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {query ? 'No changes match your search.' : 'No changes recorded yet. Edits made from this page show up here.'}
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <header className="hidden border-b bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)]">
            <span>Setting</span>
            <span>Change</span>
            <span className="text-right">Changed by</span>
          </header>
          <div className="divide-y">
            {rows.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
