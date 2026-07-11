import { useNavigate } from 'react-router-dom';
import { Sym } from './Sym';
import type { WorkspaceView } from '@/lib/api';

const RESOURCES: { key: WorkspaceView; icon: string; label: string }[] = [
  { key: 'channels', icon: 'forum', label: 'Design Channels' },
  { key: 'brief', icon: 'description', label: 'Project Brief' },
  { key: 'quotation', icon: 'request_quote', label: 'Quotation' },
  { key: 'files', icon: 'folder_open', label: 'Files' },
  { key: 'invoices', icon: 'receipt_long', label: 'Invoices' },
];

export interface AdminProjectDesign {
  id: number;
  name: string;
  imageUrl?: string | null;
  system?: boolean;
  unreadCount?: number;
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="text-[10px] font-bold text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shrink-0"
      style={{ background: 'var(--p-primary)' }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function AdminProjectSidebar({
  projectCode,
  projectTitle,
  inquiryId,
  quoteReference,
  designs,
  activeDesignId,
  onSelectDesign,
  onAddDesign,
  onDeleteDesign,
  onRenameDesign,
  onRenameProject,
  onOpenSettings,
  view,
  onViewChange,
  threadsUnread = 0,
}: {
  projectCode: string;
  projectTitle?: string;
  inquiryId: number;
  quoteReference?: string;
  designs: AdminProjectDesign[];
  activeDesignId?: number;
  onSelectDesign: (id: number) => void;
  onAddDesign: () => void;
  onDeleteDesign: (id: number) => void;
  onRenameDesign?: (designId: number, currentName: string) => void;
  onRenameProject?: () => void;
  onOpenSettings?: () => void;
  view: WorkspaceView;
  onViewChange: (v: WorkspaceView) => void;
  threadsUnread?: number;
}) {
  const navigate = useNavigate();
  const chatsUnread = designs.reduce((n, d) => n + (d.unreadCount ?? 0), 0);

  const goResource = (key: string) => {
    if (key === 'channels') onViewChange('channels');
    else if (key === 'quotation') onViewChange('quotation');
    else if (key === 'brief') onViewChange('brief');
    else if (key === 'files') onViewChange('files');
    else if (key === 'invoices') onViewChange('invoices');
  };

  const Item = ({ icon, label, on, onClick, badge }: { icon: string; label: string; on: boolean; onClick: () => void; badge?: number }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-1.5 rounded text-[14px] text-left transition-colors relative"
      style={on ? { background: 'rgba(0,103,106,0.1)', color: 'var(--p-primary)', fontWeight: 700 } : { color: 'var(--p-on-surface-variant)' }}
      onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--p-surface-container-high)'; }}
      onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}
    >
      <Sym name={icon} fill={on} /> <span className="flex-1 truncate">{label}</span>
      {badge ? (
        <span className="text-[10px] font-bold text-white rounded-full px-1.5 min-w-[18px] text-center" style={{ background: 'var(--p-primary)' }}>{badge}</span>
      ) : null}
    </button>
  );

