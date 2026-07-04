import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminShell, { AdminBtn } from '@/components/portal/AdminShell';
import { Pill } from '@/components/portal/Pill';
import { Sym } from '@/components/portal/Sym';
import { manufacturingApi } from '@/lib/api';
import { formatInquiryDate } from '@/components/inquiry/inquiryUtils';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number, c: string) => `${CUR[c] ?? ''}${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PortalAdminQuotations() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inquiryFilter = params.get('inquiry');

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['admin-quotes'],
    queryFn: () => manufacturingApi.listQuotes(),
  });

  const shown = useMemo(() => {
    if (!inquiryFilter) return quotes;
    const id = Number(inquiryFilter);
    return quotes.filter((q) => q.inquiryId === id);
  }, [quotes, inquiryFilter]);

  return (
    <AdminShell
      title={inquiryFilter ? 'Quotations · Project' : 'Quotations'}
      actions={<AdminBtn icon="add" onClick={() => navigate('/portal-admin/quote-editor/new')}>New quotation</AdminBtn>}
    >
      <div className="p-5 sm:p-8">
        {inquiryFilter && (
          <p className="text-[13px] mb-4" style={{ color: 'var(--p-on-surface-variant)' }}>
            Showing quotes for inquiry #{inquiryFilter}
            <button onClick={() => navigate('/portal-admin/quotations')} className="ml-2 font-bold underline" style={{ color: 'var(--p-primary)' }}>Show all</button>
          </p>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="progress_activity" className="text-[28px] animate-spin" />
          </div>
        ) : shown.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
            <Sym name="request_quote" className="text-[40px]" />
            <p className="mt-2 text-[15px] font-semibold">No quotations yet</p>
            <p className="text-[13px]">Create one from an inquiry or start a blank quotation.</p>
            <button onClick={() => navigate('/portal-admin/quote-editor/new')} className="mt-4 px-4 py-2 rounded-lg text-[13px] font-semibold text-white inline-flex items-center gap-1.5" style={{ background: 'var(--p-primary)' }}>
              <Sym name="add" className="text-[16px]" /> New quotation
            </button>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden overflow-x-auto" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr style={{ background: 'var(--p-surface-container-low)' }}>
                  {['Quote', 'Title', 'Client', 'Amount', 'Status', 'Updated', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((q, i) => (
                  <tr
                    key={q.id}
                    className="cursor-pointer hover:bg-black/[0.02]"
                    style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}
                    onClick={() => navigate(`/portal-admin/quote-editor/${q.reference}`)}
                  >
                    <td className="px-4 py-3 font-semibold text-[13px]">{q.reference}</td>
                    <td className="px-4 py-3 text-[13px]">{q.title}</td>
                    <td className="px-4 py-3 text-[13px]">{q.clientName || '—'}</td>
                    <td className="px-4 py-3 font-bold text-[13px]">{money(q.total, q.currency)}</td>
                    <td className="px-4 py-3"><Pill label={q.status} /></td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{q.updatedAt ? formatInquiryDate(q.updatedAt) : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[13px] font-bold" style={{ color: 'var(--p-primary)' }}>Edit</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
