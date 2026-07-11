import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { businessConfigApi, manufacturingApi, mediaApi } from '@/lib/api';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import {
  businessConfigToProfile,
  createBlock,
  defaultQuoteDoc,
  newId,
  normalizeQuoteDoc,
  appendQuoteRevision,
  type QuoteBlock,
  type QuoteBlockType,
  type QuoteCalc,
  type QuoteDoc,
} from '@/components/quote/quoteDoc';
import { computeTotals } from '@/components/quote/computeTotals';
import QuoteFormPanel from '@/components/quote/QuoteFormPanel';
import QuotePreview from '@/components/quote/QuotePreview';
import QuoteWizard from '@/components/quote/QuoteWizard';
import InquiryImport from '@/components/quote/InquiryImport';
import InquiryPicker from '@/components/quote/InquiryPicker';
import StageStepper from '@/components/manufacturing/StageStepper';

type ViewMode = 'wizard' | 'split';

const CURRENCIES: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

export default function PortalAdminQuoteBuilder() {
  const navigate = useNavigate();
  const { reference } = useParams();
  const [params] = useSearchParams();
  const isNew = !reference;

  const { data: business } = useQuery({
    queryKey: ['business-config'],
    queryFn: () => businessConfigApi.getConfig(),
  });
  const profile = useMemo(() => businessConfigToProfile(business), [business]);
  const { data: existing, isLoading } = useQuery({
    queryKey: ['quote', reference],
    queryFn: () => manufacturingApi.getQuoteByReference(reference as string),
    enabled: !isNew,
  });

  const inquiryParam = params.get('inquiry');
  const { data: linkedInquiry } = useQuery({
    queryKey: ['inquiry', inquiryParam],
    queryFn: () => manufacturingApi.getInquiry(Number(inquiryParam)),
    enabled: !!inquiryParam,
  });

  const [doc, setDoc] = useState<QuoteDoc | null>(null);
  const [quoteId, setQuoteId] = useState<number | null>(null);
  const [ref, setRef] = useState<string | null>(reference ?? null);
  const [status, setStatus] = useState<string>('DRAFT');
  const [currency, setCurrency] = useState('INR');
  const [inquiryId, setInquiryId] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  // New quotes start in the guided multi-step wizard; existing quotes (already
  // have content) open straight in split view for editing.
  const [view, setView] = useState<ViewMode>(isNew ? 'wizard' : 'split');
  // Block whose form should auto-open in the left panel (set by double-clicking
  // a section on the page). Cleared shortly after so it can re-trigger.
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [focusClientInfo, setFocusClientInfo] = useState(false);
  const seeded = useRef(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Seed a brand new document once the business config resolves.
  useEffect(() => {
    if (isNew && !seeded.current && business !== undefined) {
      seeded.current = true;
      const base = defaultQuoteDoc(profile ?? null);
      base.meta.clientName = params.get('clientName') || '';
      base.meta.clientEmail = params.get('clientEmail') || '';
      const inq = params.get('inquiry');
      if (inq) setInquiryId(Number(inq));
      const inqRef = params.get('inquiryRef');
      if (inqRef) base.meta.quoteTitle = `Quotation for ${inqRef}`;
      setDoc(base);
    }
  }, [isNew, business, profile, params]);

  // Load an existing quote.
  useEffect(() => {
    if (existing) {
      setDoc(normalizeQuoteDoc(existing.doc, profile ?? null));
      setQuoteId(existing.id);
      setRef(existing.reference);
      setStatus(existing.status);
      setCurrency(existing.currency || 'INR');
      setInquiryId(existing.inquiryId ?? null);
    }
  }, [existing, profile]);

  const update = (next: QuoteDoc) => { setDoc(next); setDirty(true); };

  const totals = useMemo(() => (doc ? computeTotals(doc) : null), [doc]);

  /* ---------- mutations on the doc ---------- */
  const patchMeta = (p: Partial<QuoteDoc['meta']>) => doc && update({ ...doc, meta: { ...doc.meta, ...p } });
  const patchBranding = (p: Partial<QuoteDoc['branding']>) => doc && update({ ...doc, branding: { ...doc.branding, ...p } });
  const patchCalc = (p: Partial<QuoteCalc>) => doc && update({ ...doc, calc: { gstPercent: 0, discount: 0, ...(doc.calc ?? {}), ...p } });
  const patchFooter = (text: string) => doc && update({ ...doc, footerText: text });
  const patchBlock = (pageId: string, blockId: string, p: Partial<QuoteBlock>) =>
    doc && update({
      ...doc,
      pages: doc.pages.map((pg) => pg.id !== pageId ? pg : { ...pg, blocks: pg.blocks.map((b) => (b.id === blockId ? ({ ...b, ...p } as QuoteBlock) : b)) }),
    });
  const addBlock = (pageId: string, type: QuoteBlockType) =>
    doc && update({ ...doc, pages: doc.pages.map((pg) => pg.id !== pageId ? pg : { ...pg, blocks: [...pg.blocks, createBlock(type)] }) });
  // Append a fully-formed block (used by the inquiry importer) to the first page.
  const addBlockFull = (block: QuoteBlock) =>
    doc && update({ ...doc, pages: doc.pages.map((pg, i) => i !== 0 ? pg : { ...pg, blocks: [...pg.blocks, block] }) });
  const removeBlock = (pageId: string, blockId: string) =>
    doc && update({ ...doc, pages: doc.pages.map((pg) => pg.id !== pageId ? pg : { ...pg, blocks: pg.blocks.filter((b) => b.id !== blockId) }) });
  const toggleBlock = (pageId: string, blockId: string) => {
    if (!doc) return;
    const b = doc.pages.find((p) => p.id === pageId)?.blocks.find((x) => x.id === blockId);
    if (b) patchBlock(pageId, blockId, { hidden: !b.hidden });
  };
  const reorderBlocks = (pageId: string, from: number, to: number) => {
    if (!doc) return;
    update({
      ...doc,
      pages: doc.pages.map((pg) => {
        if (pg.id !== pageId) return pg;
        const blocks = [...pg.blocks];
        const [m] = blocks.splice(from, 1); blocks.splice(to, 0, m);
        return { ...pg, blocks };
      }),
    });
  };
  // Standalone quote: admin picks an inquiry to pull data from. Re-open the
  // builder with ?inquiry so the existing fetch + import flow takes over.
  const pickInquiry = (pickedId: number) => {
    setInquiryId(pickedId);
    const sp = new URLSearchParams(params);
    sp.set('inquiry', String(pickedId));
    navigate({ search: sp.toString() }, { replace: true });
  };

  // Double-click a section on the page → jump to split view and open its form.
  const editBlock = (_pageId: string, blockId: string) => {
    setView('split');
    setFocusBlockId(blockId);
    window.setTimeout(() => setFocusBlockId(null), 1200);
  };
  const addPage = () => doc && update({ ...doc, pages: [...doc.pages, { id: newId('p'), blocks: [createBlock('text')] }] });
  const removePage = (pageId: string) => doc && doc.pages.length > 1 && update({ ...doc, pages: doc.pages.filter((p) => p.id !== pageId) });

  /* ---------- save ---------- */
  // Save only ever persists — it never emails or WhatsApps the client (that's
  // exclusively sendToClient's job). Used for both the manual Save button and
  // the debounced auto-save below (silent: true suppresses the success toast).
  const save = async (nextStatus?: string, opts?: { silent?: boolean }) => {
    if (!doc) return;
    if (!doc.meta.quoteTitle?.trim()) {
      if (!opts?.silent) toast.error('Add a quote title before saving');
      return;
    }
    setSaving(true);
    try {
      const total = computeTotals(doc).grandTotal;
      const st = nextStatus || status;
      const docToSave = quoteId ? appendQuoteRevision(doc, total, st) : doc;
      if (quoteId) setDoc(docToSave);
      const payload = {
        inquiryId: inquiryId ?? undefined,
        title: docToSave.meta.quoteTitle || 'Quotation',
        clientName: docToSave.meta.clientName || undefined,
        clientEmail: docToSave.meta.clientEmail || undefined,
        clientPhone: docToSave.meta.clientPhone || undefined,
        currency,
        total,
        status: st,
        doc: docToSave as unknown as Record<string, unknown>,
      };
      const saved = quoteId
        ? await manufacturingApi.updateQuote(quoteId, payload)
        : await manufacturingApi.createQuote(payload);
      setQuoteId(saved.id);
      setRef(saved.reference);
      setStatus(saved.status);
      setDirty(false);
      if (nextStatus) setStatus(nextStatus);
      if (!opts?.silent) toast.success(quoteId ? 'Quote saved' : `Quote created · ${saved.reference}`);
      if (!quoteId) navigate(`/portal-admin/quote-editor/${saved.reference}`, { replace: true });
    } catch (e) {
      if (!opts?.silent) toast.error((e as Error).message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save: after a pause in editing, silently persist an already-created
  // quote (never a still-untitled brand-new one — nothing meaningful to save
  // yet). Reuses save()'s title guard and silent mode, so it never toasts or
  // notifies the client, matching manual Save exactly.
  useEffect(() => {
    if (!dirty || !quoteId) return;
    const timer = window.setTimeout(() => {
      save(undefined, { silent: true });
    }, 2500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, dirty, quoteId]);

  // Save (creating if needed), then mark SENT + notify the client. Branches on
  // whichever of email/phone are actually on file — email if present, WhatsApp
  // if present, both if both. Blocks entirely (and surfaces the Client
  // Information form) only when neither is available.
  const sendToClient = async () => {
    if (!doc) return;
    if (!doc.meta.quoteTitle?.trim()) { toast.error('Add a quote title before sending'); return; }

    const hasEmail = !!doc.meta.clientEmail?.trim();
    const hasPhone = !!doc.meta.clientPhone?.trim();

    if (!hasEmail && !hasPhone) {
      toast.error('Add a client email or phone number before sending');
      setView('split');
      setFocusClientInfo(true);
      window.setTimeout(() => setFocusClientInfo(false), 1500);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        inquiryId: inquiryId ?? undefined,
        title: doc.meta.quoteTitle || 'Quotation',
        clientName: doc.meta.clientName || undefined,
        clientEmail: doc.meta.clientEmail || undefined,
        clientPhone: doc.meta.clientPhone || undefined,
        currency,
        total: computeTotals(doc).grandTotal,
        status: status,
        doc: doc as unknown as Record<string, unknown>,
      };
      const saved = quoteId
        ? await manufacturingApi.updateQuote(quoteId, payload)
        : await manufacturingApi.createQuote(payload);

      // Generate the quote PDF in the browser and attach it to the email.
      let pdfBase64: string | undefined;
      let pdfUrl: string | undefined;
      try {
        const pdf = await buildQuotePdf();
        if (pdf) {
          pdfBase64 = pdf.output('datauristring'); // "data:application/pdf;base64,...."
          // Also upload to Cloudinary for a public URL — needed so WhatsApp's
          // document-header template can attach the actual PDF (it fetches by
          // URL, not raw bytes like the email attachment).
          const blob = pdf.output('blob');
          const file = new File([blob], `${saved.reference || 'quotation'}.pdf`, { type: 'application/pdf' });
          pdfUrl = await mediaApi.upload(file, 'quotations');
          await manufacturingApi.updateQuote(saved.id, { pdfUrl });
        }
      } catch { /* send without attachment rather than fail */ }

      const sent = await manufacturingApi.sendQuote(saved.id, { pdfBase64 });
      setQuoteId(sent.id);
      setRef(sent.reference);
      setStatus(sent.status);
      setDirty(false);

      if (hasEmail && hasPhone) {
        toast.success(pdfBase64 ? `Quote + PDF sent to ${doc.meta.clientEmail}` : `Quote sent to ${doc.meta.clientEmail}`);
      } else if (hasEmail) {
        toast.success(`Quote emailed to ${doc.meta.clientEmail}`);
        toast('No phone on file — WhatsApp notification skipped.');
      } else {
        toast.success(`Quote sent via WhatsApp to ${doc.meta.clientPhone}`);
        toast('No email on file — email skipped.');
      }
      if (!quoteId) navigate(`/portal-admin/quote-editor/${sent.reference}`, { replace: true });
    } catch (e) {
      toast.error((e as Error).message || 'Failed to send');
    } finally {
      setSaving(false);
    }
  };

  // Save the current doc as a brand-new reusable template (does not touch this quote).
  const [savingTemplate, setSavingTemplate] = useState(false);
  const saveAsTemplate = async () => {
    if (!doc) return;
    setSavingTemplate(true);
    try {
      const payload = {
        title: `${doc.meta.quoteTitle || 'Quotation'} — Template`,
        currency,
        total: computeTotals(doc).grandTotal,
        status: 'DRAFT',
        isTemplate: true,
        doc: doc as unknown as Record<string, unknown>,
      };
      const saved = await manufacturingApi.createQuote(payload);
      toast.success(`Saved as template · ${saved.reference}`);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Rasterise the .quote-page nodes into a jsPDF. Switches to split view first
  // (the pages only render there). Returns null if nothing to render.
  const buildQuotePdf = async () => {
    if (view === 'wizard') {
      setView('split');
      await new Promise((r) => setTimeout(r, 400)); // let the preview mount
    }
    const root = canvasRef.current;
    if (!root) return null;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('.quote-page'));
    if (!nodes.length) return null;
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
    return pdf;
  };

  const downloadPdf = async () => {
    setExporting(true);
    try {
      const pdf = await buildQuotePdf();
      if (!pdf) return;
      pdf.save(`${ref || doc?.meta.quoteTitle || 'quotation'}.pdf`);
    } catch (e) {
      toast.error((e as Error).message || 'PDF export failed');
    } finally {
      setExporting(false);
    }
  };

  if (isLoading || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <i className="fa-solid fa-spinner fa-spin text-2xl" />
      </div>
    );
  }

  const accent = doc.accent || '#00676a';

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <style>{`
        .rt a { color: #2563eb; text-decoration: underline; }
        .rt ul { list-style: disc; padding-left: 1.25rem; }
        .rt ol { list-style: decimal; padding-left: 1.25rem; }
        .rt b, .rt strong { font-weight: 700; }
        .rt h2 { font-size: 1.25rem; font-weight: 700; margin: 0.4em 0 0.2em; }
        .rt h3 { font-size: 1.05rem; font-weight: 700; margin: 0.4em 0 0.2em; }
        .rt p { margin: 0.2em 0; }
        .rt-editor:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
        .rt-editor { max-height: 420px; }
        @media print { .no-print { display: none !important; } .quote-page { box-shadow: none !important; margin: 0 !important; } body { background: #fff !important; } }
      `}</style>

      {/* Toolbar */}
      <header className="no-print z-50 h-14 px-3 sm:px-5 flex items-center justify-between gap-3 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={() => navigate('/portal-admin/quotations')} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100" title="Back">
            <i className="fa-solid fa-arrow-left" />
          </button>
          <div className="min-w-0">
            <h1 className="font-semibold text-[15px] truncate">{ref ? `Quote · ${ref}` : 'New quotation'}</h1>
            <p className="text-[11px] text-gray-500 -mt-0.5">{status} {dirty ? '· unsaved' : ''}{totals ? ` · ${CURRENCIES[currency]}${totals.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* View mode toggle */}
          <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-0.5">
            {([['wizard', 'fa-list-ol', 'Steps'], ['split', 'fa-table-columns', 'Split']] as const).map(([m, icon, label]) => (
              <button
                key={m}
                onClick={() => setView(m)}
                className={`h-8 px-3 rounded-md text-[12px] font-semibold flex items-center gap-1.5 transition-colors ${view === m ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
                title={`${label} view`}
              >
                <i className={`fa-solid ${icon} text-[12px]`} /> {label}
              </button>
            ))}
          </div>
          <select value={currency} onChange={(e) => { setCurrency(e.target.value); setDirty(true); }} className="h-9 px-2 rounded-lg border border-gray-200 text-[13px]">
            {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c} {CURRENCIES[c]}</option>)}
          </select>
          <button onClick={downloadPdf} disabled={exporting} className="h-9 px-3 rounded-lg text-[13px] font-semibold border border-gray-200 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5" title="Download pixel-perfect PDF">
            <i className={`fa-solid ${exporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'} text-[12px]`} /> <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Download PDF'}</span>
          </button>
          <button onClick={saveAsTemplate} disabled={savingTemplate} className="h-9 px-3 rounded-lg text-[13px] font-semibold border border-gray-200 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5" title="Save a copy of this quote as a reusable template">
            <i className={`fa-solid ${savingTemplate ? 'fa-spinner fa-spin' : 'fa-copy'} text-[12px]`} /> <span className="hidden sm:inline">{savingTemplate ? 'Saving…' : 'Save as template'}</span>
          </button>
          <button onClick={() => save()} disabled={saving} className="h-9 px-3 rounded-lg text-[13px] font-semibold border border-gray-200 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5">
            <i className="fa-solid fa-floppy-disk text-[12px]" /> {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={sendToClient} disabled={saving} className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50 flex items-center gap-1.5" style={{ background: accent }} title={doc.meta.clientEmail ? `Email this quote to ${doc.meta.clientEmail}` : 'Add a client email to send'}>
            <i className="fa-solid fa-paper-plane text-[12px]" /> <span className="hidden sm:inline">Send to client</span>
          </button>
        </div>
      </header>

      {/* Linked-inquiry stage bar */}
      {linkedInquiry && (
        <div className="no-print px-4 py-2 bg-white border-b border-gray-200 flex items-center gap-3 overflow-x-auto shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 shrink-0">Project {linkedInquiry.reference?.replace(/^[A-Z]+-/, '')}</span>
          <StageStepper stage={linkedInquiry.currentStage} status={linkedInquiry.currentStatus} compact />
          <span className="text-[11px] text-gray-400 shrink-0 ml-auto">Manage stage on the inquiry page</span>
        </div>
      )}

      {/* Body: multi-step wizard OR split (form + live A4 preview) */}
      {view === 'wizard' ? (
        <div className="flex-1 min-h-0">
          <QuoteWizard
            doc={doc}
            currency={currency}
            accent={accent}
            inquiry={linkedInquiry}
            canPickInquiry={isNew && !linkedInquiry}
            onPickInquiry={pickInquiry}
            onPatchMeta={patchMeta}
            onPatchBranding={patchBranding}
            onPatchCalc={patchCalc}
            onPatchBlock={patchBlock}
            onAddBlock={addBlock}
            onAddBlockFull={addBlockFull}
            onRemoveBlock={removeBlock}
            onReorder={reorderBlocks}
            onToggle={toggleBlock}
            onAddPage={addPage}
            onRemovePage={removePage}
            onGenerate={() => setView('split')}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" autoSaveId="quote-builder-split">
            <ResizablePanel defaultSize={28} minSize={20} maxSize={45} className="no-print">
              <aside className="h-full border-r border-gray-200 overflow-y-auto bg-gray-50">
                {linkedInquiry ? (
                  <div className="p-3 pb-0">
                    <InquiryImport inquiry={linkedInquiry} doc={doc} accent={accent} onPatchMeta={patchMeta} onAddBlockFull={addBlockFull} />
                  </div>
                ) : isNew ? (
                  <div className="p-3 pb-0">
                    <InquiryPicker onPick={pickInquiry} />
                  </div>
                ) : null}
                <QuoteFormPanel
                  doc={doc}
                  currency={currency}
                  accent={accent}
                  focusBlockId={focusBlockId}
                  focusClientInfo={focusClientInfo}
                  onPatchMeta={patchMeta}
                  onPatchBranding={patchBranding}
                  onPatchCalc={patchCalc}
                  onPatchBlock={patchBlock}
                  onAddBlock={addBlock}
                  onRemoveBlock={removeBlock}
                  onReorder={reorderBlocks}
                  onToggle={toggleBlock}
                  onAddPage={addPage}
                  onRemovePage={removePage}
                  onPatchFooter={patchFooter}
                />
              </aside>
            </ResizablePanel>

            <ResizableHandle withHandle className="no-print" />

            <ResizablePanel defaultSize={72} minSize={40}>
              <div ref={canvasRef} className="h-full overflow-auto py-6 sm:py-10 px-2 flex flex-col items-center gap-8">
                <QuotePreview
                  doc={doc}
                  accent={accent}
                  currency={currency}
                  reference={ref}
                  onPatchMeta={patchMeta}
                  onPatchBranding={patchBranding}
                  onPatchBlock={patchBlock}
                  onUpdate={update}
                  onEditBlock={editBlock}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </div>
  );
}
