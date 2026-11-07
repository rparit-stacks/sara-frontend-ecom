import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Lock, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { CategoryBadge, ErrorNote, TemplateStatusBadge, fmtDateTime, timeAgo } from './shared';
import { TemplateBuilder } from './TemplateBuilder';
import { TemplatePreview } from './TemplatePreview';
import { describeTemplate } from '@/lib/waTemplateRules';

export const TemplatesTab = ({ canEdit }: { canEdit: boolean }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<WaCloudTemplate | null>(null);
  const [viewing, setViewing] = useState<WaCloudTemplate | null>(null);
  const [toDelete, setToDelete] = useState<WaCloudTemplate | null>(null);

  const query = useQuery({ queryKey: ['waCloudTemplates'], queryFn: whatsappCloudApi.listTemplates });
  // Templates the platform itself sends cannot be deleted or lose a variable.
  const platformQuery = useQuery({ queryKey: ['waCloudPlatformTemplates'], queryFn: whatsappCloudApi.platformTemplates, retry: false });
  const platformByName = useMemo(() => {
    const m = new Map<string, WaCloudPlatformTemplate>();
    (platformQuery.data ?? []).forEach((p) => m.set(p.name, p));
    return m;
  }, [platformQuery.data]);
  const missingPlatform = (platformQuery.data ?? []).filter((p) => !(query.data ?? []).some((t) => t.key === p.name || t.metaName === p.name));

  const sync = useMutation({
    mutationFn: whatsappCloudApi.syncTemplates,
    onSuccess: (r) => {
      toast.success(`Updated ${r.synced} template${r.synced === 1 ? '' : 's'} from WhatsApp`);
      queryClient.invalidateQueries({ queryKey: ['waCloudTemplates'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Could not refresh templates'),
  });

  const remove = useMutation({
    mutationFn: (key: string) => whatsappCloudApi.deleteTemplate(key),
    onSuccess: () => {
      toast.success('Template deleted');
      setToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['waCloudTemplates'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Could not delete the template'),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data ?? [])
      .filter((t) => (category === 'all' || t.category === category) && (status === 'all' || t.status === status))
      .filter((t) => !term || t.key.toLowerCase().includes(term) || t.metaName.toLowerCase().includes(term))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [query.data, search, category, status]);

  const counts = useMemo(() => {
    const all = query.data ?? [];
    return {
      total: all.length,
      approved: all.filter((t) => t.status === 'APPROVED').length,
      pending: all.filter((t) => t.status === 'PENDING').length,
      rejected: all.filter((t) => t.status === 'REJECTED').length,
    };
  }, [query.data]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Total', counts.total, ''],
          ['Approved', counts.approved, 'text-emerald-700'],
          ['In review', counts.pending, 'text-amber-700'],
          ['Rejected', counts.rejected, 'text-red-700'],
        ].map(([label, value, color]) => (
          <div key={label as string} className="rounded-xl border bg-background px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn('text-2xl font-semibold', color as string)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…" className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="lg:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="UTILITY">Utility</SelectItem>
            <SelectItem value="MARKETING">Marketing</SelectItem>
            <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="lg:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="PENDING">In review</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => sync.mutate()} disabled={sync.isPending || !canEdit}>
            <RefreshCw className={cn('h-4 w-4', sync.isPending && 'animate-spin')} /> Refresh from WhatsApp
          </Button>
          {canEdit && (
            <Button size="sm" className="gap-2" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New template
            </Button>
          )}
        </div>
      </div>

      {missingPlatform.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">The platform sends {missingPlatform.length} template{missingPlatform.length === 1 ? '' : 's'} that {missingPlatform.length === 1 ? 'is' : 'are'} not in WhatsApp yet</p>
          <p className="mt-0.5 text-xs">{missingPlatform.map((p) => `${p.name} (${p.variables} variable${p.variables === 1 ? '' : 's'})`).join(', ')}. Create {missingPlatform.length === 1 ? 'it' : 'them'} with exactly these names, or those messages will fail.</p>
        </div>
      )}

      {query.isError && <ErrorNote error={query.error} />}

      <div className="overflow-hidden rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Template</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Variables</TableHead>
              <TableHead className="hidden md:table-cell">Language</TableHead>
              <TableHead className="hidden lg:table-cell">Updated</TableHead>
              {canEdit && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow><TableCell colSpan={7} className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                {(query.data ?? []).length === 0 ? 'No templates yet. Create one, or refresh to pull the ones already on WhatsApp.' : 'No templates match these filters.'}
              </TableCell></TableRow>
            ) : (
              rows.map((t) => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => setViewing(t)}>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{t.key}</code>
                      {platformByName.has(t.key) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800" title={`Used by the platform: ${platformByName.get(t.key)!.label}`}>
                          <Lock className="h-3 w-3" /> Used by platform
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell><CategoryBadge category={t.category} /></TableCell>
                  <TableCell><TemplateStatusBadge status={t.status} /></TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{t.bodyParameters?.length ?? 0}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{t.language}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{timeAgo(t.updatedAt || t.syncedAt)}</TableCell>
                  {canEdit && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setEditing(t)} aria-label={`Edit ${t.key}`} disabled={t.status === 'PENDING'} title={t.status === 'PENDING' ? 'Wait for the review to finish before editing' : 'Edit'}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setToDelete(t)} aria-label={`Delete ${t.key}`}
                          disabled={platformByName.has(t.key)}
                          title={platformByName.has(t.key) ? 'Used by the platform, so it cannot be deleted' : 'Delete'}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {creating && <TemplateBuilder key="new" open={creating} onOpenChange={setCreating} />}
      {editing && <TemplateBuilder key={`edit-${editing.id}-${editing.updatedAt}`} open template={editing} platform={platformByName.get(editing.key) ?? null} onOpenChange={(o) => !o && setEditing(null)} />}

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {viewing && (
            <>
              <SheetHeader>
                <SheetTitle className="flex flex-wrap items-center gap-2"><code className="text-base">{viewing.key}</code> <TemplateStatusBadge status={viewing.status} /></SheetTitle>
                <SheetDescription><CategoryBadge category={viewing.category} /> · {viewing.language} · {viewing.bodyParameters?.length ?? 0} variable{(viewing.bodyParameters?.length ?? 0) === 1 ? '' : 's'}</SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                {viewing.components && viewing.components.length > 0 ? (
                  <TemplatePreview parts={describeTemplate(viewing.category, viewing.components)} />
                ) : (
                  <p className="rounded-lg border p-3 text-sm text-muted-foreground">The content will appear after the next refresh from WhatsApp.</p>
                )}
              </div>
              <dl className="mt-4 divide-y rounded-lg border text-sm">
                {([
                  ['Quality', viewing.quality && viewing.quality !== 'UNKNOWN' ? viewing.quality : 'Not rated yet'],
                  ['Last updated', fmtDateTime(viewing.updatedAt || viewing.syncedAt)],
                ] as Array<[string, string]>).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-3 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
              {platformByName.has(viewing.key) && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <p className="flex items-center gap-1.5 font-medium"><Lock className="h-3.5 w-3.5" /> Used by the platform: {platformByName.get(viewing.key)!.label}</p>
                  <p className="mt-1">You can change the wording and the buttons. It must keep exactly {platformByName.get(viewing.key)!.variables} variable{platformByName.get(viewing.key)!.variables === 1 ? '' : 's'}, and it cannot be deleted.</p>
                </div>
              )}
              {canEdit && (
                <div className="mt-5 flex gap-2">
                  <Button className="flex-1 gap-2" disabled={viewing.status === 'PENDING'} onClick={() => { setEditing(viewing); setViewing(null); }}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700" disabled={platformByName.has(viewing.key)} onClick={() => { setToDelete(viewing); setViewing(null); }}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              )}
              {viewing.status === 'PENDING' && <p className="mt-2 text-xs text-muted-foreground">WhatsApp is still reviewing this template, so it cannot be edited yet.</p>}
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.key}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the template from WhatsApp as well. Messages that use it will stop working. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => toDelete && remove.mutate(toDelete.key)}>
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
