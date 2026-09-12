import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell, { AdminBtn } from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import StatTile from '@/components/portal/StatTile';
import { techPackApi, projectApi, type ManufacturingProjectDto } from '@/lib/api';
import { formatInquiryDate } from '@/components/inquiry/inquiryUtils';
import { openTechPackBuilder } from '@/lib/techPackBuilder';

// The standalone Tech Pack Studio (deployed on Vercel). New/Edit open it in a
// new tab; it reads/writes the SAME studio_sara rows via the shared API, so
// changes sync back to this list.
const BUILDER_URL = (import.meta.env.VITE_TECHPACK_BUILDER_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const PAGE_SIZE = 24;

export default function PortalAdminTechPacks() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'saved' | 'templates'>('saved');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);
  // REQ-2 — tech pack summaries only carry the linked projectId, not its code/title, so
  // the chip label is captured locally the moment a link is made/discovered (from the
  // picker's search result) and remembered here across re-renders/refetches, keyed by
  // tech pack id. A tech pack linked in an earlier session just shows "Linked" until
  // re-linked or the page is refreshed after the picker resolves it once.
  const [linkedProjectLabel, setLinkedProjectLabel] = useState<Record<string, string>>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: savedItems = [], isLoading: savedLoading } = useQuery({
    queryKey: ['tech-packs', 'saved'],
    queryFn: () => techPackApi.list(false),
  });
  const { data: templateItems = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['tech-packs', 'templates'],
    queryFn: () => techPackApi.list(true),
  });

  const items = tab === 'templates' ? templateItems : savedItems;
  const isLoading = tab === 'templates' ? templatesLoading : savedLoading;

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? items.filter((it) => it.name.toLowerCase().includes(q)) : items),
    [items, q],
  );

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [tab, q]);
  const shown = filtered.slice(0, visibleCount);

  const invalidateAll = () =>
    qc.invalidateQueries({ queryKey: ['tech-packs'] }); // both tabs

  function openBuilder(docId?: string) {
    if (!BUILDER_URL) {
      toast.error('Tech Pack Studio URL not configured (VITE_TECHPACK_BUILDER_URL).');
      return;
    }
    openTechPackBuilder(BUILDER_URL, docId ? { docId } : {});
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

  async function linkProject(id: string, project: ManufacturingProjectDto) {
    try {
      await techPackApi.patch(id, { projectId: project.id });
      setLinkedProjectLabel((m) => ({ ...m, [id]: `${project.code} · ${project.title || project.code}` }));
      setLinkingId(null);
      toast.success(`Linked to ${project.code}`);
      invalidateAll();
    } catch {
      toast.error('Failed to link project');
    }
  }

  async function unlinkProject(id: string) {
    try {
      await techPackApi.patch(id, { projectId: null });
      setLinkedProjectLabel((m) => {
        const next = { ...m };
        delete next[id];
        return next;
      });
      toast.success('Unlinked from project');
      invalidateAll();
    } catch {
      toast.error('Failed to unlink project');
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
      <div className="p-5 sm:p-8">
        <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm">
          <StatTile label="Saved documents" value={savedItems.length} icon="description" color="var(--p-primary)" />
          <StatTile label="Templates" value={templateItems.length} icon="bookmark" color="#b45309" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center bg-black/[0.04] rounded-lg p-1 w-fit">
            {(['saved', 'templates'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${tab === t ? 'bg-white shadow-sm' : ''}`}
                style={{ color: tab === t ? 'var(--p-primary)' : 'var(--p-on-surface-variant)' }}
              >
                {t === 'saved' ? 'Saved' : 'Templates'}
              </button>
            ))}
          </div>

          <div className="relative">
            <Sym name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              className="pl-8 pr-3 py-1.5 rounded-lg text-[13px] w-64 sm:w-72 outline-none border"
              style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Sym name="progress_activity" className="text-[32px] animate-spin" style={{ color: 'var(--p-primary)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name={q ? 'search_off' : 'description'} className="text-[40px] mb-2 block opacity-40" />
            <p className="text-[14px]">
              {q ? `No ${tab === 'templates' ? 'templates' : 'tech packs'} match "${query}".` : `No ${tab === 'templates' ? 'templates' : 'tech packs'} yet.`}
            </p>
            {!q && (
              <button onClick={() => openBuilder()} className="text-[13px] font-bold hover:underline mt-2" style={{ color: 'var(--p-primary)' }}>
                + Create one
              </button>
            )}
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((it) => (
              <div
                key={it.id}
                className="border rounded-2xl p-4 hover:shadow-md transition-shadow flex flex-col"
                style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(0,103,106,0.1)', color: 'var(--p-primary)' }}>
                    <Sym name={it.isTemplate ? 'bookmark' : 'description'} className="text-[20px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setRenaming(it.id)} className="p-1 rounded hover:bg-black/5" style={{ color: 'var(--p-on-surface-variant)' }} title="Rename">
                      <Sym name="edit" className="text-[17px]" />
                    </button>
                    <button onClick={() => remove(it.id)} className="p-1 rounded hover:bg-black/5" style={{ color: 'var(--p-on-surface-variant)' }} title="Delete">
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
                    className="mt-3 w-full text-[14px] px-2 py-1 rounded outline-none border"
                    style={{ borderColor: 'var(--p-primary)' }}
                  />
                ) : (
                  <p className="text-[15px] font-medium mt-3 truncate">{it.name}</p>
                )}

                <div className="flex items-center gap-1.5 mt-0.5">
                  {it.isTemplate && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}>TEMPLATE</span>
                  )}
                  <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                    {it.updatedAt ? `Updated ${formatInquiryDate(it.updatedAt)}` : '—'}
                  </p>
                </div>

                {/* REQ-2 — linked project chip / link affordance. */}
                <div className="mt-2 relative">
                  {it.projectId ? (
                    <div
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full"
                      style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}
                    >
                      <Sym name="link" className="text-[13px]" />
                      <span className="truncate max-w-[140px]">{linkedProjectLabel[it.id] ?? `Project #${it.projectId}`}</span>
                      <button
                        type="button"
                        onClick={() => void unlinkProject(it.id)}
                        className="hover:opacity-70"
                        title="Unlink project"
                      >
                        <Sym name="close" className="text-[13px]" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLinkingId(linkingId === it.id ? null : it.id)}
                      className="text-[11px] font-semibold flex items-center gap-1"
                      style={{ color: 'var(--p-on-surface-variant)' }}
                    >
                      <Sym name="add_link" className="text-[14px]" /> Link to project
                    </button>
                  )}
                  {linkingId === it.id && (
                    <ProjectLinkPicker
                      onPick={(project) => void linkProject(it.id, project)}
                      onClose={() => setLinkingId(null)}
                    />
                  )}
                </div>

                <div className="flex-1" />

                <div className="mt-4 space-y-1.5">
                  {it.isTemplate ? (
                    <>
                      <button
                        onClick={() => useTemplate(it.id)}
                        className="w-full py-2 rounded-lg text-white text-[13px] font-medium flex items-center justify-center gap-1.5"
                        style={{ background: 'var(--p-primary)' }}
                      >
                        <Sym name="add" className="text-[16px]" /> Use template
                      </button>
                      <div className="flex gap-1.5">
                        <button onClick={() => openBuilder(it.id)} className="flex-1 py-1.5 rounded-lg border text-[12px]" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>Edit template</button>
                        <button onClick={() => toggleTemplate(it.id, false)} className="flex-1 py-1.5 rounded-lg border text-[12px]" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>Make document</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openBuilder(it.id)}
                        className="w-full py-2 rounded-lg text-white text-[13px] font-medium"
                        style={{ background: 'var(--p-primary)' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleTemplate(it.id, true)}
                        className="w-full py-1.5 rounded-lg border text-[12px] flex items-center justify-center gap-1.5"
                        style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}
                      >
                        <Sym name="bookmark" className="text-[15px]" /> Save as template
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {filtered.length > visibleCount && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="px-5 py-2 rounded-lg border text-[13px] font-semibold"
                style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-primary)' }}
              >
                Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </AdminShell>
  );
}

/** REQ-2 — small inline search-as-you-type project picker, in the spirit of the chat
 *  @-mention pickers elsewhere in the portal but self-contained here: those are scoped to
 *  one customer's own projects (chat is always inside one customer's workspace), while
 *  this card has no customer context, so it searches cross-customer via the same
 *  `projectApi.list({ search })` the main admin Projects list page uses. */
function ProjectLinkPicker({
  onPick,
  onClose,
}: {
  onPick: (project: ManufacturingProjectDto) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ManufacturingProjectDto[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = window.setTimeout(() => {
      projectApi
        .list({ search: q || undefined })
        .then((rows) => {
          if (!cancelled) setResults(rows.slice(0, 8));
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q]);

  return (
    <div
      ref={boxRef}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-20 top-full left-0 mt-1 w-72 rounded-xl border shadow-lg overflow-hidden"
      style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
    >
      <div className="p-2 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search projects by code or title…"
          className="w-full px-2.5 py-1.5 rounded-lg text-[12.5px] outline-none border"
          style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface)' }}
        />
      </div>
      <div className="max-h-56 overflow-y-auto">
        {loading ? (
          <p className="text-[12px] px-3 py-3" style={{ color: 'var(--p-on-surface-variant)' }}>Searching…</p>
        ) : results.length === 0 ? (
          <p className="text-[12px] px-3 py-3" style={{ color: 'var(--p-on-surface-variant)' }}>No projects found.</p>
        ) : (
          results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p)}
              className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-black/[0.03] flex flex-col"
            >
              <span className="font-semibold truncate">{p.code}</span>
              <span className="truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{p.title || p.clientName || '—'}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
