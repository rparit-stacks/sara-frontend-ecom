import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import AdminShell from '@/components/portal/AdminShell';
import StatStrip from '@/components/portal/StatStrip';
import { Sym } from '@/components/portal/Sym';
import { portalAssignmentApi, type AdminPortalAssignmentDto } from '@/lib/api';
import { useAdminPresence } from '@/hooks/useAdminPresence';
import PresenceDot from '@/components/admin/PresenceDot';
import AdminAccessSummary from '@/components/portal/AdminAccessSummary';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';

type DesignMap = Record<number, Set<number>>;
type Mode = 'none' | 'designs' | 'full';
type Filter = 'all' | 'assigned' | 'unassigned';

const PROJECT_PAGE_SIZE = 20;

const MODES: { key: Mode; label: string; icon: string; hint: string }[] = [
  { key: 'none', label: 'No access', icon: 'block', hint: 'This admin does not see the project' },
  { key: 'designs', label: 'Some designs', icon: 'palette', hint: 'Only the design channels you tick' },
  { key: 'full', label: 'Full project', icon: 'lock_open', hint: 'Every design channel, brief, invoices and quotations' },
];

const initials = (name: string) =>
  name.split(/\s+/).map((p) => p[0]).filter(Boolean).join('').slice(0, 2) || '?';

