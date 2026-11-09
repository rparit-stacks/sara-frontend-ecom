import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Check, Loader2, Send, Sparkles, Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { botAssistApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { applyOps, type Applied } from './applyOps';
import { validateFlow, type Issue } from './validate';
import type { BotEdge, BotNode } from './types';

const IDEAS = [
  'Fix the problems in Checks',
  'What does this bot do right now?',
  'Add a fabric question that answers about fabrics',
  'If it is after hours, say we are closed',
];

interface Proposal extends Applied {
  errorsAfter: number;
  state: 'open' | 'accepted' | 'discarded';
}
interface Msg {
  id: number;
  from: 'user' | 'assistant';
  text: string;
  proposal?: Proposal;
}

/**
 * A normal chat with the assistant. Ask it anything about the bot, ask follow-ups, or tell it what to change: when it suggests
 * changes they appear in the chat as a card to accept or discard, and nothing happens to the flow until you accept.
 */
export const AssistPanel = ({
  nodes, edges, issues, onApply, onUndo, canUndo,
}: {
  nodes: BotNode[]; edges: BotEdge[]; issues: Issue[];
  onApply: (nodes: BotNode[], edges: BotEdge[]) => void; onUndo: () => void; canUndo: boolean;
}) => {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs.length, busy]);

  const update = (id: number, patch: Partial<Proposal>) =>
    setMsgs((m) => m.map((x) => (x.id === id && x.proposal ? { ...x, proposal: { ...x.proposal, ...patch } } : x)));

  const send = async (raw: string) => {
    const instruction = raw.trim();
    if (instruction.length < 2 || busy) return;
    const history = msgs.slice(-8).map((m) => ({ role: m.from, text: m.text }));
    setMsgs((m) => [...m, { id: ++seq.current, from: 'user', text: instruction }]);
    setText('');
    setBusy(true);
    try {
      const flow = {
        nodes: nodes.map((n) => ({ id: n.id, ...n.data })),
        edges: edges.map((e) => ({ source: e.source, sourceHandle: e.sourceHandle ?? 'out', target: e.target })),
      };
      const r = await botAssistApi.assist({ instruction, flow, issues: issues.map((i) => `${i.level}: ${i.text}`), history });
      const applied = r.ops.length ? applyOps(nodes, edges, r.ops) : null;
      const proposal: Proposal | undefined = applied && applied.summary.length
        ? { ...applied, errorsAfter: validateFlow(applied.nodes, applied.edges).filter((i) => i.level === 'error').length, state: 'open' }
        : undefined;
      setMsgs((m) => [...m, { id: ++seq.current, from: 'assistant', text: r.notes || (proposal ? 'Here is what I would change.' : 'I had nothing to change.'), proposal }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { id: ++seq.current, from: 'assistant', text: e?.message || 'I could not answer just now. Nothing changed.' }]);
    } finally {
      setBusy(false);
    }
  };

  const accept = (msg: Msg) => {
    if (!msg.proposal || msg.proposal.state !== 'open') return;
    onApply(msg.proposal.nodes, msg.proposal.edges);
    update(msg.id, { state: 'accepted' });
    toast.success('Changes applied. You can undo them.');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <p className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Ask or build with AI</p>
        <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs" disabled={!canUndo} onClick={onUndo}><Undo2 className="h-3.5 w-3.5" /> Undo</Button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-3">
        {!msgs.length && (
          <div className="px-1 pt-4 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span>
            <p className="mt-3 text-sm font-medium text-slate-700">Ask me anything about your bot</p>
            <p className="mx-auto mt-1 max-w-[17rem] text-xs text-slate-500">Questions, follow-ups, or changes: "why does this reply go to the app?", "add a quote question". You see changes first and nothing happens until you accept.</p>
            <div className="mt-4 flex flex-col items-stretch gap-1.5">
              {IDEAS.map((i) => (
                <button key={i} type="button" onClick={() => send(i)} className="rounded-lg border bg-white px-3 py-2 text-left text-xs text-slate-600 transition-colors hover:bg-slate-100">{i}</button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m) => (
          <div key={m.id} className={cn('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm', m.from === 'user' ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border bg-white text-slate-700')}>
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.proposal && (
                <div className="mt-2.5 space-y-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700">
                  <p className="font-semibold text-slate-800">Suggested changes</p>
                  <ul className="space-y-1">
                    {m.proposal.summary.map((l, i) => <li key={i} className="flex gap-1.5"><span className="text-primary">•</span><span>{l}</span></li>)}
                  </ul>
                  {m.proposal.skipped.length > 0 && <p className="rounded-md bg-amber-50 p-1.5 text-[11px] text-amber-800">Left out: {m.proposal.skipped.join(' ')}</p>}
                  <p className={cn('text-[11px]', m.proposal.errorsAfter ? 'text-amber-700' : 'text-emerald-700')}>
                    {m.proposal.errorsAfter ? `${m.proposal.errorsAfter} error${m.proposal.errorsAfter === 1 ? '' : 's'} would still show in Checks.` : 'Checks would show no errors.'}
                  </p>
                  {m.proposal.state === 'open' ? (
                    <div className="flex gap-2 pt-0.5">
                      <Button size="sm" className="h-8 flex-1 gap-1.5" onClick={() => accept(m)}><Check className="h-3.5 w-3.5" /> Accept</Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => update(m.id, { state: 'discarded' })}><X className="h-3.5 w-3.5" /> Discard</Button>
                    </div>
                  ) : (
                    <p className={cn('text-[11px] font-medium', m.proposal.state === 'accepted' ? 'text-emerald-700' : 'text-slate-400')}>{m.proposal.state === 'accepted' ? 'Applied to the flow' : 'Discarded'}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border bg-white px-3.5 py-3 shadow-sm" aria-label="The assistant is typing">
              {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex items-end gap-2 border-t bg-white p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(text); } }}
          maxLength={800}
          rows={2}
          placeholder="Ask a question or describe a change…"
          className="max-h-32 min-w-0 flex-1 resize-none rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={busy || text.trim().length < 2} aria-label="Send">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};
