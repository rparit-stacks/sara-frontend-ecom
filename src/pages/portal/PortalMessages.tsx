import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalShell from '@/components/portal/PortalShell';
import PortalEmptyInquiry from '@/components/portal/PortalEmptyInquiry';
import { Sym } from '@/components/portal/Sym';
import { stageDef, statusLabelFor } from '@/components/manufacturing/stages';
import { useClientPortalProjects } from '@/hooks/useClientPortalAggregate';

const RADIUS = 45;
const CIRC = 2 * Math.PI * RADIUS;

function ProgressRing({ pct }: { pct: number }) {
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={RADIUS} fill="transparent" strokeWidth="3" style={{ stroke: 'var(--p-surface-container)' }} />
        <circle
          className="progress-ring__circle"
          cx="50"
          cy="50"
          r={RADIUS}
          fill="transparent"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - pct / 100)}
          style={{ stroke: 'var(--p-primary)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold text-[14px]" style={{ color: 'var(--p-primary)' }}>{pct}%</span>
      </div>
    </div>
  );
}

export default function PortalMessages() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: projects = [], isLoading } = useClientPortalProjects();

  const filtered = projects.filter(
    (p) =>
      !search ||
      (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()),
  );

  const hasProjects = projects.length > 0;

  return (
    <PortalShell active="dms" search={search} onSearchChange={setSearch}>
      {hasProjects && (
        <aside
          className="w-64 border-r flex flex-col shrink-0 hidden md:flex"
          style={{ background: 'var(--p-surface-container-low)', borderColor: 'var(--p-outline-variant)' }}
        >
          <div className="p-4 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <h3 className="font-bold text-[15px]">Your projects</h3>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
              Open a project to chat with the team.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <nav className="space-y-1">
              {projects.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => navigate(`/portal/projects/${encodeURIComponent(p.code)}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors text-left"
                  style={{ color: 'var(--p-on-surface-variant)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--p-surface-container-high)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="w-8 h-8 rounded overflow-hidden shrink-0 border flex items-center justify-center" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-high)' }}>
                    <Sym name="factory" className="text-[16px]" style={{ color: 'var(--p-primary)' }} />
                  </div>
                  <span className="text-[13px] truncate">{p.title?.trim() || p.code}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="h-14 px-8 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <h2 className="font-display text-[18px]">Projects</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center py-24">
                <Sym name="progress_activity" className="text-[32px] animate-spin" style={{ color: 'var(--p-primary)' }} />
              </div>
            ) : !hasProjects ? (
              <PortalEmptyInquiry />
            ) : (
              <>
                <p className="text-[16px] mb-8 max-w-xl" style={{ color: 'var(--p-on-surface-variant)' }}>
                  {projects.length} active {projects.length === 1 ? 'project' : 'projects'} — select one to open chats, quotes and files.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((p) => {
                    const stageLabel = stageDef(p.currentStage).label;
                    const status = statusLabelFor(p.currentStage, p.currentStatus);
                    return (
                      <div
                        key={p.code}
                        onClick={() => navigate(`/portal/projects/${encodeURIComponent(p.code)}`)}
                        className="border p-6 card-hover flex flex-col h-full rounded-xl cursor-pointer"
                        style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--p-on-surface-variant)' }}>
                              {p.code}
                            </span>
                            <h3 className="text-[17px] font-semibold" style={{ color: 'var(--p-on-surface)' }}>
                              {p.title?.trim() || 'Untitled project'}
                            </h3>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter" style={{ background: 'var(--p-surface-container)', color: 'var(--p-on-surface-variant)' }}>
                            {stageLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-5 mb-4">
                          <ProgressRing pct={p.progressPercent ?? 0} />
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold uppercase opacity-60" style={{ color: 'var(--p-on-surface-variant)' }}>Status</p>
                            <p className="font-bold text-[13px]" style={{ color: 'var(--p-on-surface)' }}>{status}</p>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--p-outline-variant)' }}>
                          <span className="text-[13px] font-bold" style={{ color: 'var(--p-primary)' }}>Open workspace</span>
                          <Sym name="arrow_forward_ios" className="opacity-40" style={{ color: 'var(--p-on-surface-variant)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filtered.length === 0 && search && (
                  <p className="text-center py-12 text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                    No projects match &ldquo;{search}&rdquo;
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </PortalShell>
  );
}
