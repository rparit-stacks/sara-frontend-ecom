import { useState } from 'react';
import PortalShell from '@/components/portal/PortalShell';
import PortalEmptyInquiry from '@/components/portal/PortalEmptyInquiry';
import { Sym } from '@/components/portal/Sym';
import { fileKind } from '@/lib/clientPortalAggregate';
import { useClientPortalAggregate } from '@/hooks/useClientPortalAggregate';

const KIND_META = {
  pdf: { icon: 'picture_as_pdf', bg: 'rgba(186,26,26,0.1)', fg: 'var(--p-error)' },
  image: { icon: 'image', bg: 'rgba(146,70,35,0.1)', fg: 'var(--p-primary)' },
  doc: { icon: 'description', bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  video: { icon: 'movie', bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface)' },
  other: { icon: 'attach_file', bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface)' },
};

export default function PortalFiles() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [q, setQ] = useState('');
  const { projects, files, isLoading } = useClientPortalAggregate();

  const shown = files.filter(
    (f) =>
      !q ||
      f.name.toLowerCase().includes(q.toLowerCase()) ||
      f.projectTitle.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <PortalShell active="files">
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="h-14 px-4 sm:px-8 border-b flex items-center justify-between shrink-0 gap-2" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <h2 className="font-display text-[18px]">Files</h2>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
              <button type="button" onClick={() => setView('grid')} className="px-2 py-1.5" style={view === 'grid' ? { background: 'var(--p-primary)', color: '#fff' } : { color: 'var(--p-on-surface-variant)' }}><Sym name="grid_view" className="text-[18px]" /></button>
              <button type="button" onClick={() => setView('list')} className="px-2 py-1.5" style={view === 'list' ? { background: 'var(--p-primary)', color: '#fff' } : { color: 'var(--p-on-surface-variant)' }}><Sym name="view_list" className="text-[18px]" /></button>
            </div>
          </div>
        </div>

        {projects.length > 0 && (
          <div className="px-4 sm:px-8 pt-5">
            <div className="max-w-md flex items-center gap-2 border rounded-lg px-3 h-9" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
              <Sym name="search" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[13px]" />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5">
          {isLoading ? (
            <div className="flex justify-center py-20"><Sym name="progress_activity" className="text-[28px] animate-spin" /></div>
          ) : projects.length === 0 ? (
            <PortalEmptyInquiry compact />
          ) : shown.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
              <Sym name="folder_open" className="text-[40px] opacity-40" />
              <p className="mt-2 text-[14px]">No files shared yet across your projects.</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {shown.map((f) => {
                const kind = fileKind(f.url);
                const k = KIND_META[kind];
                const isImg = kind === 'image';
                return (
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="border rounded-xl overflow-hidden card-hover" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
                    <div className="h-28 flex items-center justify-center" style={{ background: isImg ? undefined : k.bg }}>
                      {isImg ? <img src={f.url} className="w-full h-full object-cover" alt="" /> : <Sym name={k.icon} className="text-[40px]" style={{ color: k.fg }} />}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-[13px] truncate">{f.name}</p>
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{f.projectTitle}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="max-w-4xl border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
              {shown.map((f, i) => {
                const kind = fileKind(f.url);
                const k = KIND_META[kind];
                return (
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 px-4 py-3 hover:bg-black/[0.02]" style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                    <div className="w-9 h-9 rounded flex items-center justify-center shrink-0" style={{ background: k.bg, color: k.fg }}><Sym name={k.icon} className="text-[18px]" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] truncate">{f.name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>{f.projectTitle}{f.authorName ? ` · ${f.authorName}` : ''}</p>
                    </div>
                    <Sym name="download" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </PortalShell>
  );
}
