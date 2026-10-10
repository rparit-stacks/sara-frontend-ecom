import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminRolesApi, ProjectDesignCatalogDto } from '@/lib/api';

interface Props {
  adminId: number;
  adminName: string;
  catalog: ProjectDesignCatalogDto[];
  fullProjects: Set<number>;
  partialDesigns: Record<number, Set<number>>;
  dirty: boolean;
}

const cardStyle = { borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' } as const;
const mutedStyle = { color: 'var(--p-on-surface-variant)' } as const;
const chipStyle = { background: 'rgba(0,103,106,0.10)', color: 'var(--p-primary)' } as const;

const humanize = (s: string) => s.toLowerCase().replace(/_/g, ' ');

/**
 * One-glance "role = what they can do, assignment = which projects" for the selected admin.
 * Reflects unsaved assignment edits live; role comes from the RBAC effective-permissions API.
 */
export default function AdminAccessSummary({ adminId, adminName, catalog, fullProjects, partialDesigns, dirty }: Props) {
  const [showCodes, setShowCodes] = useState(false);

  const { data: eff, isLoading, isError } = useQuery({
    queryKey: ['admin-effective-permissions', adminId],
    queryFn: () => adminRolesApi.effectivePermissions(adminId),
  });

  const portalGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const code of eff?.permissionCodes ?? []) {
      if (!code.startsWith('PORTAL_')) continue;
      const group = code.split('_')[1] ?? 'OTHER';
      groups.set(group, [...(groups.get(group) ?? []), code]);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [eff]);

  const portalCount = portalGroups.reduce((n, [, c]) => n + c.length, 0);
  const storeCount = (eff?.permissionCodes ?? []).filter((c) => c.startsWith('STORE_')).length;

  const byId = useMemo(() => new Map(catalog.map((p) => [p.projectId, p])), [catalog]);
  const full = [...fullProjects].map((id) => byId.get(id)).filter(Boolean) as ProjectDesignCatalogDto[];
  const partial = Object.entries(partialDesigns)
    .filter(([pid, set]) => set.size > 0 && !fullProjects.has(Number(pid)))
    .map(([pid, set]) => ({ project: byId.get(Number(pid)), count: set.size }))
    .filter((x) => x.project);

  const noRole = !!eff && !eff.mainAdmin && !eff.role;
  const noPortalPerms = !!eff && !eff.mainAdmin && !!eff.role && portalCount === 0;
  const noProjects = full.length === 0 && partial.length === 0;

  const warnings: string[] = [];
  if (noRole) warnings.push('No role assigned — this admin is locked out, so project assignments have no effect until you assign a role.');
  if (eff?.role && !eff.role.active) warnings.push('Their role is inactive — permissions are not applied.');
  if (noPortalPerms) warnings.push('Their role has no Portal permissions — they cannot use the portal even for assigned projects.');
  if (!noRole && !noPortalPerms && noProjects && !eff?.mainAdmin) warnings.push('No projects assigned yet — the portal will show them nothing.');

  return (
    <div className="rounded-2xl border p-4 space-y-3" style={cardStyle}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-[14px]">Access summary · {adminName}</p>
        <span className="text-[11px]" style={mutedStyle}>
          Effective access = <strong>role</strong> (what) × <strong>assignment</strong> (where)
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase" style={mutedStyle}>Role · what they can do</p>
            <Link to="/admin-sara/roles" className="text-[11px] font-semibold" style={{ color: 'var(--p-primary)' }}>
              Change role →
            </Link>
          </div>
          {isLoading ? (
            <p className="text-[13px]" style={mutedStyle}>Loading…</p>
          ) : isError || !eff ? (
            <p className="text-[13px]" style={mutedStyle}>Could not load role.</p>
          ) : eff.mainAdmin ? (
            <p className="text-[13px]"><strong>Main admin</strong> — full access to everything, every project.</p>
          ) : !eff.role ? (
            <p className="text-[13px] font-semibold text-red-700">No role</p>
          ) : (
            <>
              <p className="text-[14px] font-semibold">{eff.role.name}</p>
              <p className="text-[12px]" style={mutedStyle}>
                {portalCount} portal · {storeCount} store permissions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {portalGroups.map(([group, codes]) => (
                  <span key={group} className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={chipStyle}>
                    {humanize(group)} · {codes.length}
                  </span>
                ))}
              </div>
              {portalCount > 0 && (
                <button type="button" className="text-[11px] font-semibold" style={{ color: 'var(--p-primary)' }} onClick={() => setShowCodes((v) => !v)}>
                  {showCodes ? 'Hide' : 'Show'} all portal permissions
                </button>
              )}
              {showCodes && (
                <ul className="max-h-40 overflow-y-auto text-[11px] space-y-0.5" style={mutedStyle}>
                  {portalGroups.flatMap(([, codes]) => codes).map((c) => (
                    <li key={c}>{humanize(c.replace(/^PORTAL_/, ''))}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase" style={mutedStyle}>Assignment · which projects</p>
            {dirty && <span className="text-[11px] font-semibold text-amber-700">Unsaved changes</span>}
          </div>
          {eff?.mainAdmin ? (
            <p className="text-[13px]">All projects (main admin ignores assignments).</p>
          ) : noProjects ? (
            <p className="text-[13px]" style={mutedStyle}>No projects assigned.</p>
          ) : (
            <>
              <p className="text-[12px]" style={mutedStyle}>{full.length} full · {partial.length} partial</p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {full.map((p) => (
                  <span key={p.projectId} className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={chipStyle} title={p.title}>
                    {p.code} · full
                  </span>
                ))}
                {partial.map(({ project, count }) => (
                  <span key={project!.projectId} className="text-[11px] px-2 py-0.5 rounded-full border" style={{ borderColor: 'var(--p-outline-variant)' }} title={project!.title}>
                    {project!.code} · {count} design{count === 1 ? '' : 's'}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <ul className="space-y-1">
          {warnings.map((w) => (
            <li key={w} className="text-[12px] rounded-lg px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200">{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
