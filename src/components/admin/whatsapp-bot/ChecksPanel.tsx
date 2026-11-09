import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Issue } from './validate';

export const ChecksPanel = ({ issues, onPick }: { issues: Issue[]; onPick: (nodeId: string) => void }) => {
  if (!issues.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 className="h-9 w-9 text-emerald-500" />
        <p className="mt-3 text-sm font-medium text-slate-700">No problems found</p>
        <p className="mt-1 text-xs text-slate-400">Every event is connected and every step is set up.</p>
      </div>
    );
  }
  const sorted = [...issues].sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));
  return (
    <ul className="space-y-2 p-4">
      {sorted.map((i, idx) => (
        <li key={idx}>
          <button type="button" disabled={!i.nodeId} onClick={() => i.nodeId && onPick(i.nodeId)}
            className={cn('flex w-full items-start gap-2.5 rounded-lg border p-3 text-left text-xs leading-snug transition-colors', i.nodeId && 'hover:bg-slate-50', i.level === 'error' ? 'border-red-200 bg-red-50/40' : 'border-amber-200 bg-amber-50/40')}>
            {i.level === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
            <span className="text-slate-700">{i.text}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};
