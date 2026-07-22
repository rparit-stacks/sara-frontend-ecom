import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell, { AdminBtn } from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import { portalAssignmentApi } from '@/lib/api';
import { useAdminPresence } from '@/hooks/useAdminPresence';
import PresenceDot from '@/components/admin/PresenceDot';

type DesignMap = Record<number, Set<number>>;

function designKey(projectId: number, designId: number) {
  return `${projectId}:${designId}`;
}

export default function PortalAdminAssignments() {
  const qc = useQueryClient();
  const [adminId, setAdminId] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [fullProjects, setFullProjects] = useState<Set<number>>(new Set());
  const [partialDesigns, setPartialDesigns] = useState<DesignMap>({});
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [dirty, setDirty] = useState(false);
  const onlineAdminIds = useAdminPresence();

  const { data: portalAdmins = [], isLoading: adminsLoading } = useQuery({
    queryKey: ['portal-assignment-admins'],
    queryFn: () => portalAssignmentApi.listPortalAdmins(),
  });

  const { data: catalog = [], isLoading: catalogLoading } = useQuery({
    queryKey: ['portal-assignment-catalog'],
    queryFn: () => portalAssignmentApi.projectsCatalog(),
  });

  const { data: saved, isLoading: savedLoading } = useQuery({
    queryKey: ['portal-assignment', adminId],
    queryFn: () => portalAssignmentApi.getAssignments(Number(adminId)),
    enabled: adminId !== '',
  });

  useEffect(() => {
    if (!saved || adminId === '') return;
    setFullProjects(new Set(saved.fullProjectIds));
    const map: DesignMap = {};
    for (const row of saved.designAssignments) {
      if (!map[row.projectId]) map[row.projectId] = new Set();
      map[row.projectId].add(row.designId);
    }
    setPartialDesigns(map);
    setDirty(false);
  }, [saved, adminId]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.clientName || '').toLowerCase().includes(q),
    );
  }, [catalog, search]);

  const toggleFullProject = (projectId: number, on: boolean) => {
    setFullProjects((prev) => {
      const next = new Set(prev);
      if (on) next.add(projectId);
      else next.delete(projectId);
      return next;
    });
    if (on) {
      setPartialDesigns((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
    }
    setDirty(true);
  };

  const toggleDesign = (projectId: number, designId: number, on: boolean) => {
    if (fullProjects.has(projectId)) return;
    setPartialDesigns((prev) => {
      const next = { ...prev };
      const set = new Set(next[projectId] || []);
      if (on) set.add(designId);
      else set.delete(designId);
      if (set.size === 0) delete next[projectId];
      else next[projectId] = set;
      return next;
    });
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (adminId === '') throw new Error('Select an admin');
      const designAssignments: { projectId: number; designId: number }[] = [];
      Object.entries(partialDesigns).forEach(([pid, ids]) => {
        const projectId = Number(pid);
        if (fullProjects.has(projectId)) return;
        ids.forEach((designId) => designAssignments.push({ projectId, designId }));
      });
      return portalAssignmentApi.setAssignments(Number(adminId), {
        fullProjectIds: Array.from(fullProjects),
        designAssignments,
      });
    },
    onSuccess: (data) => {
      qc.setQueryData(['portal-assignment', adminId], data);
      // Refresh the left-column summary counts for this admin.
      void qc.invalidateQueries({ queryKey: ['portal-assignment-admins'] });
      setDirty(false);
      toast.success('Assignments saved');
    },
    onError: (e: Error) => toast.error(e.message || 'Save failed'),
  });

  const selectedAdmin = portalAdmins.find((a) => a.adminId === adminId);
  const loading = adminsLoading || catalogLoading || (adminId !== '' && savedLoading);

  return (
    <AdminShell
      title="Portal assignments"
      search={search}
      onSearchChange={setSearch}
      actions={
        <AdminBtn
          icon="save"
          onClick={() => saveMutation.mutate()}
          variant={dirty ? 'primary' : 'ghost'}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save assignments'}
        </AdminBtn>
      }
    >
      <div className="max-w-5xl mx-auto p-5 sm:p-8 space-y-6">
        <div
          className="rounded-xl border p-4 text-[13px]"
          style={{ borderColor: 'var(--p-outline-variant)', background: 'rgba(0,103,106,0.06)' }}
        >
          <p className="font-semibold mb-1" style={{ color: 'var(--p-primary)' }}>How access works</p>
          <ul className="space-y-1" style={{ color: 'var(--p-on-surface-variant)' }}>
            <li><strong>Full project</strong> — admin sees every design channel, brief, invoices &amp; quotations for that inquiry.</li>
            <li><strong>Selected designs only</strong> — project appears on their dashboard; they get <strong>Announcements</strong> + <strong>General Chat</strong> plus only the checked design channels.</li>
            <li>Quotations &amp; billing follow the linked inquiry when the admin has any access to that project.</li>
          </ul>
        </div>

        <div className="grid sm:grid-cols-[320px_1fr] gap-5">
          <div
            className="rounded-xl border p-3 space-y-2 h-fit"
            style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
          >
            <div className="flex items-center justify-between px-1 pt-1">
              <label className="text-[11px] font-bold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>
                Portal admins
              </label>
              <span className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                {portalAdmins.filter((a) => onlineAdminIds.has(a.adminId)).length} online
              </span>
            </div>

            {adminsLoading ? (
              <p className="text-sm px-1 py-2" style={{ color: 'var(--p-on-surface-variant)' }}>Loading…</p>
            ) : portalAdmins.length === 0 ? (
              <p className="text-sm px-1 py-2" style={{ color: 'var(--p-on-surface-variant)' }}>
                No portal admins yet. Enable manufacturing portal access on an admin account first.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-0.5">
                {portalAdmins.map((a) => {
                  const isSelected = a.adminId === adminId;
                  const isOnline = onlineAdminIds.has(a.adminId);
                  const total = a.fullProjectCount + a.partialProjectCount;
                  return (
                    <button
                      key={a.adminId}
                      type="button"
                      onClick={() => {
                        setAdminId(a.adminId);
                        setDirty(false);
                      }}
                      className="w-full text-left rounded-lg border px-3 py-2.5 transition-colors"
                      style={{
                        borderColor: isSelected ? 'var(--p-primary)' : 'var(--p-outline-variant)',
                        background: isSelected ? 'rgba(0,103,106,0.08)' : 'var(--p-surface-container-low)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <PresenceDot online={isOnline} />
                        <span className="font-semibold text-[13px] truncate flex-1 min-w-0">{a.name}</span>
                        {total > 0 && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ background: 'rgba(0,103,106,0.12)', color: 'var(--p-primary)' }}
                          >
                            {total} project{total === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
                        {a.email}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
                        {total === 0
                          ? 'No projects assigned'
                          : `${a.fullProjectCount} full · ${a.partialProjectCount} partial`}
                        {' · '}
                        <span style={{ color: isOnline ? 'var(--p-primary)' : undefined }}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] px-1 pt-1" style={{ color: 'var(--p-on-surface-variant)' }}>
              You can assign any admin regardless of online status.
            </p>
          </div>

          <div className="space-y-3">
            {!adminId ? (
              <div
                className="rounded-xl border p-12 text-center text-[14px]"
                style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}
              >
                Select a portal admin to manage their assignments.
              </div>
            ) : loading ? (
              <div className="py-16 text-center text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>Loading…</div>
            ) : filteredCatalog.length === 0 ? (
              <div
                className="rounded-xl border p-12 text-center text-[14px]"
                style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}
              >
                {search ? 'No projects match your search.' : 'No manufacturing projects yet.'}
              </div>
            ) : (
              filteredCatalog.map((project) => {
                const isFull = fullProjects.has(project.projectId);
                const designSet = partialDesigns[project.projectId] || new Set<number>();
                const hasPartial = designSet.size > 0;
                const isOpen = expanded.has(project.projectId);
                return (
                  <div
                    key={project.projectId}
                    className="rounded-xl border overflow-hidden"
                    style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isFull}
                        onChange={(e) => toggleFullProject(project.projectId, e.target.checked)}
                        className="w-4 h-4 rounded accent-[var(--p-primary)]"
                        title="Full project access"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[14px] truncate">{project.title || project.code}</p>
                        <p className="text-[12px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>
                          {project.code}{project.clientName ? ` · ${project.clientName}` : ''}
                        </p>
                      </div>
                      {isFull && (
                        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,103,106,0.12)', color: 'var(--p-primary)' }}>
                          Full
                        </span>
                      )}
                      {!isFull && hasPartial && (
                        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,103,106,0.08)', color: 'var(--p-primary)' }}>
                          {designSet.size} design{designSet.size === 1 ? '' : 's'}
                        </span>
                      )}
                      {project.designs.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((prev) => {
                              const next = new Set(prev);
                              if (next.has(project.projectId)) next.delete(project.projectId);
                              else next.add(project.projectId);
                              return next;
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-black/5"
                          title={isOpen ? 'Collapse designs' : 'Pick individual designs'}
                        >
                          <Sym name={isOpen ? 'expand_less' : 'expand_more'} />
                        </button>
                      )}
                    </div>
                    {isOpen && project.designs.length > 0 && (
                      <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
                        <p className="text-[11px] font-bold uppercase mb-2" style={{ color: 'var(--p-on-surface-variant)' }}>
                          Design channels {isFull ? '(included via full project)' : ''}
                        </p>
                        {project.designs.map((d) => (
                          <label
                            key={designKey(project.projectId, d.id)}
                            className={`flex items-center gap-2 text-[13px] ${isFull ? 'opacity-50' : 'cursor-pointer'}`}
                          >
                            <input
                              type="checkbox"
                              disabled={isFull}
                              checked={isFull || designSet.has(d.id)}
                              onChange={(e) => toggleDesign(project.projectId, d.id, e.target.checked)}
                              className="w-4 h-4 rounded accent-[var(--p-primary)]"
                            />
                            <Sym name="palette" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                            {d.name}
                          </label>
                        ))}
                        <p className="text-[11px] pt-1" style={{ color: 'var(--p-on-surface-variant)' }}>
                          Announcements &amp; General Chat are always included when this project is assigned.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
