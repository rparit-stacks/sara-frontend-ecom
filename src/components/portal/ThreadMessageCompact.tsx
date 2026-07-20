import { Sym } from './Sym';
import type { ProjectMessageDto } from '@/lib/api';
import { formatMessagePreview, getMessagePreviewKind, previewAccent, previewIcon } from '@/lib/messagePreview';
import { parsePaymentCard } from './PaymentCard';
import ProductCard, { parseProductCard, stripProductMarker } from './ProductCard';
import RichMessageBody from './RichMessageBody';

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i.test(url) || url.startsWith('data:image/');
}

function defaultFormatTime(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** Compact bubble for thread panel — no duplicate raw markers / code blocks in UI. */
export default function ThreadMessageCompact({
  message,
  variant = 'reply',
  formatTime = defaultFormatTime,
}: {
  message: Pick<ProjectMessageDto, 'body' | 'attachmentUrl' | 'authorName' | 'authorType' | 'createdAt' | 'announcementCategory'>;
  variant?: 'root' | 'reply';
  formatTime?: (iso?: string) => string;
}) {
  const isSystem = message.authorType === 'SYSTEM';
  const isAdmin = message.authorType === 'ADMIN';
  const att = message.attachmentUrl;
  const pay = parsePaymentCard(message.body);
  const product = parseProductCard(message.body);
  const textBody = stripProductMarker(message.body ?? '');

  return (
    <article
      className={`relative ${variant === 'root' ? 'rounded-xl border p-3' : 'rounded-xl px-3 py-2.5'}`}
      style={
        variant === 'root'
          ? { borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }
          : { background: 'var(--p-surface-container-low)', borderLeft: '3px solid var(--p-primary)' }
      }
    >
      <header className="flex items-center gap-2 mb-1.5 min-w-0">
        <span
          className={`text-[13px] font-bold truncate ${isSystem ? 'italic' : ''}`}
          style={isAdmin ? { color: 'var(--p-secondary)' } : isSystem ? { color: 'var(--p-on-surface-variant)' } : { color: 'var(--p-on-surface)' }}
        >
          {message.authorName || (isSystem ? 'System' : 'User')}
        </span>
        <span className="text-[11px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }}>
          {formatTime(message.createdAt)}
        </span>
      </header>

      {pay ? (
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
          <Sym name="payments" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Payment</p>
            <p className="text-[14px] font-bold">{pay.amount}</p>
          </div>
        </div>
      ) : product ? (
        <div className="max-w-[280px]">
          <ProductCard data={product} />
          {textBody && textBody !== '(attachment)' ? (
            <p className="text-[13px] mt-2 leading-relaxed break-words" style={{ color: 'var(--p-on-surface-variant)' }}>
              {formatMessagePreview(textBody)}
            </p>
          ) : null}
        </div>
      ) : textBody && textBody !== '(attachment)' ? (
        isSystem ? (
          <p className="text-[13px] leading-relaxed break-words whitespace-pre-wrap">{textBody}</p>
        ) : (
          <RichMessageBody text={textBody} className="text-[14px]" />
        )
      ) : null}

      {att && isImageUrl(att) ? (
        <div className="mt-2 w-24 h-24 rounded-lg border overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <img src={att} alt="" className="w-full h-full object-cover" />
        </div>
      ) : null}

      {att && !isImageUrl(att) ? (
        <a
          href={att}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-2 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border"
          style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-primary)' }}
        >
          <Sym name="attach_file" className="text-[16px]" />
          <span className="truncate max-w-[180px]">{att.split('/').pop()}</span>
        </a>
      ) : null}

      {!pay && !product && !textBody && !att ? (
        <p className="text-[13px] italic" style={{ color: 'var(--p-on-surface-variant)' }}>—</p>
      ) : null}
    </article>
  );
}

export function ThreadPreviewIcon({ body, attachmentUrl }: { body?: string | null; attachmentUrl?: string | null }) {
  const kind = getMessagePreviewKind(body, attachmentUrl);
  const accent = previewAccent(kind);
  return (
    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center" style={{ background: accent.bg }}>
      <Sym name={previewIcon(kind)} className="text-[20px]" style={{ color: accent.fg }} />
    </div>
  );
}
