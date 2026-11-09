import { findOutcome } from './catalog';
import type { BotNodeData, NodeOutput } from './types';

/** Connection points on a node's right edge. */
export const outputsOf = (d: BotNodeData): NodeOutput[] => {
  switch (d.kind) {
    case 'start': return [{ id: 'out', label: 'Message arrives' }];
    case 'event': return [{ id: 'out', label: 'Then' }];
    case 'outcome': return findOutcome(d.outcomeId)?.outputs ?? [];
    case 'condition': return [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }];
    default: return [];
  }
};
