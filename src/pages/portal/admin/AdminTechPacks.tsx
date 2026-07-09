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
  const [renaming, setRenaming] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['tech-packs', tab],
    queryFn: () => techPackApi.list(tab === 'templates'),
  });

  const invalidateAll = () =>
    qc.invalidateQueries({ queryKey: ['tech-packs'] }); // both tabs

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
      invalidateAll();
    } catch {
      toast.error('Delete failed');
    }
  }

  async function saveRename(id: string, name: string) {
    setRenaming(null);
    if (!name.trim()) return;
    try {
      await techPackApi.patch(id, { name: name.trim() });
      toast.success('Renamed');
      invalidateAll();
    } catch {
      toast.error('Rename failed');
    }
  }

  async function toggleTemplate(id: string, makeTemplate: boolean) {
    try {
      await techPackApi.patch(id, { isTemplate: makeTemplate });
      toast.success(makeTemplate ? 'Saved as template' : 'Moved to documents');
      invalidateAll();
    } catch {
      toast.error('Update failed');
    }
  }

  // "Use template" — server-side duplicate into a new document, then open it.
  async function useTemplate(id: string) {
    try {
      const copy = await techPackApi.duplicate(id);
      toast.success('New tech pack created from template');
      invalidateAll();
      openBuilder(copy.id);
    } catch {
      toast.error('Could not create from template');
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
                  <div className="flex items-center gap-1">
                    <button onClick={() => setRenaming(it.id)} className="text-gray-300 hover:text-[#924623]" title="Rename">
                      <Sym name="edit" className="text-[17px]" />
                    </button>
                    <button onClick={() => remove(it.id)} className="text-gray-300 hover:text-red-500" title="Delete">
                      <Sym name="delete" className="text-[18px]" />
                    </button>
                  </div>
                </div>

                {renaming === it.id ? (
                  <input
                    autoFocus
                    defaultValue={it.name}
                    onBlur={(e) => saveRename(it.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      if (e.key === 'Escape') setRenaming(null);
                    }}
                    className="mt-3 w-full text-[14px] px-2 py-1 border border-[#924623] rounded outline-none"
                  />
                ) : (
                  <p className="text-[15px] font-medium text-gray-800 mt-3 truncate">{it.name}</p>
                )}

                <div className="flex items-center gap-1.5 mt-0.5">
                  {it.isTemplate && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">TEMPLATE</span>
                  )}
                  <p className="text-[11px] text-gray-400">
                    {it.updatedAt ? `Updated ${formatInquiryDate(it.updatedAt)}` : '—'}
                  </p>
                </div>

                <div className="flex-1" />

                <div className="mt-4 space-y-1.5">
                  {it.isTemplate ? (
                    <>
                      <button
                        onClick={() => useTemplate(it.id)}
                        className="w-full py-2 rounded-lg bg-[#924623] text-white text-[13px] font-medium hover:bg-[#7d3c1e] flex items-center justify-center gap-1.5"
                      >
                        <Sym name="add" className="text-[16px]" /> Use template
                      </button>
                      <div className="flex gap-1.5">
                        <button onClick={() => openBuilder(it.id)} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50">Edit</button>
                        <button onClick={() => toggleTemplate(it.id, false)} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50">Make document</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openBuilder(it.id)}
                        className="w-full py-2 rounded-lg bg-[#924623] text-white text-[13px] font-medium hover:bg-[#7d3c1e]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleTemplate(it.id, true)}
                        className="w-full py-1.5 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5"
                      >
                        <Sym name="bookmark" className="text-[15px]" /> Save as template
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
