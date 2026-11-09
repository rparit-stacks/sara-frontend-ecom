import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ANSWER_SCOPES, APP_PAGES, NEEDS, OUTCOMES, TAPS, findOutcome } from './catalog';
import { CONDITION_LABEL, KIND_META, type BotNode, type BotNodeData, type ConditionType, type OutcomeId } from './types';

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-slate-600">{label}</Label>
    {children}
    {hint && <p className="text-[11px] leading-snug text-slate-400">{hint}</p>}
  </div>
);

/** Edits the selected step. Everything here is a choice from a fixed list or a short plain phrase. Nothing here is sent to a customer as typed. */
export const Inspector = ({ node, onChange, onDelete }: { node: BotNode | undefined; onChange: (patch: Partial<BotNodeData>) => void; onDelete: () => void }) => {
  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-slate-400">
        <p className="font-medium text-slate-500">Nothing selected</p>
        <p className="mt-1">Click a step on the canvas to edit it, or drag a new one in from the left.</p>
      </div>
    );
  }
  const d = node.data;
  const meta = KIND_META[d.kind];
  const examples = d.examples ?? [];
  const outcome = findOutcome(d.outcomeId);

  const pickOutcome = (id: OutcomeId) => {
    const spec = findOutcome(id)!;
    onChange({
      outcomeId: id,
      appPage: spec.params.includes('appPage') ? d.appPage ?? '/ask' : undefined,
      scopes: spec.params.includes('scopes') ? d.scopes ?? ['products'] : undefined,
      need: spec.params.includes('need') ? d.need ?? NEEDS[0] : undefined,
    });
  };

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-start justify-between gap-3 border-b pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</p>
          <p className="text-xs text-slate-500">{meta.hint}</p>
        </div>
        {d.kind !== 'start' && (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
        )}
      </div>

      {d.kind !== 'start' && (
        <Field label="Name" hint="For your team only. A customer never sees it.">
          <Input value={d.title} maxLength={40} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
      )}

      {d.kind === 'start' && (
        <p className="rounded-lg bg-cyan-50 p-3 text-xs leading-relaxed text-cyan-900">
          This is where every conversation begins and it cannot be removed. When a customer writes, the AI reads the message and picks the event (or up to two) that fits best. Connect this step to each event you want the AI to be able to choose.
        </p>
      )}

      {d.kind === 'event' && (
        <>
          <Field label="What does the customer want?" hint="Write it in plain words. The AI uses this to decide.">
            <Textarea rows={3} maxLength={200} value={d.description ?? ''} onChange={(e) => onChange({ description: e.target.value })} placeholder="The customer asks where their order is." />
          </Field>
          <Field label="Example phrases" hint="A few ways customers might say it, including Hindi or Hinglish. Up to 6.">
            <div className="space-y-1.5">
              {examples.map((ex, i) => (
                <div key={i} className="flex gap-1.5">
                  <Input value={ex} maxLength={80} onChange={(e) => onChange({ examples: examples.map((x, j) => (j === i ? e.target.value : x)) })} />
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => onChange({ examples: examples.filter((_, j) => j !== i) })} aria-label="Remove phrase"><X className="h-4 w-4" /></Button>
                </div>
              ))}
              {examples.length < 6 && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onChange({ examples: [...examples, ''] })}><Plus className="h-3.5 w-3.5" /> Add a phrase</Button>
              )}
            </div>
          </Field>
          <Field label="Also starts when the customer taps" hint="A button tap is matched exactly, with no AI.">
            <Select value={d.tapButton ?? 'none'} onValueChange={(v) => onChange({ tapButton: v === 'none' ? undefined : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nothing</SelectItem>
                {TAPS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Fallback</p>
              <p className="text-xs text-slate-500">Used when no other event fits. Keep exactly one.</p>
            </div>
            <Switch checked={!!d.fallback} onCheckedChange={(v) => onChange({ fallback: v })} aria-label="Fallback event" />
          </div>
        </>
      )}

      {d.kind === 'outcome' && (
        <>
          <Field label="What should the bot do?">
            <Select value={d.outcomeId} onValueChange={(v) => pickOutcome(v as OutcomeId)}>
              <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {outcome && <p className="text-[11px] text-slate-400">{outcome.hint}</p>}
          </Field>
          {outcome?.params.includes('appPage') && (
            <Field label="Which page in the app?" hint="The button opens this page in the app, or on the website if they do not have it.">
              <Select value={d.appPage} onValueChange={(v) => onChange({ appPage: v })}>
                <SelectTrigger><SelectValue placeholder="Choose a page" /></SelectTrigger>
                <SelectContent>{APP_PAGES.map((p) => <SelectItem key={p.path} value={p.path}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}
          {outcome?.params.includes('scopes') && (
            <Field label="Topics the AI may answer about" hint="It answers only from our store knowledge on these topics, and nothing else.">
              <div className="space-y-1.5">
                {ANSWER_SCOPES.map((s) => {
                  const on = (d.scopes ?? []).includes(s.id);
                  return (
                    <label key={s.id} className="flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm hover:bg-slate-50">
                      <input type="checkbox" className="h-4 w-4 accent-teal-600" checked={on} onChange={() => onChange({ scopes: on ? (d.scopes ?? []).filter((x) => x !== s.id) : [...(d.scopes ?? []), s.id] })} />
                      {s.label}
                    </label>
                  );
                })}
              </div>
            </Field>
          )}
          {outcome?.params.includes('need') && (
            <Field label="What do we need from them?">
              <Select value={d.need} onValueChange={(v) => onChange({ need: v })}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>{NEEDS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}
        </>
      )}

      {d.kind === 'condition' && (
        <Field label="Check" hint="Yes goes one way, No the other.">
          <Select value={d.conditionType} onValueChange={(v) => onChange({ conditionType: v as ConditionType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(CONDITION_LABEL) as ConditionType[]).map((c) => <SelectItem key={c} value={c}>{CONDITION_LABEL[c]}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      )}
    </div>
  );
};
