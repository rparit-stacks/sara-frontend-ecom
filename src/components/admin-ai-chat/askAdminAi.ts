import type { AdminPageContextDto } from '@/lib/api';

const EVENT = 'admin-ai:ask';

export type AdminAiAskPayload = {
  /**
   * Short message shown in the admin chat bubble and stored as the user turn.
   * Keep this human-readable — never dump ids / tool instructions here.
   */
  prompt: string;
  /** Optional page/entity context override for that turn (and sticky until cleared). */
  context?: Partial<AdminPageContextDto> | null;
  /** Short chip label in the chat header (e.g. "Order #1042"). */
  label?: string | null;
};

/** One-click hand-off: opens Ops AI and sends a contextual prompt. */
export function askAdminAi(promptOrPayload: string | AdminAiAskPayload) {
  const detail: AdminAiAskPayload =
    typeof promptOrPayload === 'string'
      ? { prompt: promptOrPayload }
      : promptOrPayload;
  if (!detail.prompt?.trim()) return;
  window.dispatchEvent(new CustomEvent<AdminAiAskPayload>(EVENT, { detail }));
}

export const ADMIN_AI_ASK_EVENT = EVENT;

/** Build a focused prompt + context for a known entity. */
export function askAboutEntity(opts: {
  kind:
    | 'order'
    | 'product'
    | 'category'
    | 'blog'
    | 'faq'
    | 'user'
    | 'coupon'
    | 'api_log'
    | 'contact'
    | 'inquiry'
    | 'project'
    | 'quote'
    | 'invoice'
    | 'payment_link'
    | 'page';
  id?: string | number | null;
  name?: string | null;
  extra?: string | null;
  pageKey?: string | null;
  route?: string | null;
  orderNumber?: string | null;
  userEmail?: string | null;
  projectCode?: string | null;
}) {
  const label = entityLabel(opts);
  // Visible to admin — one short line only.
  const prompt = `About ${humanKind(opts.kind)}: ${label}`;

  // Background only — injected into Ops AI system prompt via focusHint.
  const focusHint = [
    `kind=${opts.kind}`,
    opts.id != null && opts.id !== '' ? `id=${opts.id}` : null,
    opts.orderNumber ? `orderNumber=${opts.orderNumber}` : null,
    opts.userEmail ? `userEmail=${opts.userEmail}` : null,
    opts.projectCode ? `projectCode=${opts.projectCode}` : null,
    opts.name?.trim() ? `name=${opts.name.trim()}` : null,
    opts.extra?.trim() || null,
  ]
    .filter(Boolean)
    .join('; ');

  const context: Partial<AdminPageContextDto> = {
    pageKey: opts.pageKey ?? null,
    route: opts.route ?? (typeof window !== 'undefined' ? window.location.pathname : null),
    focusHint,
  };

  if (opts.kind === 'order' && opts.id != null) {
    context.pageType = 'ORDER_DETAIL';
    context.orderId = Number(opts.id);
    context.orderNumber = opts.orderNumber ?? null;
  } else if (opts.kind === 'product' && opts.id != null) {
    context.pageType = 'PRODUCT_EDIT';
    context.productId = Number(opts.id);
  } else if (opts.kind === 'user' && opts.userEmail) {
    context.pageType = 'USERS';
    context.userEmail = opts.userEmail;
  } else {
    context.pageType = 'OTHER';
  }

  askAdminAi({ prompt, context, label });
}

function humanKind(kind: string): string {
  return kind.replace(/_/g, ' ');
}

function entityLabel(opts: {
  kind: string;
  id?: string | number | null;
  name?: string | null;
  orderNumber?: string | null;
  projectCode?: string | null;
}): string {
  if (opts.name?.trim()) return opts.name.trim();
  if (opts.orderNumber) return `#${opts.orderNumber}`;
  if (opts.projectCode) return opts.projectCode;
  if (opts.id != null && opts.id !== '') return `${opts.kind} ${opts.id}`;
  return opts.kind;
}
