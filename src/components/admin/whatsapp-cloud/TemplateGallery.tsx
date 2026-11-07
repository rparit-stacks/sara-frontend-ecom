import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List, Loader2, Lock, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { whatsappCloudApi, WaCloudTemplate, WaCloudPlatformTemplate } from '@/lib/api';
import { describeTemplate } from '@/lib/waTemplateRules';
import { cn } from '@/lib/utils';
import { CategoryBadge, ErrorNote, TemplateStatusBadge, fmtDateTime, timeAgo } from './shared';
import { TemplatePreview } from './TemplatePreview';

export const TemplateGallery = ({ canEdit }: { canEdit: boolean }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [viewing, setViewing] = useState<WaCloudTemplate | null>(null);
  const [toDelete, setToDelete] = useState<WaCloudTemplate | null>(null);

  const query = useQuery({ queryKey: ['waCloudTemplates'], queryFn: whatsappCloudApi.listTemplates });
  const platformQuery = useQuery({ queryKey: ['waCloudPlatformTemplates'], queryFn: whatsappCloudApi.platformTemplates, retry: false });
  const platformByName = useMemo(() => {
    const m = new Map<string, WaCloudPlatformTemplate>();
    (platformQuery.data ?? []).forEach((p) => m.set(p.name, p));
    return m;
  }, [platformQuery.data]);
  const missingPlatform = (platformQuery.data ?? []).filter((p) => !(query.data ?? []).some((t) => t.key === p.name || t.metaName === p.name));

  const sync = useMutation({
    mutationFn: whatsappCloudApi.syncTemplates,
    onSuccess: (r) => { toast.success(`Updated ${r.synced} template${r.synced === 1 ? '' : 's'} from WhatsApp`); queryClient.invalidateQueries({ queryKey: ['waCloudTemplates'] }); },
    onError: (e: any) => toast.error(e?.message || 'Could not refresh templates'),
  });
  const remove = useMutation({
    mutationFn: (key: string) => whatsappCloudApi.deleteTemplate(key),
    onSuccess: () => { toast.success('Template deleted'); setToDelete(null); queryClient.invalidateQueries({ queryKey: ['waCloudTemplates'] }); },
    onError: (e: any) => toast.error(e?.message || 'Could not delete the template'),
  });

  const all = query.data ?? [];
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all
      .filter((t) => (category === 'all' || t.category === category) && (status === 'all' || t.status === status))
      .filter((t) => !term || t.key.toLowerCase().includes(term) || t.metaName.toLowerCase().includes(term))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [all, search, category, status]);

  const counts = { total: all.length, approved: all.filter((t) => t.status === 'APPROVED').length, pending: all.filter((t) => t.status === 'PENDING').length, rejected: all.filter((t) => ['REJECTED', 'PAUSED', 'DISABLED'].includes(t.status)).length };
  const edit = (t: WaCloudTemplate) => navigate(`/admin-sara/whatsapp/templates/${encodeURIComponent(t.key)}/edit`);
  const isPlatform = (t: WaCloudTemplate) => platformByName.has(t.key);

  const actions = (t: WaCloudTemplate) => canEdit && (
    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => edit(t)} disabled={t.status === 'PENDING'} aria-label={`Edit ${t.key}`} title={t.status === 'PENDING' ? 'Wait for the review to finish before editing' : 'Edit'}><Pencil className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setToDelete(t)} disabled={isPlatform(t)} aria-label={`Delete ${t.key}`} title={isPlatform(t) ? 'Used by the platform, so it cannot be deleted' : 'Delete'}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
  const platformBadge = (t: WaCloudTemplate) => isPlatform(t) && (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800" title={`Used by the platform: ${platformByName.get(t.key)!.label}`}><Lock className="h-3 w-3" /> Used by platform</span>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[['all', 'All templates', counts.total, ''], ['APPROVED', 'Approved', counts.approved, 'text-emerald-700'], ['PENDING', 'In review', counts.pending, 'text-amber-700'], ['REJECTED', 'Need attention', counts.rejected, 'text-red-700']].map(([v, l, n, c]) => (
          <button key={v as string} type="button" onClick={() => setStatus(v as string)} className={cn('rounded-xl border bg-background p-4 text-left transition hover:border-primary/50', status === v && 'border-primary bg-primary/5')}>
            <p className="text-sm text-muted-foreground">{l}</p><p className={cn('mt-1 text-3xl font-semibold tabular-nums', c as string)}>{n}</p>
          </button>
        ))}
      </div>

      {missingPlatform.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">The platform sends {missingPlatform.length} template{missingPlatform.length === 1 ? '' : 's'} that {missingPlatform.length === 1 ? 'is' : 'are'} not in WhatsApp yet</p>
          <p className="mt-0.5 text-xs">{missingPlatform.map((p) => `${p.name} (${p.variables} variable${p.variables === 1 ? '' : 's'})`).join(', ')}. Create {missingPlatform.length === 1 ? 'it' : 'them'} with exactly these names, or those messages will fail.</p>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…" className="pl-9" /></div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="lg:w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="UTILITY">Utility</SelectItem><SelectItem value="MARKETING">Marketing</SelectItem><SelectItem value="AUTHENTICATION">Login code</SelectItem></SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="lg:w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="APPROVED">Approved</SelectItem><SelectItem value="PENDING">In review</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem></SelectContent>
        </Select>
        <div className="flex gap-2">
          <div className="flex rounded-lg border p-0.5">
            <Button size="icon" variant={view === 'cards' ? 'secondary' : 'ghost'} className="h-8 w-8" onClick={() => setView('cards')} aria-label="Card view"><LayoutGrid className="h-4 w-4" /></Button>
            <Button size="icon" variant={view === 'table' ? 'secondary' : 'ghost'} className="h-8 w-8" onClick={() => setView('table')} aria-label="Table view"><List className="h-4 w-4" /></Button>
          </div>
          <Button variant="outline" size="sm" className="h-10 gap-2" onClick={() => sync.mutate()} disabled={sync.isPending || !canEdit}><RefreshCw className={cn('h-4 w-4', sync.isPending && 'animate-spin')} /> Refresh</Button>
          {canEdit && <Button size="sm" className="h-10 gap-2" onClick={() => navigate('/admin-sara/whatsapp/templates/new')}><Plus className="h-4 w-4" /> New template</Button>}
        </div>
      </div>

      {query.isError && <ErrorNote error={query.error} />}
      {query.isLoading && <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
      {!query.isLoading && rows.length === 0 && <p className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">{all.length === 0 ? 'No templates yet. Create one, or refresh to pull the ones already on WhatsApp.' : 'No templates match these filters.'}</p>}

      {view === 'cards' ? (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {rows.map((t) => (
            <div key={t.id} onClick={() => setViewing(t)} className="flex cursor-pointer flex-col gap-3 rounded-xl border bg-background p-4 transition hover:border-primary/50">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><code className="block truncate text-sm font-semibold">{t.key}</code><p className="text-xs text-muted-foreground">{t.language} · {t.bodyParameters?.length ?? 0} variable{(t.bodyParameters?.length ?? 0) === 1 ? '' : 's'} · {timeAgo(t.updatedAt || t.syncedAt)}</p></div>
                <TemplateStatusBadge status={t.status} />
              </div>
              <div className="max-h-56 overflow-hidden rounded-xl">{t.components?.length ? <TemplatePreview parts={describeTemplate(t.category, t.components)} className="p-2" /> : <p className="rounded-xl bg-muted/40 p-6 text-center text-xs text-muted-foreground">Preview appears after the next refresh.</p>}</div>
              <div className="flex items-center justify-between"><div className="flex flex-wrap items-center gap-1.5"><CategoryBadge category={t.category} />{platformBadge(t)}</div>{actions(t)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader><TableRow className="bg-muted/40"><TableHead>Template</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Variables</TableHead><TableHead className="hidden lg:table-cell">Updated</TableHead>{canEdit && <TableHead className="w-24" />}</TableRow></TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => setViewing(t)}>
                  <TableCell><div className="flex flex-wrap items-center gap-2"><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{t.key}</code>{platformBadge(t)}</div></TableCell>
                  <TableCell><CategoryBadge category={t.category} /></TableCell>
                  <TableCell><TemplateStatusBadge status={t.status} /></TableCell>
                  <TableCell className="hidden text-sm md:table-cell">{t.bodyParameters?.length ?? 0}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{timeAgo(t.updatedAt || t.syncedAt)}</TableCell>
                  {canEdit && <TableCell>{actions(t)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          {viewing && (
            <>
              <SheetHeader>
                <SheetTitle className="flex flex-wrap items-center gap-2"><code className="text-lg">{viewing.key}</code><TemplateStatusBadge status={viewing.status} /></SheetTitle>
                <SheetDescription><CategoryBadge category={viewing.category} /> · {viewing.language} · {viewing.bodyParameters?.length ?? 0} variable{(viewing.bodyParameters?.length ?? 0) === 1 ? '' : 's'}</SheetDescription>
              </SheetHeader>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold">How it looks</p>
                  {viewing.components?.length ? <TemplatePreview parts={describeTemplate(viewing.category, viewing.components)} /> : <p className="rounded-xl border p-4 text-sm text-muted-foreground">The content appears after the next refresh from WhatsApp.</p>}
                </div>
                <div className="space-y-4">
                  {isPlatform(viewing) && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                      <p className="flex items-center gap-1.5 font-semibold"><Lock className="h-3.5 w-3.5" /> Used by the platform: {platformByName.get(viewing.key)!.label}</p>
                      <p className="mt-1">You can change the wording and the buttons. It must keep exactly {platformByName.get(viewing.key)!.variables} variable{platformByName.get(viewing.key)!.variables === 1 ? '' : 's'}, and it cannot be deleted.</p>
                    </div>
                  )}
                  <dl className="divide-y rounded-xl border text-sm">
                    {([['Type', viewing.category === 'AUTHENTICATION' ? 'Login code' : viewing.category.charAt(0) + viewing.category.slice(1).toLowerCase()], ['Quality', viewing.quality && viewing.quality !== 'UNKNOWN' ? viewing.quality : 'Not rated yet'], ['Language', viewing.language], ['Last updated', fmtDateTime(viewing.updatedAt || viewing.syncedAt)]] as Array<[string, string]>).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 px-3 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                    ))}
                  </dl>
                  {viewing.status === 'PENDING' && <p className="text-xs text-muted-foreground">WhatsApp is still reviewing this template, so it cannot be edited yet.</p>}
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button className="flex-1 gap-2" disabled={viewing.status === 'PENDING'} onClick={() => edit(viewing)}><Pencil className="h-4 w-4" /> Edit</Button>
                      <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700" disabled={isPlatform(viewing)} onClick={() => { setToDelete(viewing); setViewing(null); }}><Trash2 className="h-4 w-4" /> Delete</Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.key}”?</AlertDialogTitle>
            <AlertDialogDescription>This removes the template from WhatsApp as well. Messages that use it will stop working. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => toDelete && remove.mutate(toDelete.key)}>{remove.isPending ? 'Deleting…' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
