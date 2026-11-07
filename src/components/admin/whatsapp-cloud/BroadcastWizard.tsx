import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarClock, Download, FileText, Loader2, Play, Save, Search, Send, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { whatsappCloudApi, WaCloudCreateBroadcast, WaCloudTemplate } from '@/lib/api';
import { SendValues, describeTemplate, validateSend } from '@/lib/waTemplateRules';
import { DEFAULT_COUNTRY } from '@/lib/phone';
import { MAX_RECIPIENTS, parseList, toCsv } from '@/lib/broadcastList';
import { cn } from '@/lib/utils';
import { CategoryBadge, ErrorNote } from './shared';
import { CountryPicker, PhoneInput, emptyPhone, phoneResult } from './PhoneInput';
import { TemplatePreview } from './TemplatePreview';
import { Section, StepHead, WhyBox, WizardShell, WizardStep } from './WizardShell';

type Audience = 'list' | 'customers' | 'tags' | 'all';

type When = 'draft' | 'now' | 'later';
type Source = 'shared' | 'list';

const DAILY_LIMIT = 250;
const download = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};
const newId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`).slice(0, 60);
const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export const BroadcastWizard = ({
  open = true, onOpenChange, asPage = false, onClose,
}: { open?: boolean; onOpenChange?: (o: boolean) => void; asPage?: boolean; onClose?: () => void }) => {
  const close = () => { if (asPage) onClose?.(); else onOpenChange?.(false); };
  const queryClient = useQueryClient();
  const templates = useQuery({ queryKey: ['waCloudTemplates'], queryFn: whatsappCloudApi.listTemplates, enabled: open });

  const [step, setStep] = useState(0);
  const [showIssues, setShowIssues] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'CAMPAIGN' | 'COLLECTION_LAUNCH'>('CAMPAIGN');
  const [templateKey, setTemplateKey] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<Record<string, Source>>({});
  const [shared, setShared] = useState<Record<string, string>>({});
  const [headerLink, setHeaderLink] = useState('');
  const [btnValues, setBtnValues] = useState<Record<number, string>>({});
  const [audience, setAudience] = useState<Audience>('list');
  const [custSource, setCustSource] = useState('ALL');
  const [defaultCode, setDefaultCode] = useState(DEFAULT_COUNTRY);
  const [listText, setListText] = useState('');
  const [tags, setTags] = useState('');
  const [when, setWhen] = useState<When>('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [consent, setConsent] = useState(false);
  const [testPhone, setTestPhone] = useState(emptyPhone());
  const [testSent, setTestSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const approved = useMemo(
    () => (templates.data ?? []).filter((t) => t.status === 'APPROVED' && t.category !== 'AUTHENTICATION').sort((a, b) => a.key.localeCompare(b.key)),
    [templates.data],
  );
  const template: WaCloudTemplate | undefined = approved.find((t) => t.key === templateKey);
  const parts = useMemo(() => (template ? describeTemplate(template.category, template.components) : null), [template]);
  const vars = parts?.bodyVariables ?? [];
  const listVars = vars.filter((v) => source[v] === 'list').sort((a, b) => Number(a) - Number(b));
  const sharedVars = vars.filter((v) => source[v] !== 'list');
  const isMarketing = template?.category === 'MARKETING';

  const parsed = useMemo(() => parseList(listText, defaultCode, listVars), [listText, defaultCode, listVars]);
  const tagList = useMemo(() => Array.from(new Set(tags.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean))), [tags]);
  const customerAudience = useQuery({
    queryKey: ['waCloudCustomerAudience', custSource],
    queryFn: () => whatsappCloudApi.getCustomerAudience(custSource),
    enabled: audience === 'customers',
  });
  const customers = customerAudience.data?.customers ?? [];
  const audienceCount = audience === 'list' ? parsed.valid.length : audience === 'customers' ? customers.length : audience === 'tags' ? tagList.length : 0;

  const problems = useMemo(() => {
    const list: Array<{ step: number; message: string }> = [];
    if (!name.trim()) list.push({ step: 0, message: 'Give the broadcast a name' });
    if (name.length > 80) list.push({ step: 0, message: 'The name can be at most 80 characters' });
    if (!template) list.push({ step: 1, message: 'Choose a template' });
    if (parts && template) {
      const forCheck: SendValues = { variables: { ...shared, ...Object.fromEntries(listVars.map((v) => [v, 'x'])) }, headerText: '', headerLink, buttons: btnValues };
      validateSend(parts, forCheck).forEach((m) => list.push({ step: 2, message: m }));
    }
    if (audience === 'list') {
      if (parsed.valid.length === 0) list.push({ step: 3, message: 'Add at least one valid phone number' });
      if (parsed.tooMany) list.push({ step: 3, message: `A list can have at most ${MAX_RECIPIENTS} numbers. Use a tag for a bigger audience.` });
    }
    if (audience === 'customers') {
      if (customerAudience.isLoading) list.push({ step: 3, message: 'Customers are still loading' });
      else if (customers.length === 0) list.push({ step: 3, message: 'No customers with a phone number found for this choice' });
      if (customers.length > MAX_RECIPIENTS) list.push({ step: 3, message: `A broadcast can have at most ${MAX_RECIPIENTS} numbers. Pick one source.` });
    }
    if (audience === 'tags') {
      if (tagList.length === 0) list.push({ step: 3, message: 'Add at least one tag' });
      if (tagList.length > 10) list.push({ step: 3, message: 'Use at most 10 tags' });
      if (tagList.some((t) => !/^[A-Za-z0-9_-]{1,40}$/.test(t))) list.push({ step: 3, message: 'Tags can use letters, numbers, - and _ only' });
    }
    if (audience !== 'list' && listVars.length > 0) list.push({ step: 2, message: 'Values "from my list" need a list of numbers. Use the same value for everyone, or choose a list.' });
    if (when === 'later') {
      const t = scheduledAt ? new Date(scheduledAt).getTime() : 0;
      if (!t) list.push({ step: 4, message: 'Choose the date and time to send' });
      else if (t < Date.now() + 10 * 60 * 1000) list.push({ step: 4, message: 'Choose a time at least 10 minutes from now' });
    }
    if (isMarketing && audience !== 'customers' && when !== 'draft' && !consent) list.push({ step: 5, message: 'Confirm that these customers agreed to receive marketing messages' });
    return list;
  }, [name, template, parts, shared, listVars, audience, parsed, customers, customerAudience.isLoading, tagList, when, scheduledAt, isMarketing, consent, headerLink, btnValues]);

  const stepHas = (i: number) => showIssues && problems.some((p) => p.step === i);
  const steps: WizardStep[] = [
    { id: 'basics', label: 'Name', hint: 'What this broadcast is', problem: stepHas(0) },
    { id: 'template', label: 'Template', hint: 'Which message to send', problem: stepHas(1) },
    { id: 'values', label: 'Message details', hint: 'Fill in the variables', problem: stepHas(2) },
    { id: 'audience', label: 'Audience', hint: 'Who receives it', problem: stepHas(3) },
    { id: 'when', label: 'When', hint: 'Now, later or draft', problem: stepHas(4) },
    { id: 'review', label: 'Review & test', hint: 'Check, test, then go', problem: stepHas(5) },
  ];

  const mediaHeader = () => (parts?.header && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(parts.header.format)
    ? { type: parts.header.format.toLowerCase(), value: headerLink.trim() } : undefined);
  const buttonValues = () => (parts?.buttons ?? []).filter((b) => b.type === 'COPY_CODE' || (b.type === 'URL' && b.needsValue))
    .map((b) => ({ index: b.index, subType: b.type === 'URL' ? 'url' : 'copy_code', value: (btnValues[b.index] ?? '').trim() }));

  const create = useMutation({
    mutationFn: async () => {
      const header = mediaHeader();
      const buttons = buttonValues();
      if (audience === 'customers' && when !== 'draft') {
        // Safety net: these people ticked the box, so make sure the service has them as opted in. Their consent is already synced when they tick it.
        // A customer who replied STOP stays blocked until they opt in again: an import never reverses an opt-out.
        for (let i = 0; i < customers.length; i += 1000) {
          await whatsappCloudApi.importContacts(
            customers.slice(i, i + 1000).map((c) => ({ phone: c.phone, ...(c.name ? { name: c.name } : {}), optIn: true })),
            'consent-table',
          );
        }
      }
      const body = {
        name: name.trim(), kind, templateKey,
        parameters: {
          variables: Object.fromEntries(sharedVars.map((v) => [v, (shared[v] ?? '').trim()])),
          ...(header ? { header } : {}), ...(buttons.length ? { buttons } : {}),
        },
        ...(audience === 'list' ? { recipients: parsed.valid.map((r) => ({ to: r.digits, ...(listVars.length ? { variables: r.values } : {}) })) } : {}),
        ...(audience === 'customers' ? { recipients: customers.map((c) => ({ to: c.phone })) } : {}),
        ...(audience === 'tags' ? { tags: tagList } : {}),
        ...(audience === 'all' ? { allContacts: true } : {}),
        ...(when === 'later' ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      };
      const made = await whatsappCloudApi.createBroadcast(body as unknown as WaCloudCreateBroadcast);
      if (when === 'now') await whatsappCloudApi.broadcastAction(made.id, 'start');
      return made;
    },
    onSuccess: () => {
      toast.success(when === 'now' ? 'Broadcast started' : when === 'later' ? 'Broadcast scheduled' : 'Draft saved. Open it from the list to start it.');
      queryClient.invalidateQueries({ queryKey: ['waCloudBroadcasts'] });
      close();
    },
    onError: (e: any) => toast.error(e?.message || 'Could not create the broadcast'),
  });

  const test = useMutation({
    mutationFn: () => {
      const first = parsed.valid[0];
      const variables: Record<string, string> = { ...shared, ...(first ? first.values : Object.fromEntries(listVars.map((v) => [v, 'Sample']))) };
      const header = mediaHeader();
      const buttons = buttonValues();
      return whatsappCloudApi.sendMessage({
        clientMessageId: `test-${newId()}`, templateKey, to: phoneResult(testPhone).digits,
        parameters: { variables, ...(header ? { header } : {}), ...(buttons.length ? { buttons } : {}) },
      });
    },
    onSuccess: (m) => {
      if (m.status === 'SKIPPED') { toast.error(`The test was not sent (${m.skipReason?.replace(/_/g, ' ').toLowerCase()})`); return; }
      setTestSent(true);
      toast.success('Test message is on its way to that number');
    },
    onError: (e: any) => toast.error(e?.message || 'The test could not be sent'),
  });

  const submit = () => {
    setShowIssues(true);
    if (problems.length) {
      setStep(problems[0].step);
      toast.error(`${problems.length} thing${problems.length === 1 ? '' : 's'} to fix first`);
      return;
    }
    create.mutate();
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('The file is too big. Use a list under 2 MB.'); return; }
    setListText(await file.text());
    if (fileRef.current) fileRef.current.value = '';
  };
  const sampleCsv = () => download('recipients-sample.csv', toCsv(['phone', ...listVars.map((v) => `value_for_${v}`)], [['9810167696', ...listVars.map(() => 'Rohit')], ['+14155550123', ...listVars.map(() => 'Asha')]]));
  const invalidCsv = () => download('invalid-numbers.csv', toCsv(['line', 'row', 'problem'], [...parsed.invalid, ...parsed.duplicates].map((r) => [String(r.line), r.raw, r.reason ?? ''])));

  const previewValues = Object.fromEntries(vars.map((v) => [v, source[v] === 'list' ? '‹from your list›' : shared[v] ?? '']));
  const filteredTemplates = approved.filter((t) => (typeFilter === 'all' || t.category === typeFilter) && (!search.trim() || t.key.toLowerCase().includes(search.trim().toLowerCase())));
  const days = Math.max(1, Math.ceil(audienceCount / DAILY_LIMIT));

  const stepIssues = (s: number) => {
    const list = showIssues ? problems.filter((p) => p.step === s) : [];
    if (!list.length) return null;
    return <ul className="space-y-0.5">{list.map((p) => <li key={p.message} className="text-sm text-red-600">• {p.message}</li>)}</ul>;
  };

  const basicsStep = (
    <div className="space-y-6">
      <StepHead title="Name your broadcast" subtitle="Only you see this. It helps you find the broadcast later." />
      <WhyBox title="What a broadcast is">
        A broadcast sends one template to many customers. The service sends them in small batches, one message each, and keeps to the daily limit WhatsApp sets for your number. You can watch the progress afterwards.
      </WhyBox>
      <div className="max-w-xl space-y-1">
        <Label>Name</Label>
        <Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diwali collection launch" />
        <p className="text-xs text-muted-foreground">Only you see this. It helps you find the broadcast in the list. {name.length}/80</p>
      </div>
      <Section title="What kind of broadcast" hint="It only changes how it is labelled in the list.">
        <RadioGroup value={kind} onValueChange={(v) => setKind(v as typeof kind)} className="grid gap-3 sm:grid-cols-2">
          {[['CAMPAIGN', 'Campaign', 'An offer, announcement or reminder.'], ['COLLECTION_LAUNCH', 'Collection launch', 'A new collection or product going live.']].map(([v, t, d]) => (
            <label key={v} className={cn('flex cursor-pointer gap-3 rounded-xl border p-3', kind === v && 'border-primary bg-primary/5')}>
              <RadioGroupItem value={v} className="mt-1" />
              <span><span className="block text-sm font-semibold">{t}</span><span className="block text-xs text-muted-foreground">{d}</span></span>
            </label>
          ))}
        </RadioGroup>
      </Section>
      {stepIssues(0)}
    </div>
  );

  const templateStep = (
    <div className="space-y-5">
      <StepHead title="Choose the message" subtitle="Only approved templates can be broadcast." />
      <WhyBox title="Why only approved templates">
        WhatsApp lets a business message customers first only with an approved template. Login codes are not available for broadcasts. A Marketing template reaches only customers who agreed to hear from you.
      </WhyBox>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…" className="pl-9" />
        </div>
        {[['all', 'All'], ['UTILITY', 'Utility'], ['MARKETING', 'Marketing']].map(([v, l]) => (
          <Button key={v} type="button" size="sm" variant={typeFilter === v ? 'default' : 'outline'} onClick={() => setTypeFilter(v)}>{l}</Button>
        ))}
      </div>
      {templates.isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      {approved.length === 0 && !templates.isLoading && <p className="text-sm text-amber-700">No approved templates yet. Create one first.</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredTemplates.map((t) => {
          const p = describeTemplate(t.category, t.components);
          const blocked = p.unsupported.length > 0;
          return (
            <button key={t.id} type="button" disabled={blocked}
              onClick={() => { setTemplateKey(t.key); setSource({}); setShared({}); setBtnValues({}); setHeaderLink(''); }}
              className={cn('flex flex-col gap-2 rounded-xl border p-3 text-left transition', templateKey === t.key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50', blocked && 'cursor-not-allowed opacity-50')}>
              <div className="flex items-center justify-between gap-2"><code className="truncate text-xs">{t.key}</code><CategoryBadge category={t.category} /></div>
              <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">{p.body || 'No preview yet'}</p>
              <p className="text-xs text-muted-foreground">
                {p.bodyVariables.length} variable{p.bodyVariables.length === 1 ? '' : 's'}
                {p.header ? ` · ${p.header.format.toLowerCase()} header` : ''}{p.buttons.length ? ` · ${p.buttons.length} button${p.buttons.length === 1 ? '' : 's'}` : ''}
              </p>
              {blocked && <p className="text-xs text-red-600">Has {p.unsupported[0]}, which cannot be sent from here yet.</p>}
            </button>
          );
        })}
      </div>
      {stepIssues(1)}
    </div>
  );

  const valuesStep = (
    <div className="space-y-6">
      <StepHead title="Fill in the details" subtitle="Same value for everyone, or a different one for each person." />
      <WhyBox title="Same for everyone, or from your list">
        A value that is the same for every customer (a collection name, an end date) is typed once. A value that differs per person (their name, their order number) comes from a column in your list, which you add in the next step.
      </WhyBox>
      {!parts && <p className="text-sm text-muted-foreground">Choose a template first.</p>}
      {parts && vars.length === 0 && <p className="rounded-xl border p-4 text-sm">This template has no variables, so there is nothing to fill in.</p>}
      {vars.map((v) => (
        <div key={v} className="space-y-2 rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded bg-muted px-2 py-1 font-mono text-xs">{`{{${v}}}`}</span>
            <div className="flex gap-1.5">
              {([['shared', 'Same for everyone'], ['list', 'From my list']] as Array<[Source, string]>).map(([m, l]) => (
                <Button key={m} type="button" size="sm" variant={(source[v] ?? 'shared') === m ? 'default' : 'outline'} onClick={() => setSource({ ...source, [v]: m })}>{l}</Button>
              ))}
            </div>
          </div>
          {(source[v] ?? 'shared') === 'shared'
            ? <Input value={shared[v] ?? ''} onChange={(e) => setShared({ ...shared, [v]: e.target.value })} placeholder="Value sent to everyone" />
            : <p className="text-sm text-muted-foreground">Each row of your list gives its own value for this variable.</p>}
        </div>
      ))}
      {parts?.header && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(parts.header.format) && (
        <div className="space-y-1">
          <Label>{parts.header.format.charAt(0) + parts.header.format.slice(1).toLowerCase()} link for the header</Label>
          <Input value={headerLink} onChange={(e) => setHeaderLink(e.target.value)} placeholder="https://…" />
          <p className="text-xs text-muted-foreground">A public https link to the file. Everyone gets the same one.</p>
        </div>
      )}
      {parts?.buttons.filter((b) => b.type === 'COPY_CODE' || (b.type === 'URL' && b.needsValue)).map((b) => (
        <div key={b.index} className="space-y-1">
          <Label>{b.type === 'COPY_CODE' ? 'Code on the Copy code button' : `Value for the “${b.text}” link`}</Label>
          <Input value={btnValues[b.index] ?? ''} onChange={(e) => setBtnValues({ ...btnValues, [b.index]: b.type === 'COPY_CODE' ? e.target.value.replace(/[^A-Za-z0-9]/g, '') : e.target.value })} placeholder={b.example || ''} />
        </div>
      ))}
      {stepIssues(2)}
    </div>
  );

  const audienceStep = (
    <div className="space-y-5">
      <StepHead title="Choose who gets it" subtitle="Customers who opted in, or numbers you paste or upload." />
      <WhyBox title="Who will receive it">
        Paste or upload a list of numbers with their country code, send to every customer who agreed to receive messages, or send to customers with a tag. Numbers that are wrong or repeated are left out, and you see exactly which.
      </WhyBox>
      <Tabs value={audience} onValueChange={(v) => setAudience(v as Audience)}>
        <TabsList>
          <TabsTrigger value="customers">Our customers</TabsTrigger>
          <TabsTrigger value="list">Paste or upload a list</TabsTrigger>
          <TabsTrigger value="tags">Customers with a tag</TabsTrigger>
          <TabsTrigger value="all">All who agreed</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          {customerAudience.isLoading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading customers</p>}
          {customerAudience.isError && <p className="text-sm text-red-700">Could not load customers. Try again.</p>}
          {customerAudience.data && (
            <>
              <div className="flex flex-wrap gap-2">
                {[['ALL', Object.values(customerAudience.data.sources).reduce((a, b) => a + b, 0)], ...Object.entries(customerAudience.data.sources)].map(([key, n]) => (
                  <button key={key as string} type="button" onClick={() => setCustSource(key as string)}
                    className={cn('rounded-full border px-3 py-1 text-sm', custSource === key ? 'border-primary bg-primary/10 font-medium' : 'text-muted-foreground')}>
                    {key === 'ALL' ? 'Everyone who opted in' : (key as string).replace(/-/g, ' ')} ({n as number})
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border px-4 py-3"><p className="text-xs text-muted-foreground">Will receive it</p><p className="text-2xl font-semibold">{customers.length}</p></div>
                <div className="rounded-xl border px-4 py-3"><p className="text-xs text-muted-foreground">Opted in, no phone number</p><p className="text-2xl font-semibold text-amber-700">{customerAudience.data.withoutPhone}</p></div>
                <div className="rounded-xl border px-4 py-3"><p className="text-xs text-muted-foreground">Unsubscribed (never sent to)</p><p className="text-2xl font-semibold">{customerAudience.data.unsubscribed}</p></div>
              </div>
              <div className="rounded-xl border">
                <p className="border-b px-3 py-2 text-sm font-semibold">First customers</p>
                <ul className="divide-y text-sm">
                  {customers.slice(0, 8).map((c) => (
                    <li key={c.phone} className="flex justify-between gap-3 px-3 py-1.5">
                      <span>{c.name || c.email || c.phone} <span className="text-muted-foreground">+{c.phone}</span></span>
                      <span className="text-muted-foreground">{c.source.replace(/-/g, ' ')}</span>
                    </li>
                  ))}
                  {customers.length === 0 && <li className="px-3 py-3 text-muted-foreground">Nobody has opted in with a phone number yet.</li>}
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">These are customers who ticked the marketing box on signup, login, a form, checkout or the newsletter, and have not unsubscribed. Everyone listed gets the message.</p>
            </>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Country for numbers without a +</Label>
              <CountryPicker value={defaultCode} onChange={setDefaultCode} className="mt-1 w-[260px]" />
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button type="button" variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Upload CSV</Button>
            <Button type="button" variant="ghost" className="gap-2" onClick={sampleCsv}><Download className="h-4 w-4" /> Sample file</Button>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
            One customer per line: <code>phone</code>{listVars.map((v) => <span key={v}>, <code>value for {`{{${v}}}`}</code></span>)}. Numbers can have a country code (<code>+44 7911 123456</code>) or not, in which case the country above is used. A first line with column names is skipped.
          </div>
          <Textarea rows={9} value={listText} onChange={(e) => setListText(e.target.value)}
            placeholder={`9810167696${listVars.map(() => ', Rohit').join('')}\n+1 415 555 0123${listVars.map(() => ', Asha').join('')}`} />
          <div className="grid gap-3 sm:grid-cols-4">
            {[['Valid', parsed.valid.length, 'text-emerald-700'], ['Wrong', parsed.invalid.length, 'text-red-700'], ['Repeated', parsed.duplicates.length, 'text-amber-700'], ['Countries', parsed.byCountry.length, '']].map(([k, v, c]) => (
              <div key={k as string} className="rounded-xl border px-4 py-3"><p className="text-xs text-muted-foreground">{k}</p><p className={cn('text-2xl font-semibold', c as string)}>{v}</p></div>
            ))}
          </div>
          {parsed.byCountry.length > 0 && <p className="text-sm text-muted-foreground">{parsed.byCountry.slice(0, 6).map((c) => `${c.country}: ${c.count}`).join(' · ')}{parsed.byCountry.length > 6 ? ' …' : ''}</p>}
          {(parsed.invalid.length > 0 || parsed.duplicates.length > 0) && (
            <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-red-800">These rows are left out</p>
                <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={invalidCsv}><Download className="h-3.5 w-3.5" /> Download</Button>
              </div>
              <ul className="max-h-40 space-y-0.5 overflow-y-auto text-sm text-red-700">
                {[...parsed.invalid, ...parsed.duplicates].slice(0, 50).map((r) => <li key={r.line}>Line {r.line}: <span className="font-mono">{r.raw.slice(0, 40)}</span> — {r.reason}</li>)}
              </ul>
            </div>
          )}
          {parsed.valid.length > 0 && (
            <div className="rounded-xl border">
              <p className="border-b px-3 py-2 text-sm font-semibold">First numbers to be sent to</p>
              <ul className="divide-y text-sm">
                {parsed.valid.slice(0, 6).map((r) => <li key={r.digits} className="flex justify-between px-3 py-1.5"><span>{r.display}</span><span className="text-muted-foreground">{r.country}</span></li>)}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tags" className="space-y-3">
          <Label>Tags</Label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vip, diwali" />
          <p className="text-xs text-muted-foreground">Everyone who has any of these tags and agreed to receive messages gets it. Separate tags with commas. Up to 10.</p>
        </TabsContent>

        <TabsContent value="all">
          <p className="rounded-xl border p-4 text-sm">Every customer who agreed to receive messages gets this broadcast. This can be a large number, so check the template and values twice.</p>
        </TabsContent>
      </Tabs>
      {stepIssues(3)}
    </div>
  );

  const whenStep = (
    <div className="space-y-6">
      <StepHead title="When should it go out?" subtitle="Send now, schedule it, or save it as a draft." />
      <WhyBox title="Why the daily limit matters">
        WhatsApp limits how many different customers your number can message in a day (new numbers start at about {DAILY_LIMIT}). The broadcast stays under the limit and carries on the next day. {audienceCount > DAILY_LIMIT && audience !== 'all' ? `With ${audienceCount} customers that is about ${days} days.` : ''}
      </WhyBox>
      <RadioGroup value={when} onValueChange={(v) => setWhen(v as When)} className="grid gap-3">
        {([
          ['draft', 'Save as draft', 'Nothing is sent. Start it later from the list.', Save],
          ['now', 'Send now', 'Starts right after you confirm.', Play],
          ['later', 'Schedule', 'Starts at the time you choose.', CalendarClock],
        ] as Array<[When, string, string, typeof Save]>).map(([v, t, d, Icon]) => (
          <label key={v} className={cn('flex cursor-pointer gap-3 rounded-xl border p-4', when === v && 'border-primary bg-primary/5')}>
            <RadioGroupItem value={v} className="mt-1" />
            <span><span className="flex items-center gap-1.5 text-sm font-semibold"><Icon className="h-4 w-4" /> {t}</span><span className="block text-xs text-muted-foreground">{d}</span></span>
          </label>
        ))}
      </RadioGroup>
      {when === 'later' && (
        <div className="max-w-sm space-y-1">
          <Label>Date and time</Label>
          <Input type="datetime-local" min={localInput(new Date(Date.now() + 10 * 60 * 1000))} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          <p className="text-xs text-muted-foreground">In your time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). At least 10 minutes from now.</p>
        </div>
      )}
      {stepIssues(4)}
    </div>
  );

  const reviewStep = (
    <div className="space-y-6">
      <StepHead title="Check and send" subtitle="A broadcast cannot be taken back once messages go out." />
      <WhyBox title="Check it once more">
        A broadcast cannot be taken back once messages are sent. Send yourself a test first so you see exactly what customers will see.
      </WhyBox>
      <Section title="Summary">
        <dl className="grid gap-x-8 text-sm sm:grid-cols-2">
          {([
            ['Name', name || '—'],
            ['Kind', kind === 'CAMPAIGN' ? 'Campaign' : 'Collection launch'],
            ['Template', template?.key ?? '—'],
            ['Audience', audience === 'list' ? `${parsed.valid.length} numbers` : audience === 'customers' ? `${customers.length} customers who opted in${custSource !== 'ALL' ? ` (${custSource.replace(/-/g, ' ')})` : ''}` : audience === 'tags' ? `Tags: ${tagList.join(', ') || '—'}` : 'All who agreed'],
            ['When', when === 'draft' ? 'Saved as a draft' : when === 'now' ? 'Starts right away' : scheduledAt ? new Date(scheduledAt).toLocaleString() : '—'],
            ['Values from the list', listVars.length ? listVars.map((v) => `{{${v}}}`).join(', ') : 'None'],
          ] as Array<[string, string]>).map(([k, v]) => <div key={k} className="flex justify-between border-b py-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
        </dl>
      </Section>

      <Section title="Send yourself a test" hint="Sends the real message to one number, using the first customer's values if you use a list.">
        <div className="flex max-w-xl flex-wrap items-start gap-3">
          <PhoneInput value={testPhone} onChange={(v) => { setTestPhone(v); setTestSent(false); }} className="min-w-[320px] flex-1" />
          <Button type="button" variant="outline" className="gap-2" disabled={!phoneResult(testPhone).ok || !template || test.isPending || problems.some((p) => p.step === 2 || p.step === 1)} onClick={() => test.mutate()}>
            {test.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send test
          </Button>
        </div>
        {testSent && <p className="text-sm text-emerald-700">Test sent. Check that phone, then come back.</p>}
        {!testSent && when !== 'draft' && <p className="flex items-center gap-1.5 text-xs text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> You have not sent a test yet.</p>}
      </Section>

      {isMarketing && audience !== 'customers' && when !== 'draft' && (
        <label className="flex cursor-pointer gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
          <span className="text-sm">
            <span className="block font-semibold text-amber-900">These customers agreed to receive marketing messages</span>
            <span className="block text-xs text-amber-800">Sending marketing messages to people who did not agree can get your WhatsApp number restricted. Customers who replied STOP are skipped automatically.</span>
          </span>
        </label>
      )}
      {showIssues && problems.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Fix these first</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-red-700">{problems.map((p) => <li key={p.message}>{p.message}</li>)}</ul>
        </div>
      )}
      {create.isError && <ErrorNote error={create.error} />}
    </div>
  );

  const body = [basicsStep, templateStep, valuesStep, audienceStep, whenStep, reviewStep][step];
  const last = step === steps.length - 1;

  return (
    <WizardShell
      open={open}
      onClose={close}
      title="New broadcast"
      subtitle="Send one approved template to many customers. Nothing is sent until the last step."
      steps={steps}
      current={step}
      onStep={setStep}
      aside={parts ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold">How it looks</p>
          <TemplatePreview parts={parts} values={previewValues} />
          <p className="text-xs text-muted-foreground">Variables that come from your list show as ‹from your list›.</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" /> Choose a template to see a preview.</div>
      )}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}><ArrowLeft className="h-4 w-4" /> Back</Button>
            {last ? (
              <Button className="gap-2" onClick={submit} disabled={create.isPending}>
                {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : when === 'now' ? <Play className="h-4 w-4" /> : when === 'later' ? <CalendarClock className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {when === 'now' ? 'Start broadcast' : when === 'later' ? 'Schedule broadcast' : 'Save draft'}
              </Button>
            ) : (
              <Button className="gap-2" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>Next <ArrowRight className="h-4 w-4" /></Button>
            )}
          </div>
        </>
      }
    >
      {body}
    </WizardShell>
  );
};
