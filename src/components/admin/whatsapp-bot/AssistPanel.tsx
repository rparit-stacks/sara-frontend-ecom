import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Sparkles, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { botAssistApi } from '@/lib/api';
import { applyOps, type Applied } from './applyOps';
import { validateFlow, type Issue } from './validate';
import type { BotEdge, BotNode } from './types';

const IDEAS = [
  'Fix the problems in Checks',
  'Add an event for fabric questions that answers about fabrics',
  'If it is after hours, say we are closed, otherwise show the menu',
  'Send quote requests to the app',
];

interface Proposal extends Applied {
  notes: string;
  errorsAfter: number;
}

/** Describe the bot in plain words; the assistant proposes changes, you preview them, then accept or discard. */
export const AssistPanel = ({
  nodes, edges, issues, onApply, onUndo, canUndo,
}: {
  nodes: BotNode[]; edges: BotEdge[]; issues: Issue[];
  onApply: (nodes: BotNode[], edges: BotEdge[]) => void; onUndo: () => void; canUndo: boolean;
}) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  const ask = async (instruction: string) => {
    if (instruction.trim().length < 3) return;
    setBusy(true);
    setProposal(null);
    try {
      const flow = {
        nodes: nodes.map((n) => ({ id: n.id, ...n.data })),
        edges: edges.map((e) => ({ source: e.source, sourceHandle: e.sourceHandle ?? 'out', target: e.target })),
      };
      const r = await botAssistApi.assist({ instruction, flow, issues: issues.map((i) => `${i.level}: ${i.text}`) });
      const applied = applyOps(nodes, edges, r.ops);
      setProposal({ ...applied, notes: r.notes, errorsAfter: validateFlow(applied.nodes, applied.edges).filter((i) => i.level === 'error').length });
    } catch (e: any) {
      toast.error(e?.message || 'The assistant could not answer. Nothing changed.');
    } finally {
      setBusy(false);
    }
  };

  const accept = () => {
    if (!proposal) return;
    onApply(proposal.nodes, proposal.edges);
    toast.success('Changes applied. You can undo them.');
    setProposal(null);
    setText('');
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Build with AI</p>
        <p className="mt-1 text-xs text-slate-500">Say what the bot should do. You see the changes first and nothing happens until you accept.</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={800}
        rows={4}
        placeholder="For example: if a customer asks about an order, tell them the status and then send them to the app."
        className="w-full resize-none rounded-lg border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 gap-1.5" disabled={busy || text.trim().length < 3} onClick={() => ask(text)}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Suggest changes
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" disabled={!canUndo} onClick={onUndo}><Undo2 className="h-3.5 w-3.5" /> Undo</Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {IDEAS.map((i) => (
          <button key={i} type="button" disabled={busy} onClick={() => (i === IDEAS[0] ? ask(i) : setText(i))} className="rounded-full border bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50">{i}</button>
        ))}
      </div>

      {proposal && (
        <div className="space-y-3 rounded-xl border bg-slate-50/60 p-3">
          {proposal.notes && <p className="text-xs text-slate-700">{proposal.notes}</p>}
          {proposal.summary.length ? (
            <ul className="space-y-1 text-xs text-slate-700">
              {proposal.summary.map((l, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{l}</span></li>)}
            </ul>
          ) : <p className="text-xs text-slate-500">The assistant had no changes to suggest.</p>}
          {proposal.skipped.length > 0 && (
            <p className="rounded-md bg-amber-50 p-2 text-[11px] text-amber-800">Left out: {proposal.skipped.join(' ')}</p>
          )}
          {proposal.summary.length > 0 && (
            <p className={`text-[11px] ${proposal.errorsAfter ? 'text-amber-700' : 'text-emerald-700'}`}>
              {proposal.errorsAfter ? `After these changes ${proposal.errorsAfter} error${proposal.errorsAfter === 1 ? '' : 's'} would still show in Checks.` : 'After these changes Checks shows no errors.'}
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" disabled={!proposal.summary.length} onClick={accept}>Accept changes</Button>
            <Button size="sm" variant="outline" onClick={() => setProposal(null)}>Discard</Button>
          </div>
        </div>
      )}
    </div>
  );
};
