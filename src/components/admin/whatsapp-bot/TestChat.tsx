import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { initialState, userSays, withGst, type SimSettings, type SimState } from './engine';
import type { BotEdge, BotNode } from './types';

const inr = (n: number) => `₹${n.toFixed(2)}`;

/** Try the flow as a customer. The AI choice is approximated from your example phrases; the real bot uses an AI model. */
export const TestChat = ({ nodes, edges }: { nodes: BotNode[]; edges: BotEdge[] }) => {
  const [state, setState] = useState<SimState>(initialState);
  const [text, setText] = useState('');
  const [settings, setSettings] = useState<SimSettings>({ businessOpen: true, hasOrders: true, newCustomer: true });
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [state.msgs.length]);

  const send = (t: string) => {
    if (!t.trim()) return;
    setState((s) => userSays({ nodes, edges }, s, t, settings));
    setText('');
  };
  const samples = useMemo(() => {
    const out: string[] = [];
    nodes.filter((n) => n.data.kind === 'event').forEach((n) => { const e = (n.data.examples ?? []).find(Boolean); if (e) out.push(e); });
    return out.slice(0, 6);
  }, [nodes]);

  const toggles: { key: keyof SimSettings; label: string }[] = [
    { key: 'businessOpen', label: 'Open now' },
    { key: 'hasOrders', label: 'Has orders' },
    { key: 'newCustomer', label: 'New customer' },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pretend the customer is</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {toggles.map((t) => (
            <label key={t.key} className="flex items-center gap-2 text-xs text-slate-600">
              <Switch checked={settings[t.key]} onCheckedChange={(v) => setSettings((s) => ({ ...s, [t.key]: v }))} className="scale-75" /> {t.label}
            </label>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-[#efeae2] p-3">
        {!state.msgs.length && <p className="px-2 pt-6 text-center text-xs text-slate-500">Type a message below, or tap a sample, to see what the bot would do.</p>}
        {state.msgs.map((m) =>
          m.from === 'system' ? (
            <p key={m.id} className="mx-auto max-w-[90%] rounded-md bg-white/70 px-2.5 py-1 text-center text-[11px] text-slate-500">{m.text}</p>
          ) : (
            <div key={m.id} className={cn('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-snug shadow-sm', m.from === 'user' ? 'bg-[#d9fdd3]' : 'bg-white')}>
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.buttons && (
                  <div className="mt-2 space-y-1 border-t pt-2">
                    {m.buttons.map((b) => (
                      <button key={b.label} type="button" onClick={() => b.kind === 'reply' && send(b.label)}
                        className={cn('block w-full rounded-md px-2 py-1.5 text-center text-xs font-medium', b.kind === 'reply' ? 'text-sky-700 hover:bg-sky-50' : 'cursor-default text-sky-700')}>
                        {b.kind === 'link' ? '↗ ' : ''}{b.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        <div ref={end} />
      </div>

      <div className="space-y-2 border-t bg-white p-3">
        {samples.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {samples.map((s) => <button key={s} type="button" onClick={() => send(s)} className="rounded-full border px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-50">{s}</button>)}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type as the customer" className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          <Button type="submit" size="icon" aria-label="Send"><Send className="h-4 w-4" /></Button>
          <Button type="button" variant="outline" size="icon" aria-label="Start over" onClick={() => setState(initialState())}><RotateCcw className="h-4 w-4" /></Button>
        </form>
        <p className="text-[11px] text-slate-400">
          {state.botMessages} bot {state.botMessages === 1 ? 'message' : 'messages'}, about {inr(state.cost)} ({inr(withGst(state.cost))} with GST). The AI step adds a small extra cost{state.aiCalls ? ` for ${state.aiCalls} typed ${state.aiCalls === 1 ? 'message' : 'messages'}` : ''}.
        </p>
      </div>
    </div>
  );
};
