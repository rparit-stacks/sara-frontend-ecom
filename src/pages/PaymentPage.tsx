import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { paymentApi, paymentLinkApi, mediaApi, type ResolvedPayTarget, type ManufacturingInvoiceDto } from '@/lib/api';
import InvoiceDocument from '@/components/quote/InvoiceDocument';

const ACCENT = '#00676a';
const ACCENT_DARK = '#6f351a';
const SYMBOL: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

declare global { interface Window { Razorpay?: any } }

const money = (n: number, cur = 'INR') =>
  `${SYMBOL[cur] ?? ''}${(isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type Phase = 'form' | 'processing' | 'success' | 'failed';

export default function PaymentPage() {
  const { code: codeParam } = useParams();
  const [params] = useSearchParams();
  // CLIENT-mode links (no quote attached) are built as /pay?code=xxx (query
  // string) while invoice/quote links use /pay/xxx (path param) — accept both.
  const code = codeParam || params.get('code') || undefined;
  const quote = params.get('quote') || undefined;

  const { data: target, isLoading, error, refetch } = useQuery({
    queryKey: ['pay-resolve', code, quote],
    queryFn: () => paymentLinkApi.resolve({ code, quote }),
    retry: 1,
  });

  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [failMsg, setFailMsg] = useState('');
  const [txnId, setTxnId] = useState('');
  // Off-screen invoice used to re-render a PAID-stamped PDF right after payment.
  const [pdfInvoice, setPdfInvoice] = useState<ManufacturingInvoiceDto | null>(null);
  const pdfRenderRef = useRef<HTMLDivElement>(null);

  /**
   * After a successful payment, re-render the invoice document (now PAID, with
   * a paid-on date) and upload it so the payment-received email/WhatsApp — and
   * the invoice's saved pdfUrl — carry the updated PDF, not the old pending one.
   * Best-effort: a failure here doesn't affect the payment itself, which has
   * already gone through.
   */
  const regenerateAndUploadPaidPdf = async (linkCode: string, paymentId: string) => {
    try {
      const invoice = await paymentLinkApi.getPaidInvoice(linkCode);
      setPdfInvoice(invoice);
      await new Promise((r) => setTimeout(r, 450)); // let it mount + images load
      const root = pdfRenderRef.current;
      const nodes = root ? Array.from(root.querySelectorAll<HTMLElement>('.quote-page')) : [];
      if (!nodes.length) return;
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
      for (let i = 0; i < nodes.length; i++) {
        const canvas = await html2canvas(nodes[i], { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
        const img = canvas.toDataURL('image/jpeg', 0.96);
        let w = pw, h = (canvas.height * pw) / canvas.width;
        if (h > ph) { h = ph; w = (canvas.width * ph) / canvas.height; }
        if (i > 0) pdf.addPage();
        pdf.addImage(img, 'JPEG', (pw - w) / 2, 0, w, h);
      }
      const blob = pdf.output('blob');
      const file = new File([blob], `${invoice.reference}-paid.pdf`, { type: 'application/pdf' });
      const url = await mediaApi.upload(file, 'invoices');
      await paymentLinkApi.savePaidPdf(linkCode, url);
    } catch (e) {
      console.error('Paid-PDF regeneration failed:', e);
    } finally {
      setPdfInvoice(null);
    }
  };

  useEffect(() => {
    if (!target) return;
    if (target.amount != null && amount === '') setAmount(String(target.amount));
    if (target.clientName && name === '') setName(target.clientName);
    if (target.clientEmail && email === '') setEmail(target.clientEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const currency = target?.currency || 'INR';
  const amountEditable = target?.amountEditable ?? (target?.mode === 'OPEN');
  const clientLocked = target?.mode === 'CLIENT' && !!target?.clientEmail;
  const numericAmount = useMemo(() => parseFloat(amount) || 0, [amount]);

  const { data: methods } = useQuery({
    queryKey: ['pay-methods', currency],
    queryFn: () => paymentApi.getMethods('India', currency),
    enabled: !!target,
  });
  const gateways: string[] = methods?.gateways?.filter((g) => g === 'RAZORPAY' || g === 'STRIPE') ?? [];

  const pay = async () => {
    if (numericAmount <= 0) { toast.error('Enter an amount to pay'); return; }
    if (!email) { toast.error('Enter your email for the receipt'); return; }
    const gateway = gateways.includes('RAZORPAY') ? 'RAZORPAY' : gateways[0];
    if (!gateway) { toast.error('No payment method available'); return; }

    setPhase('processing');
    try {
      const order = await paymentLinkApi.createOrder({
        code, quote, amount: numericAmount, currency, gateway,
        payerName: name, payerEmail: email, payerPhone: phone,
      });

      if (gateway !== 'RAZORPAY') { setPhase('failed'); setFailMsg('This gateway is not supported yet.'); return; }

      const ok = await loadRazorpay();
      if (!ok) { setPhase('failed'); setFailMsg('Could not load the payment gateway. Check your connection.'); return; }

      const od = order.orderData as Record<string, any>;
      const rzp = new window.Razorpay({
        key: od.key_id,
        amount: od.amount,
        currency: od.currency,
        name: 'Studio Sara',
        description: target?.title || 'Payment',
        order_id: od.order_id,
        prefill: { name, email, contact: phone },
        theme: { color: ACCENT },
        handler: async (resp: any) => {
          try {
            const v = await paymentLinkApi.verify({
              paymentId: resp.razorpay_payment_id,
              orderId: od.order_id,
              gateway: 'RAZORPAY',
              verificationData: {
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_signature: resp.razorpay_signature,
              },
            });
            if (v.status === 'SUCCESS') {
              setTxnId(resp.razorpay_payment_id);
              setPhase('success');
              if (code) regenerateAndUploadPaidPdf(code, resp.razorpay_payment_id);
            } else { setFailMsg(v.message || 'We could not verify your payment.'); setPhase('failed'); }
          } catch (e) { setFailMsg((e as Error).message || 'Verification failed.'); setPhase('failed'); }
        },
        modal: { ondismiss: () => { setPhase('form'); toast.info('Payment cancelled'); } },
      });
      rzp.on('payment.failed', (r: any) => { setFailMsg(r.error?.description || 'Your payment could not be completed.'); setPhase('failed'); });
      rzp.open();
    } catch (e) {
      setFailMsg((e as Error).message || 'Could not start the payment.');
      setPhase('failed');
    }
  };

  return (
    <div className="relative min-h-screen py-8 px-4 overflow-hidden" style={{ background: 'linear-gradient(160deg,#f7f2e9 0%,#f0e7d7 100%)' }}>
      <style>{`@keyframes pp-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes pp-spin{to{transform:rotate(360deg)}}
        @keyframes pp-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .pp-fade{animation:pp-fade .4s ease both}`}</style>

      {/* abstract background — same watercolor/floral art as the quotation PDF */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{ backgroundImage: 'url(/bg_images/watercolor-wallpaper-with-hand-drawn-elements.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
      />

      {/* Brand header */}
      <div className="max-w-4xl mx-auto text-center mb-6 pp-fade">
        <div className="inline-flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 rounded-full" style={{ background: ACCENT, boxShadow: `0 0 0 4px ${ACCENT}22` }} />
          <span className="text-[26px] font-semibold tracking-wide" style={{ color: '#2b2620', fontFamily: 'Georgia, "Times New Roman", serif' }}>Studio Sara</span>
        </div>
        <p className="text-[11px] tracking-[3px] uppercase mt-1" style={{ color: '#8a7f6d' }}>Secure Payment Portal</p>
      </div>

      {isLoading ? (
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-[#e6ddcd] p-12 text-center pp-fade">
          <div className="w-10 h-10 mx-auto rounded-full border-[3px] border-[#e6ddcd]" style={{ borderTopColor: ACCENT, animation: 'pp-spin .8s linear infinite' }} />
          <p className="text-[13px] text-[#8a7f6d] mt-4">Loading payment details…</p>
        </div>
      ) : error ? (
        <ErrorCard message={(error as Error).message || 'This payment link is invalid or inactive.'} onRetry={() => refetch()} contact={undefined} />
      ) : target?.alreadyPaid ? (
        <AlreadyPaidCard target={target} />
      ) : phase === 'success' ? (
        <SuccessCard amount={numericAmount} currency={currency} txnId={txnId} email={email} target={target!} />
      ) : phase === 'failed' ? (
        <FailedCard message={failMsg} onRetry={() => setPhase('form')} contact={target?.contact} />
      ) : (
        <div className="max-w-4xl mx-auto grid md:grid-cols-[1.1fr_1fr] gap-5 items-start pp-fade">
          {/* LEFT — what you're paying for */}
          <DetailsPanel target={target!} currency={currency} />

          {/* RIGHT — pay box */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#e6ddcd] overflow-hidden md:sticky md:top-8">
            <div className="px-6 py-4 border-b border-[#efe8db]" style={{ background: `${ACCENT}0a` }}>
              <p className="font-semibold text-[15px] text-[#2b2620]">{target?.title || 'Make a payment'}</p>
              {target?.quoteReference && <p className="text-[12px] text-[#8a7f6d]">Ref: {target.quoteReference}</p>}
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#8a7f6d] mb-1">Amount to pay</label>
                {amountEditable ? (
                  <div className="flex items-center rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#00676a]/25 overflow-hidden">
                    <span className="px-3 text-gray-400 text-[18px]">{SYMBOL[currency] ?? ''}</span>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="flex-1 h-12 px-1 outline-none text-[18px] font-semibold" />
                  </div>
                ) : (
                  <div className="text-[30px] font-bold" style={{ color: ACCENT }}>{money(numericAmount, currency)}</div>
                )}
              </div>

              <Field label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
              <Field label="Email (for receipt)"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={clientLocked} className={`${inputCls} disabled:bg-gray-50`} /></Field>
              <Field label="Phone (optional)"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></Field>

              {gateways.length === 0 && <p className="text-[12px] text-red-500">No online payment method is enabled right now. Please contact us below.</p>}

              <button onClick={pay} disabled={gateways.length === 0} className="w-full h-13 py-3.5 rounded-xl text-white font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-[.99]" style={{ background: `linear-gradient(180deg,${ACCENT},${ACCENT_DARK})` }}>
                <i className="fa-solid fa-lock text-[13px]" /> Pay {numericAmount > 0 ? money(numericAmount, currency) : 'now'}
              </button>

              <TrustRow />
            </div>
          </div>
        </div>
      )}

      {/* Contact — always visible (except success has its own) */}
      {phase !== 'success' && target?.contact && <ContactSection contact={target.contact} />}

      <p className="text-center text-[11px] text-[#a99f8c] mt-8">© {new Date().getFullYear()} Studio Sara · All rights reserved</p>

      {phase === 'processing' && <ProcessingOverlay />}

      {/* Off-screen invoice render used to capture the post-payment PAID PDF */}
      {pdfInvoice && (
        <div style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }} aria-hidden>
          <div ref={pdfRenderRef}><InvoiceDocument invoice={pdfInvoice} txnId={txnId} /></div>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full h-11 px-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#00676a]/25';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#8a7f6d] mb-1">{label}</label>
      {children}
    </div>
  );
}

function TrustRow() {
  const items = [['fa-shield-halved', 'Secure Payment'], ['fa-lock', 'SSL Protected'], ['fa-circle-check', '100% Safe']];
  return (
    <div className="flex items-center justify-center gap-4 pt-1">
      {items.map(([icon, label]) => (
        <span key={label} className="flex items-center gap-1.5 text-[11px] text-[#8a7f6d]">
          <i className={`fa-solid ${icon}`} style={{ color: ACCENT }} /> {label}
        </span>
      ))}
    </div>
  );
}

function DetailsPanel({ target, currency }: { target: ResolvedPayTarget; currency: string }) {
  const hasQuote = !!target.quoteReference;
  const items = target.items ?? [];
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-[#e6ddcd] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#efe8db]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a7f6d]">Payment summary</p>
        {hasQuote ? (
          <p className="font-semibold text-[16px] text-[#2b2620] mt-0.5">Quotation {target.quoteReference}</p>
        ) : (
          target.title && <p className="font-semibold text-[16px] text-[#2b2620] mt-0.5">{target.title}</p>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Bill to */}
        {(target.clientName || target.clientEmail) && (
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a99f8c] mb-1">Billed to</p>
              <p className="font-semibold text-[#2b2620]">{target.clientName || '—'}</p>
              {target.clientEmail && <p className="text-[#6b6357]">{target.clientEmail}</p>}
              {target.clientAddress && <p className="text-[#6b6357]">{target.clientAddress}</p>}
            </div>
            {(target.companyName || target.date) && (
              <div className="text-right">
                {target.companyName && <><p className="text-[10px] font-bold uppercase tracking-wide text-[#a99f8c] mb-1">From</p><p className="font-semibold text-[#2b2620]">{target.companyName}</p></>}
                {target.date && <p className="text-[#6b6357] mt-1">Date: {target.date}</p>}
                {!!target.validityDays && <p className="text-[#6b6357]">Valid {target.validityDays} days</p>}
              </div>
            )}
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-[#a99f8c]">
                  <th className="text-left font-bold pb-2">Item</th>
                  <th className="text-right font-bold pb-2 w-12">Qty</th>
                  <th className="text-right font-bold pb-2 w-24">Rate</th>
                  <th className="text-right font-bold pb-2 w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-t border-[#f0e9dc]">
                    <td className="py-2 text-[#2b2620]">{it.description}</td>
                    <td className="py-2 text-right text-[#6b6357]">{it.qty}</td>
                    <td className="py-2 text-right text-[#6b6357]">{money(it.rate, currency)}</td>
                    <td className="py-2 text-right font-medium text-[#2b2620]">{money(it.amount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals — always show the amount being requested (quote breakdown when present) */}
        {(hasQuote || target.amount != null) && (
          <div className="space-y-1.5 text-[13px] border-t border-[#f0e9dc] pt-4">
            {hasQuote && target.subtotal != null && <Row label="Subtotal" value={money(target.subtotal, currency)} />}
            {hasQuote && !!target.discount && <Row label="Discount" value={`− ${money(target.discount, currency)}`} />}
            {hasQuote && !!target.gstPercent && <Row label={`GST (${target.gstPercent}%)`} value={money(target.gstAmount || 0, currency)} />}
            <div className="flex items-center justify-between pt-2 border-t-2 mt-1" style={{ borderColor: ACCENT }}>
              <span className="font-bold text-[15px]">Amount to pay</span>
              <span className="font-bold text-[20px]" style={{ color: ACCENT }}>{money(target.amount || 0, currency)}</span>
            </div>
          </div>
        )}

        {target.note && (
          <div className="rounded-xl p-3 text-[12px] text-[#6b6357]" style={{ background: `${ACCENT}08` }}>
            <span className="font-semibold">Note: </span>{target.note}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between text-[#6b6357]"><span>{label}</span><span className="font-medium text-[#2b2620]">{value}</span></div>;
}

function ContactSection({ contact }: { contact: NonNullable<ResolvedPayTarget['contact']> }) {
  const rows = [
    contact.email && ['fa-envelope', 'Email', contact.email, `mailto:${contact.email}`],
    contact.phone && ['fa-phone', 'Phone', contact.phone, `tel:${contact.phone}`],
    contact.phone && ['fa-whatsapp', 'WhatsApp', contact.phone, `https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`],
    contact.address && ['fa-location-dot', 'Address', contact.address, ''],
  ].filter(Boolean) as [string, string, string, string][];
  if (!rows.length) return null;
  return (
    <div className="max-w-4xl mx-auto mt-5 bg-white/70 backdrop-blur rounded-2xl border border-[#e6ddcd] p-5 pp-fade">
      <p className="text-center text-[13px] font-semibold text-[#2b2620] mb-3"><i className="fa-solid fa-headset mr-1.5" style={{ color: ACCENT }} /> Need help? Contact Studio Sara</p>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {rows.map(([icon, label, val, href]) => (
          href
            ? <a key={label} href={href} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] text-[#6b6357] hover:text-[#00676a]"><i className={`fa-${icon.startsWith('fa-whatsapp') ? 'brands' : 'solid'} ${icon}`} style={{ color: ACCENT }} /> {val}</a>
            : <span key={label} className="flex items-center gap-1.5 text-[12px] text-[#6b6357]"><i className={`fa-solid ${icon}`} style={{ color: ACCENT }} /> {val}</span>
        ))}
      </div>
    </div>
  );
}

function ProcessingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#e6ddcd]" style={{ borderTopColor: ACCENT, animation: 'pp-spin .8s linear infinite' }} />
        <p className="text-[14px] font-semibold text-[#2b2620] mt-4">Opening secure checkout…</p>
        <p className="text-[12px] text-[#8a7f6d] mt-1">Please don't close this window.</p>
      </div>
    </div>
  );
}

function SuccessCard({ amount, currency, txnId, email, target }: { amount: number; currency: string; txnId: string; email: string; target: ResolvedPayTarget }) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-[#e6ddcd] overflow-hidden pp-fade">
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: '#e7f3e7', animation: 'pp-pop .5s ease both' }}>
          <i className="fa-solid fa-check text-[30px]" style={{ color: '#2e7d32' }} />
        </div>
        <h2 className="text-[20px] font-bold text-[#2b2620] mt-4">Payment successful</h2>
        <p className="text-[13px] text-[#6b6357] mt-1">Thank you! Your payment has been received.</p>
        <div className="text-[34px] font-bold mt-4" style={{ color: ACCENT }}>{money(amount, currency)}</div>

        <div className="mt-5 rounded-xl p-4 text-left text-[13px] space-y-1.5" style={{ background: '#faf7f1' }}>
          {target.quoteReference && <Row label="Quotation" value={target.quoteReference} />}
          {txnId && <Row label="Transaction ID" value={txnId} />}
          <Row label="Paid via" value="Razorpay" />
          <Row label="Receipt sent to" value={email} />
        </div>
        <p className="text-[12px] text-[#8a7f6d] mt-4">A confirmation & invoice have been emailed to you.</p>
      </div>
      <div className="px-6 py-4 border-t border-[#efe8db] text-center">
        <TrustRow />
      </div>
    </div>
  );
}

function FailedCard({ message, onRetry, contact }: { message: string; onRetry: () => void; contact?: ResolvedPayTarget['contact'] }) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-[#e6ddcd] overflow-hidden pp-fade">
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: '#fdecea', animation: 'pp-pop .5s ease both' }}>
          <i className="fa-solid fa-xmark text-[30px]" style={{ color: '#c62828' }} />
        </div>
        <h2 className="text-[20px] font-bold text-[#2b2620] mt-4">Payment not completed</h2>
        <p className="text-[13px] text-[#6b6357] mt-1">{message || 'Something went wrong. No amount was charged.'}</p>
        <button onClick={onRetry} className="mt-6 w-full h-12 rounded-xl text-white font-semibold text-[15px] flex items-center justify-center gap-2" style={{ background: `linear-gradient(180deg,${ACCENT},${ACCENT_DARK})` }}>
          <i className="fa-solid fa-rotate-right text-[13px]" /> Retry payment
        </button>
        {contact?.email && <a href={`mailto:${contact.email}`} className="inline-block mt-3 text-[12px] text-[#8a7f6d] hover:text-[#00676a]">Still stuck? Contact support</a>}
      </div>
    </div>
  );
}

function AlreadyPaidCard({ target }: { target: ResolvedPayTarget }) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-[#e6ddcd] overflow-hidden pp-fade">
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: '#e7f3e7' }}>
          <i className="fa-solid fa-check text-[30px]" style={{ color: '#2e7d32' }} />
        </div>
        <h2 className="text-[20px] font-bold text-[#2b2620] mt-4">Already paid</h2>
        <p className="text-[13px] text-[#6b6357] mt-1">This invoice has already been paid — nothing more to do here.</p>
        {target.amount != null && (
          <div className="text-[34px] font-bold mt-4" style={{ color: ACCENT }}>{money(target.amount, target.currency || 'INR')}</div>
        )}
        <div className="mt-5 rounded-xl p-4 text-left text-[13px] space-y-1.5" style={{ background: '#faf7f1' }}>
          {target.invoiceReference && <Row label="Invoice" value={target.invoiceReference} />}
          {target.quoteReference && <Row label="Quotation" value={target.quoteReference} />}
          {target.transactionId && <Row label="Transaction ID" value={target.transactionId} />}
          {target.paidAt && <Row label="Paid on" value={new Date(target.paidAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />}
        </div>
        {target.pdfUrl && (
          <a href={target.pdfUrl} target="_blank" rel="noreferrer" className="inline-block mt-4 text-[13px] font-semibold" style={{ color: ACCENT }}>
            Download invoice
          </a>
        )}
      </div>
      <div className="px-6 py-4 border-t border-[#efe8db] text-center">
        <TrustRow />
      </div>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void; contact?: undefined }) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-[#e6ddcd] p-8 text-center pp-fade">
      <i className="fa-solid fa-circle-exclamation text-[34px]" style={{ color: ACCENT }} />
      <p className="text-[14px] text-[#2b2620] font-semibold mt-3">Couldn't load this payment</p>
      <p className="text-[13px] text-[#6b6357] mt-1">{message}</p>
      <button onClick={onRetry} className="mt-5 h-10 px-5 rounded-xl text-white font-semibold text-[13px]" style={{ background: ACCENT }}>Try again</button>
    </div>
  );
}
