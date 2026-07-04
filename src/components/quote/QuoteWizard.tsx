import { useMemo, useState } from 'react';
import type { ManufacturingInquiryDto } from '@/lib/api';
import { computeTotals } from './computeTotals';
import {
  BrandingForm, MetaForm, CalcForm, SectionsEditor, BLOCK_META,
} from './quoteFormParts';
import InquiryImport from './InquiryImport';
import InquiryPicker from './InquiryPicker';
import type { QuoteDoc, QuoteBlock, QuoteBlockType, QuoteCalc } from './quoteDoc';

const CURRENCIES: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number, currency: string) =>
  `${CURRENCIES[currency] ?? ''}${(isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STEPS = [
  { key: 'company', label: 'Company', icon: 'fa-building' },
  { key: 'client', label: 'Client & details', icon: 'fa-user' },
  { key: 'sections', label: 'Sections', icon: 'fa-layer-group' },
  { key: 'tax', label: 'Tax & discount', icon: 'fa-percent' },
  { key: 'review', label: 'Review', icon: 'fa-circle-check' },
] as const;

/**
 * Multi-step, centered full-page form. It mutates the same QuoteDoc as the
 * split view (single source of truth) via the same callbacks. The Sections
 * step is dynamic — the admin adds as many sections of any type as they want.
 * Finishing calls onGenerate(), which the shell uses to switch to split view.
 */
export default function QuoteWizard({
  doc, currency, accent, inquiry, canPickInquiry, onPickInquiry,
  onPatchMeta, onPatchBranding, onPatchCalc, onPatchBlock, onAddBlock, onAddBlockFull, onRemoveBlock, onReorder, onToggle, onAddPage, onRemovePage,
  onGenerate,
}: {
  doc: QuoteDoc; currency: string; accent: string;
  inquiry?: ManufacturingInquiryDto | null;
  canPickInquiry?: boolean;
  onPickInquiry?: (inquiryId: number) => void;
  onPatchMeta: (p: Partial<QuoteDoc['meta']>) => void;
  onPatchBranding: (p: Partial<QuoteDoc['branding']>) => void;
  onPatchCalc: (p: Partial<QuoteCalc>) => void;
  onPatchBlock: (pageId: string, blockId: string, p: Partial<QuoteBlock>) => void;
  onAddBlock: (pageId: string, t: QuoteBlockType) => void;
  onAddBlockFull: (block: QuoteBlock) => void;
  onRemoveBlock: (pageId: string, blockId: string) => void;
  onReorder: (pageId: string, from: number, to: number) => void;
  onToggle: (pageId: string, blockId: string) => void;
  onAddPage: () => void;
  onRemovePage: (pageId: string) => void;
  onGenerate: () => void;
}) {
  const [step, setStep] = useState(0);
  const calc = doc.calc ?? { gstPercent: 0, discount: 0 };
  const totals = useMemo(() => computeTotals(doc), [doc]);
  const last = STEPS.length - 1;
  const sectionCount = doc.pages.reduce((n, p) => n + p.blocks.length, 0);

  return (
    <div className="h-full overflow-y-auto bg-gray-100">
      <div className={`mx-auto px-4 py-8 transition-[max-width] ${step === 2 ? 'max-w-5xl' : 'max-w-3xl'}`}>
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => setStep(i)}
                className="flex flex-col items-center gap-1.5 group"
                title={s.label}
              >
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-semibold transition-colors ${i === step ? 'text-white' : i < step ? 'text-white' : 'bg-white text-gray-400 border border-gray-200'}`}
                  style={i <= step ? { background: accent } : undefined}
                >
                  {i < step ? <i className="fa-solid fa-check" /> : <i className={`fa-solid ${s.icon}`} />}
                </span>
                <span className={`text-[11px] font-semibold ${i === step ? 'text-gray-800' : 'text-gray-400'}`}>{s.label}</span>
              </button>
              {i < last && <div className="flex-1 h-0.5 mx-2 mb-5 rounded" style={{ background: i < step ? accent : '#e5e7eb' }} />}
            </div>
          ))}
        </div>

        {/* Step body */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 min-h-[360px]">
          {step === 0 && (
            <>
              <StepHead icon="fa-building" title="Company / branding" subtitle="Yeh details quote ke header mein aayengi." accent={accent} />
              <BrandingForm doc={doc} onPatchBranding={onPatchBranding} accent={accent} />
            </>
          )}

          {step === 1 && (
            <>
              <StepHead icon="fa-user" title="Client & quote details" subtitle="Kiske liye quote hai aur kab tak valid hai." accent={accent} />
              {inquiry ? (
                <div className="mb-4">
                  <InquiryImport inquiry={inquiry} doc={doc} accent={accent} onPatchMeta={onPatchMeta} onAddBlockFull={onAddBlockFull} />
                </div>
              ) : canPickInquiry && onPickInquiry ? (
                <div className="mb-4">
                  <InquiryPicker onPick={onPickInquiry} />
                </div>
              ) : null}
              <MetaForm doc={doc} onPatchMeta={onPatchMeta} />
            </>
          )}

          {step === 2 && (
            <>
              <StepHead icon="fa-layer-group" title="Sections" subtitle={`Jitne chahe sections add karo — text, table, summary, image, custom fields, signature. Drag se reorder. (${sectionCount} added)`} accent={accent} />
              <div className="space-y-4">
                {doc.pages.map((page, pageIdx) => (
                  <SectionsEditor
                    key={page.id}
                    page={page}
                    pageIdx={pageIdx}
                    accent={accent}
                    currency={currency}
                    removablePage={pageIdx > 0}
                    onPatchBlock={(blockId, p) => onPatchBlock(page.id, blockId, p)}
                    onAddBlock={(t) => onAddBlock(page.id, t)}
                    onRemoveBlock={(blockId) => onRemoveBlock(page.id, blockId)}
                    onReorder={(from, to) => onReorder(page.id, from, to)}
                    onToggle={(blockId) => onToggle(page.id, blockId)}
                    onRemovePage={() => onRemovePage(page.id)}
                  />
                ))}
                <button onClick={onAddPage} className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#924623] hover:text-[#924623] font-semibold text-[13px] flex items-center justify-center gap-2">
                  <i className="fa-solid fa-file-circle-plus" /> Add page
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <StepHead icon="fa-percent" title="Tax & discount" subtitle="GST aur discount — Summary section inhi se calculate hota hai." accent={accent} />
              <CalcForm calc={calc} currency={currency} onPatchCalc={onPatchCalc} />
              <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-1.5">
                <Line label="Subtotal" value={money(totals.subtotal, currency)} />
                {totals.discount > 0 && <Line label="Discount" value={`− ${money(totals.discount, currency)}`} />}
                <Line label={`GST (${totals.gstPercent}%)`} value={money(totals.gstAmount, currency)} />
                <div className="flex items-center justify-between pt-2 border-t-2 mt-1" style={{ borderColor: accent }}>
                  <span className="font-bold">Grand total</span>
                  <span className="font-bold text-[18px]" style={{ color: accent }}>{money(totals.grandTotal, currency)}</span>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <StepHead icon="fa-circle-check" title="Review & generate" subtitle="Sab sahi hai? Generate dabate hi editable preview khul jaayega." accent={accent} />
              <ReviewSummary doc={doc} currency={currency} totals={totals} accent={accent} />
            </>
          )}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="h-10 px-5 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold disabled:opacity-40 flex items-center gap-2">
            <i className="fa-solid fa-arrow-left text-[12px]" /> Back
          </button>
          {step < last ? (
            <button onClick={() => setStep((s) => Math.min(last, s + 1))} className="h-10 px-6 rounded-xl text-white text-[13px] font-semibold flex items-center gap-2" style={{ background: accent }}>
              Next <i className="fa-solid fa-arrow-right text-[12px]" />
            </button>
          ) : (
            <button onClick={onGenerate} className="h-10 px-6 rounded-xl text-white text-[13px] font-semibold flex items-center gap-2" style={{ background: accent }}>
              <i className="fa-solid fa-wand-magic-sparkles text-[12px]" /> Generate &amp; edit preview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHead({ icon, title, subtitle, accent }: { icon: string; title: string; subtitle: string; accent: string }) {
  return (
    <div className="flex items-start gap-3 pb-3 mb-2 border-b border-gray-100">
      <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: accent }}><i className={`fa-solid ${icon}`} /></span>
      <div>
        <h2 className="font-bold text-[16px]">{title}</h2>
        <p className="text-[12px] text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between text-[13px] text-gray-600"><span>{label}</span><span className="font-medium text-gray-800">{value}</span></div>;
}

function ReviewSummary({ doc, currency, totals, accent }: { doc: QuoteDoc; currency: string; totals: ReturnType<typeof computeTotals>; accent: string }) {
  const visible = doc.pages.flatMap((p) => p.blocks).filter((b) => !b.hidden);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card label="Company" value={doc.branding.name || '—'} />
        <Card label="Client" value={doc.meta.clientName || '—'} />
        <Card label="Quote title" value={doc.meta.quoteTitle || '—'} />
        <Card label="Valid for" value={`${doc.meta.validityDays} days`} />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Sections ({visible.length})</p>
        <div className="flex flex-wrap gap-1.5">
          {visible.map((b) => (
            <span key={b.id} className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
              <i className={`fa-solid ${BLOCK_META[b.type].icon} text-[10px]`} style={{ color: accent }} />
              {b.title || BLOCK_META[b.type].label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl p-4 text-white" style={{ background: accent }}>
        <span className="font-semibold">Grand total</span>
        <span className="font-bold text-[20px]">{money(totals.grandTotal, currency)}</span>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-[14px] font-semibold text-gray-800 truncate">{value}</p>
    </div>
  );
}