export default function PortalAdminAssignments() {
  const { hasAny } = useAdminPermissions();
  const canSave = hasAny(P.PORTAL_ASSIGNMENTS_SAVE);
  const qc = useQueryClient();
  const reduced = !!useReducedMotion();
  const [adminId, setAdminId] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showHow, setShowHow] = useState(false);
  const [fullProjects, setFullProjects] = useState<Set<number>>(new Set());
  const [partialDesigns, setPartialDesigns] = useState<DesignMap>({});
  // "Some designs" chosen on a project but no design ticked yet: still counts as that mode on screen.
  const [designMode, setDesignMode] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PROJECT_PAGE_SIZE);
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

  const applySaved = (data: AdminPortalAssignmentDto) => {
    setFullProjects(new Set(data.fullProjectIds));
    const map: DesignMap = {};
    for (const row of data.designAssignments) {
      if (!map[row.projectId]) map[row.projectId] = new Set();
      map[row.projectId].add(row.designId);
    }
    setPartialDesigns(map);
    setDesignMode(new Set());
    setDirty(false);
  };

  useEffect(() => {
    if (!saved || adminId === '') return;
    applySaved(saved);
  }, [saved, adminId]);

  // Start on the first admin instead of an empty screen.
  useEffect(() => {
    if (adminId === '' && portalAdmins.length > 0) setAdminId(portalAdmins[0].adminId);
  }, [portalAdmins, adminId]);

  const modeOf = (projectId: number): Mode => {
    if (fullProjects.has(projectId)) return 'full';
    if ((partialDesigns[projectId]?.size ?? 0) > 0 || designMode.has(projectId)) return 'designs';
    return 'none';
  };

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.clientName || '').toLowerCase().includes(q),
    );
  }, [catalog, search]);

  const counts = useMemo(() => {
    let full = 0, designs = 0;
    for (const p of catalog) {
      const m = modeOf(p.projectId);
      if (m === 'full') full++;
      else if (m === 'designs') designs++;
    }
    return { full, designs, none: catalog.length - full - designs };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, fullProjects, partialDesigns, designMode]);

  const filteredCatalog = useMemo(
    () => searched.filter((p) => {
      if (filter === 'all') return true;
      const assigned = modeOf(p.projectId) !== 'none';
      return filter === 'assigned' ? assigned : !assigned;
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searched, filter, fullProjects, partialDesigns, designMode],
  );

  useEffect(() => { setVisibleCount(PROJECT_PAGE_SIZE); }, [search, adminId, filter]);
  const visibleCatalog = filteredCatalog.slice(0, visibleCount);

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
      setDesignMode((prev) => { const n = new Set(prev); n.delete(projectId); return n; });
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

  const setAllDesigns = (projectId: number, ids: number[], on: boolean) => {
    if (fullProjects.has(projectId)) return;
    setPartialDesigns((prev) => {
      const next = { ...prev };
      if (on && ids.length > 0) next[projectId] = new Set(ids);
      else delete next[projectId];
      return next;
    });
    setDirty(true);
  };

  const chooseMode = (projectId: number, mode: Mode) => {
    if (mode === 'full') {
      toggleFullProject(projectId, true);
      return;
    }
    if (mode === 'designs') {
      setFullProjects((prev) => { const n = new Set(prev); n.delete(projectId); return n; });
      setDesignMode((prev) => new Set(prev).add(projectId));
      setExpanded((prev) => new Set(prev).add(projectId));
    } else {
      setFullProjects((prev) => { const n = new Set(prev); n.delete(projectId); return n; });
      setPartialDesigns((prev) => { const n = { ...prev }; delete n[projectId]; return n; });
      setDesignMode((prev) => { const n = new Set(prev); n.delete(projectId); return n; });
    }
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
      setDesignMode(new Set());
      toast.success('Assignments saved');
    },
    onError: (e: Error) => toast.error(e.message || 'Save failed'),
  });

  const selectedAdmin = portalAdmins.find((a) => a.adminId === adminId);
  const loading = adminsLoading || catalogLoading || (adminId !== '' && savedLoading);
  const onlineCount = portalAdmins.filter((a) => onlineAdminIds.has(a.adminId)).length;

  const shownAdmins = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    if (!q) return portalAdmins;
    return portalAdmins.filter((a) => (a.name || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q));
  }, [portalAdmins, adminSearch]);

  const selectAdmin = (id: number) => {
    if (id === adminId) return;
    if (dirty && !window.confirm('You have unsaved changes for this admin. Switch anyway?')) return;
    setAdminId(id);
    setDirty(false);
  };

  return (
    <AdminShell title="Portal assignments" search={search} onSearchChange={setSearch}>
      <div className="p-5 sm:p-8 pb-28 max-w-[1500px] space-y-6">
        {/* The numbers that frame the page */}
        <StatStrip
          items={[
            { label: 'Portal admins', value: portalAdmins.length },
            { label: 'Online now', value: onlineCount, tone: onlineCount > 0 ? 'good' : undefined },
            { label: 'Projects', value: catalog.length },
            {
              label: selectedAdmin ? `${selectedAdmin.name.split(' ')[0]}'s access` : 'Selected admin',
              value: selectedAdmin ? counts.full + counts.designs : '—',
              hint: selectedAdmin ? `${counts.full} full · ${counts.designs} partial` : undefined,
            },
          ]}
        />

        <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
          {/* TEAM */}
          <aside className="pa-card p-4 lg:sticky lg:top-4" data-ghost="groups">
            <div className="flex items-center justify-between mb-3">
              <h3 className="pa-card-title">Team</h3>
              <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: 'var(--p-on-surface-variant)' }}>
                {portalAdmins.length} admin{portalAdmins.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="relative mb-3">
              <Sym name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
              <input
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Find an admin…"
                className="w-full pl-9 pr-3 h-10 rounded-xl border text-[13.5px] outline-none"
                style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}
              />
            </div>

            {adminsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[74px] rounded-xl animate-pulse" style={{ background: 'var(--p-surface-container)' }} />)}
              </div>
            ) : portalAdmins.length === 0 ? (
              <p className="text-[13.5px] py-6 text-center" style={{ color: 'var(--p-on-surface-variant)' }}>
                No portal admins yet. Enable manufacturing portal access on an admin account first.
              </p>
            ) : shownAdmins.length === 0 ? (
              <p className="text-[13.5px] py-6 text-center" style={{ color: 'var(--p-on-surface-variant)' }}>No admin matches “{adminSearch}”.</p>
            ) : (
              <div className="space-y-2 max-h-[62vh] overflow-y-auto -mr-1 pr-1">
                {shownAdmins.map((a) => {
                  const isSelected = a.adminId === adminId;
                  const isOnline = onlineAdminIds.has(a.adminId);
                  const total = a.fullProjectCount + a.partialProjectCount;
                  const share = catalog.length ? Math.min(100, (total / catalog.length) * 100) : 0;
                  return (
                    <button
                      key={a.adminId}
                      type="button"
                      onClick={() => selectAdmin(a.adminId)}
                      className="pa-row w-full text-left rounded-xl border px-3 py-3 flex items-center gap-3"
                      style={{
                        borderColor: isSelected ? 'var(--p-primary)' : 'var(--p-outline-variant)',
                        background: isSelected ? 'var(--pa-teal-10)' : 'var(--p-surface-container-lowest)',
                        boxShadow: isSelected ? 'inset 3px 0 0 var(--p-primary)' : undefined,
                      }}
                    >
                      <div className="relative shrink-0">
                        <div className="pa-avatar">{initials(a.name || a.email)}</div>
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full" style={{ background: isOnline ? '#22c55e' : '#cbd5e1', boxShadow: '0 0 0 2px var(--p-surface-container-lowest, #fff)' }} title={isOnline ? 'Online' : 'Offline'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[14px] truncate">{a.name}</p>
                        <p className="text-[12px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{a.email}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="pa-bar !h-1.5 flex-1"><i style={{ width: `${share}%`, opacity: total ? 1 : 0 }} /></div>
                          <span className="text-[11.5px] font-semibold tabular-nums shrink-0" style={{ color: total ? 'var(--p-primary)' : 'var(--p-on-surface-variant)' }}>
                            {total === 0 ? 'none' : `${a.fullProjectCount} full · ${a.partialProjectCount} part`}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-[12px] mt-3" style={{ color: 'var(--p-on-surface-variant)' }}>You can assign any admin, online or not.</p>
          </aside>

          {/* DETAIL */}
          <section className="space-y-5 min-w-0">
            {!selectedAdmin ? (
              <div className="pa-card p-14 text-center">
                <Sym name="assignment_ind" className="text-[44px] opacity-40" style={{ color: 'var(--p-primary)' }} />
                <p className="font-bold text-[16px] mt-2">Choose an admin</p>
                <p className="text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>Pick someone from the team to see and change which projects they can open.</p>
              </div>
            ) : (
              <>
                {/* who */}
                <div className="pa-card p-5" data-ghost="verified_user">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="pa-avatar !w-14 !h-14 !text-[18px]">{initials(selectedAdmin.name || selectedAdmin.email)}</div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-[22px] leading-tight truncate">{selectedAdmin.name}</h2>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[13.5px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                        <span className="truncate">{selectedAdmin.email}</span>
                        <PresenceDot online={onlineAdminIds.has(selectedAdmin.adminId)} withLabel />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="pa-chip"><Sym name="lock_open" className="text-[16px]" /> {counts.full} full</span>
                      <span className="pa-chip"><Sym name="palette" className="text-[16px]" /> {counts.designs} partial</span>
                      <span className="pa-chip" style={{ background: 'var(--p-surface-container)', color: 'var(--p-on-surface-variant)' }}>{counts.none} none</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHow((v) => !v)}
                    className="mt-4 text-[13px] font-semibold flex items-center gap-1.5"
                    style={{ color: 'var(--p-primary)' }}
                  >
                    <Sym name={showHow ? 'expand_less' : 'info'} className="text-[18px]" /> {showHow ? 'Hide how access works' : 'How access works'}
                  </button>
                  <AnimatePresence initial={false}>
                    {showHow && (
                      <motion.ul
                        initial={reduced ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={reduced ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden text-[13.5px] space-y-1.5 pt-3"
                        style={{ color: 'var(--p-on-surface-variant)' }}
                      >
                        <li><strong style={{ color: 'var(--p-on-surface)' }}>Role</strong> decides <em>what</em> an admin can do; <strong style={{ color: 'var(--p-on-surface)' }}>assignment</strong> decides <em>which projects</em> they can do it on. They need both.</li>
                        <li><strong style={{ color: 'var(--p-on-surface)' }}>Full project</strong>: every design channel, brief, invoices &amp; quotations for that inquiry.</li>
                        <li><strong style={{ color: 'var(--p-on-surface)' }}>Some designs</strong>: the project shows on their dashboard with <strong>Announcements</strong> and <strong>General Chat</strong>, plus only the design channels you tick.</li>
                        <li>Quotations &amp; billing follow the linked inquiry when the admin has any access to that project.</li>
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                {!loading && catalog.length > 0 && (
                  <AdminAccessSummary
                    adminId={Number(adminId)}
                    adminName={selectedAdmin.name || selectedAdmin.email || 'Admin'}
                    catalog={catalog}
                    fullProjects={fullProjects}
                    partialDesigns={partialDesigns}
                    dirty={dirty}
                  />
                )}

                {/* projects */}
                <div className="pa-card overflow-hidden" data-ghost="folder_open">
                  <div className="px-5 pt-5 pb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="pa-card-title">Projects</h3>
                      <p className="pa-card-sub">
                        {filteredCatalog.length === catalog.length
                          ? `${catalog.length} project${catalog.length === 1 ? '' : 's'}`
                          : `${filteredCatalog.length} of ${catalog.length} projects`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="pa-seg">
                        {([
                          ['all', `All ${catalog.length}`],
                          ['assigned', `Assigned ${counts.full + counts.designs}`],
                          ['unassigned', `Not assigned ${counts.none}`],
                        ] as [Filter, string][]).map(([k, label]) => (
                          <button key={k} type="button" className={filter === k ? 'on' : ''} onClick={() => setFilter(k)} style={filter === k ? { background: 'var(--p-surface-container-lowest)', boxShadow: '0 1px 3px rgba(0,40,42,.12)' } : undefined}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <Sym name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search code, title, client…"
                          className="pl-9 pr-3 h-10 w-64 rounded-xl border text-[13.5px] outline-none"
                          style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}
                        />
                      </div>
                    </div>
                  </div>

                  {loading ? (
                    <div className="border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-5 py-5 flex items-center gap-4 animate-pulse" style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                          <div className="flex-1 space-y-2"><div className="h-3.5 w-48 rounded" style={{ background: 'var(--p-surface-container)' }} /><div className="h-3 w-32 rounded" style={{ background: 'var(--p-surface-container)' }} /></div>
                          <div className="h-10 w-72 rounded-xl" style={{ background: 'var(--p-surface-container)' }} />
                        </div>
                      ))}
                    </div>
                  ) : filteredCatalog.length === 0 ? (
                    <div className="border-t px-5 py-14 text-center" style={{ borderColor: 'var(--p-outline-variant)' }}>
                      <Sym name={search || filter !== 'all' ? 'search_off' : 'folder_off'} className="text-[40px] opacity-40" />
                      <p className="font-semibold text-[15px] mt-1">
                        {search ? 'No projects match your search' : filter === 'assigned' ? 'Nothing assigned yet' : filter === 'unassigned' ? 'Every project is assigned' : 'No manufacturing projects yet'}
                      </p>
                      {(search || filter !== 'all') && (
                        <button type="button" onClick={() => { setSearch(''); setFilter('all'); }} className="mt-2 text-[13.5px] font-semibold" style={{ color: 'var(--p-primary)' }}>Clear filters</button>
                      )}
                    </div>
                  ) : (
                    <div className="border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
                      {visibleCatalog.map((project, i) => {
                        const mode = modeOf(project.projectId);
                        const designSet = partialDesigns[project.projectId] || new Set<number>();
                        const isOpen = mode === 'designs' && (expanded.has(project.projectId) || designMode.has(project.projectId));
                        const allIds = project.designs.map((d) => d.id);
                        return (
                          <div
                            key={project.projectId}
                            className="relative"
                            style={{
                              borderTop: i ? '1px solid var(--p-outline-variant)' : undefined,
                              boxShadow: mode === 'full' ? 'inset 4px 0 0 var(--p-primary)' : mode === 'designs' ? 'inset 4px 0 0 var(--p-primary-fixed-dim)' : undefined,
                              background: mode === 'none' ? undefined : 'var(--pa-teal-06)',
                            }}
                          >
                            <div className="px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                              <div className="min-w-0 flex-1 basis-[220px]">
                                <p className="font-bold text-[14.5px] truncate">{project.title || project.code}</p>
                                <p className="text-[12.5px] mt-0.5 truncate" style={{ color: 'var(--p-on-surface-variant)' }}>
                                  {project.code}{project.clientName ? ` · ${project.clientName}` : ''}
                                  {project.designs.length > 0 && ` · ${project.designs.length} design${project.designs.length === 1 ? '' : 's'}`}
                                </p>
                              </div>
                              <div className="pa-seg" role="radiogroup" aria-label={`Access to ${project.code}`}>
                                {MODES.map((m) => {
                                  const on = mode === m.key;
                                  const disabled = m.key === 'designs' && project.designs.length === 0;
                                  return (
                                    <button
                                      key={m.key}
                                      type="button"
                                      role="radio"
                                      aria-checked={on}
                                      disabled={disabled}
                                      title={disabled ? 'This project has no design channels yet' : m.hint}
                                      onClick={() => chooseMode(project.projectId, m.key)}
                                      className={`!flex items-center gap-1.5 ${on ? 'on' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                      style={on
                                        ? m.key === 'none'
                                          ? { background: 'var(--p-surface-container-lowest)', boxShadow: '0 1px 3px rgba(0,40,42,.12)', color: 'var(--p-on-surface)' }
                                          : { background: 'var(--p-primary)', color: '#fff', boxShadow: '0 6px 14px -8px rgba(0,103,106,.85)' }
                                        : undefined}
                                    >
                                      <Sym name={m.icon} className="text-[17px]" fill={on} /> {m.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <AnimatePresence initial={false}>
                              {(mode === 'full' || isOpen) && project.designs.length > 0 && (
                                <motion.div
                                  key="designs"
                                  initial={reduced ? false : { opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={reduced ? undefined : { opacity: 0, height: 0 }}
                                  transition={{ duration: 0.22 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-5 pb-4 -mt-1">
                                    {mode === 'full' ? (
                                      <p className="text-[13px] flex items-center gap-2" style={{ color: 'var(--p-on-surface-variant)' }}>
                                        <Sym name="check_circle" className="text-[18px]" style={{ color: 'var(--p-primary)' }} fill />
                                        All {project.designs.length} design channel{project.designs.length === 1 ? '' : 's'} are included.
                                      </p>
                                    ) : (
                                      <>
                                        <div className="flex items-center justify-between mb-2">
                                          <p className="text-[12.5px] font-semibold" style={{ color: 'var(--p-on-surface-variant)' }}>
                                            Tick the design channels this admin can open · {designSet.size} of {allIds.length}
                                          </p>
                                          <div className="flex gap-3 text-[12.5px] font-semibold" style={{ color: 'var(--p-primary)' }}>
                                            <button type="button" onClick={() => setAllDesigns(project.projectId, allIds, true)}>Select all</button>
                                            <button type="button" onClick={() => setAllDesigns(project.projectId, allIds, false)}>Clear</button>
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {project.designs.map((d) => {
                                            const checked = designSet.has(d.id);
                                            return (
                                              <button
                                                key={d.id}
                                                type="button"
                                                role="checkbox"
                                                aria-checked={checked}
                                                onClick={() => toggleDesign(project.projectId, d.id, !checked)}
                                                className="px-3 py-1.5 rounded-xl border text-[13px] font-semibold flex items-center gap-1.5 active:scale-[0.96]"
                                                style={checked
                                                  ? { background: 'var(--p-primary)', color: '#fff', borderColor: 'var(--p-primary)' }
                                                  : { background: 'var(--p-surface-container-lowest)', color: 'var(--p-on-surface)', borderColor: 'var(--p-outline-variant)' }}
                                              >
                                                <Sym name={checked ? 'check' : 'palette'} className="text-[16px]" /> {d.name}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}

                      <div className="border-t px-5 py-3.5 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
                        <p className="text-[12.5px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                          Announcements &amp; General Chat are always included when a project is assigned.
                        </p>
                        {filteredCatalog.length > visibleCount ? (
                          <button
                            type="button"
                            onClick={() => setVisibleCount((n) => n + PROJECT_PAGE_SIZE)}
                            className="px-4 py-2 rounded-xl border text-[13px] font-bold"
                            style={{ borderColor: 'var(--p-primary)', color: 'var(--p-primary)' }}
                          >
                            Show {Math.min(PROJECT_PAGE_SIZE, filteredCatalog.length - visibleCount)} more · {visibleCount} of {filteredCatalog.length}
                          </button>
                        ) : (
                          filteredCatalog.length > PROJECT_PAGE_SIZE && (
                            <span className="text-[12.5px] font-semibold" style={{ color: 'var(--p-on-surface-variant)' }}>All {filteredCatalog.length} shown</span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Unsaved changes bar */}
      <AnimatePresence>
        {canSave && dirty && selectedAdmin && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[min(680px,calc(100vw-32px))] rounded-2xl border px-5 py-3.5 flex items-center gap-4"
            style={{ background: 'var(--p-on-surface)', borderColor: 'rgba(255,255,255,.12)', boxShadow: '0 24px 48px -16px rgba(0,40,42,.6)' }}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-amber-400 animate-pulse" />
            <p className="flex-1 min-w-0 text-[14px] font-semibold text-white truncate">
              Unsaved changes for {selectedAdmin.name}
            </p>
            <button
              type="button"
              onClick={() => { if (saved) applySaved(saved); }}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white/85 hover:bg-white/10"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="px-5 py-2 rounded-xl text-[13px] font-bold text-white flex items-center gap-2 disabled:opacity-60"
              style={{ background: 'var(--p-primary)' }}
            >
              <Sym name="save" className="text-[17px]" /> {saveMutation.isPending ? 'Saving…' : 'Save assignments'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminShell>
  );
}
