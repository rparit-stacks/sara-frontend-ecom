import type { Edge, Node } from '@xyflow/react';

/**
 * One workflow. A customer message comes in, the AI decides which Event(s) it matches, each Event leads to
 * Outcomes (what the bot does). The person building the flow never sees or chooses templates; the system maps every
 * Outcome to approved wording privately.
 */
export type NodeKind = 'start' | 'event' | 'outcome' | 'condition' | 'end';
export type OutcomeId = 'menu' | 'order_status' | 'open_app' | 'answer' | 'ai_chat' | 'ask_details' | 'confirm' | 'feedback' | 'handover' | 'closed';
export type ConditionType = 'business_hours' | 'has_orders' | 'new_customer';

export type BotNodeData = {
  kind: NodeKind;
  /** A label for the team. Never sent to a customer. */
  title: string;
  // event
  description?: string;
  examples?: string[];
  tapButton?: string;
  fallback?: boolean;
  // outcome
  outcomeId?: OutcomeId;
  appPage?: string;
  scopes?: string[];
  need?: string;
  // condition
  conditionType?: ConditionType;
} & Record<string, unknown>;

export type BotNode = Node<BotNodeData, 'bot'>;
export type BotEdge = Edge;

export interface BotFlow {
  name: string;
  nodes: BotNode[];
  edges: BotEdge[];
}

export interface NodeOutput {
  id: string;
  label: string;
}

export const KIND_META: Record<NodeKind, { label: string; hint: string; color: string; soft: string }> = {
  start: { label: 'Customer message', hint: 'Every chat starts here', color: '#0e7490', soft: '#ecfeff' },
  event: { label: 'Event', hint: 'Something the customer wants', color: '#7c3aed', soft: '#f5f3ff' },
  outcome: { label: 'Outcome', hint: 'What the bot does', color: '#2c9b8a', soft: '#effaf8' },
  condition: { label: 'Condition', hint: 'Yes or no split', color: '#d97706', soft: '#fffbeb' },
  end: { label: 'End', hint: 'Stop here', color: '#475569', soft: '#f1f5f9' },
};

export const CONDITION_LABEL: Record<ConditionType, string> = {
  business_hours: 'It is within business hours',
  has_orders: 'The customer has orders',
  new_customer: 'This is a new customer',
};

export const newId = (prefix = 'n') => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
export const START_ID = 'start';
export const MAX_EVENTS = 12;
export const MAX_EVENTS_PER_MESSAGE = 2;
