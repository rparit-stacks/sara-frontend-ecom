import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WhatsAppLayout } from '@/components/admin/whatsapp-cloud/WhatsAppLayout';
import { BroadcastStatusBadge, ErrorNote, MessageStatusBadge, failureHint, fmtDateTime, formatPhone } from '@/components/admin/whatsapp-cloud/shared';
import { ProgressBar, progressOf, useBroadcastActions } from '@/components/admin/whatsapp-cloud/broadcastActions';
import { whatsappCloudApi, WaCloudMessage } from '@/lib/api';
import { toCsv } from '@/lib/broadcastList';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';
import { cn } from '@/lib/utils';

const FILTERS = [['', 'All'], ['DELIVERED', 'Delivered'], ['READ', 'Read'], ['SENT', 'Sent'], ['QUEUED', 'Waiting'], ['FAILED', 'Failed'], ['SKIPPED', 'Skipped']];

const WhatsAppBroadcastDetail = () => {
  const { id = '' } = useParams();
  const { hasAny } = useAdminPermissions();
  const canEdit = hasAny(P.WHATSAPP_UPDATE_TEMPLATES);
  const { buttons, dialog } = useBroadcastActions();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);

  const query = useQuery({
    queryKey: ['waCloudBroadcast', id],
    queryFn: () => whatsappCloudApi.getBroadcast(id),
    refetchInterval: (q) => (q.state.data?.status === 'RUNNING' ? 6_000 : 30_000),
  });
  const recipients = useQuery({
    queryKey: ['waCloudBroadcastRecipients', id, status, page],
    queryFn: () => whatsappCloudApi.broadcastRecipients(id, page, 15, status || undefined),
    placeholderData: (prev) => prev,
    refetchInterval: query.data?.status === 'RUNNING' ? 8_000 : false,
  });

  const b = query.data;
  const p = b ? progressOf(b) : null;

  const exportAll = async () => {
    setExporting(true);
    try {
      const rows: WaCloudMessage[] = [];
      for (let pg = 0; pg < 60; pg++) {
        const r = await whatsappCloudApi.broadcastRecipients(id, pg, 100, status || undefined);
        rows.push(...r.content);
        if (pg + 1 >= r.totalPages) break;
      }
      const csv = toCsv(['phone', 'status', 'problem', 'created', 'sent', 'delivered', 'read'],
        rows.map((m) => [m.to, m.status, failureHint(m.errorCode, m.errorMessage, m.skipReason), m.createdAt ?? '', m.sentAt ?? '', m.deliveredAt ?? '', m.readAt ?? '']));
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url; a.download = `${(b?.name ?? 'broadcast').replace(/\W+/g, '-')}-recipients.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.message || 'Could not export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <WhatsAppLayout title={b?.name ?? 'Broadcast'} subtitle={b ? `${b.kind === 'COLLECTION_LAUNCH' ? 'Collection launch' : 'Campaign'} using the “${b.templateKey}” template` : undefined}>
      <Link to="/admin-sara/whatsapp/broadcasts" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All broadcasts</Link>
      {query.isLoading && <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
      {query.isError && <ErrorNote error={query.error} />}

      {b && p && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background p-4">
            <div className="flex items-center gap-3"><BroadcastStatusBadge status={b.status} /><span className="text-sm text-muted-foreground">Created {fmtDateTime(b.createdAt)}</span></div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => { query.refetch(); recipients.refetch(); }}><RefreshCw className="h-4 w-4" /> Refresh</Button>
              {canEdit && buttons(b, 'default')}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ['Audience', b.allContacts ? 'All' : b.tags?.length ? b.tags.length + ' tags' : String(b.recipientsListed), 'text-foreground'],
              ['Messages created', String(b.messagesCreated), 'text-foreground'],
              ['Reached customers', String(p.reached), 'text-emerald-700'],
              ['Waiting or sent', String(p.waiting + p.sent), 'text-sky-700'],
              ['Failed or skipped', String(p.failed), 'text-red-700'],
            ].map(([k, v, c]) => (
              <div key={k} className="rounded-2xl border bg-background p-4"><p className="text-sm text-muted-foreground">{k}</p><p className={cn('mt-1 text-3xl font-semibold tabular-nums', c)}>{v}</p></div>
            ))}
          </div>

          <div className="rounded-2xl border bg-background p-4">
            <ProgressBar b={b} />
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Reached</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-sky-400" /> Sent</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-300" /> Waiting</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-red-400" /> Failed or skipped</span>
            </div>
          </div>

          <Tabs defaultValue="recipients">
            <TabsList><TabsTrigger value="recipients">Recipients</TabsTrigger><TabsTrigger value="details">Details</TabsTrigger></TabsList>

            <TabsContent value="recipients" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {FILTERS.map(([v, l]) => (
                    <Button key={v} size="sm" variant={status === v ? 'default' : 'outline'} onClick={() => { setStatus(v); setPage(0); }}>{l}</Button>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="gap-2" disabled={exporting} onClick={exportAll}>
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export CSV
                </Button>
              </div>
              <div className="overflow-hidden rounded-xl border bg-background">
                <Table>
                  <TableHeader><TableRow className="bg-muted/40"><TableHead>Number</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Details</TableHead><TableHead className="hidden lg:table-cell">Delivered</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {recipients.isLoading ? (
                      <TableRow><TableCell colSpan={4} className="py-14 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
                    ) : (recipients.data?.content.length ?? 0) === 0 ? (
                      <TableRow><TableCell colSpan={4} className="py-14 text-center text-sm text-muted-foreground">No messages here yet. They appear once the broadcast starts.</TableCell></TableRow>
                    ) : recipients.data!.content.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{formatPhone(m.to)}</TableCell>
                        <TableCell><MessageStatusBadge status={m.status} /></TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{failureHint(m.errorCode, m.errorMessage, m.skipReason) || '—'}</TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{m.deliveredAt ? fmtDateTime(m.deliveredAt) : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {recipients.data && recipients.data.totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <span>Page {page + 1} of {recipients.data.totalPages} · {recipients.data.totalElements} messages</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page + 1 >= recipients.data.totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details">
              <dl className="grid gap-x-10 rounded-2xl border bg-background p-5 text-sm sm:grid-cols-2">
                {([
                  ['Template', b.templateKey],
                  ['Kind', b.kind === 'COLLECTION_LAUNCH' ? 'Collection launch' : 'Campaign'],
                  ['Audience', b.allContacts ? 'All customers who agreed' : b.tags?.length ? `Tags: ${b.tags.join(', ')}` : `${b.recipientsListed} numbers in the list`],
                  ['Created', fmtDateTime(b.createdAt)],
                  ['Scheduled for', fmtDateTime(b.scheduledAt)],
                  ['Started', fmtDateTime(b.startedAt)],
                  ['Finished', fmtDateTime(b.completedAt)],
                  ...Object.entries(b.counts ?? {}).map(([k, v]) => [`Messages ${k.toLowerCase()}`, String(v)] as [string, string]),
                ] as Array<[string, string]>).map(([k, v]) => <div key={k} className="flex justify-between border-b py-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
              </dl>
            </TabsContent>
          </Tabs>
        </div>
      )}
      {dialog}
    </WhatsAppLayout>
  );
};
export default WhatsAppBroadcastDetail;
