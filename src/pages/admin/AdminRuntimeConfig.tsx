import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, Eye, EyeOff, FileText, Loader2, Lock, RefreshCw, RotateCcw, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RuntimeConfigAudit } from '@/components/admin/RuntimeConfigAudit';
import { runtimeConfigApi, RuntimeConfigItem } from '@/lib/api';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';
import { cn } from '@/lib/utils';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const splitKey = (key: string) => {
  const i = key.lastIndexOf('.');
  return i === -1 ? { prefix: '', name: key } : { prefix: key.slice(0, i + 1), name: key.slice(i + 1) };
};

const ConfigRow = ({ item }: { item: RuntimeConfigItem }) => {
  const queryClient = useQueryClient();
  const { hasAny } = useAdminPermissions();
  const canEdit = hasAny(item.secret ? P.RUNTIME_CONFIG_EDIT_SECRETS : P.RUNTIME_CONFIG_EDIT);
  // Secrets start empty (the server never returns the full value); plain values start filled.
  const initial = item.secret ? '' : item.value ?? '';
  const [draft, setDraft] = useState(initial);
  const [visible, setVisible] = useState(false);
  const dirty = draft !== initial;
  const { prefix, name } = splitKey(item.key);

  const save = useMutation({
    mutationFn: () => runtimeConfigApi.update(item.key, draft),
    onSuccess: () => {
      toast.success(`${item.key} saved. Applies within ~15 seconds.`);
      setVisible(false);
      if (item.secret) setDraft('');
      queryClient.invalidateQueries({ queryKey: ['runtime-config'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not save'),
  });

  const reveal = !item.secret || visible;

  return (
    <div
      className={cn(
        'grid gap-3 px-4 py-4 border-l-2 transition-colors md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-center',
        dirty ? 'border-l-amber-500 bg-amber-50/50' : 'border-l-transparent hover:bg-muted/40',
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold break-all">{name}</span>
          {item.secret && (
            <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 font-medium">
              <Lock className="h-3 w-3" /> Secret
            </Badge>
          )}
          <Badge
            variant={item.source === 'DB' ? 'default' : 'secondary'}
            className="gap-1 text-[10px] px-1.5 py-0 font-medium"
          >
            {item.source === 'DB' ? <Database className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            {item.source}
          </Badge>
          {item.secret && !item.set && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-medium">
              Not set
            </Badge>
          )}
        </div>
        <p className="mt-1 font-mono text-[11px] leading-snug text-muted-foreground break-all">
          {prefix}
          <span className="text-foreground/70">{name}</span>
        </p>
        {item.updatedAt && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Updated {fmtTime(item.updatedAt)}
            {item.updatedBy ? ` by ${item.updatedBy}` : ''}
          </p>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Input
            type={reveal ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!canEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && dirty && !save.isPending) save.mutate();
              if (e.key === 'Escape') setDraft(initial);
            }}
            placeholder={
              item.secret
                ? item.set
                  ? canEdit
                    ? `${item.value}  ·  type a new value to replace`
                    : item.value ?? ''
                  : 'Not set'
                : 'Empty'
            }
            className={cn('h-10 font-mono text-[13px]', item.secret && 'pr-10')}
          />
          {item.secret && canEdit && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label={visible ? 'Hide value' : 'Show value'}
              title={visible ? 'Hide' : 'Show what you type'}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {canEdit && dirty && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => setDraft(initial)}
            title="Discard changes"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        {canEdit ? (
          <Button className="h-10 shrink-0" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 sm:mr-2" />}
            <span className="hidden sm:inline">Save</span>
          </Button>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">Read-only</span>
        )}
      </div>
    </div>
  );
};

const AdminRuntimeConfig = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['runtime-config'],
    queryFn: () => runtimeConfigApi.list(),
  });

  const items = useMemo(() => data ?? [], [data]);
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((i) => counts.set(i.category, (counts.get(i.category) ?? 0) + 1));
    return Array.from(counts.entries());
  }, [items]);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, RuntimeConfigItem[]>();
    items
      .filter((i) => category === 'All' || i.category === category)
      .filter((i) => !q || i.key.toLowerCase().includes(q))
      .forEach((i) => map.set(i.category, [...(map.get(i.category) ?? []), i]));
    return Array.from(map.entries());
  }, [items, search, category]);

  const secretCount = items.filter((i) => i.secret).length;
  const dbCount = items.filter((i) => i.source === 'DB').length;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight">Runtime Config</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Settings and secrets stored in the database. Changes apply within about 15 seconds, with no restart.
              Secrets are encrypted and never shown in full. Use the eye icon to check what you are typing.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="settings">
          <TabsList className="mb-5">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-0">
          {items.length > 0 && (
            <div className="mb-5 grid grid-cols-3 gap-3">
              {[
                { label: 'Settings', value: items.length },
                { label: 'Secrets', value: secretCount },
                { label: 'Stored in DB', value: dbCount },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border bg-card px-4 py-3">
                  <p className="text-2xl font-bold leading-none">{s.value}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="sticky top-0 z-10 -mx-1 mb-5 space-y-3 bg-muted/30 px-1 py-3 backdrop-blur">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by key, e.g. gemini or mail.host"
                className="h-10 bg-background pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[['All', items.length] as [string, number], ...categories].map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    category === name
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:text-foreground',
                  )}
                >
                  {name} <span className="opacity-70">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {isError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Could not load config. You need the View runtime config permission.
            </p>
          )}
          {!isLoading && !isError && grouped.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">No settings match your search.</p>
          )}

          <div className="space-y-6">
            {grouped.map(([name, rows]) => (
              <section key={name} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <header className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
                  <h2 className="text-base font-semibold">{name}</h2>
                  <span className="text-xs text-muted-foreground">{rows.length} settings</span>
                </header>
                <div className="divide-y">
                  {rows.map((item) => (
                    <ConfigRow key={`${item.key}:${item.updatedAt ?? ''}`} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-0">
            <RuntimeConfigAudit />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminRuntimeConfig;
