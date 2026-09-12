import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { businessConfigApi, manufacturingApi, mediaApi } from '@/lib/api';
import { exportQuotePdf } from '@/components/quote/exportQuotePdf';
import QuotePdfPreviewModal from '@/components/quote/QuotePdfPreviewModal';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
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
import { useQuotePagination } from '@/components/quote/useQuotePagination';
import { layoutPagesToQuotePages } from '@/components/quote/paginateDoc';
import QuoteFormPanel from '@/components/quote/QuoteFormPanel';
import QuotePreview from '@/components/quote/QuotePreview';
import QuoteWizard from '@/components/quote/QuoteWizard';
import InquiryImport from '@/components/quote/InquiryImport';
import InquiryPicker from '@/components/quote/InquiryPicker';
import StageStepper from '@/components/manufacturing/StageStepper';

type ViewMode = 'wizard' | 'split';

const CURRENCIES: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
/** Floor on the Autoformat button's visible "working" state — see autoformatQuote(). */
const MIN_AUTOFORMAT_MS = 600;

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
  const [autoformatting, setAutoformatting] = useState(false);
  // New quotes start in the guided multi-step wizard; existing quotes (already
  // have content) open straight in split view for editing.
  const [view, setView] = useState<ViewMode>(isNew ? 'wizard' : 'split');
  // Block whose form should auto-open in the left panel (set by double-clicking
  // a section on the page). Cleared shortly after so it can re-trigger.
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [focusClientInfo, setFocusClientInfo] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
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

  // Flush any still-pending auto-save when the editor actually unmounts
  // (navigating away before the 2.5s pause elapses) — otherwise edits made
  // just before navigating away (e.g. typing a client email then clicking
  // straight to "Convert to project" in the list view) are silently
  // dropped, and downstream actions run against the stale, already-persisted
  // value. Kept in its own effect with an empty dependency array so the
  // cleanup only runs on true unmount, not on every keystroke.
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const quoteIdRef = useRef(quoteId);
  quoteIdRef.current = quoteId;
  useEffect(() => {
    return () => {
      if (dirtyRef.current && quoteIdRef.current) {
        save(undefined, { silent: true });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          // Also upload for a public URL — needed so WhatsApp's document-header
          // template can attach the actual PDF (it fetches by URL, not raw bytes
          // like the email attachment). MUST be uploadFile, never mediaApi.upload:
          // the plain image endpoint runs every file through Cloudinary's 800x800
          // image/crop pipeline, which silently rasterizes a multi-page PDF down
          // to a single cropped page — the exact "cut off, not paginated" copy
          // that reached WhatsApp before this fix, even though this SAME pdf
          // object (used for preview/download) was always generated correctly.
          const blob = pdf.output('blob');
          const file = new File([blob], `${saved.reference || 'quotation'}.pdf`, { type: 'application/pdf' });
          pdfUrl = await mediaApi.uploadFile(file, 'quotations');
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

  // Builds the PDF from the paginated print render (see exportQuotePdf) —
  // no view switch needed, it mounts its own off-screen copy regardless of
  // which view (wizard/split) is currently showing.
  const buildQuotePdf = async () => {
    if (!doc) return null;
    return exportQuotePdf(doc, doc.accent || '#00676a', currency, ref);
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

  // Called unconditionally (before the loading guard below) so hook order
  // never depends on `doc` going from null to non-null — falls back to an
  // empty doc while loading; nothing reads `layoutPages` until after the
  // guard, once `doc` is guaranteed real.
  const layoutPages = useQuotePagination(doc ?? defaultQuoteDoc(null), doc?.accent || '#00676a', currency);

  if (isLoading || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <i className="fa-solid fa-spinner fa-spin text-2xl" />
      </div>
    );
  }

  const accent = doc.accent || '#00676a';

  /**
   * "Autoformat" — always available, entirely optional, never runs on its own
   * (no auto-trigger on save/load/export). Re-runs the SAME measurement-based
   * packer the print/PDF path already uses on every export, and writes its
   * result back into the editable `doc.pages` so the editor view matches
   * exactly what will print — this never reorders content, it only regroups
   * the SAME blocks, in the SAME order, into page-sized chunks.
   *
   * The short artificial delay is deliberate, not padding for its own sake:
   * the measurement pass really is async (it mounts every block off-screen
   * to read real DOM heights), but on a short/simple quote it can resolve
   * in a single frame — with no minimum duration the button would flash and
   * finish before a user register anything happened, which reads as broken
   * ("I clicked and nothing happened") rather than as a background action
   * that completed instantly.
   */
  const autoformatQuote = async () => {
    if (autoformatting) return;
    setAutoformatting(true);
    const started = Date.now();
    try {
      if (!layoutPages) {
        toast.info('Still measuring this quote\'s layout — try again in a moment.');
        return;
      }
      const pages = layoutPagesToQuotePages(layoutPages);
      const elapsed = Date.now() - started;
      if (elapsed < MIN_AUTOFORMAT_MS) await new Promise((r) => setTimeout(r, MIN_AUTOFORMAT_MS - elapsed));
      if (pages.length === doc.pages.length) {
        toast.info('Already perfectly formatted — nothing to change.');
        return;
      }
      update({ ...doc, pages });
      toast.success(`Autoformatted into ${pages.length} page${pages.length === 1 ? '' : 's'} — same content, same order, repacked to fit A4 exactly.`);
    } finally {
      setAutoformatting(false);
    }
  };

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
          <button
            onClick={autoformatQuote}
            disabled={autoformatting}
            className="h-9 px-3 rounded-lg text-[13px] font-semibold border border-gray-200 hover:bg-gray-50 disabled:opacity-70 flex items-center gap-1.5"
            title="Optional — repacks every section across pages so nothing overflows an A4 sheet. Same content, same order, just re-fit to the page. Never runs on its own."
          >
            <i className={`fa-solid ${autoformatting ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} text-[12px]`} />
            <span className="hidden sm:inline">{autoformatting ? 'Formatting…' : 'Autoformat'}</span>
          </button>
          <button onClick={() => setPreviewOpen(true)} className="h-9 px-3 rounded-lg text-[13px] font-semibold border border-gray-200 hover:bg-gray-50 flex items-center gap-1.5" title="Preview the paginated PDF before downloading">
            <i className="fa-solid fa-eye text-[12px]" /> <span className="hidden sm:inline">Preview</span>
          </button>
          {/* Save + its secondary variants (Save as template, Download PDF) —
              these three used to be three separate, similarly-styled buttons
              that read as interchangeable. Save/Send are the only actions an
              admin needs on every quote; the other two are occasional. */}
          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => save()} disabled={saving} className="h-9 px-3 text-[13px] font-semibold hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5">
              <i className="fa-solid fa-floppy-disk text-[12px]" /> {saving ? 'Saving…' : 'Save'}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-8 border-l border-gray-200 hover:bg-gray-50 flex items-center justify-center" title="More save options">
                  <i className="fa-solid fa-chevron-down text-[10px] text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadPdf} disabled={exporting}>
                  <i className={`fa-solid ${exporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'} w-4 text-center mr-2`} /> {exporting ? 'Exporting…' : 'Download PDF'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={saveAsTemplate} disabled={savingTemplate}>
                  <i className={`fa-solid ${savingTemplate ? 'fa-spinner fa-spin' : 'fa-copy'} w-4 text-center mr-2`} /> {savingTemplate ? 'Saving…' : 'Save as template'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                  onAddPage={addPage}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}

      <QuotePdfPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        doc={doc}
        accent={accent}
        currency={currency}
        reference={ref}
      />
    </div>
  );
}
