import { useNavigate } from 'react-router-dom';
import { Sym } from './Sym';

type Key = 'channels' | 'threads' | 'drafts' | 'brief' | 'moodboards' | 'pins' | 'quotation' | 'invoices';

const NAV_TOP: { key: Key; icon: string; label: string; to: string }[] = [
  { key: 'threads', icon: 'list_alt', label: 'Threads', to: '/portal/threads' },
  { key: 'drafts', icon: 'drafts', label: 'Drafts & sent', to: '/portal/drafts' },
];

const RESOURCES: { key: Key; icon: string; label: string; to: string }[] = [
  { key: 'channels', icon: 'forum', label: 'Design Channels', to: '/portal/workspace' },
  { key: 'brief', icon: 'description', label: 'Project Brief', to: '/portal/brief' },
  { key: 'moodboards', icon: 'grid_view', label: 'Moodboards', to: '/portal/moodboards' },
  { key: 'pins', icon: 'push_pin', label: 'Pins', to: '/portal/pins' },
  { key: 'quotation', icon: 'request_quote', label: 'Quotation', to: '/portal/quotation' },
  { key: 'invoices', icon: 'receipt_long', label: 'Invoices', to: '/portal/invoices' },
];

/** Shared secondary sidebar for all project-scoped pages. */
export default function ProjectSidebar({
  active,
  designs,
  activeDesign,
  onSelectDesign,
  projectCode = 'SS-2026-0001',
}: {
  active: Key;
  designs?: { name: string; img?: string; system?: boolean }[];
  activeDesign?: number;
  onSelectDesign?: (i: number) => void;
  projectCode?: string;
}) {
  const navigate = useNavigate();

  const Item = ({ icon, label, to, on }: { icon: string; label: string; to: string; on: boolean }) => (
    <button
      onClick={() => navigate(to)}
      className="w-full flex items-center gap-3 px-3 py-1.5 rounded text-[14px] text-left transition-colors"
      style={on ? { background: 'rgba(146,70,35,0.1)', color: 'var(--p-primary)', fontWeight: 700 } : { color: 'var(--p-on-surface-variant)' }}
      onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--p-surface-container-high)'; }}
      onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}
    >
      <Sym name={icon} fill={on} /> <span className="truncate">{label}</span>
    </button>
  );

  return (
    <aside className="w-60 sm:w-64 border-r flex-col shrink-0 hidden md:flex" style={{ background: 'var(--p-surface-container-low)', borderColor: 'var(--p-outline-variant)' }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--p-outline-variant)' }}>
        <button onClick={() => navigate('/portal')} className="flex items-center gap-2 min-w-0">
          <Sym name="arrow_back_ios" className="text-[14px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
          <h3 className="font-bold text-[15px] truncate">{projectCode}</h3>
        </button>
        <Sym name="edit_square" className="text-[18px] cursor-pointer shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        <nav className="space-y-0.5">
          {NAV_TOP.map((x) => <Item key={x.key} {...x} on={active === x.key} />)}
        </nav>

        <div>
          <p className="px-3 mb-1 text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--p-on-surface-variant)' }}>Resources</p>
          <nav className="space-y-0.5">
            {RESOURCES.map((x) => <Item key={x.key} {...x} on={active === x.key} />)}
          </nav>
        </div>

        {designs && (
          <div>
            <div className="px-3 mb-1 flex justify-between items-center">
              <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--p-on-surface-variant)' }}>Designs</p>
              <Sym name="add" className="text-[16px] cursor-pointer" style={{ color: 'var(--p-primary)' }} />
            </div>
            <nav className="space-y-1">
              {designs.map((d, i) => {
                const on = i === activeDesign;
                return (
                  <button
                    key={d.name}
                    onClick={() => onSelectDesign?.(i)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors text-left"
                    style={on ? { background: 'rgba(146,70,35,0.1)', color: 'var(--p-primary)' } : { color: 'var(--p-on-surface-variant)' }}
                  >
                    <div className="w-8 h-8 rounded overflow-hidden shrink-0 border flex items-center justify-center" style={{ borderColor: on ? 'var(--p-primary)' : 'var(--p-outline-variant)', background: d.system ? 'rgba(146,70,35,0.12)' : undefined }}>
                      {d.system ? (
                        <Sym name="campaign" className="text-[17px]" style={{ color: 'var(--p-primary)' }} />
                      ) : (
                        <img className="w-full h-full object-cover" src={d.img} alt="" />
                      )}
                    </div>
                    <span className={`text-[14px] truncate ${on || d.system ? 'font-bold' : ''}`}>{d.system ? `# ${d.name}` : d.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
