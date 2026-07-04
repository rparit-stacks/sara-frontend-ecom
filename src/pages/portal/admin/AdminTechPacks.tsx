import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell, { AdminBtn } from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import { techPackApi } from '@/lib/api';
import { formatInquiryDate } from '@/components/inquiry/inquiryUtils';

// The standalone Tech Pack Studio (deployed on Vercel). New/Edit open it in a
// new tab; it reads/writes the SAME studio_sara rows via the shared API, so
// changes sync back to this list.
const BUILDER_URL = (import.meta.env.VITE_TECHPACK_BUILDER_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export default function PortalAdminTechPacks() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'saved' | 'templates'>('saved');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['tech-packs', tab],
    queryFn: () => techPackApi.list(tab === 'templates'),
  });

  function openBuilder(docId?: string) {
    if (!BUILDER_URL) {
      toast.error('Tech Pack Studio URL not configured (VITE_TECHPACK_BUILDER_URL).');
      return;
    }
    const url = docId ? `${BUILDER_URL}/?docId=${encodeURIComponent(docId)}` : `${BUILDER_URL}/`;
    window.open(url, '_blank', 'noopener');
  }

  async function remove(id: string) {
    if (!confirm('Delete this tech pack permanently?')) return;
    try {
      await techPackApi.remove(id);
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['tech-packs'] });
    } catch {
      toast.error('Delete failed');
    }
  }

  return (
    <AdminShell
      title="Tech Packs"
      actions={
        <div className="flex items-center gap-2">
          <AdminBtn icon="refresh" variant="ghost" onClick={() => qc.invalidateQueries({ queryKey: ['tech-packs'] })}>
            Refresh
          </AdminBtn>
          <AdminBtn icon="add" onClick={() => openBuilder()}>
            New Tech Pack
          </AdminBtn>
        </div>
      }
    >
      <div className="p-4 md:p-6">
        {/* tabs */}
        <div className="flex gap-1 mb-5">
          {(['saved', 'templates'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[13px] px-4 py-2 rounded-lg font-medium transition-colors ${
                tab === t ? 'bg-[#924623] text-white' : 'text-gray-600 hover:bg-black/5'
              }`}
            >
              {t === 'saved' ? 'Saved' : 'Templates'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Sym name="description" className="text-[40px] mb-2 block" />
            <p className="text-sm">No {tab === 'templates' ? 'templates' : 'tech packs'} yet.</p>
            <button onClick={() => openBuilder()} className="text-[13px] text-[#924623] hover:underline mt-2">
              + Create one
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((it) => (
              <div
                key={it.id}
                className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[#924623]/10 text-[#924623] flex items-center justify-center shrink-0">
                    <Sym name={it.isTemplate ? 'bookmark' : 'description'} className="text-[20px]" />
                  </div>
                  <button onClick={() => remove(it.id)} className="text-gray-300 hover:text-red-500" title="Delete">
                    <Sym name="delete" className="text-[18px]" />
                  </button>
                </div>
                <p className="text-[15px] font-medium text-gray-800 mt-3 truncate">{it.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {it.updatedAt ? `Updated ${formatInquiryDate(it.updatedAt)}` : '—'}
                </p>
                <div className="flex-1" />
                <button
                  onClick={() => openBuilder(it.id)}
                  className="mt-4 w-full py-2 rounded-lg bg-[#924623] text-white text-[13px] font-medium hover:bg-[#7d3c1e]"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
