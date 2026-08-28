import { Sym } from './Sym';
import { formatMessagePreview } from '@/lib/messagePreview';

export { formatMessagePreview };

export interface ParsedPayment {
  amount: string;
  title: string;
  url: string;
  code: string;
}

const PAYMENT_MARKER = '[[payment:requested';

function extractField(body: string, key: string): string {
  const re = new RegExp(`(?:^|\\|)${key}=([^|\\]]+)`);
  const m = body.match(re);
  return m ? m[1].trim() : '';
}

/** Parse a `[[payment:requested|amount=..|title=..|url=..|code=..]]` marker (lenient). */
export function parsePaymentCard(body?: string): ParsedPayment | null {
  if (!body) return null;
  const trimmed = body.trim();
  if (!trimmed.includes(PAYMENT_MARKER)) return null;

  const amount = extractField(trimmed, 'amount');
  if (!amount) return null;

  return {
    amount,
    title: extractField(trimmed, 'title') || 'Payment',
    url: extractField(trimmed, 'url') || '',
    code: extractField(trimmed, 'code') || '',
  };
}

/**
 * Payment-request card shown in chat. `paid` flips it to the settled state.
 * `actionable` shows the Pay button (client side); admin sees a passive card.
 */
export default function PaymentCard({ data, paid, actionable }: { data: ParsedPayment; paid?: boolean; actionable?: boolean }) {
  return (
    <div className="w-72 border rounded-2xl overflow-hidden mb-1 shadow-sm" style={{ borderColor: 'var(--p-outline-variant)' }}>
      <div
        className="px-4 py-4 flex items-center gap-3"
        style={paid
          ? { background: 'var(--p-secondary-container)' }
          : { background: 'linear-gradient(135deg, var(--p-primary), var(--p-tertiary))' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: paid ? 'var(--p-surface-container-lowest)' : 'rgba(255,255,255,0.2)' }}
        >
          <Sym name={paid ? 'task_alt' : 'payments'} className="text-[22px]" style={{ color: paid ? 'var(--p-primary)' : '#fff' }} />
        </div>
        <div className="min-w-0">
          <p
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: paid ? 'var(--p-on-secondary-container)' : 'rgba(255,255,255,0.85)' }}
          >
            {paid ? 'Payment received' : 'Payment requested'}
          </p>
          <p className="font-display text-[22px] leading-tight" style={{ color: paid ? 'var(--p-on-secondary-container)' : '#fff' }}>{data.amount}</p>
        </div>
      </div>
      <div className="px-4 py-3.5" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <p className="text-[13px] mb-3 break-words" style={{ color: 'var(--p-on-surface)' }}>{data.title}</p>
        {paid ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--p-primary)' }}>
            <Sym name="check_circle" className="text-[16px]" /> Paid
          </span>
        ) : actionable ? (
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white shadow-sm hover:brightness-110 transition-all"
            style={{ background: 'var(--p-primary)' }}
          >
            <Sym name="lock" className="text-[15px]" /> Pay securely
          </a>
        ) : (
          <div className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg" style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}>
            <Sym name="hourglass_top" className="text-[15px]" /> Awaiting client payment
            {data.url ? (
              <a href={data.url} target="_blank" rel="noreferrer" className="ml-auto font-semibold underline" style={{ color: 'var(--p-primary)' }}>Open link</a>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact payment line for thread lists. */
export function PaymentThreadPreview({ body }: { body?: string }) {
  const pay = parsePaymentCard(body);
  if (!pay) {
    return <span>{formatMessagePreview(body)}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <Sym name="payments" className="text-[14px]" style={{ color: 'var(--p-primary)' }} />
      <span>Payment requested — <strong>{pay.amount}</strong></span>
      {pay.title !== 'Payment' ? <span style={{ color: 'var(--p-on-surface-variant)' }}>· {pay.title}</span> : null}
    </span>
  );
}
