import { useNavigate } from 'react-router-dom';
import PortalShell from '@/components/portal/PortalShell';
import ProjectSidebar from '@/components/portal/ProjectSidebar';
import { Sym } from '@/components/portal/Sym';

const PINS = [
  { id: 'pin1', by: 'Marco Rossi', design: 'Linen Wrap Dress', text: 'Final approved pattern — do not change without sign-off.', kind: 'file' as const, file: 'Pattern_final_v3.pdf' },
  { id: 'pin2', by: 'Sara Al-Farsi', design: 'Linen Wrap Dress', text: 'Approved swatch — second from left is the production color.', kind: 'image' as const, img: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=300&q=60' },
  { id: 'pin3', by: 'Admin Team', design: 'Silk Blazer', text: 'Delivery deadline is firm: Dec 5. Plan sampling accordingly.', kind: 'text' as const },
];

export default function PortalPins() {
  const navigate = useNavigate();
  return (
    <PortalShell active="home">
      <ProjectSidebar active="pins" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="h-14 px-6 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <Sym name="push_pin" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
          <h2 className="font-display text-[18px]">Pinned items</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl space-y-3">
            {PINS.map((p) => (
              <div key={p.id} className="border rounded-xl p-4 flex gap-4" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(0,103,106,0.1)', color: 'var(--p-primary)' }}>
                  <Sym name="push_pin" className="text-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                    <span className="font-bold" style={{ color: 'var(--p-on-surface)' }}>{p.by}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Sym name="tag" className="text-[13px]" />{p.design}</span>
                  </div>
                  <p className="text-[14px] mb-2 break-words">{p.text}</p>
                  {p.kind === 'image' && <img src={p.img} className="w-28 h-28 rounded-lg object-cover border" style={{ borderColor: 'var(--p-outline-variant)' }} alt="" />}
                  {p.kind === 'file' && (
                    <div className="max-w-xs border rounded-lg p-2.5 flex items-center gap-2" style={{ borderColor: 'var(--p-outline-variant)' }}>
                      <Sym name="picture_as_pdf" style={{ color: 'var(--p-error)' }} />
                      <span className="text-[13px] font-semibold truncate flex-1">{p.file}</span>
                      <Sym name="download" style={{ color: 'var(--p-on-surface-variant)' }} />
                    </div>
                  )}
                  <button onClick={() => navigate('/portal/workspace')} className="mt-2 text-[12px] font-semibold hover:underline" style={{ color: 'var(--p-primary)' }}>Jump to message →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </PortalShell>
  );
}
