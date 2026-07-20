import { parsePaymentCard } from '@/components/portal/PaymentCard';
import { parseProductCard, stripProductMarker } from '@/components/portal/ProductCard';

export type MessagePreviewKind = 'payment' | 'product' | 'image' | 'file' | 'text' | 'empty';

function plainPreviewText(body?: string | null): string {
  if (!body) return '';
  let s = stripProductMarker(body);
  s = s.replace(/\[\[(?:product|payment):[^\]]+\]\]/g, '');
  s = s.replace(/`([^`]+)`/g, '$1');
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  s = s.replace(/\*\*|__/g, '').replace(/\*|_/g, '');
  return s.trim();
}

export function getMessagePreviewKind(body?: string | null, attachmentUrl?: string | null): MessagePreviewKind {
  if (parsePaymentCard(body ?? undefined)) return 'payment';
  if (parseProductCard(body ?? undefined)) return 'product';
  if (body?.includes('[[payment:')) return 'payment';
  if (body?.includes('[[product:')) return 'product';
  const text = plainPreviewText(body);
  if (text && text !== '(attachment)') return 'text';
  if (attachmentUrl) return /\.(png|jpe?g|gif|webp|svg)/i.test(attachmentUrl) ? 'image' : 'file';
  return 'empty';
}

/** Human-readable preview — never shows raw [[product:…]] / [[payment:…]] markers or markdown code fences. */
export function formatMessagePreview(body?: string | null, attachmentUrl?: string | null): string {
  const pay = parsePaymentCard(body ?? undefined);
  if (pay) {
    const title = pay.title && pay.title !== 'Payment' ? `: ${pay.title}` : '';
    return `Payment requested — ${pay.amount}${title}`;
  }
  const product = parseProductCard(body ?? undefined);
  if (product) {
    const extra = plainPreviewText(body);
    if (extra && extra !== '(attachment)' && !extra.includes(product.name)) {
      const truncated = extra.length > 72 ? `${extra.slice(0, 69)}…` : extra;
      return `${truncated} · ${product.name}`;
    }
    return `Shared product — ${product.name}`;
  }
  if (body?.includes('[[payment:')) return 'Payment requested';
  if (body?.includes('[[product:')) return 'Product shared';

  const text = plainPreviewText(body);
  if (text && text !== '(attachment)') {
    return text.length > 120 ? `${text.slice(0, 117)}…` : text;
  }
  if (attachmentUrl) {
    return /\.(png|jpe?g|gif|webp|svg)/i.test(attachmentUrl) ? 'Image attachment' : 'File attachment';
  }
  return '—';
}

export function previewIcon(kind: MessagePreviewKind): string {
  switch (kind) {
    case 'payment': return 'payments';
    case 'product': return 'shopping_bag';
    case 'image': return 'image';
    case 'file': return 'attach_file';
    case 'text': return 'chat_bubble';
    default: return 'forum';
  }
}

export function previewAccent(kind: MessagePreviewKind): { bg: string; fg: string } {
  switch (kind) {
    case 'payment':
      return { bg: 'var(--p-secondary-container)', fg: 'var(--p-secondary)' };
    case 'product':
      return { bg: 'rgba(0,103,106,0.12)', fg: 'var(--p-primary)' };
    case 'image':
    case 'file':
      return { bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface-variant)' };
    default:
      return { bg: 'var(--p-surface-container-high)', fg: 'var(--p-primary)' };
  }
}
