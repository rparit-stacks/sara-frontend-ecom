import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { Sym } from '@/components/portal/Sym';
import InvoiceDocument from '@/components/quote/InvoiceDocument';
import type { ManufacturingInvoiceDto } from '@/lib/api';

export default function InvoiceViewerModal({
  invoice,
  onClose,
}: {
  invoice: ManufacturingInvoiceDto;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      const nodes = canvasRef.current
        ? Array.from(canvasRef.current.querySelectorAll<HTMLElement>('.quote-page'))
        : [];
      if (!nodes.length) throw new Error('Invoice document is not available');

      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      for (let i = 0; i < nodes.length; i++) {
        const canvas = await html2canvas(nodes[i], {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
        });
        const image = canvas.toDataURL('image/jpeg', 0.96);
        let width = pageWidth;
        let height = (canvas.height * pageWidth) / canvas.width;
        if (height > pageHeight) {
          height = pageHeight;
          width = (canvas.width * pageHeight) / canvas.height;
        }
        if (i > 0) pdf.addPage();
        pdf.addImage(image, 'JPEG', (pageWidth - width) / 2, 0, width, height);
      }
      pdf.save(`${invoice.reference}.pdf`);
    } catch (error) {
      toast.error((error as Error).message || 'PDF download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex flex-col" onClick={onClose}>
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="font-semibold text-[14px]">{invoice.reference}</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={download}
            disabled={downloading}
            className="h-9 px-3 rounded-lg text-[13px] font-semibold border border-gray-200 disabled:opacity-50"
          >
            {downloading ? 'Rendering…' : 'Download PDF'}
          </button>
          <button type="button" onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-gray-100" aria-label="Close">
            <Sym name="close" />
          </button>
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
