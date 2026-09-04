import { useState } from 'react';
import { toast } from 'sonner';
import QuotePrintPreview from './QuotePrintPreview';
import { exportQuotePdf } from './exportQuotePdf';
import type { QuoteDoc } from './quoteDoc';
import { Sym } from '@/components/portal/Sym';

/**
 * "Preview PDF" from inside the builder — shows exactly what Download/Send
 * will produce (the paginated QuotePrintPreview, not the editable authoring
 * view), working off the CURRENT in-memory doc so unsaved edits are reflected
 * too. Distinct from QuoteViewerModal, which views an already-persisted quote
 * from outside the builder (project panel, client portal) by id/reference.
 */
export default function QuotePdfPreviewModal({
  open, onClose, doc, accent, currency, reference,
}: {
  open: boolean;
  onClose: () => void;
  doc: QuoteDoc;
  accent: string;
  currency: string;
  reference: string | null;
}) {
  const [exporting, setExporting] = useState(false);

  if (!open) return null;

  const download = async () => {
    setExporting(true);
    try {
      const pdf = await exportQuotePdf(doc, accent, currency, reference);
      if (!pdf) { toast.error('Nothing to export'); return; }
      pdf.save(`${reference || doc.meta.quoteTitle || 'quotation'}.pdf`);
    } catch (e) {
      toast.error((e as Error).message || 'PDF export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <header className="h-14 px-4 flex items-center justify-between shrink-0 text-white" style={{ background: accent }}>
        <div className="flex items-center gap-2 min-w-0">
          <Sym name="picture_as_pdf" />
          <span className="font-semibold truncate">Preview · {reference || doc.meta.quoteTitle || 'Quotation'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void download()} disabled={exporting} className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-white/15 hover:bg-white/25 disabled:opacity-50 flex items-center gap-1.5">
            <Sym name="download" className="text-[16px]" /> {exporting ? 'Exporting…' : 'Download PDF'}
          </button>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/15"><Sym name="close" /></button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto py-8 px-4 flex flex-col items-center gap-8" style={{ background: '#e5e7eb' }}>
        <QuotePrintPreview doc={doc} accent={accent} currency={currency} reference={reference} />
      </div>
    </div>
  );
}