  return (
    <aside className="w-60 sm:w-64 border-r flex-col shrink-0 hidden md:flex" style={{ background: 'var(--p-surface-container-low)', borderColor: 'var(--p-outline-variant)' }}>
      <div className="p-4 border-b flex items-center justify-between gap-2 min-w-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
        <button onClick={() => navigate('/portal-admin/projects')} className="flex items-center gap-2 min-w-0 text-left flex-1">
          <Sym name="arrow_back_ios" className="text-[14px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
          <div className="min-w-0">
            <h3 className="font-bold text-[15px] truncate">{projectTitle?.trim() || projectCode}</h3>
            <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{projectCode}</p>
          </div>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          {onRenameProject ? (
            <button type="button" onClick={onRenameProject} title="Rename project" className="p-1.5 rounded hover:bg-black/5">
              <Sym name="edit" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            </button>
          ) : null}
          {onOpenSettings ? (
            <button type="button" onClick={onOpenSettings} title="Project settings" className="p-1.5 rounded hover:bg-black/5">
              <Sym name="settings" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        <nav className="space-y-0.5">
          <Item
            icon="list_alt"
            label="Threads"
            on={view === 'threads'}
            badge={threadsUnread || undefined}
            onClick={() => onViewChange('threads')}
          />
        </nav>

        <div>
          <p className="px-3 mb-1 text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--p-on-surface-variant)' }}>Resources</p>
          <nav className="space-y-0.5">
            {RESOURCES.map((x) => (
              <Item key={x.key} icon={x.icon} label={x.label} on={view === x.key} onClick={() => goResource(x.key)} />
            ))}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-1 flex justify-between items-center">
            <p className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--p-on-surface-variant)' }}>
              Designs
              {chatsUnread > 0 ? <UnreadBadge count={chatsUnread} /> : null}
            </p>
            <button type="button" onClick={onAddDesign} className="p-0.5 rounded hover:bg-black/5" title="Add design channel">
              <Sym name="add" className="text-[16px]" style={{ color: 'var(--p-primary)' }} />
            </button>
          </div>
          <nav className="space-y-1">
            {designs.map((d) => {
              const on = d.id === activeDesignId && view === 'channels';
              const unread = !on ? (d.unreadCount ?? 0) : 0;
              const hasUnread = unread > 0;
              const realDesigns = designs.filter((x) => !x.system).length;
              const canDelete = !d.system && realDesigns > 1;
              return (
                <div key={d.id} className="group/design relative">
                  <button
                    onClick={() => { onSelectDesign(d.id); onViewChange('channels'); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors text-left pr-9"
                    style={on ? { background: 'rgba(0,103,106,0.1)', color: 'var(--p-primary)' } : hasUnread ? { background: 'var(--p-surface-container-lowest)' } : { color: 'var(--p-on-surface-variant)' }}
                  >
                    <div className="relative w-8 h-8 rounded overflow-hidden shrink-0 border flex items-center justify-center" style={{ borderColor: on ? 'var(--p-primary)' : 'var(--p-outline-variant)', background: d.system ? 'rgba(0,103,106,0.12)' : 'var(--p-surface-container-high)' }}>
                      {d.system ? (
                        <Sym name="campaign" className="text-[17px]" style={{ color: 'var(--p-primary)' }} />
                      ) : d.imageUrl ? (
                        <img className="w-full h-full object-cover" src={d.imageUrl} alt="" />
                      ) : (
                        <Sym name="palette" className="text-[16px]" style={{ color: on ? 'var(--p-primary)' : 'var(--p-on-surface-variant)' }} />
                      )}
                      {hasUnread ? (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: 'var(--p-primary)' }} />
                      ) : null}
                    </div>
                    <span className={`text-[14px] truncate flex-1 min-w-0 ${hasUnread || on || d.system ? 'font-bold' : ''}`} style={hasUnread && !on ? { color: 'var(--p-on-surface)' } : undefined}>
                      {d.system && <span aria-hidden>#</span>}{d.name}
                    </span>
                    <UnreadBadge count={unread} />
                  </button>
                  {onRenameDesign && !d.system && (
                    <button
                      type="button"
                      title="Rename design"
                      onClick={(e) => { e.stopPropagation(); onRenameDesign(d.id, d.name); }}
                      className={`absolute top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover/design:opacity-100 hover:bg-black/5 transition-all ${canDelete ? 'right-8' : 'right-2'}`}
                    >
                      <Sym name="edit" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      title="Delete design channel"
                      onClick={(e) => { e.stopPropagation(); onDeleteDesign(d.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover/design:opacity-100 hover:bg-red-50 transition-all"
                    >
                      <Sym name="delete" className="text-[16px]" style={{ color: '#b42318' }} />
                    </button>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
