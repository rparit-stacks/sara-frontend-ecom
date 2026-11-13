import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Sym } from '@/components/portal/Sym';
import InvoiceDocument from '@/components/quote/InvoiceDocument';
import { invoiceApi, mediaApi, type ManufacturingInvoiceDto } from '@/lib/api';

/**
 * The invoice as a full-screen viewer (mode "view"), or the same document rendered off-screen to do one job and
 * close: "download" saves the PDF to the device, "send" emails + WhatsApps the paid receipt to the customer.
 */
export type InvoiceMode = 'view' | 'download' | 'send';

export default function InvoiceViewModal({
  invoice,
  canUpdatePdf = false,
  mode = 'view',
  onClose,
  onSaved,
}: {
  invoice: ManufacturingInvoiceDto;
  canUpdatePdf?: boolean;
  mode?: InvoiceMode;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'' | 'download' | 'save'>('');

  const renderPdf = async (): Promise<Blob | null> => {
    const root = canvasRef.current;
    if (!root) return null;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('.quote-page'));
    if (!nodes.length) return null;
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    for (let i = 0; i < nodes.length; i++) {
      const canvas = await html2canvas(nodes[i], { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      const img = canvas.toDataURL('image/jpeg', 0.96);
      let w = pw, h = (canvas.height * pw) / canvas.width;
      if (h > ph) { h = ph; w = (canvas.width * ph) / canvas.height; }
      if (i > 0) pdf.addPage();
      pdf.addImage(img, 'JPEG', (pw - w) / 2, 0, w, h);
    }
    return pdf.output('blob');
  };

  const download = async (): Promise<boolean> => {
    setBusy('download');
    try {
      const blob = await renderPdf();
      if (!blob) { toast.error('Could not render the invoice'); return false; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${invoice.reference}.pdf`; a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (e) { toast.error((e as Error).message || 'PDF failed'); return false; }
    finally { setBusy(''); }
  };

  const generateAndSave = async () => {
    setBusy('save');
    try {
      const blob = await renderPdf();
      if (!blob) return;
      const file = new File([blob], `${invoice.reference}.pdf`, { type: 'application/pdf' });
      const url = await mediaApi.upload(file, 'invoices');
      await invoiceApi.savePdf(invoice.id, url);
      toast.success('Invoice PDF saved — clients will get the link in emails');
      onSaved?.();
    } catch (e) { toast.error((e as Error).message || 'Save failed'); }
    finally { setBusy(''); }
  };

  /** Render a fresh PAID PDF (unless one is already saved), then have the server send the receipt. */
  const sendToCustomer = async () => {
    const t = toast.loading('Sending invoice to the customer…');
    try {
      let pdfUrl = invoice.pdfUrl || undefined;
      if (!pdfUrl) {
        const blob = await renderPdf();
        if (blob) pdfUrl = await mediaApi.upload(new File([blob], `${invoice.reference}.pdf`, { type: 'application/pdf' }), 'invoices');
      }
      const res = await invoiceApi.sendReceipt(invoice.id, pdfUrl);
      const parts = [res.email ? 'email' : null, res.whatsapp ? 'WhatsApp' : null].filter(Boolean);
      if (parts.length) toast.success(`Invoice sent to the customer by ${parts.join(' and ')}`, { id: t });
      else toast.error('Nothing could be sent: the customer has no email on this invoice and no linked WhatsApp number', { id: t });
      onSaved?.();
    } catch (e) { toast.error((e as Error).message || 'Could not send', { id: t }); }
  };

  // Off-screen jobs: wait for the document to paint, do the one thing, close.
  useEffect(() => {
    if (mode === 'view') return;
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled) return;
      if (mode === 'download') await download(); else await sendToCustomer();
      if (!cancelled) onClose();
    }, 700);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (mode !== 'view') {
    return (
      <div aria-hidden style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}>
        <div ref={canvasRef}><InvoiceDocument invoice={invoice} /></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex flex-col" onClick={onClose}>
      <div className="border-b px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }} onClick={(e) => e.stopPropagation()}>
        <span className="font-semibold text-[14px]">{invoice.reference}</span>
        {invoice.pdfUrl && <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" className="text-[12px] font-semibold" style={{ color: 'var(--p-primary)' }}>Saved PDF ↗</a>}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => void download()} disabled={!!busy} className="h-9 px-3 rounded-lg text-[13px] font-semibold border disabled:opacity-50" style={{ borderColor: 'var(--p-outline-variant)' }}>{busy === 'download' ? 'Rendering…' : 'Download PDF'}</button>
          {canUpdatePdf && (
            <button onClick={generateAndSave} disabled={!!busy} className="h-9 px-3 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: 'var(--p-primary)' }}>{busy === 'save' ? 'Saving…' : 'Generate & save PDF'}</button>
          )}
          <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-black/[0.04]"><Sym name="close" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-8 flex justify-center" onClick={(e) => e.stopPropagation()}>
        <div ref={canvasRef}>
          <InvoiceDocument invoice={invoice} />
        </div>
      </div>
    </div>
  );
}
