import { ANSWER_SCOPES, APP_PAGES, NEEDS, TAPS, findOutcome } from './catalog';
import { outputsOf } from './outputs';
import { KIND_META, MAX_EVENTS, START_ID, type BotEdge, type BotNode } from './types';

export interface Issue {
  level: 'error' | 'warning';
  nodeId?: string;
  text: string;
}

const label = (n: BotNode) => `${KIND_META[n.data.kind].label} "${n.data.title || '(untitled)'}"`;

/** What would stop the bot working, and what is worth a second look. */
export const validateFlow = (nodes: BotNode[], edges: BotEdge[]): Issue[] => {
  const issues: Issue[] = [];
  const bySource = new Map<string, BotEdge[]>();
  edges.forEach((e) => bySource.set(e.source, [...(bySource.get(e.source) ?? []), e]));
  const connected = (id: string, handle: string) => (bySource.get(id) ?? []).some((e) => (e.sourceHandle ?? 'out') === handle);

  if (!nodes.some((n) => n.id === START_ID)) issues.push({ level: 'error', text: 'The starting point is missing. Load the starter flow to get it back.' });
  const events = nodes.filter((n) => n.data.kind === 'event');
  if (!events.length) issues.push({ level: 'error', text: 'Add at least one event, so the bot knows what customers may ask for.' });
  if (events.length > MAX_EVENTS) issues.push({ level: 'error', text: `There are ${events.length} events. The limit is ${MAX_EVENTS}, so the AI can choose reliably.` });
  const fromStart = new Set((bySource.get(START_ID) ?? []).map((e) => e.target));

  for (const n of events) {
    const d = n.data;
    if (!fromStart.has(n.id)) issues.push({ level: 'error', nodeId: n.id, text: `${label(n)} is not connected to the starting point, so the AI can never choose it.` });
    if (!connected(n.id, 'out')) issues.push({ level: 'error', nodeId: n.id, text: `${label(n)} has nothing after it.` });
    if ((d.description ?? '').trim().length < 10) issues.push({ level: 'error', nodeId: n.id, text: `${label(n)} needs a description of at least a sentence, so the AI understands it.` });
    if (!d.fallback && !d.tapButton && (d.examples ?? []).filter((e) => e.trim()).length < 2) issues.push({ level: 'warning', nodeId: n.id, text: `${label(n)} works best with at least 2 example phrases.` });
    if (d.tapButton && !TAPS.includes(d.tapButton)) issues.push({ level: 'error', nodeId: n.id, text: `${label(n)} listens for a button that does not exist.` });
  }
  const fallbacks = events.filter((n) => n.data.fallback);
  if (!fallbacks.length) issues.push({ level: 'warning', text: 'There is no fallback event. A message that fits nothing gets no reply.' });
  if (fallbacks.length > 1) issues.push({ level: 'warning', text: 'More than one event is marked as the fallback. Only one is used.' });

  for (const n of nodes) {
    const d = n.data;
    if (d.kind === 'outcome') {
      const spec = findOutcome(d.outcomeId);
      if (!spec) { issues.push({ level: 'error', nodeId: n.id, text: `${label(n)} has no outcome chosen.` }); continue; }
      if (spec.params.includes('appPage') && !APP_PAGES.some((p) => p.path === d.appPage)) issues.push({ level: 'error', nodeId: n.id, text: `${label(n)} needs an app page.` });
      if (spec.params.includes('scopes')) {
        const ok = (d.scopes ?? []).filter((s) => ANSWER_SCOPES.some((x) => x.id === s));
        if (!ok.length) issues.push({ level: 'error', nodeId: n.id, text: `${label(n)} needs at least one topic the AI may answer about.` });
      }
      if (spec.params.includes('need') && !NEEDS.includes(d.need ?? '')) issues.push({ level: 'error', nodeId: n.id, text: `${label(n)} needs to say what we are asking for.` });
      for (const o of outputsOf(d)) {
        if (!connected(n.id, o.id) && spec.id === 'order_status') issues.push({ level: 'warning', nodeId: n.id, text: `${label(n)}: "${o.label}" leads nowhere.` });
      }
    }
    if (d.kind === 'condition') {
      if (!connected(n.id, 'yes')) issues.push({ level: 'warning', nodeId: n.id, text: `${label(n)}: the Yes branch leads nowhere.` });
      if (!connected(n.id, 'no')) issues.push({ level: 'warning', nodeId: n.id, text: `${label(n)}: the No branch leads nowhere.` });
    }
  }

  const reached = new Set<string>();
  const stack = [START_ID];
  while (stack.length) {
    const id = stack.pop()!;
    if (reached.has(id)) continue;
    reached.add(id);
    (bySource.get(id) ?? []).forEach((e) => stack.push(e.target));
  }
  nodes.filter((n) => !reached.has(n.id)).forEach((n) => issues.push({ level: 'warning', nodeId: n.id, text: `${label(n)} can never be reached.` }));

  const mark = new Map<string, 0 | 1 | 2>();
  const cyc = (id: string): boolean => {
    mark.set(id, 1);
    for (const e of bySource.get(id) ?? []) {
      const m = mark.get(e.target) ?? 0;
      if (m === 1 || (m === 0 && cyc(e.target))) return true;
    }
    mark.set(id, 2);
    return false;
  };
  if (cyc(START_ID)) issues.push({ level: 'error', text: 'The flow loops back on itself. A loop would send messages without end.' });
  return issues;
};
