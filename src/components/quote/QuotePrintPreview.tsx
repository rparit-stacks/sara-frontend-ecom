import QuotePreview from './QuotePreview';
import type { QuoteDoc } from './quoteDoc';

/**
 * Read-only render used by PDF export and the "Preview" modal. It is the SAME
 * component as the live canvas (QuotePreview) with editing turned off, so the
 * PDF cannot drift from what the quote page shows.
 *
 * `onReady(pageCount)` fires once pagination finishes, so callers building a
 * PDF know when it's safe to start rasterizing `.quote-page` nodes.
 */
export default function QuotePrintPreview({
  doc, accent, currency, reference, onReady,
}: {
  doc: QuoteDoc;
  accent: string;
  currency: string;
  reference: string | null;
  onReady?: (pageCount: number) => void;
}) {
  return <QuotePreview doc={doc} accent={accent} currency={currency} reference={reference} readOnly onReady={onReady} />;
}
