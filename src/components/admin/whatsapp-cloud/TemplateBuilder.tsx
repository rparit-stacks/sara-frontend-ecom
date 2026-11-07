import { useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Bold, Check, Copy, Italic, KeyRound, Link2, Loader2, MessageSquareText, Megaphone,
  Phone, Plus, Reply, Send, Strikethrough, Trash2, Upload, Variable, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { whatsappCloudApi, WaCloudTemplate, WaCloudPlatformTemplate } from '@/lib/api';
import {
  AuthDraft, ButtonDraft, ButtonKind, CATEGORY_INFO, Draft, HeaderKind, LIMITS, STARTERS, Starter, buildAuthComponents, buildComponents,
  describeTemplate, draftFromComponents, draftFromStarter, emptyDraft, emptyHeader, newButton, numericVariables, ruleChecklist,
  toTemplateName, validateAuth, validateDraft,
} from '@/lib/waTemplateRules';
import { parsePhone } from '@/lib/phone';
import { cn } from '@/lib/utils';
import { TemplatePreview } from './TemplatePreview';
import { PhoneInput, PhoneValue, emptyPhone } from './PhoneInput';
import { Section, StepHead, WhyBox, WizardShell, WizardStep } from './WizardShell';

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

const Field = ({ label, hint, right, children }: { label: string; hint?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      {right}
    </div>
    <div className="mt-1">{children}</div>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const BUTTON_META: Record<ButtonKind, { label: string; icon: typeof Link2; help: string; why: string }> = {
  quick_reply: { label: 'Quick reply', icon: Reply, help: 'A tap that sends a short answer back', why: 'Lets a customer answer in one tap, for example "Yes, confirm". Up to 10.' },
  url: { label: 'Link', icon: Link2, help: 'Opens a website', why: 'Takes the customer to a page, such as order tracking. The link can end with one variable so each customer gets their own page. Up to 2.' },
  phone: { label: 'Call', icon: Phone, help: 'Calls a phone number', why: 'Lets a customer call your support number in one tap. Only 1 allowed.' },
  copy_code: { label: 'Copy code', icon: Copy, help: 'Copies a coupon code', why: 'Copies a coupon code to the clipboard. Marketing templates only. Only 1 allowed.' },
};

const CATEGORY_ICON = { UTILITY: MessageSquareText, MARKETING: Megaphone, AUTHENTICATION: KeyRound } as const;

type Mode = 'message' | 'auth';

export const TemplateBuilder = ({
  open = true, onOpenChange, asPage = false, onClose, template, platform, existingNames = [],
}: {
  open?: boolean; onOpenChange?: (o: boolean) => void; asPage?: boolean; onClose?: () => void;
  template?: WaCloudTemplate | null; platform?: WaCloudPlatformTemplate | null; existingNames?: string[];
}) => {
  const close = () => { if (asPage) onClose?.(); else onOpenChange?.(false); };
  const editing = !!template;
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>(template?.category === 'AUTHENTICATION' ? 'auth' : 'message');
  const [step, setStep] = useState(editing ? 2 : 0);
  const [draft, setDraft] = useState<Draft>(() =>
    template && template.category !== 'AUTHENTICATION'
      ? draftFromComponents(template.key, template.language, template.category, template.components ?? [])
      : emptyDraft(),
  );
  const [auth, setAuth] = useState<AuthDraft>(() => {
    const footer = (template?.components ?? []).find((c) => String(c.type).toUpperCase() === 'FOOTER');
    const body = (template?.components ?? []).find((c) => String(c.type).toUpperCase() === 'BODY');
    return {
      name: template?.key ?? '', language: template?.language ?? 'en',
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
  const setButton = (id: string, patch: Partial<ButtonDraft>) => setDraft((d) => ({ ...d, buttons: d.buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));

  const name = mode === 'auth' ? auth.name : draft.name;
  const issues = useMemo(() => {
    const list = mode === 'auth' ? validateAuth(auth) : validateDraft(draft);
    if (!editing && name && existingNames.includes(name)) list.push({ field: 'name', message: 'A template with this name already exists. Choose another name.' });
    if (platform && mode !== 'auth' && numericVariables(draft.body).length !== platform.variables) {
      list.push({
        field: 'body',
        message: `The platform sends ${platform.variables} value${platform.variables === 1 ? '' : 's'} with this template, so the message must keep exactly ${platform.variables} variable${platform.variables === 1 ? '' : 's'}. You can change the wording around them.`,
      });
    }
    return list;
  }, [mode, auth, draft, platform, name, editing, existingNames]);

  const components = useMemo(() => (mode === 'auth' ? buildAuthComponents(auth) : buildComponents(draft)), [mode, auth, draft]);
  const parts = useMemo(() => describeTemplate(mode === 'auth' ? 'AUTHENTICATION' : draft.category, components), [mode, draft.category, components]);
  const previewValues = useMemo(() => {
    if (mode === 'auth') return { '1': '123456' };
    const v: Record<string, string> = {};
    numericVariables(draft.body).forEach((n) => { v[String(n)] = draft.bodyExamples[n] || `variable ${n}`; });
    return v;
  }, [mode, draft.body, draft.bodyExamples]);
  const checklist = useMemo(() => ruleChecklist(draft, issues), [draft, issues]);

  const stepIds = mode === 'auth' ? ['type', 'basics', 'settings', 'review'] : ['type', 'basics', 'content', 'buttons', 'review'];
  const idx = (id: string) => stepIds.indexOf(id);
  const current = stepIds[Math.min(step, stepIds.length - 1)];
  const hasIssue = (...fields: string[]) => issues.some((i) => fields.includes(i.field));
  const steps: WizardStep[] = stepIds.map((id) => ({
    type: { id, label: 'Type', hint: 'Utility, Marketing or Login code', problem: false },
    basics: { id, label: 'Name', hint: 'What it is called and who reads it', problem: showIssues && hasIssue('name', 'language') },
    content: { id, label: 'Message', hint: 'Header, text and footer', problem: showIssues && hasIssue('header', 'body', 'footer', 'general') },
    buttons: { id, label: 'Buttons', hint: 'Optional taps for the customer', problem: showIssues && hasIssue('buttons') },
    settings: { id, label: 'Settings', hint: 'Expiry and security line', problem: showIssues && hasIssue('footer') },
    review: { id, label: 'Review', hint: 'Check the rules, then submit', problem: false },
  }[id] as WizardStep));

  const issuesFor = (field: string) => (showIssues ? issues.filter((i) => i.field === field) : []);
  const Issues = ({ field }: { field: string }) => {
    const list = issuesFor(field);
    if (!list.length) return null;
    return <ul className="mt-1 space-y-0.5">{list.map((i) => <li key={i.message} className="text-xs text-red-600">• {i.message}</li>)}</ul>;
  };

  const bodyVars = numericVariables(draft.body);
  const counts = (k: ButtonKind) => draft.buttons.filter((b) => b.kind === k).length;
  const canAdd = (k: ButtonKind) => {
    if (draft.buttons.length >= LIMITS.buttons) return false;
    if (k === 'quick_reply') return counts(k) < LIMITS.quickReplies;
    if (k === 'url') return counts(k) < LIMITS.urlButtons;
    if (k === 'phone') return counts(k) < LIMITS.phoneButtons;
    return counts(k) < LIMITS.copyCodeButtons && draft.category === 'MARKETING';
  };

  const wrapSelection = (mark: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    set({ body: `${value.slice(0, a)}${mark}${value.slice(a, b) || 'text'}${mark}${value.slice(b)}` });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + mark.length, a + mark.length + (b - a || 4)); });
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

  const applyStarter = (s: Starter) => {
    const lang = draft.language;
    setDraft({ ...draftFromStarter(s, lang), buttons: [] });
    toast.success(`Started from “${s.label}”. Change anything you like.`);
  };

  const save = useMutation({
    mutationFn: () => {
      if (editing) return whatsappCloudApi.updateTemplate(template!.key, { components });
      return whatsappCloudApi.createTemplate({
        key: name, name, language: mode === 'auth' ? auth.language : draft.language,
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
      close();
    },
    onError: (e: any) => toast.error(e?.message || 'WhatsApp did not accept the template'),
  });

  const submit = () => {
    setShowIssues(true);
    if (issues.length > 0) {
      toast.error(`${issues.length} thing${issues.length === 1 ? '' : 's'} to fix first`);
      const first = issues[0].field;
      const target = first === 'name' || first === 'language' ? 'basics' : first === 'buttons' ? 'buttons' : mode === 'auth' ? 'settings' : 'content';
      setStep(Math.max(0, idx(target)));
      return;
    }
    save.mutate();
  };

  const isLast = current === 'review';

  // ---------- steps ----------
  const typeStep = (
    <div className="space-y-5">
      <StepHead title="What kind of template is this?" subtitle="Pick the type that matches your message. WhatsApp reviews and prices each type differently." />
      <WhyBox title="Why the type matters">
        WhatsApp reviews, prices and delivers each type differently. Choosing the wrong one gets a template rejected, or moved to a more expensive type. If a message mentions a discount or an offer, it is Marketing.
      </WhyBox>
      <div className="grid gap-3">
        {CATEGORY_INFO.map((c) => {
          const Icon = CATEGORY_ICON[c.id];
          const selected = c.id === 'AUTHENTICATION' ? mode === 'auth' : mode === 'message' && draft.category === c.id;
          return (
            <button
              key={c.id}
              type="button"
              disabled={editing}
              onClick={() => {
                if (c.id === 'AUTHENTICATION') setMode('auth');
                else { setMode('message'); set({ category: c.id, buttons: c.id === 'MARKETING' ? draft.buttons : draft.buttons.filter((b) => b.kind !== 'copy_code') }); }
              }}
              className={cn('grid gap-x-8 gap-y-3 rounded-xl border p-5 text-left transition md:grid-cols-[230px_1fr_1fr]', selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50', editing && 'cursor-not-allowed opacity-70')}
            >
              <div>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="font-sans text-base font-semibold">{c.title}</p>
                  {selected && <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>}
                </div>
                <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{c.tagline}</p>
                <p className="mt-2 text-xs text-muted-foreground">Review: {c.approval.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Use it for</p>
                <ul className="mt-1.5 space-y-1 text-sm leading-snug">{c.useFor.slice(0, 3).map((u) => <li key={u} className="flex gap-2"><span className="text-muted-foreground">•</span>{u}</li>)}</ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Watch out</p>
                <ul className="mt-1.5 space-y-1 text-sm leading-snug text-amber-900">{c.watchOut.slice(0, 2).map((u) => <li key={u} className="flex gap-2"><span>•</span>{u}</li>)}</ul>
              </div>
            </button>
          );
        })}
      </div>
      {editing && <p className="text-sm text-muted-foreground">The type of an existing template cannot be changed. Create a new template to use a different type.</p>}
    </div>
  );

  const languageNote = (
    <p className="text-xs text-muted-foreground">
      Customers get the template in this language. Write the message in the same language, and create a second template for another language.
    </p>
  );

  const basicsStep = (
    <div className="space-y-6">
      <StepHead title="Name your template" subtitle="The name is how the platform finds it, and it cannot be changed later." />
      <WhyBox title="Why the name and language matter">
        The name is how the platform and this page find the template, and it cannot be changed later. The language tells WhatsApp how to review the text.
      </WhyBox>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="Template name" hint={name ? `Saved as ${name}` : 'Lowercase letters, numbers and underscores, for example order_shipped'}>
          <Input value={name} disabled={editing} placeholder="e.g. order shipped"
            onChange={(e) => (mode === 'auth' ? setAuth({ ...auth, name: toTemplateName(e.target.value) }) : set({ name: toTemplateName(e.target.value) }))} />
          <Issues field="name" />
        </Field>
        <Field label="Language" hint={languageNote}>
          <Select value={mode === 'auth' ? auth.language : draft.language} disabled={editing}
            onValueChange={(v) => (mode === 'auth' ? setAuth({ ...auth, language: v }) : set({ language: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
          </Select>
          <Issues field="language" />
        </Field>
      </div>
      {mode === 'message' && !editing && (
        <Section title="Start from an example" hint="Optional. Pick one to fill the message with wording that already follows the rules, then change it.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STARTERS.map((s) => (
              <button key={s.id} type="button" onClick={() => applyStarter(s)} className="rounded-xl border p-3 text-left transition hover:border-primary hover:bg-muted/40">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{s.label}</p>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', s.category === 'UTILITY' ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800')}>{s.category === 'UTILITY' ? 'Utility' : 'Marketing'}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
              </button>
            ))}
          </div>
        </Section>
      )}
    </div>
  );

  const contentStep = (
    <div className="space-y-8">
      <StepHead title="Write the message" subtitle="The text your customer will read, with an optional header and footer." />
      {platform && (
        <WhyBox title={`Used by the platform: ${platform.label}`} tone="warn">
          You can change the wording and the buttons, but the message must keep exactly {platform.variables} variable{platform.variables === 1 ? '' : 's'}, because the platform sends that many values. It cannot be deleted.
        </WhyBox>
      )}

      <Section title="Header" hint="Optional. A line, picture, video or file shown above the message. It makes the message stand out, but adds one more thing to review.">
        <Select value={draft.header.kind} onValueChange={(v) => setHeader({ ...emptyHeader(), kind: v as HeaderKind })}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No header</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="document">Document (PDF)</SelectItem>
          </SelectContent>
        </Select>
        {draft.header.kind === 'text' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Header text" right={<Counter value={draft.header.text.length} max={LIMITS.headerText} />} hint="One line. No emoji or formatting. You can use one variable, {{1}}.">
              <Input value={draft.header.text} onChange={(e) => setHeader({ text: e.target.value })} />
            </Field>
            {/\{\{\s*1\s*\}\}/.test(draft.header.text) && (
              <Field label="Example for {{1}}"><Input value={draft.header.textExample} onChange={(e) => setHeader({ textExample: e.target.value })} /></Field>
            )}
          </div>
        )}
        {['image', 'video', 'document'].includes(draft.header.kind) && (
          <div className="rounded-xl border border-dashed p-4">
            <input ref={fileRef} type="file" className="hidden"
              accept={draft.header.kind === 'image' ? 'image/png,image/jpeg' : draft.header.kind === 'video' ? 'video/mp4' : 'application/pdf'}
              onChange={(e) => onFile(e.target.files?.[0])} />
            <Button type="button" variant="outline" className="gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {draft.header.handle ? 'Replace sample' : `Upload a sample ${draft.header.kind}`}
            </Button>
            {draft.header.fileName && <span className="ml-3 text-sm text-muted-foreground">{draft.header.fileName}</span>}
            <p className="mt-2 text-xs text-muted-foreground">
              {draft.header.kind === 'image' && `JPG or PNG, up to ${LIMITS.sampleImageMB} MB. `}
              {draft.header.kind === 'video' && `MP4, up to ${LIMITS.sampleVideoMB} MB. `}
              {draft.header.kind === 'document' && `PDF, up to ${LIMITS.sampleDocumentMB} MB. `}
              This is only a sample for WhatsApp’s review. You choose the real file each time you send.
            </p>
          </div>
        )}
        <Issues field="header" />
      </Section>

      <Section title="Message text" hint="What the customer reads. Use variables for the parts that change for each customer, such as their name or order number.">
        <div className="flex flex-wrap gap-1.5">
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => wrapSelection('*')}><Bold className="h-3.5 w-3.5" /> Bold</Button>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => wrapSelection('_')}><Italic className="h-3.5 w-3.5" /> Italic</Button>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => wrapSelection('~')}><Strikethrough className="h-3.5 w-3.5" /> Strike</Button>
          <Button type="button" size="sm" className="h-8 gap-1.5" onClick={insertVariable}><Variable className="h-3.5 w-3.5" /> Add variable</Button>
          <span className="ml-auto self-center"><Counter value={draft.body.replace(/\{\{\s*[^{}\s]+\s*\}\}/g, 'x').length} max={LIMITS.body} /></span>
        </div>
        <Textarea ref={bodyRef} rows={9} value={draft.body} onChange={(e) => set({ body: e.target.value })}
          placeholder={'Hello {{1}}, your order #{{2}} has been shipped and will reach you by {{3}}.\n\nThank you for shopping with Studio Sara.'} />
        <p className="text-xs text-muted-foreground">
          Do not start or end the text with a variable, do not put two side by side, and write some words around each one (about three words for every variable).
        </p>
        <Issues field="body" />
        {bodyVars.length > 0 && (
          <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-semibold">Examples for the variables</p>
              <p className="text-xs text-muted-foreground">WhatsApp needs real-looking sample values to review the template. They are never sent to customers.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {bodyVars.map((n) => (
                <div key={n} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 rounded bg-background px-2 py-1 text-center font-mono text-xs">{`{{${n}}}`}</span>
                  <Input value={draft.bodyExamples[n] ?? ''} onChange={(e) => set({ bodyExamples: { ...draft.bodyExamples, [n]: e.target.value } })} placeholder="Sample value" />
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Footer" hint="Optional. One short grey line under the message, often used for 'Reply STOP to opt out'. No variables or emoji.">
        <Field label="Footer text" right={<Counter value={draft.footer.length} max={LIMITS.footer} />}>
          <Input value={draft.footer} onChange={(e) => set({ footer: e.target.value })} placeholder="e.g. Reply STOP to opt out" />
        </Field>
        <Issues field="footer" />
      </Section>
      <Issues field="general" />
    </div>
  );

  const buttonsStep = (
    <div className="space-y-5">
      <StepHead title="Add buttons" subtitle="Optional. A button saves your customer a step." />
      <WhyBox title="Why add buttons">
        A button saves the customer a step: open the order page, call you, or confirm in one tap. They are optional. Up to {LIMITS.buttons} buttons in all, and every label up to {LIMITS.buttonText} characters.
      </WhyBox>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(BUTTON_META) as ButtonKind[]).map((k) => {
          const Icon = BUTTON_META[k].icon;
          const disabled = !canAdd(k);
          return (
            <button key={k} type="button" disabled={disabled} onClick={() => setDraft((d) => ({ ...d, buttons: [...d.buttons, newButton(k)] }))}
              className={cn('flex gap-3 rounded-xl border p-3 text-left transition', disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-primary hover:bg-muted/40')}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>
                <span className="flex items-center gap-1 text-sm font-semibold"><Plus className="h-3 w-3" /> {BUTTON_META[k].label}</span>
                <span className="block text-xs text-muted-foreground">{k === 'copy_code' && draft.category !== 'MARKETING' ? 'Only available for Marketing templates' : BUTTON_META[k].why}</span>
              </span>
            </button>
          );
        })}
      </div>
      {(draft.buttons.length > 3 || (draft.buttons.some((b) => b.kind === 'quick_reply') && draft.buttons.some((b) => b.kind !== 'quick_reply'))) && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> With 4 or more buttons, or a quick reply next to another kind, customers on WhatsApp Desktop are asked to open the message on their phone.
        </p>
      )}
      {draft.buttons.map((b, i) => {
        const meta = BUTTON_META[b.kind];
        const Icon = meta.icon;
        const phoneValue: PhoneValue = (() => {
          const p = parsePhone(b.phone, '+91');
          return p.countryCode ? { code: p.countryCode, national: p.national } : emptyPhone();
        })();
        return (
          <div key={b.id} className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4" /> Button {i + 1}: {meta.label}</span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDraft((d) => ({ ...d, buttons: d.buttons.filter((x) => x.id !== b.id) }))} aria-label="Remove button">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {b.kind !== 'copy_code' && (
              <Field label="Label" right={<Counter value={b.text.length} max={LIMITS.buttonText} />} hint="No emoji or variables.">
                <Input value={b.text} onChange={(e) => setButton(b.id, { text: e.target.value })} placeholder={b.kind === 'quick_reply' ? 'e.g. Yes, confirm' : b.kind === 'url' ? 'e.g. Track order' : 'e.g. Call us'} />
              </Field>
            )}
            {b.kind === 'url' && (
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Link" hint="Must start with https://. To give each customer their own page, end the link with {{1}}.">
                  <Input value={b.url} onChange={(e) => setButton(b.id, { url: e.target.value })} placeholder="https://studiosara.in/track/{{1}}" />
                </Field>
                {/\{\{\s*1\s*\}\}/.test(b.url) && (
                  <Field label="Example for {{1}}"><Input value={b.urlExample} onChange={(e) => setButton(b.id, { urlExample: e.target.value })} placeholder="e.g. 1042" /></Field>
                )}
              </div>
            )}
            {b.kind === 'phone' && (
              <Field label="Phone number" hint="Customers tap the button to call this number.">
                <PhoneInput value={phoneValue} onChange={(v) => {
                  const digits = v.national.replace(/\D/g, '');
                  setButton(b.id, { phone: digits ? `${v.code}${digits}` : v.code });
                }} />
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
      {draft.buttons.length === 0 && <p className="text-sm text-muted-foreground">No buttons yet. That is fine, you can skip this step.</p>}
    </div>
  );

  const settingsStep = (
    <div className="space-y-6">
      <StepHead title="Login code settings" subtitle="Choose how long the code lasts." />
      <WhyBox title="Why login codes are different">
        WhatsApp writes the message itself ("{'{{1}}'} is your verification code") so it cannot be misused. You only choose the security reminder and how long the code lasts. The customer gets a Copy Code button.
      </WhyBox>
      <div className="flex items-center justify-between rounded-xl border p-4">
        <div>
          <p className="text-sm font-semibold">Add the security reminder</p>
          <p className="text-xs text-muted-foreground">Adds "For your security, do not share this code." Recommended.</p>
        </div>
        <Switch checked={auth.securityRecommendation} onCheckedChange={(v) => setAuth({ ...auth, securityRecommendation: v })} />
      </div>
      <Field label="Code expires after (minutes)" hint={`Between ${LIMITS.authExpiryMin} and ${LIMITS.authExpiryMax}. Leave empty for no expiry line.`}>
        <Input type="number" min={LIMITS.authExpiryMin} max={LIMITS.authExpiryMax} value={auth.expiryMinutes ?? ''} className="max-w-[180px]"
          onChange={(e) => setAuth({ ...auth, expiryMinutes: e.target.value === '' ? null : Number(e.target.value) })} />
        <Issues field="footer" />
      </Field>
      <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
        The code can be up to {LIMITS.authCode} letters or numbers. Links, images and emoji are not allowed in a login code message.
      </p>
    </div>
  );

  const reviewStep = (
    <div className="space-y-6">
      <StepHead title="Review and send" subtitle="Check the rules, then send it to WhatsApp for review." />
      <WhyBox title="What happens when you submit">
        WhatsApp reviews the template, usually in minutes to a few hours. If it is rejected, the reason is shown on the Templates page and you can fix it and try again. Once approved you can use it straight away.
      </WhyBox>
      {mode === 'message' ? (
        <Section title="Rules check" hint="Every rule WhatsApp applies. A template cannot be submitted until all of them pass.">
          <ul className="divide-y rounded-xl border">
            {checklist.map((c) => (
              <li key={c.id} className="flex gap-3 p-3">
                <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', c.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')}>
                  {c.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </span>
                <span>
                  <span className="block text-sm font-medium">{c.label}</span>
                  <span className="block text-xs text-muted-foreground">{c.why}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : (
        <p className="rounded-xl border p-4 text-sm">The login code template follows WhatsApp’s fixed format, so only the expiry needs checking.</p>
      )}
      {issues.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Fix these before submitting</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-red-700">{issues.map((i) => <li key={i.message}>{i.message}</li>)}</ul>
        </div>
      )}
      <Section title="Summary">
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {([
            ['Name', name || '—'],
            ['Type', mode === 'auth' ? 'Login code' : draft.category === 'UTILITY' ? 'Utility' : 'Marketing'],
            ['Language', LANGUAGES.find((l) => l.value === (mode === 'auth' ? auth.language : draft.language))?.label ?? '—'],
            ['Variables', mode === 'auth' ? '1 (the code)' : String(bodyVars.length)],
            ['Header', mode === 'auth' ? 'None' : draft.header.kind === 'none' ? 'None' : draft.header.kind],
            ['Buttons', mode === 'auth' ? 'Copy Code' : String(draft.buttons.length)],
          ] as Array<[string, string]>).map(([k, v]) => (
            <div key={k} className="flex justify-between border-b py-1.5"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
        </dl>
      </Section>
    </div>
  );

  const stepBody = { type: typeStep, basics: basicsStep, content: contentStep, buttons: buttonsStep, settings: settingsStep, review: reviewStep }[current];

  return (
    <WizardShell
      open={open}
      onClose={close}
      wide={current === 'type'}
      title={editing ? `Edit “${template!.key}”` : 'Create a WhatsApp template'}
      subtitle={editing
        ? 'After you save, WhatsApp reviews the template again and it cannot be used until it is approved. WhatsApp also limits how often a template can be edited.'
        : 'Fill in each step. We check the rules as you go.'}
      steps={steps}
      current={Math.min(step, stepIds.length - 1)}
      onStep={(i) => setStep(i)}
      aside={current !== 'type' && current !== 'basics' ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Live preview</p>
          <TemplatePreview parts={parts} values={previewValues} headerValue={draft.header.textExample} />
          <p className="text-xs text-muted-foreground">This is how it looks to the customer, with your examples filled in.</p>
        </div>
      ) : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}><ArrowLeft className="h-4 w-4" /> Back</Button>
            {isLast ? (
              <Button className="gap-2" onClick={submit} disabled={save.isPending}>
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {editing ? 'Save and send for review' : 'Submit for review'}
              </Button>
            ) : (
              <Button className="gap-2" onClick={() => { if (current === 'basics' && !name) setShowIssues(true); setStep((s) => Math.min(stepIds.length - 1, s + 1)); }}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </>
      }
    >
      {stepBody}
    </WizardShell>
  );
};
