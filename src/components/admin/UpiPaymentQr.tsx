import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Loader2 } from 'lucide-react';
import { PLATFORM_UPI_ID, formatInr } from '@/data/platformPayments';

const LOGO_SRC = '/brand/elyvatelabs-qr-logo.png';
const QR_SIZE = 280;
/** Center logo plate — keep ~18% of QR so scanners still read. */
const LOGO_BOX = 52;

function buildUpiUri(opts: { pa: string; pn: string; amount?: number; note?: string }) {
  const params = new URLSearchParams();
  params.set('pa', opts.pa);
  params.set('pn', opts.pn);
  params.set('cu', 'INR');
  if (opts.amount != null && opts.amount > 0) {
    params.set('am', opts.amount.toFixed(2));
  }
  if (opts.note) params.set('tn', opts.note.slice(0, 80));
  return `upi://pay?${params.toString()}`;
}

type Props = {
  /** If set, QR pre-fills this amount in UPI apps. */
  amount?: number;
  note?: string;
  payeeName?: string;
};

export function UpiPaymentQr({
  amount,
  note = 'Studio Sara platform payment',
  payeeName = 'Elyvate Labs',
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upiUri = useMemo(
    () =>
      buildUpiUri({
        pa: PLATFORM_UPI_ID,
        pn: payeeName,
        amount,
        note,
      }),
    [amount, note, payeeName],
  );

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    setError(null);

    (async () => {
      try {
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, upiUri, {
          width: QR_SIZE,
          margin: 2,
          errorCorrectionLevel: 'H', // needed for center logo
          color: { dark: '#0B1220', light: '#FFFFFF' },
        });

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No canvas context');

        const logo = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Logo failed to load'));
          img.src = LOGO_SRC;
        });

        const box = LOGO_BOX;
        const pad = 6;
        const x = (canvas.width - box) / 2;
        const y = (canvas.height - box) / 2;

        // White rounded plate behind logo so modules stay readable
        ctx.fillStyle = '#FFFFFF';
        const r = 10;
        const px = x - pad;
        const py = y - pad;
        const pw = box + pad * 2;
        const ph = box + pad * 2;
        ctx.beginPath();
        ctx.moveTo(px + r, py);
        ctx.arcTo(px + pw, py, px + pw, py + ph, r);
        ctx.arcTo(px + pw, py + ph, px, py + ph, r);
        ctx.arcTo(px, py + ph, px, py, r);
        ctx.arcTo(px, py, px + pw, py, r);
        ctx.closePath();
        ctx.fill();

        ctx.drawImage(logo, x, y, box, box);

        if (!cancelled) setDataUrl(canvas.toDataURL('image/png'));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'QR failed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [upiUri]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {error ? (
          <div className="w-[280px] h-[280px] flex items-center justify-center text-sm text-destructive text-center px-4">
            {error}
          </div>
        ) : dataUrl ? (
          <img
            src={dataUrl}
            alt={`UPI QR for ${PLATFORM_UPI_ID}`}
            width={QR_SIZE}
            height={QR_SIZE}
            className="block rounded-lg"
          />
        ) : (
          <div className="w-[280px] h-[280px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="text-center space-y-0.5">
        <p className="font-mono text-sm font-semibold">{PLATFORM_UPI_ID}</p>
        <p className="text-xs text-muted-foreground">
          {payeeName}
          {amount != null && amount > 0 ? ` · ${formatInr(amount)}` : ' · Scan to pay'}
        </p>
      </div>
    </div>
  );
}
