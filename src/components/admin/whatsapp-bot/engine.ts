import { ANSWER_SCOPES, GST, findOutcome, findPage } from './catalog';
import { MAX_EVENTS_PER_MESSAGE, type BotEdge, type BotNode } from './types';

export interface SimSettings {
  businessOpen: boolean;
  hasOrders: boolean;
  newCustomer: boolean;
}

export interface ChatButton {
  label: string;
  kind: 'reply' | 'link';
}

export interface ChatMsg {
  id: string;
  from: 'user' | 'bot' | 'system';
  text: string;
  buttons?: ChatButton[];
  /** What it costs, per message. Shown as a plain number only; the wording behind it is private. */
  cost?: number;
}

export interface SimState {
  msgs: ChatMsg[];
  cost: number;
  botMessages: number;
  aiCalls: number;
}

export const initialState = (): SimState => ({ msgs: [], cost: 0, botMessages: 0, aiCalls: 0 });
export const withGst = (n: number) => n * (1 + GST);

const NAME = 'Priya';
const uid = () => Math.random().toString(36).slice(2, 9);
const STOP = new Set(['the', 'a', 'an', 'is', 'to', 'my', 'me', 'i', 'of', 'in', 'on', 'and', 'or', 'it', 'for', 'you', 'we', 'do', 'have']);
const tokens = (s: string) => s.toLowerCase().split(/[^a-z0-9ऀ-ॿ]+/).filter((w) => w && !STOP.has(w));

/** How well a customer message fits an Event, from its example phrases. The real bot uses an AI model; this is the nearest simple stand-in. */
const score = (text: string, node: BotNode): number => {
  const lower = text.toLowerCase();
  const words = new Set(tokens(text));
  let best = 0;
  for (const ex of [...(node.data.examples ?? []), node.data.title]) {
    const e = ex.trim().toLowerCase();
    if (!e) continue;
    if (lower.includes(e)) { best = Math.max(best, 1); continue; }
    const et = tokens(e);
    if (!et.length) continue;
    best = Math.max(best, et.filter((w) => words.has(w)).length / et.length);
  }
  return best;
};

interface Rendered {
  text: string;
  buttons?: ChatButton[];
}

const render = (node: BotNode, found: boolean): Rendered => {
  const d = node.data;
  const page = findPage(d.appPage);
  const link = (label: string): ChatButton[] => [{ label, kind: 'link' }];
  switch (d.outcomeId) {
    case 'menu':
      return { text: `Hi ${NAME}, welcome to Studio Sara. How can we help you today? Tap an option below to continue.`, buttons: ['Track my order', 'Get a quote', 'Chat in the app'].map((label) => ({ label, kind: 'reply' as const })) };
    case 'order_status':
      return found
        ? { text: `Hi ${NAME}, your Studio Sara order #1042 is now shipped. Details: you can see every detail in the app. Tap below to see your order.`, buttons: link('View order') }
        : { text: `Hi ${NAME}, here is what you asked for: we could not find an order for this phone number. Tap below for more details.`, buttons: link('Open page') };
    case 'open_app':
      return { text: `Hi ${NAME}, here is what you asked for: ${page?.line ?? ''} Tap below for more details.`, buttons: link('Open page') };
    case 'answer': {
      const topics = (d.scopes ?? []).map((s) => ANSWER_SCOPES.find((x) => x.id === s)?.label ?? s).join(', ');
      return { text: `Hi ${NAME}, here is the information you asked for: [AI answer, using only: ${topics || 'no topics chosen'}] Reply here if you need anything else.`, buttons: [{ label: 'Main menu', kind: 'reply' }] };
    }
    case 'ask_details':
      return { text: `Hi ${NAME}, we need a little more information to move ahead: ${d.need ?? '...'} Please reply to this message with the details.` };
    case 'confirm':
      return { text: `Hi ${NAME}, we have noted your request. Our team will get back to you as soon as possible.` };
    case 'feedback':
      return { text: `Hi ${NAME}, thank you for shopping with Studio Sara. How was your experience? We would love to hear from you.`, buttons: ['Loved it', 'It was okay', 'Not happy'].map((label) => ({ label, kind: 'reply' as const })) };
    case 'handover':
      return { text: `Hi ${NAME}, here is what you asked for: our assistant and team are in the app, free of charge. Tap below to chat.`, buttons: link('Open page') };
    case 'closed':
      return { text: `Hi ${NAME}, here is what you asked for: we are closed right now, and our assistant in the app can help any time. Tap below for more details.`, buttons: link('Open page') };
    default:
      return { text: '' };
  }
};

