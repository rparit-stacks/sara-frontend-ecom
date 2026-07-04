import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import QuotePreview from '@/components/quote/QuotePreview';
import { businessConfigToProfile, normalizeQuoteDoc, type QuoteDoc } from '@/components/quote/quoteDoc';
import { businessConfigApi, clientProjectApi, projectApi, type ManufacturingQuoteDto } from '@/lib/api';
import { Sym } from '@/components/portal/Sym';

async function buildPdfFromCanvas(root: HTMLElement | null, filename: string) {
  if (!root) return;
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('.quote-page'));
  if (!nodes.length) return;
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  for (let i = 0; i < nodes.length; i++) {
    const canvas = await html2canvas(nodes[i], {
      scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
      ignoreElements: (el) => (el as HTMLElement).classList?.contains('no-print'),
    });
    const img = canvas.toDataURL('image/jpeg', 0.96);
    let w = pw; let h = (canvas.height * pw) / canvas.width;
    if (h > ph) { h = ph; w = (canvas.width * ph) / canvas.height; }
    if (i > 0) pdf.addPage();
    pdf.addImage(img, 'JPEG', (pw - w) / 2, 0, w, h);
  }
  pdf.save(filename);
}

export default function QuoteViewerModal({
  open,
  onClose,
  mode,
  projectCode,
  quoteId,
  fetchQuote,
}: {
  open: boolean;
  onClose: () => void;
  mode: 'admin' | 'client';
  projectCode: string;
  quoteId: number | null;
  fetchQuote?: () => Promise<ManufacturingQuoteDto>;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [doc, setDoc] = useState<QuoteDoc | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [currency, setCurrency] = useState('INR');

  const { data: business } = useQuery({
    queryKey: ['business-config'],
    queryFn: () => businessConfigApi.getConfig(),
    enabled: open,
  });
  const profile = useMemo(() => businessConfigToProfile(business), [business]);

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote-view', mode, projectCode, quoteId],
    queryFn: () => {
      if (fetchQuote) return fetchQuote();
      if (!quoteId) throw new Error('No quote');
      return mode === 'client'
        ? clientProjectApi.getQuote(projectCode, quoteId)
        : projectApi.getQuote(projectCode, quoteId);
    },
    enabled: open && !!quoteId,
  });

  useEffect(() => {
    if (!quote) return;
    setDoc(normalizeQuoteDoc(quote.doc, profile ?? null));
    setReference(quote.reference);
    setCurrency(quote.currency || 'INR');
  }, [quote, profile]);

  if (!open || !quoteId) return null;

  const download = async () => {
    setExporting(true);
    try {
      await buildPdfFromCanvas(canvasRef.current, `${reference || 'quotation'}.pdf`);
    } catch (e) {
      toast.error((e as Error).message || 'PDF export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <header className="no-print h-14 px-4 flex items-center justify-between shrink-0 text-white" style={{ background: 'var(--p-primary)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <Sym name="request_quote" />
          <span className="font-semibold truncate">{reference || 'Quotation'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void download()} disabled={exporting || !doc} className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-white/15 hover:bg-white/25 disabled:opacity-50 flex items-center gap-1.5">
            <Sym name="download" className="text-[16px]" /> {exporting ? 'Exporting…' : 'Download PDF'}
          </button>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/15"><Sym name="close" /></button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto py-8 px-4 flex justify-center" style={{ background: '#e5e7eb' }}>
        {isLoading || !doc ? (
          <Sym name="progress_activity" className="text-[32px] animate-spin" style={{ color: 'var(--p-primary)' }} />
        ) : (
          <div ref={canvasRef} className="flex flex-col gap-8 items-center">
            <QuotePreview doc={doc} accent={doc.accent || '#924623'} currency={currency} reference={reference} />
          </div>
        )}
      </div>
    </div>
  );
}
