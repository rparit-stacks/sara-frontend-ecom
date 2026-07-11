import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sym } from '@/components/portal/Sym';
import { Pill } from '@/components/portal/Pill';
import QuoteViewerModal from '@/components/portal/QuoteViewerModal';
import { manufacturingApi } from '@/lib/api';
import type { QuoteRevision } from '@/components/quote/quoteDoc';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number, c: string) => `${CUR[c] ?? ''}${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminProjectQuotationPanel({
  inquiryId,
  projectCode,
}: {
  inquiryId: number;
  projectCode: string;
}) {
  const navigate = useNavigate();
  const [viewQuoteId, setViewQuoteId] = useState<number | null>(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['admin-quotes'],
    queryFn: () => manufacturingApi.listQuotes(),
  });

  const projectQuotes = useMemo(
    () => quotes.filter((q) => q.inquiryId === inquiryId),
    [quotes, inquiryId],
  );

  const revisions = useMemo(() => {
    const rows: { quoteRef: string; quoteId: number; rev: QuoteRevision; latest: boolean }[] = [];
    for (const q of projectQuotes) {
      const doc = q.doc as { revisions?: QuoteRevision[] } | undefined;
      const revs = doc?.revisions?.length
        ? doc.revisions
        : [{ version: 1, savedAt: q.updatedAt || q.createdAt || '', total: q.total, status: q.status }];
      revs.forEach((rev, i) => {
        rows.push({
          quoteRef: q.reference,
          quoteId: q.id,
          rev,
          latest: i === revs.length - 1,
        });
      });
    }
    return rows.sort((a, b) => (b.rev.savedAt || '').localeCompare(a.rev.savedAt || ''));
  }, [projectQuotes]);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-[20px]">Quotations</h2>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
                All versions for this project — view, download or edit. Changes are announced to the client.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/portal-admin/quote-editor/new?inquiry=${inquiryId}`)}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-1.5"
              style={{ background: 'var(--p-primary)' }}
            >
              <Sym name="add" className="text-[16px]" /> New quote
            </button>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center"><Sym name="progress_activity" className="text-[28px] animate-spin" style={{ color: 'var(--p-on-surface-variant)' }} /></div>
          ) : revisions.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
              <Sym name="request_quote" className="text-[40px] opacity-40" />
              <p className="mt-2 font-semibold">No quotations yet</p>
              <p className="text-[13px]">Create the first quote for this project.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {revisions.map((row) => (
                <div
                  key={`${row.quoteRef}-v${row.rev.version}`}
                  className="border rounded-xl p-4 flex flex-wrap items-center gap-4"
                  style={{ borderColor: 'var(--p-outline-variant)', background: row.latest ? 'var(--p-surface-container-low)' : 'var(--p-surface-container-lowest)' }}
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[14px]">{row.quoteRef}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: 'rgba(0,103,106,0.12)', color: 'var(--p-primary)' }}>
                        v{row.rev.version}{row.latest ? ' · current' : ''}
                      </span>
                      <Pill label={row.rev.status} />
                    </div>
                    <p className="text-[12px] mt-1" style={{ color: 'var(--p-on-surface-variant)' }}>
                      Saved {row.rev.savedAt ? new Date(row.rev.savedAt).toLocaleString() : '—'}
                    </p>
                  </div>
                  <p className="font-bold text-[15px]">{money(row.rev.total, projectQuotes.find((q) => q.id === row.quoteId)?.currency || 'INR')}</p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setViewQuoteId(row.quoteId)}
                      className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border flex items-center gap-1"
                      style={{ borderColor: 'var(--p-outline)', color: 'var(--p-primary)' }}
                    >
                      <Sym name="visibility" className="text-[16px]" /> View
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewQuoteId(row.quoteId)}
                      className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border flex items-center gap-1"
                      style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}
                    >
                      <Sym name="download" className="text-[16px]" /> PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/portal-admin/quote-editor/${row.quoteRef}`)}
                      className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white"
                      style={{ background: 'var(--p-primary)' }}
                    >
                      {row.latest ? 'Edit' : 'View & edit'}
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
        mode="admin"
        projectCode={projectCode}
        quoteId={viewQuoteId}
      />
    </>
  );
}
