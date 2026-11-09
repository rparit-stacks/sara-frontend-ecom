import { ANSWER_SCOPES, APP_PAGES, NEEDS, TAPS, findOutcome } from './catalog';
import { outputsOf } from './outputs';
import { MAX_EVENTS, START_ID, newId, type BotEdge, type BotFlow, type BotNode, type BotNodeData, type ConditionType, type NodeKind } from './types';

const KINDS: NodeKind[] = ['start', 'event', 'outcome', 'condition', 'end'];
const CONDITIONS: ConditionType[] = ['business_hours', 'has_orders', 'new_customer'];
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[<>]/g, '').trim().slice(0, max) : '');

/**
 * Rebuilds a flow from only the fields the builder is allowed to produce. A saved or imported flow can therefore never carry
 * free text to send, a template name, an instruction for the AI, or any outcome that is not in the catalogue. The server must
 * run the same rules when a flow is published.
 */
export const sanitizeFlow = (input: unknown): { flow: BotFlow | null; dropped: string[] } => {
  const dropped: string[] = [];
  const raw = (input ?? {}) as { name?: unknown; nodes?: unknown; edges?: unknown };
  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) return { flow: null, dropped: ['This is not a flow file.'] };

  const nodes: BotNode[] = [];
  let events = 0;
  for (const r of raw.nodes as any[]) {
    const kind = r?.data?.kind as NodeKind;
    if (!KINDS.includes(kind)) { dropped.push('A step of an unknown type was removed.'); continue; }
    if (kind === 'event' && ++events > MAX_EVENTS) { dropped.push('Extra events beyond the limit were removed.'); continue; }
    const id = kind === 'start' ? START_ID : str(r.id, 40) || newId();
    const d: BotNodeData = { kind, title: str(r.data.title, 40) };
    if (kind === 'event') {
      d.description = str(r.data.description, 200);
      d.examples = (Array.isArray(r.data.examples) ? r.data.examples : []).map((x: unknown) => str(x, 80)).filter(Boolean).slice(0, 6);
      if (TAPS.includes(r.data.tapButton)) d.tapButton = r.data.tapButton;
      if (r.data.fallback === true) d.fallback = true;
    }
    if (kind === 'outcome') {
      const spec = findOutcome(r.data.outcomeId);
      if (!spec) { dropped.push('A step that did something outside the allowed list was removed.'); continue; }
      d.outcomeId = spec.id;
      if (spec.params.includes('appPage') && APP_PAGES.some((p) => p.path === r.data.appPage)) d.appPage = r.data.appPage;
      if (spec.params.includes('scopes')) d.scopes = (Array.isArray(r.data.scopes) ? r.data.scopes : []).filter((s: string) => ANSWER_SCOPES.some((x) => x.id === s));
      if (spec.params.includes('need') && NEEDS.includes(r.data.need)) d.need = r.data.need;
    }
    if (kind === 'condition') d.conditionType = CONDITIONS.includes(r.data.conditionType) ? r.data.conditionType : 'business_hours';
    if (Object.keys(r.data).some((k) => ['text', 'instructions', 'template', 'templateName', 'prompt', 'message'].includes(k))) dropped.push('Free text, template names and AI instructions are not allowed and were removed.');
    nodes.push({ id, type: 'bot', position: { x: Number(r.position?.x) || 0, y: Number(r.position?.y) || 0 }, data: d, deletable: kind !== 'start' });
  }
  if (!nodes.some((n) => n.id === START_ID)) nodes.unshift({ id: START_ID, type: 'bot', position: { x: 0, y: 220 }, deletable: false, data: { kind: 'start', title: 'Customer sends a message' } });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: BotEdge[] = [];
  for (const e of raw.edges as any[]) {
    const s = byId.get(e?.source);
    const t = byId.get(e?.target);
    if (!s || !t || t.id === START_ID) continue;
    const handle = typeof e.sourceHandle === 'string' ? e.sourceHandle : 'out';
    if (!outputsOf(s.data).some((o) => o.id === handle)) continue;
    if (t.data.kind === 'event' && s.id !== START_ID) continue;
    if (s.id === START_ID && t.data.kind !== 'event') continue;
    edges.push({ id: `e_${s.id}_${handle}_${t.id}`, source: s.id, target: t.id, sourceHandle: handle, type: 'smoothstep' });
  }
  return { flow: { name: str(raw.name, 60) || 'Studio Sara bot', nodes, edges }, dropped: [...new Set(dropped)] };
};
