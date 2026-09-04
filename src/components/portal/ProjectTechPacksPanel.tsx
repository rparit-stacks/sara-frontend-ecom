import { Sym } from '@/components/portal/Sym';
import { formatInquiryDate } from '@/components/inquiry/inquiryUtils';
import type { ProjectTechPackSummary } from '@/lib/api';

// The standalone Tech Pack Studio (deployed on Vercel) — same origin AdminTechPacks.tsx
// opens for New/Edit. Reads/writes the SAME studio_sara rows via the shared API.
const BUILDER_URL = (import.meta.env.VITE_TECHPACK_BUILDER_URL as string | undefined)?.replace(/\/$/, '') ?? '';

/**
 * REQ-2 (Tech Pack Creation, Saving & Project Linking) — "Tech Packs" folder under a
 * project's Resources, mirroring REQ-1's ProjectResourceLinksPanel structure/styling.
 *
 * A tech pack can be created straight from here (`onCreate`, admin only) — it opens the
 * builder with `?projectId=` set, so the doc auto-links to this project from its very
 * first autosave, no separate "link from the Tech Packs list" step needed. An existing
 * tech pack can still be linked/unlinked from the admin Tech Packs list (AdminTechPacks.tsx)
 * for the case of reusing a doc that already existed before this project did.
 *
 * `editable` controls whether rows open the builder in an editable tab (admin) or the
 * client just gets a disabled/"view only" affordance — there is no read-only viewer for
 * an in-progress canvas doc yet (these aren't persisted PDFs), so "open" always means
 * "open the builder"; the client-facing copy just sets expectations accordingly.
 */
export default function ProjectTechPacksPanel({
  techPacks,
  isLoading,
  editable,
  onCreate,
}: {
  techPacks: ProjectTechPackSummary[];
  isLoading?: boolean;
  editable?: boolean;
  /** Admin-only — opens the builder pre-linked to this project. Omit to hide the button
   *  entirely (the client-facing panel never gets one). */
  onCreate?: () => void;
}) {
  function openBuilder(id: string) {
    if (!BUILDER_URL) return;
    window.open(`${BUILDER_URL}/?docId=${encodeURIComponent(id)}`, '_blank', 'noopener');
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="max-w-3xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-[20px]">Tech Packs</h2>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
              {editable
                ? 'Tech pack documents linked to this project.'
                : 'Tech pack documents your team has linked to this project.'}
            </p>
          </div>
          {onCreate && (
            <button
              type="button"
              onClick={onCreate}
              disabled={!BUILDER_URL}
              className="px-3 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 shrink-0 disabled:opacity-40"
              style={{ background: 'var(--p-primary)', color: 'var(--p-on-primary)' }}
            >
              <Sym name="add" className="text-[16px]" /> Create Tech Pack
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center"><Sym name="progress_activity" className="text-[28px] animate-spin" /></div>
        ) : techPacks.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
            <Sym name="description" className="text-[40px] opacity-40" />
            <p className="mt-2 font-semibold">No tech packs linked yet</p>
            <p className="text-[13px]">
              {editable ? 'Create one above, or link an existing one from the Tech Packs list.' : 'Your team will link tech pack documents here.'}
            </p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
            {techPacks.map((tp, i) => (
              <div
                key={tp.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-black/[0.02]"
                style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}
              >
                <div className="w-10 h-10 rounded flex items-center justify-center shrink-0" style={{ background: 'rgba(0,103,106,0.1)', color: 'var(--p-primary)' }}>
                  <Sym name={tp.isTemplate ? 'bookmark' : 'description'} className="text-[20px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px] truncate">{tp.name}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>
                    {tp.updatedAt ? `Updated ${formatInquiryDate(tp.updatedAt)}` : '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openBuilder(tp.id)}
                  disabled={!BUILDER_URL}
                  className="px-2.5 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1 shrink-0 disabled:opacity-40"
                  style={{ color: 'var(--p-primary)' }}
                >
                  <Sym name="open_in_new" className="text-[16px]" /> {editable ? 'Open to edit' : 'Open in Tech Pack Studio'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
