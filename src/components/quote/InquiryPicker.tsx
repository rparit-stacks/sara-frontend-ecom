import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { manufacturingApi } from '@/lib/api';

const ACCENT = '#00676a';

/**
 * For a standalone quote (opened without ?inquiry): let the admin optionally
 * pick an existing inquiry to pull data from. Selecting one calls onPick with
 * its id; the builder then links + offers import. Or the admin just fills the
 * quote manually and ignores this.
 */
export default function InquiryPicker({ onPick }: { onPick: (inquiryId: number) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['admin-inquiries', 'picker'],
    queryFn: () => manufacturingApi.listInquiries(),
    enabled: open,
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return inquiries;
    return inquiries.filter((i) =>
      [i.reference, i.clientName, i.brand, i.clientEmail].filter(Boolean).some((s) => String(s).toLowerCase().includes(term)),
    );
  }, [inquiries, q]);

  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 rounded-xl">
        <i className="fa-solid fa-link text-[13px]" style={{ color: ACCENT }} />
        <span className="font-semibold text-[13px] flex-1">Link an inquiry <span className="text-gray-400 font-normal">(optional — pull client + answers)</span></span>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} text-[11px] text-gray-400`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by reference, client, brand…"
            className="w-full h-9 px-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00676a]/20"
          />
          <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-100">
            {isLoading ? (
              <p className="px-3 py-4 text-[12px] text-gray-400 text-center"><i className="fa-solid fa-spinner fa-spin" /> Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-4 text-[12px] text-gray-400 text-center">No inquiries found.</p>
            ) : (
              filtered.map((i) => (
                <button key={i.id} onClick={() => onPick(i.id)} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3">
                  <span className="text-[12px] font-bold shrink-0" style={{ color: ACCENT }}>{i.reference}</span>
                  <span className="text-[13px] text-gray-700 truncate flex-1">{i.clientName || i.brand || '—'}</span>
                  <span className="text-[11px] text-gray-400 truncate hidden sm:block">{i.clientEmail}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
