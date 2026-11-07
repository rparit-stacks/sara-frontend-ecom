import { useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, Bold, Copy, Italic, KeyRound, Link2, Loader2, MessageSquareText, Phone, Plus, Reply, Strikethrough, Trash2, Upload, Variable,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { whatsappCloudApi, WaCloudTemplate, WaCloudPlatformTemplate } from '@/lib/api';
import {
  ButtonDraft, ButtonKind, Draft, HeaderKind, LIMITS, buildAuthComponents, buildComponents, describeTemplate, draftFromComponents,
  emptyDraft, emptyHeader, newButton, numericVariables, toTemplateName, validateAuth, validateDraft,
} from '@/lib/waTemplateRules';
import { cn } from '@/lib/utils';
import { TemplatePreview } from './TemplatePreview';

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'en_US', label: 'English (US)' },
  { value: 'hi', label: 'Hindi' },
  { value: 'mr', label: 'Marathi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'bn', label: 'Bengali' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'kn', label: 'Kannada' },
];

const Counter = ({ value, max }: { value: number; max: number }) => (
  <span className={cn('text-xs tabular-nums', value > max ? 'text-red-600' : 'text-muted-foreground')}>{value}/{max}</span>
);

const Field = ({ label, hint, right, children }: { label: string; hint?: string; right?: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      {right}
    </div>
    <div className="mt-1">{children}</div>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const BUTTON_META: Record<ButtonKind, { label: string; icon: typeof Link2; help: string }> = {
  quick_reply: { label: 'Quick reply', icon: Reply, help: 'The customer taps it to send a short answer back' },
  url: { label: 'Link', icon: Link2, help: 'Opens a website. The link can end with one variable' },
  phone: { label: 'Call', icon: Phone, help: 'Calls your phone number' },
  copy_code: { label: 'Copy code', icon: Copy, help: 'Copies a code, such as a coupon (Marketing only)' },
};

type Mode = 'choose' | 'message' | 'auth';

export const TemplateBuilder = ({
  open, onOpenChange, template, platform,
}: { open: boolean; onOpenChange: (o: boolean) => void; template?: WaCloudTemplate | null; platform?: WaCloudPlatformTemplate | null }) => {
  const editing = !!template;
  const queryClient = useQueryClient();
  const initialMode: Mode = template ? (template.category === 'AUTHENTICATION' ? 'auth' : 'message') : 'choose';
  const [mode, setMode] = useState<Mode>(initialMode);

  const [draft, setDraft] = useState<Draft>(() =>
    template && template.category !== 'AUTHENTICATION'
      ? draftFromComponents(template.key, template.language, template.category, template.components ?? [])
      : emptyDraft(),
  );
  const [auth, setAuth] = useState(() => {
    const footer = (template?.components ?? []).find((c) => String(c.type).toUpperCase() === 'FOOTER');
    const body = (template?.components ?? []).find((c) => String(c.type).toUpperCase() === 'BODY');
    return {
      name: template?.key ?? '',
      language: template?.language ?? 'en',
      securityRecommendation: body ? body.add_security_recommendation !== false : true,
      expiryMinutes: (footer?.code_expiration_minutes as number | undefined) ?? 10,
    };
  });
  const [uploading, setUploading] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const setHeader = (patch: Partial<Draft['header']>) => setDraft((d) => ({ ...d, header: { ...d.header, ...patch } }));
  const setButton = (id: string, patch: Partial<ButtonDraft>) =>
    setDraft((d) => ({ ...d, buttons: d.buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));

  const issues = useMemo(() => {
    const list = mode === 'auth' ? validateAuth(auth) : validateDraft(draft);
    // A template the platform sends keeps the exact number of variables the code passes.
    if (platform && mode !== 'auth' && numericVariables(draft.body).length !== platform.variables) {
      list.push({
        field: 'body',
        message: `The platform sends ${platform.variables} value${platform.variables === 1 ? '' : 's'} with this template, so the message must keep exactly ${platform.variables} variable${platform.variables === 1 ? '' : 's'} ({{1}}${platform.variables > 1 ? ` to {{${platform.variables}}}` : ''}). You can change the wording around them.`,
      });
    }
    return list;
  }, [mode, auth, draft, platform]);
  const components = useMemo(() => (mode === 'auth' ? buildAuthComponents(auth) : buildComponents(draft)), [mode, auth, draft]);
  const parts = useMemo(
    () => describeTemplate(mode === 'auth' ? 'AUTHENTICATION' : draft.category, components),
    [mode, draft.category, components],
  );
  const previewValues = useMemo(() => {
    if (mode === 'auth') return { '1': '123456' };
    const v: Record<string, string> = {};
    numericVariables(draft.body).forEach((n) => { v[String(n)] = draft.bodyExamples[n] || `variable ${n}`; });
    return v;
  }, [mode, draft.body, draft.bodyExamples]);

  const issuesFor = (field: string) => (showIssues ? issues.filter((i) => i.field === field) : []);
  const bodyVars = numericVariables(draft.body);
  const counts = (k: ButtonKind) => draft.buttons.filter((b) => b.kind === k).length;
  const canAdd = (k: ButtonKind) => {
    if (draft.buttons.length >= LIMITS.buttons) return false;
    if (k === 'quick_reply') return counts(k) < LIMITS.quickReplies;
    if (k === 'url') return counts(k) < LIMITS.urlButtons;
    if (k === 'phone') return counts(k) < LIMITS.phoneButtons;
    return counts(k) < LIMITS.copyCodeButtons && draft.category === 'MARKETING';
  };

  const wrapSelection = (open_: string, close = open_) => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const next = `${value.slice(0, a)}${open_}${value.slice(a, b) || 'text'}${close}${value.slice(b)}`;
    set({ body: next });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + open_.length, a + open_.length + (b - a || 4)); });
  };
  const insertVariable = () => {
    const el = bodyRef.current;
    const n = (bodyVars.length ? Math.max(...bodyVars) : 0) + 1;
    const token = `{{${n}}}`;
    const pos = el ? el.selectionStart : draft.body.length;
    set({ body: `${draft.body.slice(0, pos)}${token}${draft.body.slice(pos)}` });
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(pos + token.length, pos + token.length); });
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    const kind = draft.header.kind;
    const rules: Record<string, { types: string[]; mb: number; label: string }> = {
      image: { types: ['image/jpeg', 'image/png'], mb: LIMITS.sampleImageMB, label: 'a JPG or PNG image' },
      video: { types: ['video/mp4'], mb: LIMITS.sampleVideoMB, label: 'an MP4 video' },
      document: { types: ['application/pdf'], mb: LIMITS.sampleDocumentMB, label: 'a PDF' },
    };
    const rule = rules[kind];
    if (!rule) return;
    if (!rule.types.includes(file.type)) { toast.error(`Choose ${rule.label}`); return; }
    if (file.size > rule.mb * 1024 * 1024) { toast.error(`The file must be ${rule.mb} MB or smaller`); return; }
    setUploading(true);
    try {
      const { handle } = await whatsappCloudApi.uploadTemplateSample(file);
      setHeader({ handle, fileName: file.name });
      toast.success('Sample uploaded');
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const reset = () => {
    setMode(initialMode); setDraft(emptyDraft()); setShowIssues(false);
    setAuth({ name: '', language: 'en', securityRecommendation: true, expiryMinutes: 10 });
  };

  const save = useMutation({
    mutationFn: () => {
      if (editing) return whatsappCloudApi.updateTemplate(template!.key, { components });
      const name = mode === 'auth' ? auth.name : draft.name;
      return whatsappCloudApi.createTemplate({
        key: name,
        name,
        language: mode === 'auth' ? auth.language : draft.language,
        category: mode === 'auth' ? 'AUTHENTICATION' : draft.category,
        ...(mode === 'auth' ? {} : { parameterFormat: 'POSITIONAL' as const }),
        components,
      });
    },
    onSuccess: () => {
      toast.success(editing
        ? 'Changes sent to WhatsApp. The template goes back to review before it can be used again.'
        : 'Template sent to WhatsApp for review. This usually takes a few minutes to a few hours.');
      queryClient.invalidateQueries({ queryKey: ['waCloudTemplates'] });
      if (!editing) reset();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message || 'WhatsApp did not accept the template'),
  });

  const submit = () => {
    setShowIssues(true);
    if (issues.length > 0) { toast.error('Please fix the highlighted problems first'); return; }
    save.mutate();
  };

  const Issues = ({ field }: { field: string }) => {
    const list = issuesFor(field);
    if (!list.length) return null;
    return <ul className="mt-1 space-y-0.5">{list.map((i) => <li key={i.message} className="text-xs text-red-600">• {i.message}</li>)}</ul>;
  };

  // ---------- step 0: choose a type ----------
  if (mode === 'choose') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>What kind of template?</DialogTitle>
            <DialogDescription>WhatsApp treats these differently, so pick the one that matches your message.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setMode('message')} className="rounded-xl border p-4 text-left transition hover:border-primary hover:bg-muted/40">
              <MessageSquareText className="mb-2 h-6 w-6 text-sky-600" />
              <p className="font-semibold">Message</p>
              <p className="mt-1 text-sm text-muted-foreground">Order updates, account news, offers and announcements. Can have a header, buttons and variables.</p>
            </button>
            <button type="button" onClick={() => setMode('auth')} className="rounded-xl border p-4 text-left transition hover:border-primary hover:bg-muted/40">
              <KeyRound className="mb-2 h-6 w-6 text-violet-600" />
              <p className="font-semibold">Login code (OTP)</p>
              <p className="mt-1 text-sm text-muted-foreground">Sends a one-time code with a Copy Code button. WhatsApp fixes the wording.</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit “${template!.key}”` : mode === 'auth' ? 'New login code template' : 'New message template'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'After you save, WhatsApp reviews the template again and it cannot be used until it is approved. WhatsApp also limits how often a template can be edited.'
              : 'WhatsApp reviews every template before it can be used.'}
          </DialogDescription>
        </DialogHeader>

        {platform && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Used by the platform: {platform.label}</p>
            <p className="mt-0.5 text-xs">
              You can change the wording and the buttons, but the message must keep exactly {platform.variables} variable{platform.variables === 1 ? '' : 's'}, and the template cannot be deleted.
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            {mode === 'auth' ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Template name" hint={auth.name ? `Saved as ${toTemplateName(auth.name) || '…'}` : 'e.g. login_code'}>
                    <Input value={auth.name} disabled={editing} onChange={(e) => setAuth({ ...auth, name: toTemplateName(e.target.value) })} />
                    <Issues field="name" />
                  </Field>
                  <Field label="Language">
                    <Select value={auth.language} disabled={editing} onValueChange={(v) => setAuth({ ...auth, language: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Add the security reminder</p>
                    <p className="text-xs text-muted-foreground">“For your security, do not share this code.”</p>
                  </div>
                  <Switch checked={auth.securityRecommendation} onCheckedChange={(v) => setAuth({ ...auth, securityRecommendation: v })} />
                </div>
                <Field label="Code expires after (minutes)" hint={`Between ${LIMITS.authExpiryMin} and ${LIMITS.authExpiryMax}. Leave empty for no expiry line.`}>
                  <Input
                    type="number"
                    min={LIMITS.authExpiryMin}
                    max={LIMITS.authExpiryMax}
                    value={auth.expiryMinutes ?? ''}
                    onChange={(e) => setAuth({ ...auth, expiryMinutes: e.target.value === '' ? null : Number(e.target.value) })}
                    className="max-w-[160px]"
                  />
                  <Issues field="footer" />
                </Field>
                <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  The wording, the Copy Code button and the code length (up to {LIMITS.authCode} letters or numbers) are set by WhatsApp for login codes. Links, images and emoji are not allowed.
                </p>
              </>
            ) : (
              <>
                {/* basics */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <Field label="Template name" hint={draft.name ? `Saved as ${draft.name}` : 'Lowercase letters, numbers and underscores, e.g. order_shipped'}>
                      <Input value={draft.name} disabled={editing} onChange={(e) => set({ name: toTemplateName(e.target.value) })} placeholder="e.g. order shipped" />
                      <Issues field="name" />
                    </Field>
                  </div>
                  <Field label="Type">
                    <Select value={draft.category} disabled={editing} onValueChange={(v) => set({ category: v as Draft['category'], buttons: v === 'MARKETING' ? draft.buttons : draft.buttons.filter((b) => b.kind !== 'copy_code') })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTILITY">Utility</SelectItem>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Language">
                    <Select value={draft.language} disabled={editing} onValueChange={(v) => set({ language: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Issues field="language" />
                  </Field>
                  <div className="sm:col-span-3 -mt-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    {draft.category === 'UTILITY'
                      ? 'Utility: updates about something the customer did or asked for (an order, a payment, an account). No offers, discounts or promotion of any kind, or WhatsApp will treat it as Marketing.'
                      : 'Marketing: offers, new arrivals, promotions, reminders to come back. Customers must have agreed to receive these.'}
                  </div>
                </div>

                {/* header */}
                <div className="space-y-2 rounded-lg border p-3">
                  <Field label="Header (optional)">
                    <Select value={draft.header.kind} onValueChange={(v) => setHeader({ ...emptyHeader(), kind: v as HeaderKind })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No header</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="document">Document (PDF)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  {draft.header.kind === 'text' && (
                    <>
                      <Field label="Header text" right={<Counter value={draft.header.text.length} max={LIMITS.headerText} />} hint="One line. No emoji or formatting. You can use one variable, {{1}}.">
                        <Input value={draft.header.text} onChange={(e) => setHeader({ text: e.target.value })} />
                      </Field>
                      {/\{\{\s*1\s*\}\}/.test(draft.header.text) && (
                        <Field label="Example for {{1}}">
                          <Input value={draft.header.textExample} onChange={(e) => setHeader({ textExample: e.target.value })} />
                        </Field>
                      )}
                    </>
                  )}
                  {['image', 'video', 'document'].includes(draft.header.kind) && (
                    <div>
                      <input ref={fileRef} type="file" className="hidden"
                        accept={draft.header.kind === 'image' ? 'image/png,image/jpeg' : draft.header.kind === 'video' ? 'video/mp4' : 'application/pdf'}
                        onChange={(e) => onFile(e.target.files?.[0])} />
                      <Button type="button" variant="outline" size="sm" className="gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {draft.header.handle ? 'Replace sample' : `Upload sample ${draft.header.kind}`}
                      </Button>
                      {draft.header.fileName && <span className="ml-2 text-xs text-muted-foreground">{draft.header.fileName}</span>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {draft.header.kind === 'image' && `JPG or PNG, up to ${LIMITS.sampleImageMB} MB. `}
                        {draft.header.kind === 'video' && `MP4, up to ${LIMITS.sampleVideoMB} MB. `}
                        {draft.header.kind === 'document' && `PDF, up to ${LIMITS.sampleDocumentMB} MB. `}
                        This is only a sample for WhatsApp’s review. You choose the real file each time you send.
                      </p>
                    </div>
                  )}
                  <Issues field="header" />
                </div>

                {/* body */}
                <div>
                  <Field label="Message text" right={<Counter value={draft.body.replace(/\{\{\s*[^{}\s]+\s*\}\}/g, 'x').length} max={LIMITS.body} />}>
                    <div className="mb-1 flex flex-wrap gap-1">
                      <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => wrapSelection('*')}><Bold className="h-3.5 w-3.5" /> Bold</Button>
                      <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => wrapSelection('_')}><Italic className="h-3.5 w-3.5" /> Italic</Button>
                      <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => wrapSelection('~')}><Strikethrough className="h-3.5 w-3.5" /> Strike</Button>
                      <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={insertVariable}><Variable className="h-3.5 w-3.5" /> Add variable</Button>
                    </div>
                    <Textarea ref={bodyRef} rows={7} value={draft.body} onChange={(e) => set({ body: e.target.value })}
                      placeholder={'Hello {{1}}, your order #{{2}} has been shipped and will reach you by {{3}}.\n\nThank you for shopping with Studio Sara.'} />
                  </Field>
                  <p className="mt-1 text-xs text-muted-foreground">
                    A variable ({'{{1}}'}, {'{{2}}'}…) is a detail that changes for each customer. Do not start or end the text with one, do not put two side by side, and write some words around each.
                  </p>
                  <Issues field="body" />
                  {bodyVars.length > 0 && (
                    <div className="mt-2 space-y-2 rounded-lg border bg-muted/30 p-3">
                      <p className="text-sm font-medium">Example for each variable</p>
                      <p className="text-xs text-muted-foreground">WhatsApp needs a real-looking sample to review the template. It is never sent to customers.</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {bodyVars.map((n) => (
                          <div key={n} className="flex items-center gap-2">
                            <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">{`{{${n}}}`}</span>
                            <Input className="h-8" value={draft.bodyExamples[n] ?? ''} onChange={(e) => set({ bodyExamples: { ...draft.bodyExamples, [n]: e.target.value } })} placeholder="Sample value" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* footer */}
                <Field label="Footer (optional)" right={<Counter value={draft.footer.length} max={LIMITS.footer} />} hint="One short line under the message. No variables or emoji.">
                  <Input value={draft.footer} onChange={(e) => set({ footer: e.target.value })} placeholder="e.g. Reply STOP to opt out" />
                  <Issues field="footer" />
                </Field>

                {/* buttons */}
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Buttons (optional) <span className="font-normal text-muted-foreground">{draft.buttons.length}/{LIMITS.buttons}</span></p>
                    <div className="flex flex-wrap gap-1">
                      {(Object.keys(BUTTON_META) as ButtonKind[]).map((k) => {
                        const Icon = BUTTON_META[k].icon;
                        return (
                          <Button key={k} type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" disabled={!canAdd(k)}
                            title={k === 'copy_code' && draft.category !== 'MARKETING' ? 'Copy-code buttons are for Marketing templates only' : BUTTON_META[k].help}
                            onClick={() => setDraft((d) => ({ ...d, buttons: [...d.buttons, newButton(k)] }))}>
                            <Plus className="h-3 w-3" /><Icon className="h-3 w-3" /> {BUTTON_META[k].label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  {draft.buttons.length > 3 || (draft.buttons.some((b) => b.kind === 'quick_reply') && draft.buttons.some((b) => b.kind !== 'quick_reply')) ? (
                    <p className="flex items-start gap-1.5 text-xs text-amber-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> With 4 or more buttons, or a quick reply next to another kind, customers on WhatsApp Desktop are asked to open the message on their phone.</p>
                  ) : null}
                  {draft.buttons.map((b) => {
                    const meta = BUTTON_META[b.kind];
                    const Icon = meta.icon;
                    return (
                      <div key={b.id} className="space-y-2 rounded-lg bg-muted/30 p-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-sm font-medium"><Icon className="h-4 w-4" /> {meta.label}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => setDraft((d) => ({ ...d, buttons: d.buttons.filter((x) => x.id !== b.id) }))} aria-label="Remove button">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {b.kind !== 'copy_code' && (
                          <Field label="Button label" right={<Counter value={b.text.length} max={LIMITS.buttonText} />}>
                            <Input value={b.text} onChange={(e) => setButton(b.id, { text: e.target.value })} placeholder={b.kind === 'quick_reply' ? 'e.g. Yes, confirm' : b.kind === 'url' ? 'e.g. Track order' : 'e.g. Call us'} />
                          </Field>
                        )}
                        {b.kind === 'url' && (
                          <>
                            <Field label="Link" hint="Must start with https://. To add a value per customer, end the link with {{1}}.">
                              <Input value={b.url} onChange={(e) => setButton(b.id, { url: e.target.value })} placeholder="https://studiosara.in/track/{{1}}" />
                            </Field>
                            {/\{\{\s*1\s*\}\}/.test(b.url) && (
                              <Field label="Example for {{1}}"><Input value={b.urlExample} onChange={(e) => setButton(b.id, { urlExample: e.target.value })} placeholder="e.g. 1042" /></Field>
                            )}
                          </>
                        )}
                        {b.kind === 'phone' && (
                          <Field label="Phone number" hint="With country code, digits only, e.g. +919876543210.">
                            <Input value={b.phone} onChange={(e) => setButton(b.id, { phone: e.target.value.replace(/[^\d+]/g, '') })} />
                          </Field>
                        )}
                        {b.kind === 'copy_code' && (
                          <Field label="Example code" hint={`1 to ${LIMITS.copyCodeExample} letters or numbers. You type the real code each time you send.`}>
                            <Input value={b.example} onChange={(e) => setButton(b.id, { example: e.target.value.replace(/[^A-Za-z0-9]/g, '') })} placeholder="e.g. SAVE10" />
                          </Field>
                        )}
                      </div>
                    );
                  })}
                  <Issues field="buttons" />
                </div>
                <Issues field="general" />
              </>
            )}
          </div>

          {/* preview */}
          <div className="lg:sticky lg:top-0 lg:self-start">
            <p className="mb-2 text-sm font-medium">Preview</p>
            <TemplatePreview parts={parts} values={previewValues} headerValue={draft.header.textExample} />
            <p className="mt-2 text-xs text-muted-foreground">This is how it looks to the customer, with your examples filled in.</p>
          </div>
        </div>

        {showIssues && issues.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-medium">{issues.length} thing{issues.length === 1 ? '' : 's'} to fix before this can be sent to WhatsApp</p>
          </div>
        )}

        <DialogFooter>
          {!editing && <Button variant="ghost" onClick={() => { reset(); setMode('choose'); }}>Back</Button>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending} className="gap-2">
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? 'Save and send for review' : 'Submit for review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