/** One customer message goes in; the flow runs; the new state comes out. */
export const userSays = (flow: { nodes: BotNode[]; edges: BotEdge[] }, prev: SimState, text: string, settings: SimSettings): SimState => {
  const state: SimState = { ...prev, msgs: [...prev.msgs] };
  const byId = new Map(flow.nodes.map((n) => [n.id, n]));
  const clean = text.trim();
  state.msgs.push({ id: uid(), from: 'user', text: clean });
  const note = (t: string) => state.msgs.push({ id: uid(), from: 'system', text: t });
  const next = (id: string, handle: string) => flow.edges.find((e) => e.source === id && (e.sourceHandle ?? 'out') === handle)?.target ?? null;

  const runChain = (startId: string | null) => {
    let id = startId;
    for (let steps = 0; id && steps < 30; steps++) {
      const node = byId.get(id);
      if (!node) return;
      const d = node.data;
      if (d.kind === 'end') { note('Conversation ended.'); return; }
      if (d.kind === 'condition') {
        const yes = d.conditionType === 'business_hours' ? settings.businessOpen : d.conditionType === 'has_orders' ? settings.hasOrders : settings.newCustomer;
        note(`Check: ${yes ? 'yes' : 'no'}`);
        id = next(id, yes ? 'yes' : 'no');
        continue;
      }
      if (d.kind === 'outcome') {
        const spec = findOutcome(d.outcomeId);
        if (!spec) { note('An outcome is not set up.'); return; }
        const found = d.outcomeId === 'order_status' ? settings.hasOrders : true;
        const r = render(node, found);
        state.msgs.push({ id: uid(), from: 'bot', text: r.text, buttons: r.buttons, cost: spec.cost });
        state.cost += spec.cost;
        state.botMessages += 1;
        if (d.outcomeId === 'handover') note('The team has been notified.');
        id = d.outcomeId === 'order_status' ? next(id, found ? 'found' : 'none') : next(id, 'out');
        continue;
      }
      id = next(id, 'out');
    }
  };

  const events = flow.nodes.filter((n) => n.data.kind === 'event');
  const fromStart = new Set(flow.edges.filter((e) => e.source === 'start').map((e) => e.target));
  const live = events.filter((e) => fromStart.has(e.id));

  // A button tap is matched exactly, with no AI.
  const tapped = live.filter((e) => e.data.tapButton && e.data.tapButton.toLowerCase() === clean.toLowerCase());
  let chosen: { node: BotNode; why: string }[];
  if (tapped.length) {
    chosen = tapped.slice(0, MAX_EVENTS_PER_MESSAGE).map((node) => ({ node, why: 'button tap, no AI' }));
  } else {
    state.aiCalls += 1;
    const ranked = live.map((node) => ({ node, s: score(clean, node) })).filter((x) => x.s >= 0.6 && !x.node.data.fallback).sort((a, b) => b.s - a.s);
    chosen = ranked.slice(0, MAX_EVENTS_PER_MESSAGE).map((x) => ({ node: x.node, why: `AI match ${Math.round(x.s * 100)}%` }));
    if (!chosen.length) {
      const fb = live.find((e) => e.data.fallback);
      if (fb) chosen = [{ node: fb, why: 'nothing else fit' }];
    }
  }
  if (!chosen.length) {
    note('No event fits this message, so the bot stays silent and nothing is charged.');
    return state;
  }
  for (const c of chosen) {
    note(`Event: ${c.node.data.title} (${c.why})`);
    runChain(next(c.node.id, 'out'));
  }
  return state;
};
