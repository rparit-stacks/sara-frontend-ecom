import { newId, START_ID, type BotEdge, type BotFlow, type BotNode } from './types';

const node = (id: string, x: number, y: number, data: BotNode['data']): BotNode => ({ id, type: 'bot', position: { x, y }, data, deletable: data.kind !== 'start' });
const edge = (source: string, target: string, sourceHandle = 'out'): BotEdge => ({ id: `e_${source}_${sourceHandle}_${target}`, source, target, sourceHandle, type: 'smoothstep' });

/** A small flow that follows the strategy: answer the basics, then send the customer to the app. */
export const starterFlow = (): BotFlow => {
  const nodes: BotNode[] = [
    node(START_ID, 0, 330, { kind: 'start', title: 'Customer sends a message' }),
    node('ev_hi', 380, 0, { kind: 'event', title: 'Says hello', description: 'The customer greets us or asks to see the menu.', examples: ['hi', 'hello', 'namaste', 'menu'], tapButton: 'Main menu' }),
    node('ev_order', 380, 190, { kind: 'event', title: 'Wants to track an order', description: 'The customer asks where their order is or what its status is.', examples: ['where is my order', 'order status', 'track my order', 'mera order kahan hai'], tapButton: 'Track my order' }),
    node('ev_quote', 380, 380, { kind: 'event', title: 'Wants a quote', description: 'The customer asks for a price for custom work, bulk orders or embroidery.', examples: ['quote', 'price for custom print', 'bulk order', 'embroidery rate'], tapButton: 'Get a quote' }),
    node('ev_person', 380, 570, { kind: 'event', title: 'Wants a person', description: 'The customer asks for a person, wants to complain, or wants to chat to the team.', examples: ['talk to someone', 'human', 'agent', 'complaint'], tapButton: 'Chat in the app' }),
    node('ev_info', 380, 760, { kind: 'event', title: 'Asks about our products', description: 'The customer asks a question about products, fabrics, prices or minimum orders.', examples: ['do you have cotton', 'price of silk', 'minimum order', 'what fabrics'] }),
    node('ev_other', 380, 950, { kind: 'event', title: 'Anything else', description: 'Use this when nothing else fits the message.', examples: [], fallback: true }),
    node('o_menu', 780, 0, { kind: 'outcome', title: 'Welcome menu', outcomeId: 'menu' }),
    node('o_order', 780, 190, { kind: 'outcome', title: 'Order status', outcomeId: 'order_status' }),
    node('o_noorder', 1180, 250, { kind: 'outcome', title: 'No order found', outcomeId: 'open_app', appPage: '/ask' }),
    node('o_quote', 780, 380, { kind: 'outcome', title: 'Quote in the app', outcomeId: 'open_app', appPage: '/inquiry' }),
    node('c_hours', 780, 570, { kind: 'condition', title: 'Open now?', conditionType: 'business_hours' }),
    node('o_hand', 1180, 540, { kind: 'outcome', title: 'Hand over', outcomeId: 'handover' }),
    node('o_closed', 1180, 700, { kind: 'outcome', title: 'We are closed', outcomeId: 'closed' }),
    node('o_answer', 780, 760, { kind: 'outcome', title: 'Product answer', outcomeId: 'answer', scopes: ['products', 'fabrics', 'pricing'] }),
    node('o_fallback', 780, 950, { kind: 'outcome', title: 'Point to the app', outcomeId: 'open_app', appPage: '/ask' }),
  ];
  void newId;
  const edges: BotEdge[] = [
    edge(START_ID, 'ev_hi'), edge(START_ID, 'ev_order'), edge(START_ID, 'ev_quote'), edge(START_ID, 'ev_person'), edge(START_ID, 'ev_info'), edge(START_ID, 'ev_other'),
    edge('ev_hi', 'o_menu'),
    edge('ev_order', 'o_order'), edge('o_order', 'o_noorder', 'none'),
    edge('ev_quote', 'o_quote'),
    edge('ev_person', 'c_hours'), edge('c_hours', 'o_hand', 'yes'), edge('c_hours', 'o_closed', 'no'),
    edge('ev_info', 'o_answer'),
    edge('ev_other', 'o_fallback'),
  ];
  return { name: 'Studio Sara bot', nodes, edges };
};
