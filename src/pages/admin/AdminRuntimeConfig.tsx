import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Lock, RefreshCw, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { runtimeConfigApi, RuntimeConfigItem } from '@/lib/api';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const ConfigRow = ({ item }: { item: RuntimeConfigItem }) => {
  const queryClient = useQueryClient();
  // Secrets start empty (the server never returns the full value); plain values start filled.
  const [draft, setDraft] = useState(item.secret ? '' : item.value ?? '');
  const dirty = item.secret ? draft !== '' : draft !== (item.value ?? '');

  const save = useMutation({
    mutationFn: () => runtimeConfigApi.update(item.key, draft),
    onSuccess: () => {
      toast.success(`${item.key} saved. Applies within ~15 seconds.`);
      if (item.secret) setDraft('');
      queryClient.invalidateQueries({ queryKey: ['runtime-config'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not save'),
  });

  return (
    <div className="flex flex-col gap-2 py-3 border-b last:border-b-0 md:flex-row md:items-center">
      <div className="md:w-96 min-w-0">
        <div className="flex items-center gap-2">
          {item.secret && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <code className="text-xs break-all">{item.key}</code>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={item.source === 'DB' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
            {item.source}
          </Badge>
          {item.updatedAt && (
            <span>
              {fmtTime(item.updatedAt)}
              {item.updatedBy ? ` · ${item.updatedBy}` : ''}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 gap-2 min-w-0">
        <Input
          type={item.secret ? 'password' : 'text'}
          autoComplete="off"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={item.secret ? (item.set ? `${item.value} (enter new value to replace)` : 'Not set') : ''}
          className="font-mono text-sm"
        />
        <Button size="sm" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

const AdminRuntimeConfig = () => {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['runtime-config'],
    queryFn: () => runtimeConfigApi.list(),
  });

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, RuntimeConfigItem[]>();
    (data ?? [])
      .filter((i) => !q || i.key.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
      .forEach((i) => map.set(i.category, [...(map.get(i.category) ?? []), i]));
    return Array.from(map.entries());
  }, [data, search]);

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Runtime Config</h1>
            <p className="text-muted-foreground">
              Settings and secrets stored in the database. Changes apply within about 15 seconds, no restart.
              Secret values are encrypted and never shown in full.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search key or category"
            className="pl-9"
          />
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {isError && <p className="text-destructive">Could not load config. Only the main admin can open this page.</p>}

        <div className="space-y-6">
          {grouped.map(([category, items]) => (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                {items.map((item) => (
                  <ConfigRow key={`${item.key}:${item.updatedAt ?? ''}`} item={item} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRuntimeConfig;
