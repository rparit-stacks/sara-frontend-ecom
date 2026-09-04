import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import QuotePrintPreview from '@/components/quote/QuotePrintPreview';
import { exportQuotePdf } from '@/components/quote/exportQuotePdf';
import { businessConfigToProfile, normalizeQuoteDoc, type QuoteDoc } from '@/components/quote/quoteDoc';
import { businessConfigApi, clientProjectApi, projectApi, type ManufacturingQuoteDto } from '@/lib/api';
import { Sym } from '@/components/portal/Sym';

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [doc, setDoc] = useState<QuoteDoc | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [scale, setScale] = useState(1);

  // The quote page is a fixed 794px-wide A4 design (built for PDF export) — on
  // narrow screens (phones) it must shrink to fit, otherwise it overflows or
  // gets clipped. Scale it down to the available width; never scale up past 1.
  useLayoutEffect(() => {
    if (!open) return;
    const el = scrollAreaRef.current;
    if (!el) return;
    const PAGE_WIDTH = 794;
    const compute = () => {
      const available = el.clientWidth - 32; // matches the px-4 padding on both sides
      setScale(available > 0 && available < PAGE_WIDTH ? available / PAGE_WIDTH : 1);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const { data: business } = useQuery({
    queryKey: ['business-config'],
    queryFn: () => businessConfigApi.getConfig(),
    enabled: open,
  });
  const profile = useMemo(() => businessConfigToProfile(business), [business]);

  const { data: quote, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['quote-view', mode, projectCode, quoteId],
    queryFn: () => {
      if (fetchQuote) return fetchQuote();
      if (!quoteId) throw new Error('No quote');
      return mode === 'client'
        ? clientProjectApi.getQuote(projectCode, quoteId)
        : projectApi.getQuote(projectCode, quoteId);
    },
    enabled: open && !!quoteId,
    retry: false,
  });

  useEffect(() => {
    if (!quote) return;
    setDoc(normalizeQuoteDoc(quote.doc, profile ?? null));
    setReference(quote.reference);
    setCurrency(quote.currency || 'INR');
  }, [quote, profile]);

  if (!open || !quoteId) return null;

  const download = async () => {
    if (!doc) return;
    setExporting(true);
    try {
      const pdf = await exportQuotePdf(doc, doc.accent || '#00676a', currency, reference);
      if (!pdf) { toast.error('Nothing to export'); return; }
      pdf.save(`${reference || 'quotation'}.pdf`);
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
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto py-8 px-4 flex justify-center" style={{ background: '#e5e7eb' }}>
        {isError ? (
          <div className="flex flex-col items-center gap-3 text-center max-w-xs mt-16">
            <Sym name="receipt_long" className="text-[40px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            <p className="font-semibold text-[15px]" style={{ color: 'var(--p-on-surface)' }}>This quotation could not be found</p>
            <p className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>
              {(error as Error)?.message || 'It may have been removed or the link is out of date.'}
            </p>
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => void refetch()} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface)' }}>Retry</button>
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: 'var(--p-primary)' }}>Close</button>
            </div>
          </div>
        ) : isLoading || !doc ? (
          <Sym name="progress_activity" className="text-[32px] animate-spin" style={{ color: 'var(--p-primary)' }} />
        ) : (
          <div style={{ width: 794 * scale }}>
            {/* The scale transform lives one level above canvasRef, so html2canvas
                captures canvasRef's own untransformed pixel size — the exported
                PDF always renders at full native resolution regardless of the
                on-screen zoom level applied here for narrow viewports. */}
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <div ref={canvasRef} className="flex flex-col gap-8 items-center">
                <QuotePrintPreview doc={doc} accent={doc.accent || '#00676a'} currency={currency} reference={reference} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
