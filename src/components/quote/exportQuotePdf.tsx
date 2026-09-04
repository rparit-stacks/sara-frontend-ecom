import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createRoot } from 'react-dom/client';
import QuotePrintPreview from './QuotePrintPreview';
import type { QuoteDoc } from './quoteDoc';

/**
 * Builds a jsPDF from a QuoteDoc by mounting QuotePrintPreview off-screen
 * (the same paginated, read-only render the "Preview PDF" modal shows),
 * waiting for pagination to finish, then rasterizing each already-A4-sized
 * `.quote-page` node 1:1 into its own PDF page.
 *
 * Replaces the old approach of rasterizing whatever authoring pages happened
 * to be visible in the split view and squeeze-fitting an overflowing capture
 * into one page — that's what caused a long quote's content to be crushed
 * into a single cramped page. Every `.quote-page` here is already guaranteed
 * to fit real A4 content height, because it went through useQuotePagination.
 */
export async function exportQuotePdf(
  doc: QuoteDoc, accent: string, currency: string, reference: string | null,
): Promise<jsPDF | null> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-99999px';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);
  const root = createRoot(container);

  try {
    const pageCount = await new Promise<number>((resolve) => {
      root.render(
        <QuotePrintPreview doc={doc} accent={accent} currency={currency} reference={reference} onReady={resolve} />,
      );
    });
    if (pageCount === 0) return null;

    // One more rAF so the just-rendered pages are fully painted (images, in
    // particular, can commit before they've actually decoded/laid out).
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const nodes = Array.from(container.querySelectorAll<HTMLElement>('.quote-page'));
    if (!nodes.length) return null;

    const pdf = new jsPDF('p', 'pt', 'a4');
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    for (let i = 0; i < nodes.length; i++) {
      const canvas = await html2canvas(nodes[i], {
        scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
        ignoreElements: (el) => (el as HTMLElement).classList?.contains('no-print'),
      });
      // No squeeze-to-fit needed — every node is already exactly PAGE_HEIGHT_PX
      // tall by construction, so this is a straight 1:1 scale to the PDF page.
      const img = canvas.toDataURL('image/jpeg', 0.96);
      if (i > 0) pdf.addPage();
      pdf.addImage(img, 'JPEG', 0, 0, pw, ph);
    }
    return pdf;
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
