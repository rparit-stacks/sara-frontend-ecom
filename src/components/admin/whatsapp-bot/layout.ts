import { outputsOf } from './outputs';
import { START_ID, type BotEdge, type BotNode } from './types';

const WIDTH = 270;
const GAP_X = 150;
const GAP_Y = 36;

/** How tall a card is when the screen has not measured it yet. */
const guessHeight = (n: BotNode): number => {
  const d = n.data;
  const outs = outputsOf(d).length;
  switch (d.kind) {
    case 'start': return 140;
    case 'event': return 150 + ((d.examples ?? []).length ? 34 : 0);
    case 'condition': return 150;
    case 'end': return 90;
    default: return 105 + Math.max(0, outs - 1) * 30 + (d.outcomeId === 'answer' || d.outcomeId === 'open_app' ? 22 : 0);
  }
};

/**
 * Arranges a flow left to right: the starting point, then events, then what each event does, each step beside the one before it.
 * Steps hang off their first parent like a tree, a parent sits in the middle of its children, and nothing overlaps. Steps
 * that nothing leads to are put in a column underneath. Only positions change.
 */
export const autoLayout = (nodes: BotNode[], edges: BotEdge[]): BotNode[] => {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const height = (n: BotNode) => n.measured?.height ?? guessHeight(n);
  const kids = new Map<string, string[]>();
  for (const e of edges) {
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    const list = kids.get(e.source) ?? [];
    if (!list.includes(e.target)) list.push(e.target);
    kids.set(e.source, list);
  }
  // Order a node's children the way their connection points sit (Yes before No, Found before None), so lines do not cross.
  const outOrder = (src: string, target: string) => {
    const s = byId.get(src);
    const handles = s ? outputsOf(s.data).map((o) => o.id) : [];
    const e = edges.find((x) => x.source === src && x.target === target);
    const i = handles.indexOf(e?.sourceHandle ?? 'out');
    return i < 0 ? 0 : i;
  };

  // Each step belongs to the first parent that reaches it; its column is the longest path from the start.
  const depth = new Map<string, number>([[START_ID, 0]]);
  const queue = [START_ID];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    for (const t of kids.get(id) ?? []) {
      const next = (depth.get(id) ?? 0) + 1;
      if (next > (depth.get(t) ?? -1) && next <= nodes.length) {
        depth.set(t, next);
        queue.push(t);
      }
    }
  }
  const parent = new Map<string, string>();
  const treeKids = new Map<string, string[]>();
  for (const id of [...depth.keys()].sort((a, b) => (depth.get(a) ?? 0) - (depth.get(b) ?? 0))) {
    for (const t of kids.get(id) ?? []) {
      if (t !== START_ID && !parent.has(t) && (depth.get(t) ?? 0) > (depth.get(id) ?? 0)) {
        parent.set(t, id);
      }
    }
  }
  for (const [t, p] of parent) treeKids.set(p, [...(treeKids.get(p) ?? []), t]);
  for (const [p, list] of treeKids) list.sort((a, b) => outOrder(p, a) - outOrder(p, b));

  const pos = new Map<string, { x: number; y: number }>();
  // First measure every subtree: it is as tall as the step itself or its children stacked, whichever is more.
  const block = new Map<string, number>();
  const measure = (id: string): number => {
    const h = height(byId.get(id)!);
    const children = treeKids.get(id) ?? [];
    const stacked = children.reduce((sum, c, i) => sum + measure(c) + (i ? GAP_Y : 0), 0);
    block.set(id, Math.max(h, stacked));
    return block.get(id)!;
  };
  // Then place from the top: the step sits in the middle of its block and its children are stacked, centred, beside it.
  const place = (id: string, top: number) => {
    const n = byId.get(id)!;
    const children = treeKids.get(id) ?? [];
    const total = block.get(id)!;
    pos.set(id, { x: (depth.get(id) ?? 0) * (WIDTH + GAP_X), y: top + (total - height(n)) / 2 });
    const stacked = children.reduce((sum, c, i) => sum + block.get(c)! + (i ? GAP_Y : 0), 0);
    let y = top + (total - stacked) / 2;
    for (const c of children) {
      place(c, y);
      y += block.get(c)! + GAP_Y;
    }
  };
  let cursor = 0;
  if (byId.has(START_ID)) {
    cursor = measure(START_ID) + GAP_Y;
    place(START_ID, 0);
  }

  // Anything the start cannot reach goes below, in one column.
  let loose = Math.max(cursor, 0);
  for (const n of nodes) {
    if (pos.has(n.id)) continue;
    pos.set(n.id, { x: 0, y: loose });
    loose += height(n) + GAP_Y;
  }

  // The tree can leave a gap above when a parent is centred on tall children; shift everything so the top sits at zero.
  const top = Math.min(...[...pos.values()].map((p) => p.y));
  return nodes.map((n) => {
    const p = pos.get(n.id)!;
    return { ...n, position: { x: Math.round(p.x), y: Math.round(p.y - top) } };
  });
};
