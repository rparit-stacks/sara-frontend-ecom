import type { BotAssistOp } from '@/lib/api';
import { findOutcome } from './catalog';
import { sanitizeFlow } from './sanitize';
import { START_ID, newId, type BotEdge, type BotNode, type BotNodeData, type NodeKind } from './types';

export interface Applied {
  nodes: BotNode[];
  edges: BotEdge[];
  /** One plain line per change, for the preview. */
  summary: string[];
  /** Changes that could not be applied, and why. */
  skipped: string[];
}

const PREFIX: Record<string, string> = { event: 'ev', outcome: 'ou', condition: 'co', end: 'en' };
const FIELD_KEYS = ['title', 'description', 'examples', 'tapButton', 'fallback', 'outcomeId', 'appPage', 'scopes', 'need', 'conditionType'];

const blank = (kind: NodeKind): BotNodeData => {
  switch (kind) {
    case 'event': return { kind, title: 'New event', description: '', examples: [] };
    case 'outcome': return { kind, title: 'New outcome', outcomeId: 'open_app', appPage: '/ask' };
    case 'condition': return { kind, title: 'New check', conditionType: 'business_hours' };
    default: return { kind: 'end', title: 'End' };
  }
};

const pick = (fields: Record<string, unknown> | undefined) => {
  const out: Record<string, unknown> = {};
  for (const k of FIELD_KEYS) if (fields && k in fields) out[k] = fields[k];
  return out;
};

const describe = (n: BotNode) => {
  const d = n.data;
  const what = d.kind === 'outcome' ? findOutcome(d.outcomeId)?.label : d.kind;
  return `“${d.title || '(untitled)'}”${what ? ` (${what})` : ''}`;
};

/**
 * Applies the assistant's changes to a copy of the flow. The result is rebuilt with the same sanitize rules as an imported
 * file, so nothing outside the catalogue can get through even if the server let it by. New steps are placed beside the step
 * they hang from.
 */
export const applyOps = (startNodes: BotNode[], startEdges: BotEdge[], ops: BotAssistOp[]): Applied => {
  let nodes = startNodes.map((n) => ({ ...n, data: { ...n.data } }));
  let edges = startEdges.map((e) => ({ ...e }));
  const summary: string[] = [];
  const skipped: string[] = [];
  const refs = new Map<string, string>();
  const added = new Set<string>();
  const resolve = (x?: string) => (x ? (x === START_ID ? START_ID : refs.get(x) ?? x) : '');
  const find = (id: string) => nodes.find((n) => n.id === id);

  for (const op of ops) {
    if (op.op === 'add' && op.kind && op.ref) {
      const kind = op.kind as NodeKind;
      const id = newId(PREFIX[kind] ?? 'n');
      refs.set(op.ref, id);
      added.add(id);
      const node: BotNode = { id, type: 'bot', position: { x: 0, y: 0 }, data: { ...blank(kind), ...pick(op.fields) } as BotNodeData };
      nodes.push(node);
      summary.push(`Add ${describe(node)}`);
    } else if (op.op === 'update' && op.id) {
      const n = find(resolve(op.id));
      if (!n || n.id === START_ID) { skipped.push('A change to a step that does not exist was ignored.'); continue; }
      const before = describe(n);
      n.data = { ...n.data, ...pick(op.fields) } as BotNodeData;
      summary.push(`Change ${before}`);
    } else if (op.op === 'delete' && op.ids?.length) {
      for (const raw of op.ids) {
        const n = find(resolve(raw));
        if (!n || n.id === START_ID) { skipped.push('A removal of a step that does not exist was ignored.'); continue; }
        summary.push(`Remove ${describe(n)}`);
        nodes = nodes.filter((x) => x.id !== n.id);
        edges = edges.filter((e) => e.source !== n.id && e.target !== n.id);
      }
    } else if ((op.op === 'connect' || op.op === 'disconnect') && op.from && op.to) {
      const s = find(resolve(op.from));
      const t = find(resolve(op.to));
      const handle = op.handle || 'out';
      if (!s || !t) { skipped.push('A connection to a step that does not exist was ignored.'); continue; }
      if (op.op === 'disconnect') {
        const before = edges.length;
        edges = edges.filter((e) => !(e.source === s.id && e.target === t.id && (e.sourceHandle ?? 'out') === handle));
        if (edges.length < before) summary.push(`Disconnect ${describe(s)} from ${describe(t)}`);
        continue;
      }
      if (t.id === START_ID || (t.data.kind === 'event' && s.id !== START_ID) || (s.id === START_ID && t.data.kind !== 'event')) {
        skipped.push(`${describe(s)} cannot connect to ${describe(t)}.`);
        continue;
      }
      // One line per connection point, except the starting point, which fans out to every event.
      edges = s.id === START_ID
        ? edges.filter((e) => !(e.source === s.id && e.target === t.id))
        : edges.filter((e) => !(e.source === s.id && (e.sourceHandle ?? 'out') === handle));
      edges.push({ id: `e_${s.id}_${handle}_${t.id}`, source: s.id, target: t.id, sourceHandle: handle, type: 'smoothstep' });
      summary.push(`Connect ${describe(s)} to ${describe(t)}`);
    }
  }

  // Place each new step to the right of the step it hangs from, stacked under its siblings.
  const slots = new Map<string, number>();
  let lowest = Math.max(0, ...nodes.filter((n) => !added.has(n.id)).map((n) => n.position.y));
  for (const n of nodes) {
    if (!added.has(n.id)) continue;
    const parent = edges.map((e) => (e.target === n.id ? nodes.find((p) => p.id === e.source) : undefined)).find(Boolean);
    if (parent) {
      const k = slots.get(parent.id) ?? 0;
      slots.set(parent.id, k + 1);
      n.position = { x: parent.position.x + 320, y: parent.position.y + k * 150 };
    } else {
      lowest += 150;
      n.position = { x: 320, y: lowest };
    }
  }

  const { flow, dropped } = sanitizeFlow({ name: 'x', nodes, edges });
  dropped.forEach((d) => skipped.push(d));
  return { nodes: flow?.nodes ?? startNodes, edges: flow?.edges ?? startEdges, summary, skipped: [...new Set(skipped)] };
};
