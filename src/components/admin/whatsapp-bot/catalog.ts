import type { NodeOutput, OutcomeId } from './types';

/**
 * The fixed list of things the bot can do, and the private mapping to approved wording.
 * `template` and `cost` are for the system only and are never shown to the person building a flow.
 * See docs/kb/58-whatsapp-bot-plan.md.
 */

export const DEEP_LINK_BASE = 'https://open.studiosara.in';

export const APP_PAGES: { path: string; label: string; line: string }[] = [
  { path: '/ask', label: 'Chat with Sara (AI assistant)', line: 'Our assistant and team are in the app, free of charge. Tap below to chat.' },
  { path: '/inquiry', label: 'Get a quote', line: 'Quotes are quickest in the app. Tap below to start one.' },
  { path: '/orders', label: 'My orders', line: 'You can see every detail of your orders in the app.' },
  { path: '/products', label: 'Shop', line: 'You can browse our full collection in the app.' },
  { path: '/cart', label: 'Cart', line: 'Your cart is waiting for you in the app.' },
  { path: '/portal', label: 'Manufacturing portal', line: 'You can follow your custom projects and quotes in the app.' },
  { path: '/contact', label: 'Contact', line: 'You can reach our team from the app.' },
];

export const ANSWER_SCOPES = [
  { id: 'products', label: 'Products and prints' },
  { id: 'fabrics', label: 'Fabrics' },
  { id: 'pricing', label: 'Pricing and minimums' },
  { id: 'custom', label: 'Custom design and embroidery' },
  { id: 'orders', label: 'Orders and delivery' },
  { id: 'policies', label: 'Shipping, returns and policies' },
];

export const NEEDS = [
  'the fabric you would like to use',
  'the quantity you need',
  'your design file or idea',
  'your order number',
  'the date you need it by',
];

/** Buttons a customer can tap in the bot's messages. An Event can be set to start from a tap, which needs no AI. */
export const TAPS = ['Track my order', 'Get a quote', 'Chat in the app', 'Main menu', 'Loved it', 'It was okay', 'Not happy'];

export interface OutcomeSpec {
  id: OutcomeId;
  label: string;
  hint: string;
  params: ('appPage' | 'scopes' | 'need')[];
  outputs: NodeOutput[];
  /** Private: which approved template carries it, and what it costs per message (INR before GST). */
  template: string;
  cost: number;
}

const out = (id = 'out', label = 'Next'): NodeOutput => ({ id, label });

export const OUTCOMES: OutcomeSpec[] = [
  { id: 'menu', label: 'Show the main menu', hint: 'Welcome with three buttons', params: [], outputs: [], template: 'ai_main_menu', cost: 0.115 },
  { id: 'order_status', label: 'Share the order status', hint: 'Looks up their latest order', params: [], outputs: [out('found', 'Order found'), out('none', 'No order')], template: 'ai_order_status', cost: 0.115 },
  { id: 'open_app', label: 'Send them to the app', hint: 'A button that opens a page in the app', params: ['appPage'], outputs: [out()], template: 'ai_info_link', cost: 0.115 },
  { id: 'answer', label: 'Answer from our knowledge', hint: 'AI answers using only the topics you allow', params: ['scopes'], outputs: [out()], template: 'ai_info_text', cost: 0.115 },
  { id: 'ai_chat', label: 'Let AI handle from here', hint: 'The AI keeps the chat going in its own words, on the topics you allow, until the customer taps Main menu. It hands over to the team when it is not sure.', params: ['scopes'], outputs: [], template: 'ai_info_text', cost: 0.115 },
  { id: 'ask_details', label: 'Ask for more details', hint: 'Asks for one thing we need', params: ['need'], outputs: [out()], template: 'ai_design_needs_info', cost: 0.115 },
  { id: 'confirm', label: 'Confirm we got their request', hint: 'Says the team will reply', params: [], outputs: [out()], template: 'ai_ticket_created', cost: 0.115 },
  { id: 'feedback', label: 'Ask how it went', hint: 'Three answer buttons', params: [], outputs: [out('loved', 'Loved it'), out('okay', 'It was okay'), out('unhappy', 'Not happy')], template: 'ai_feedback_request', cost: 0.115 },
  { id: 'handover', label: 'Hand over to the team', hint: 'Notifies the team and links to the app chat', params: [], outputs: [out()], template: 'ai_info_link', cost: 0.115 },
  { id: 'closed', label: 'Tell them we are closed', hint: 'Points them to the app', params: [], outputs: [out()], template: 'ai_info_link', cost: 0.115 },
];

export const findOutcome = (id?: string) => OUTCOMES.find((o) => o.id === id);
export const findPage = (path?: string) => APP_PAGES.find((p) => p.path === path);
export const deepLink = (path?: string) => `${DEEP_LINK_BASE}${findPage(path) ? path : '/ask'}`;
export const GST = 0.18;
