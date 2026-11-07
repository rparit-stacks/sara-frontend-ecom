import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2, Pause, Play, Plus, RefreshCw, RotateCcw, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { whatsappCloudApi, WaCloudBroadcast } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  BroadcastStatusBadge, CategoryBadge, ErrorNote, MessageStatusBadge, failureHint, fmtDateTime, formatPhone, timeAgo,
} from './shared';

type Action = 'start' | 'pause' | 'resume' | 'cancel';

const parseNumbers = (text: string) =>
  Array.from(new Set(text.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)));

const Progress = ({ b }: { b: WaCloudBroadcast }) => {
  const c = b.counts ?? {};
  const delivered = (c.DELIVERED ?? 0) + (c.READ ?? 0);
  const failed = (c.FAILED ?? 0) + (c.SKIPPED ?? 0);
  const sent = (c.SENT ?? 0);
  const total = Math.max(b.messagesCreated, 1);
  const pct = (n: number) => `${Math.min(100, (n / total) * 100)}%`;
  return (
    <div className="min-w-[150px]">
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="bg-emerald-500" style={{ width: pct(delivered) }} />
        <div className="bg-sky-400" style={{ width: pct(sent) }} />
        <div className="bg-red-400" style={{ width: pct(failed) }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {b.messagesCreated === 0 ? 'Not started' : `${delivered} delivered · ${failed} failed · ${b.messagesCreated} total`}
      </p>
    </div>
  );
};

const CreateBroadcastDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const queryClient = useQueryClient();
  const templates = useQuery({ queryKey: ['waCloudTemplates'], queryFn: whatsappCloudApi.listTemplates, enabled: open });
  const [name, setName] = useState('');
  const [templateKey, setTemplateKey] = useState('');
  const [vars, setVars] = useState<Record<string, string>>({});
  const [audience, setAudience] = useState<'numbers' | 'all' | 'tags'>('numbers');
  const [numbers, setNumbers] = useState('');
  const [tags, setTags] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const approved = useMemo(
    () => (templates.data ?? []).filter((t) => t.status === 'APPROVED' && t.category !== 'AUTHENTICATION').sort((a, b) => a.key.localeCompare(b.key)),
    [templates.data],
  );
  const template = approved.find((t) => t.key === templateKey);
  const list = useMemo(() => parseNumbers(numbers), [numbers]);
  const tagList = useMemo(() => parseNumbers(tags.replace(/,/g, ' ')), [tags]);

  const problems: string[] = [];
  if (!name.trim()) problems.push('Give the broadcast a name');
  if (!template) problems.push('Choose a template');
  if (template?.bodyParameters.some((p) => !(vars[p] ?? '').trim())) problems.push('Fill in every variable');
  if (audience === 'numbers' && list.length === 0) problems.push('Add at least one phone number');
  if (audience === 'tags' && tagList.length === 0) problems.push('Add at least one tag');
  if (scheduledAt && new Date(scheduledAt).getTime() <= Date.now()) problems.push('Schedule time must be in the future');

  const reset = () => {
    setName(''); setTemplateKey(''); setVars({}); setAudience('numbers'); setNumbers(''); setTags(''); setScheduledAt('');
  };

  const create = useMutation({
    mutationFn: () =>
      whatsappCloudApi.createBroadcast({
        name: name.trim(),
        templateKey,
        parameters: { variables: vars },
        ...(audience === 'numbers' ? { recipients: list.map((to) => ({ to })) } : {}),
        ...(audience === 'all' ? { allContacts: true } : {}),
        ...(audience === 'tags' ? { tags: tagList } : {}),
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      }),
    onSuccess: () => {
      toast.success(scheduledAt ? 'Broadcast scheduled' : 'Broadcast saved. Press Start when you are ready.');
      queryClient.invalidateQueries({ queryKey: ['waCloudBroadcasts'] });
      reset();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message || 'Could not create the broadcast'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New broadcast</DialogTitle>
          <DialogDescription>Nothing is sent until you press Start (or the scheduled time arrives).</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diwali collection launch" className="mt-1" />
          </div>

          <div>
            <Label>Template</Label>
            <Select value={templateKey} onValueChange={(v) => { setTemplateKey(v); setVars({}); }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={templates.isLoading ? 'Loading…' : 'Choose an approved template'} /></SelectTrigger>
              <SelectContent>
                {approved.map((t) => <SelectItem key={t.id} value={t.key}>{t.key} · {t.category.toLowerCase()}</SelectItem>)}
              </SelectContent>
            </Select>
            {approved.length === 0 && !templates.isLoading && <p className="mt-1 text-xs text-amber-700">No approved templates yet. Create one in the Templates tab first.</p>}
            {template?.category === 'MARKETING' && (
              <p className="mt-1 text-xs text-muted-foreground">Marketing messages go only to customers who agreed to receive them. Others are skipped automatically.</p>
            )}
          </div>

          {template && template.bodyParameters.length > 0 && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <p className="text-sm font-medium">Values for everyone</p>
              {template.bodyParameters.map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">{`{{${p}}}`}</span>
                  <Input value={vars[p] ?? ''} onChange={(e) => setVars({ ...vars, [p]: e.target.value })} className="h-8" />
                </div>
              ))}
            </div>
          )}

          <div>
            <Label>Who should get it?</Label>
            <RadioGroup value={audience} onValueChange={(v) => setAudience(v as typeof audience)} className="mt-2 space-y-2">
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="numbers" /> Phone numbers I paste</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="tags" /> Contacts with a tag</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="all" /> All contacts who opted in</label>
            </RadioGroup>
            {audience === 'numbers' && (
              <>
                <Textarea value={numbers} onChange={(e) => setNumbers(e.target.value)} rows={5} placeholder={'9810167696\n+91 98765 43210\n…one per line, or separated by commas'} className="mt-2" />
                <p className="mt-1 text-xs text-muted-foreground">{list.length} number{list.length === 1 ? '' : 's'} (duplicates removed)</p>
              </>
            )}
            {audience === 'tags' && <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vip, diwali" className="mt-2" />}
          </div>

          <div>
            <Label>Send later <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1" />
          </div>

          {problems.length > 0 && (name || templateKey) && (
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-amber-700">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={problems.length > 0 || create.isPending} className="gap-2">
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {scheduledAt ? 'Schedule broadcast' : 'Save broadcast'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RecipientsDrawer = ({ broadcast, onClose }: { broadcast: WaCloudBroadcast | null; onClose: () => void }) => {
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ['waCloudBroadcastRecipients', broadcast?.id, page],
    queryFn: () => whatsappCloudApi.broadcastRecipients(broadcast!.id, page, 15),
    enabled: !!broadcast,
    placeholderData: (prev) => prev,
  });
  const data = query.data;
  return (
    <Sheet open={!!broadcast} onOpenChange={(o) => { if (!o) { setPage(0); onClose(); } }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {broadcast && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">{broadcast.name} <BroadcastStatusBadge status={broadcast.status} /></SheetTitle>
              <SheetDescription>Template {broadcast.templateKey} · created {fmtDateTime(broadcast.createdAt)}</SheetDescription>
            </SheetHeader>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              {[['Created', broadcast.messagesCreated], ['Delivered', (broadcast.counts?.DELIVERED ?? 0) + (broadcast.counts?.READ ?? 0)], ['Failed', (broadcast.counts?.FAILED ?? 0) + (broadcast.counts?.SKIPPED ?? 0)]].map(([k, v]) => (
                <div key={k as string} className="rounded-lg border px-2 py-2"><p className="text-xs text-muted-foreground">{k}</p><p className="text-lg font-semibold">{v}</p></div>
              ))}
            </div>
            <h4 className="mb-2 mt-5 text-sm font-semibold">Recipients</h4>
            {query.isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : query.isError ? <ErrorNote error={query.error} /> : (
              <>
                <div className="divide-y rounded-lg border text-sm">
                  {(data?.content ?? []).map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <p className="font-medium">{formatPhone(m.to)}</p>
                        {failureHint(m.errorCode, m.errorMessage, m.skipReason) && <p className="truncate text-xs text-muted-foreground">{failureHint(m.errorCode, m.errorMessage, m.skipReason)}</p>}
                      </div>
                      <MessageStatusBadge status={m.status} />
                    </div>
                  ))}
                  {(data?.content.length ?? 0) === 0 && <p className="px-3 py-6 text-center text-muted-foreground">No messages yet. They appear once the broadcast starts.</p>}
                </div>
                {data && data.totalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Page {page + 1} of {data.totalPages}</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="h-7 w-7" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export const BroadcastsTab = ({ canEdit }: { canEdit: boolean }) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<WaCloudBroadcast | null>(null);
  const [confirm, setConfirm] = useState<{ b: WaCloudBroadcast; action: Action } | null>(null);

  const query = useQuery({
    queryKey: ['waCloudBroadcasts', page],
    queryFn: () => whatsappCloudApi.listBroadcasts(page, 15),
    placeholderData: (prev) => prev,
    refetchInterval: (q) => ((q.state.data?.content ?? []).some((b) => b.status === 'RUNNING') ? 10_000 : false),
  });

  const act = useMutation({
    mutationFn: ({ b, action }: { b: WaCloudBroadcast; action: Action }) => whatsappCloudApi.broadcastAction(b.id, action),
    onSuccess: (_, v) => {
      toast.success({ start: 'Broadcast started', pause: 'Broadcast paused', resume: 'Broadcast resumed', cancel: 'Broadcast cancelled' }[v.action]);
      setConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['waCloudBroadcasts'] });
    },
    onError: (e: any) => { toast.error(e?.message || 'That did not work'); setConfirm(null); },
  });

  const data = query.data;
  const ActionButtons = ({ b }: { b: WaCloudBroadcast }) => {
    if (!canEdit) return null;
    const btn = (action: Action, label: string, icon: JSX.Element, danger = false) => (
      <Button
        key={action}
        size="sm"
        variant={danger ? 'ghost' : 'outline'}
        className={cn('h-8 gap-1.5', danger && 'text-red-600 hover:text-red-700')}
        onClick={(e) => { e.stopPropagation(); setConfirm({ b, action }); }}
      >
        {icon}{label}
      </Button>
    );
    const play = <Play className="h-3.5 w-3.5" />;
    if (b.status === 'DRAFT' || b.status === 'SCHEDULED') return <div className="flex gap-1">{btn('start', 'Start', play)}{btn('cancel', 'Cancel', <Square className="h-3.5 w-3.5" />, true)}</div>;
    if (b.status === 'RUNNING') return <div className="flex gap-1">{btn('pause', 'Pause', <Pause className="h-3.5 w-3.5" />)}{btn('cancel', 'Cancel', <Square className="h-3.5 w-3.5" />, true)}</div>;
    if (b.status === 'PAUSED') return <div className="flex gap-1">{btn('resume', 'Resume', <RotateCcw className="h-3.5 w-3.5" />)}{btn('cancel', 'Cancel', <Square className="h-3.5 w-3.5" />, true)}</div>;
    return null;
  };

  const confirmText: Record<Action, string> = {
    start: 'This starts sending now to everyone in the audience.',
    pause: 'No new messages will be created. Messages already waiting will still go out.',
    resume: 'Sending continues from where it stopped.',
    cancel: 'Sending stops, including messages that are still waiting. This cannot be undone.',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Send one template to many customers. Each message follows the same consent and delivery rules.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={cn('h-4 w-4', query.isFetching && 'animate-spin')} /> Refresh
          </Button>
          {canEdit && <Button size="sm" className="gap-2" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New broadcast</Button>}
        </div>
      </div>

      {query.isError && <ErrorNote error={query.error} />}

      <div className="overflow-hidden rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Broadcast</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Progress</TableHead>
              <TableHead className="hidden lg:table-cell">Audience</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="w-[1%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
            ) : (data?.content.length ?? 0) === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">No broadcasts yet. Create your first one.</TableCell></TableRow>
            ) : (
              data!.content.map((b) => (
                <TableRow key={b.id} className="cursor-pointer" onClick={() => setOpen(b)}>
                  <TableCell>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-muted-foreground"><code>{b.templateKey}</code>{b.scheduledAt && b.status === 'SCHEDULED' ? ` · starts ${fmtDateTime(b.scheduledAt)}` : ''}</p>
                  </TableCell>
                  <TableCell><BroadcastStatusBadge status={b.status} /></TableCell>
                  <TableCell className="hidden md:table-cell"><Progress b={b} /></TableCell>
                  <TableCell className="hidden text-sm lg:table-cell">
                    {b.allContacts ? 'All opted-in contacts' : b.tags?.length ? `Tags: ${b.tags.join(', ')}` : `${b.recipientsListed} numbers`}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{timeAgo(b.createdAt)}</TableCell>
                  <TableCell><ActionButtons b={b} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span>Page {page + 1} of {data.totalPages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      <CreateBroadcastDialog open={creating} onOpenChange={setCreating} />
      <RecipientsDrawer broadcast={open} onClose={() => setOpen(null)} />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm && `${confirm.action.charAt(0).toUpperCase()}${confirm.action.slice(1)} “${confirm.b.name}”?`}</AlertDialogTitle>
            <AlertDialogDescription>{confirm && confirmText[confirm.action]}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm && act.mutate(confirm)} className={confirm?.action === 'cancel' ? 'bg-red-600 hover:bg-red-700' : ''}>
              {act.isPending ? 'Working…' : 'Yes, continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
