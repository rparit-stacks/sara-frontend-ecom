import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell from '@/components/portal/AdminShell';
import { Pill } from '@/components/portal/Pill';
import { Sym } from '@/components/portal/Sym';
import ProjectAssignModal from '@/components/portal/ProjectAssignModal';
import { STAGE_TONE, type Stage } from '@/components/portal/adminData';
import { STAGES, stageDef, type StageKey } from '@/components/manufacturing/stages';
import { projectApi } from '@/lib/api';
import { getStoredAdminUser, isSuperAdmin } from '@/lib/adminAccess';
import { highlightText } from '@/lib/highlightText';
import { parseServerDate, formatServerDate } from '@/lib/serverTime';

const stageLabel = (key?: string) => stageDef((key as StageKey) || 'INQUIRY').label;

const NEW_WINDOW_MS = 48 * 60 * 60 * 1000;
const isNew = (createdAt?: string) => {
  const d = parseServerDate(createdAt);
  return !!d && Date.now() - d.getTime() < NEW_WINDOW_MS;
};
const fmtDate = (iso?: string) => formatServerDate(iso);

const stageTone = (key?: string) => STAGE_TONE[stageLabel(key) as Stage];

function formatUpdated(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function PortalAdminProjects() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const superAdmin = isSuperAdmin(getStoredAdminUser());
  const [q, setQ] = useState('');
  const [stage, setStage] = useState<StageKey | 'All'>('All');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [assignOpen, setAssignOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['admin-projects', q, stage],
    queryFn: () => projectApi.list({
      search: q || undefined,
      stage: stage === 'All' ? undefined : stage,
    }),
  });

  const deleteMut = useMutation({
    mutationFn: (code: string) => projectApi.deleteProject(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-projects'] });
      toast.success('Project deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete project'),
  });

  const confirmDelete = (e: React.MouseEvent, code: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Delete project "${name}" (${code})? This permanently removes all its channels and messages. This cannot be undone.`)) {
      deleteMut.mutate(code);
    }
  };

  const stageFilters = useMemo(() => ['All' as const, ...STAGES.map((s) => s.key)], []);

  const selectedProjects = projects.filter((p) => selected.has(p.id));
  const allSelected = projects.length > 0 && projects.every((p) => selected.has(p.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(projects.map((p) => p.id)));
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AdminShell title="Projects">
      <div className="p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex items-center gap-2 border rounded-lg px-3 h-9 sm:max-w-xs flex-1" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
            <Sym name="search" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects, clients…" className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[13px]" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {stageFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStage(s)}
                className="px-3 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap"
                style={s === stage ? { background: 'var(--p-primary)', color: '#fff' } : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
              >
                {s === 'All' ? 'All' : stageDef(s).label}
              </button>
            ))}
          </div>
        </div>

        {superAdmin && selected.size > 0 && (
          <div className="mb-4 flex items-center gap-3 px-4 py-2.5 rounded-xl border" style={{ borderColor: 'var(--p-outline-variant)', background: 'rgba(0,103,106,0.06)' }}>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--p-primary)' }}>{selected.size} selected</span>
            <button
              type="button"
              onClick={() => setAssignOpen(true)}
              className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white flex items-center gap-1.5"
              style={{ background: 'var(--p-primary)' }}
            >
              <Sym name="person_add" className="text-[16px]" /> Assign to admin
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className="text-[13px] underline" style={{ color: 'var(--p-on-surface-variant)' }}>Clear</button>
          </div>
        )}

        <div className="border rounded-xl overflow-hidden overflow-x-auto" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr style={{ background: 'var(--p-surface-container-low)' }}>
                {superAdmin && (
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all projects" />
                  </th>
                )}
                {['Project', 'Client', 'Designs', 'Stage', 'Progress', 'Value', 'Updated'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={superAdmin ? 9 : 8} className="text-center py-16">
                    <Sym name="progress_activity" className="text-[24px] animate-spin inline-block" style={{ color: 'var(--p-on-surface-variant)' }} />
                  </td>
                </tr>
              ) : projects.map((p, i) => (
                <tr
                  key={p.code}
                  onClick={() => navigate(`/portal-admin/projects/${p.code}`)}
                  className="cursor-pointer hover:bg-black/[0.02]"
                  style={{
                    borderTop: i ? '1px solid var(--p-outline-variant)' : undefined,
                    background: isNew(p.createdAt) ? 'color-mix(in srgb, var(--p-primary) 6%, transparent)' : selected.has(p.id) ? 'rgba(0,103,106,0.04)' : undefined,
                  }}
                >
                  {superAdmin && (
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} aria-label={`Select ${p.code}`} />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[13px]">{highlightText(p.title?.trim() || 'Untitled project', q)}</p>
                      {isNew(p.createdAt) && (
                        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--p-primary)' }}>New</span>
                      )}
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                      {highlightText(p.code, q)} · {highlightText(p.inquiryReference || '', q)}
                      {p.createdAt && <> · Created {fmtDate(p.createdAt)}</>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[13px]">{highlightText(p.clientName || p.brand || '—', q)}</td>
                  <td className="px-4 py-3 text-[13px]">{p.designCount ?? 1}</td>
                  <td className="px-4 py-3"><Pill label={stageLabel(p.currentStage)} tone={stageTone(p.currentStage)} /></td>
                  <td className="px-4 py-3 w-32">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--p-surface-container-high)' }}>
                        <div className="h-full rounded-full" style={{ width: `${p.progressPercent ?? 0}%`, background: 'var(--p-primary)' }} />
                      </div>
                      <span className="text-[11px] font-bold w-8">{p.progressPercent ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-[13px]">{p.valueDisplay || 'TBD'}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{formatUpdated(p.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      title="Delete project"
                      onClick={(e) => confirmDelete(e, p.code, p.title || p.brand || p.code)}
                      disabled={deleteMut.isPending}
                      className="p-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Sym name="delete" className="text-[18px]" style={{ color: '#b42318' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && projects.length === 0 && (
            <div className="text-center py-16 text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>No projects match.</div>
          )}
        </div>
      </div>

      <ProjectAssignModal
        open={assignOpen}
        projectIds={selectedProjects.map((p) => p.id)}
        projectLabels={selectedProjects.map((p) => p.title?.trim() || p.code)}
        onClose={() => setAssignOpen(false)}
        onAssigned={() => {
          qc.invalidateQueries({ queryKey: ['admin-projects'] });
          toast.success('Projects assigned — notification email sent');
          setSelected(new Set());
        }}
      />
    </AdminShell>
  );
}
