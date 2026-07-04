import { useState } from 'react';
import { Sym } from '@/components/portal/Sym';
import { Pill } from '@/components/portal/Pill';
import QuoteViewerModal from '@/components/portal/QuoteViewerModal';
import type { ManufacturingProjectDetailDto } from '@/lib/api';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number | undefined, c?: string) =>
  `${CUR[c || 'INR'] ?? ''}${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Read-only quotation list for the client project workspace. */
export default function ClientProjectQuotationPanel({
  project,
  projectCode,
}: {
  project: ManufacturingProjectDetailDto;
  projectCode: string;
}) {
  const quotes = project.quotes || [];
  const [viewQuoteId, setViewQuoteId] = useState<number | null>(null);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-3xl">
          <div className="mb-5">
            <h2 className="font-display text-[20px]">Quotations</h2>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
              Quotes shared by the Studio Sara team. Updates also appear in Announcements.
            </p>
          </div>

          {quotes.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
              <Sym name="request_quote" className="text-[40px] opacity-40" />
              <p className="mt-2 font-semibold">No quotations yet</p>
              <p className="text-[13px]">Your team will share a quote here when it&apos;s ready.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className="border rounded-xl p-4 flex flex-wrap items-center gap-4"
                  style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--p-surface-container-high)' }}>
                    <Sym name="request_quote" className="text-[20px]" style={{ color: 'var(--p-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[14px]">{q.reference}</span>
                      <Pill label={q.status} />
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
                      {q.title || 'Quotation'}
                      {q.updatedAt ? ` · Updated ${new Date(q.updatedAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <p className="font-bold text-[15px]">{money(q.total, q.currency)}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setViewQuoteId(q.id)}
                      className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border flex items-center gap-1"
                      style={{ borderColor: 'var(--p-outline)', color: 'var(--p-primary)' }}
                    >
                      <Sym name="visibility" className="text-[16px]" /> View
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewQuoteId(q.id)}
                      className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white flex items-center gap-1"
                      style={{ background: 'var(--p-primary)' }}
                    >
                      <Sym name="download" className="text-[16px]" /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <QuoteViewerModal
        open={viewQuoteId != null}
        onClose={() => setViewQuoteId(null)}
        mode="client"
        projectCode={projectCode}
        quoteId={viewQuoteId}
      />
    </>
  );
}
