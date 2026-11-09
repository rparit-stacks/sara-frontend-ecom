import { createContext, memo, useContext, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react';
import { CircleStop, GitBranch, MessageCircle, Sparkles, Zap } from 'lucide-react';
import { APP_PAGES, ANSWER_SCOPES, findOutcome } from './catalog';
import { outputsOf } from './outputs';
import { CONDITION_LABEL, KIND_META, type BotNode, type NodeKind } from './types';
import { cn } from '@/lib/utils';

/** Which nodes have a problem, so the canvas can mark them. */
export const NodeIssuesContext = createContext<Map<string, 'error' | 'warning'>>(new Map());

const ICON: Record<NodeKind, typeof Zap> = { start: MessageCircle, event: Zap, outcome: Sparkles, condition: GitBranch, end: CircleStop };

const Summary = ({ node }: { node: BotNode }) => {
  const d = node.data;
  switch (d.kind) {
    case 'start':
      return <p className="text-xs text-slate-500">Every chat starts here. The AI reads the message and decides which event it matches.</p>;
    case 'event':
      return (
        <div className="space-y-1.5">
          <p className="line-clamp-2 text-xs text-slate-600">{d.description || 'Describe what the customer wants.'}</p>
          <div className="flex flex-wrap gap-1">
            {(d.examples ?? []).slice(0, 3).map((e) => <span key={e} className="max-w-[9rem] truncate rounded bg-violet-50 px-1.5 py-0.5 text-[10px] text-violet-700">“{e}”</span>)}
            {d.tapButton && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">tap: {d.tapButton}</span>}
            {d.fallback && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">fallback</span>}
          </div>
        </div>
      );
    case 'outcome': {
      const spec = findOutcome(d.outcomeId);
      const extra = d.outcomeId === 'open_app' ? APP_PAGES.find((p) => p.path === d.appPage)?.label
        : d.outcomeId === 'answer' || d.outcomeId === 'ai_chat' ? (d.scopes ?? []).map((s) => ANSWER_SCOPES.find((x) => x.id === s)?.label).filter(Boolean).join(', ')
        : d.outcomeId === 'ask_details' ? d.need : '';
      return (
        <div>
          <p className="text-xs font-medium text-slate-700">{spec?.label ?? 'Choose an outcome'}</p>
          {extra && <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{extra}</p>}
        </div>
      );
    }
    case 'condition':
      return <p className="text-xs text-slate-600">{d.conditionType ? CONDITION_LABEL[d.conditionType] : 'Choose a check'}</p>;
    default:
      return <p className="text-xs text-slate-500">The bot stops here.</p>;
  }
};

export const BotNodeView = memo(({ id, data, selected }: NodeProps<BotNode>) => {
  const update = useUpdateNodeInternals();
  const issues = useContext(NodeIssuesContext);
  const meta = KIND_META[data.kind];
  const Icon = ICON[data.kind];
  const outs = outputsOf(data);
  const sig = outs.map((o) => o.id).join('|');
  useEffect(() => { update(id); }, [id, sig, update]);
  const issue = issues.get(id);

  return (
    <div
      className={cn('w-[270px] rounded-xl border bg-white text-left shadow-sm transition-shadow', selected ? 'shadow-lg ring-2' : 'hover:shadow-md')}
      style={{ borderColor: issue === 'error' ? '#ef4444' : issue === 'warning' ? '#f59e0b' : meta.color + '55', ['--tw-ring-color' as string]: meta.color }}
    >
      {data.kind !== 'start' && <Handle type="target" position={Position.Left} id="in" className="!h-3 !w-3 !border-2 !border-white" style={{ background: meta.color }} />}
      <div className="flex items-center gap-2 rounded-t-xl px-3 py-2" style={{ background: meta.soft }}>
        <span className="flex h-6 w-6 items-center justify-center rounded-md text-white" style={{ background: meta.color }}><Icon className="h-3.5 w-3.5" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-slate-800">{data.title || meta.label}</p>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: meta.color }}>{meta.label}</p>
        </div>
        {issue && <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', issue === 'error' ? 'bg-red-500' : 'bg-amber-500')} title={issue === 'error' ? 'Needs fixing' : 'Worth a look'} />}
      </div>
      <div className="px-3 py-2.5"><Summary node={{ id, data } as BotNode} /></div>
      {outs.length > 0 && (
        <div className="border-t border-slate-100">
          {outs.map((o) => (
            <div key={o.id} className="relative flex items-center justify-end px-3 py-1.5 text-[11px] font-medium text-slate-500">
              {o.label}
              <Handle type="source" position={Position.Right} id={o.id} className="!h-3 !w-3 !border-2 !border-white" style={{ background: meta.color, top: '50%' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
BotNodeView.displayName = 'BotNodeView';
