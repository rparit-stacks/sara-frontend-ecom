import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Search, Send, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminUsersApi, whatsappCloudApi } from '@/lib/api';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';
import { LIMITS, SendValues, describeTemplate, validateSend } from '@/lib/waTemplateRules';
import { cn } from '@/lib/utils';
import { CategoryBadge, ErrorNote, failureHint, formatPhone, useDebounced } from './shared';
import { TemplatePreview } from './TemplatePreview';
import { PhoneInput, PhoneValue, emptyPhone, phoneResult } from './PhoneInput';
import { parsePhone } from '@/lib/phone';

interface Customer {
  email: string;
  name: string;
  phone: string;
}

/** Customer phone numbers are stored as typed; keep digits and a leading + only. */
const cleanPhone = (raw?: string | null) => (raw ?? '').replace(/[^\d+]/g, '');
const newId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`).slice(0, 60);

export const SendMessagePanel = ({ onDone }: { onDone?: () => void }) => {
  const open = true;
  const queryClient = useQueryClient();
  const { hasAny } = useAdminPermissions();
  const canSearchCustomers = hasAny(P.USERS_VIEW);

  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [manualPhone, setManualPhone] = useState<PhoneValue>(emptyPhone());
  const [templateKey, setTemplateKey] = useState('');
  const [vars, setVars] = useState<Record<string, string>>({});
  const [headerText, setHeaderText] = useState('');
  const [headerLink, setHeaderLink] = useState('');
  const [btnValues, setBtnValues] = useState<Record<number, string>>({});
  const debounced = useDebounced(search.trim(), 350);

  const customers = useQuery({
    queryKey: ['waCloudCustomers', debounced],
    queryFn: () => adminUsersApi.getPage({ page: 0, size: 8, q: debounced || undefined }),
    enabled: open && canSearchCustomers && !customer,
    placeholderData: (prev) => prev,
  });
  const templates = useQuery({ queryKey: ['waCloudTemplates'], queryFn: whatsappCloudApi.listTemplates, enabled: open });

  const approved = useMemo(
    () => (templates.data ?? []).filter((t) => t.status === 'APPROVED').sort((a, b) => a.key.localeCompare(b.key)),
    [templates.data],
  );
  const template = approved.find((t) => t.key === templateKey);
  const parts = useMemo(() => (template ? describeTemplate(template.category, template.components) : null), [template]);
  const hasContent = !!template?.components && template.components.length > 0;
  const manualResult = phoneResult(manualPhone);
  const phone = customer ? parsePhone(customer.phone, '+91').digits || cleanPhone(customer.phone).replace(/^\+/, '') : manualResult.digits;

  const values: SendValues = { variables: vars, headerText, headerLink, buttons: btnValues };
  const problems: string[] = [];
  if (customer ? !parsePhone(customer.phone, '+91').ok : !manualResult.ok) problems.push(customer ? 'This customer\u2019s phone number is not valid. Type the number below instead.' : (manualResult.reason && manualPhone.national ? manualResult.reason : 'Choose a customer, or type a phone number'));
  if (!template) problems.push('Choose a template');
  if (parts && hasContent) problems.push(...validateSend(parts, values));
  else if (template && template.bodyParameters.some((p) => !(vars[p] ?? '').trim())) problems.push('Fill in every variable');

  const reset = () => {
    setSearch(''); setCustomer(null); setManualPhone(emptyPhone()); setTemplateKey(''); setVars({}); setHeaderText(''); setHeaderLink(''); setBtnValues({});
  };

  const send = useMutation({
    mutationFn: () => {
      const header = parts?.header;
      const headerParam =
        header && header.format === 'TEXT' && header.hasVariable
          ? { type: 'text', value: headerText.trim() }
          : header && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header.format)
            ? { type: header.format.toLowerCase(), value: headerLink.trim() }
            : undefined;
      const buttons = (parts?.buttons ?? [])
        .filter((b) => !parts?.auth && (b.type === 'COPY_CODE' || (b.type === 'URL' && b.needsValue)))
        .map((b) => ({ index: b.index, subType: b.type === 'URL' ? 'url' : 'copy_code', value: (btnValues[b.index] ?? '').trim() }));
      return whatsappCloudApi.sendMessage({
        clientMessageId: newId(),
        templateKey,
        to: phone,
        parameters: {
          variables: Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, v.trim()])),
          ...(headerParam ? { header: headerParam } : {}),
          ...(buttons.length ? { buttons } : {}),
        },
      });
    },
    onSuccess: (m) => {
      queryClient.invalidateQueries({ queryKey: ['waCloudMessages'] });
      if (m.status === 'SKIPPED') {
        toast.error(`Not sent: ${failureHint(null, null, m.skipReason) || 'skipped'}`);
        return;
      }
      toast.success(`Message to ${formatPhone(m.to)} is on its way. Check the Messages tab for the delivery status.`);
      reset();
      onDone?.();
    },
    onError: (e: any) => toast.error(e?.message || 'Could not send the message'),
  });

  const list: Customer[] = (customers.data?.content ?? []).map((u: any) => ({
    email: u.email,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
    phone: u.phoneNumber ?? '',
  }));
  const firstName = customer?.name.split(' ')[0];
  const bodyVars = parts?.bodyVariables ?? template?.bodyParameters ?? [];

  return (
    <div className="rounded-2xl border bg-background shadow-sm">
      <div className="border-b bg-muted/30 px-6 py-4">
        <h2 className="text-xl font-semibold">Send a message to one customer</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick a customer and an approved template, fill in the details, and send. WhatsApp only lets you message a customer first with an approved template.</p>
      </div>
      <div className="p-6">

        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div>
              <Label>Customer</Label>
              {customer ? (
                <div className="mt-1 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPhone(cleanPhone(customer.phone).replace(/^\+/, ''))} · {customer.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCustomer(null)} aria-label="Change customer"><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <>
                  {canSearchCustomers && (
                    <>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers by name, email or phone" className="pl-9" />
                      </div>
                      <div className="mt-2 max-h-44 divide-y overflow-y-auto rounded-lg border">
                        {customers.isLoading ? (
                          <p className="px-3 py-4 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></p>
                        ) : customers.isError ? (
                          <div className="p-2"><ErrorNote error={customers.error} /></div>
                        ) : list.length === 0 ? (
                          <p className="px-3 py-4 text-center text-sm text-muted-foreground">No customers found</p>
                        ) : (
                          list.map((c) => {
                            const hasPhone = cleanPhone(c.phone).length >= 8;
                            return (
                              <button key={c.email} type="button" disabled={!hasPhone} onClick={() => setCustomer(c)}
                                className={cn('flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm', hasPhone ? 'hover:bg-muted/60' : 'cursor-not-allowed opacity-50')}>
                                <span className="min-w-0">
                                  <span className="block truncate font-medium">{c.name}</span>
                                  <span className="block truncate text-xs text-muted-foreground">{c.email}</span>
                                </span>
                                <span className="shrink-0 text-xs text-muted-foreground">{hasPhone ? c.phone : 'No phone number'}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                  <div className="mt-3">
                    <Label className="text-xs text-muted-foreground">{canSearchCustomers ? 'Or type a number' : 'Phone number'}</Label>
                    <PhoneInput value={manualPhone} onChange={setManualPhone} className="mt-1" />
                  </div>
                </>
              )}
            </div>

            <div>
              <Label>Template</Label>
              <Select value={templateKey} onValueChange={(v) => { setTemplateKey(v); setVars({}); setHeaderText(''); setHeaderLink(''); setBtnValues({}); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={templates.isLoading ? 'Loading…' : 'Choose an approved template'} /></SelectTrigger>
                <SelectContent>{approved.map((t) => <SelectItem key={t.id} value={t.key}>{t.key}</SelectItem>)}</SelectContent>
              </Select>
              {template && <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground"><CategoryBadge category={template.category} /> {template.bodyParameters.length} variable{template.bodyParameters.length === 1 ? '' : 's'}</div>}
              {template?.category === 'MARKETING' && <p className="mt-1 text-xs text-muted-foreground">Marketing messages are skipped unless the customer has agreed to receive them.</p>}
              {approved.length === 0 && !templates.isLoading && <p className="mt-1 text-xs text-amber-700">No approved templates. Open the Templates tab and refresh from WhatsApp.</p>}
            </div>

            {parts && parts.unsupported.length > 0 && (
              <p className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> This template has {parts.unsupported[0]}, which cannot be sent from here yet.
              </p>
            )}

            {template && parts && parts.unsupported.length === 0 && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <p className="text-sm font-medium">{parts.auth ? 'Login code' : 'Fill in the details'}</p>

                {parts.header?.format === 'TEXT' && parts.header.hasVariable && (
                  <div className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-xs text-muted-foreground">Header</span>
                    <Input className="h-8" value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Value for the header" />
                  </div>
                )}
                {parts.header && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(parts.header.format) && (
                  <div>
                    <Label className="text-xs text-muted-foreground">{parts.header.format.charAt(0) + parts.header.format.slice(1).toLowerCase()} link</Label>
                    <Input className="mt-1 h-8" value={headerLink} onChange={(e) => setHeaderLink(e.target.value)} placeholder="https://…" />
                    <p className="mt-1 text-xs text-muted-foreground">A public https link to the file shown in the message header.</p>
                  </div>
                )}

                {bodyVars.map((p, i) => (
                  <div key={p} className="flex items-center gap-2">
                    <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">{parts.auth ? 'Code' : `{{${p}}}`}</span>
                    <Input className="h-8" value={vars[p] ?? ''} maxLength={parts.auth ? LIMITS.authCode : LIMITS.body}
                      onChange={(e) => setVars({ ...vars, [p]: parts.auth ? e.target.value.replace(/[^A-Za-z0-9]/g, '') : e.target.value })} />
                    {firstName && i === 0 && !parts.auth && (
                      <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 text-xs" onClick={() => setVars({ ...vars, [p]: firstName })}>Use name</Button>
                    )}
                  </div>
                ))}
                {parts.auth && <p className="text-xs text-muted-foreground">The same code is put on the “Copy code” button automatically. Up to {LIMITS.authCode} letters or numbers.</p>}

                {parts.buttons.filter((b) => !parts.auth && (b.type === 'COPY_CODE' || (b.type === 'URL' && b.needsValue))).map((b) => (
                  <div key={b.index}>
                    <Label className="text-xs text-muted-foreground">
                      {b.type === 'COPY_CODE' ? 'Code on the Copy code button' : `Value for the “${b.text}” link`}
                    </Label>
                    <Input className="mt-1 h-8" value={btnValues[b.index] ?? ''}
                      onChange={(e) => setBtnValues({ ...btnValues, [b.index]: b.type === 'COPY_CODE' ? e.target.value.replace(/[^A-Za-z0-9]/g, '') : e.target.value })}
                      placeholder={b.example || (b.type === 'COPY_CODE' ? 'e.g. SAVE10' : 'e.g. 1042')} />
                    {b.type === 'URL' && b.url && <p className="mt-1 break-all text-xs text-muted-foreground">Opens: {b.url.replace(/\{\{\s*1\s*\}\}/, (btnValues[b.index] ?? '').trim() || '…')}</p>}
                  </div>
                ))}
              </div>
            )}

            {problems.length > 0 && (customer || manualPhone.national || templateKey) && (
              <ul className="list-disc space-y-0.5 pl-5 text-xs text-amber-700">{Array.from(new Set(problems)).map((p) => <li key={p}>{p}</li>)}</ul>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Preview</p>
            {parts && hasContent ? (
              <TemplatePreview parts={parts} values={vars} headerValue={headerText} />
            ) : (
              <div className="rounded-xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                {template ? 'Preview is not available for this template yet.' : 'Choose a template to see how it looks.'}
              </div>
            )}
          </div>
        </div>

      </div>
      <div className="flex justify-end gap-2 border-t px-6 py-3">
        <Button variant="outline" onClick={() => { reset(); onDone?.(); }}>Cancel</Button>
        <Button onClick={() => send.mutate()} disabled={problems.length > 0 || send.isPending} className="gap-2">
          {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send message
        </Button>
      </div>
    </div>
  );
};
