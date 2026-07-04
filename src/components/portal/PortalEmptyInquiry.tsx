import { useNavigate } from 'react-router-dom';
import { Sym } from '@/components/portal/Sym';

/** Shown when the client has no manufacturing projects yet. */
export default function PortalEmptyInquiry({ compact }: { compact?: boolean }) {
  const navigate = useNavigate();

  return (
    <div
      className={`text-center border-2 border-dashed rounded-xl ${compact ? 'p-10' : 'p-16'}`}
      style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: 'rgba(146,70,35,0.1)', color: 'var(--p-primary)' }}
      >
        <Sym name="factory" className="text-[32px]" />
      </div>
      <h3 className="font-display text-[22px] mb-2" style={{ color: 'var(--p-on-surface)' }}>
        No production projects yet
      </h3>
      <p className={`max-w-md mx-auto text-[14px] ${compact ? '' : 'mb-6'}`}>
        Start by submitting a manufacturing inquiry. Once we receive it, your project workspace will appear here.
      </p>
      <button
        type="button"
        onClick={() => navigate('/inquiry')}
        className="mt-6 text-white px-6 py-3 rounded-lg text-[14px] font-semibold inline-flex items-center gap-2 hover:brightness-110"
        style={{ background: 'var(--p-primary)' }}
      >
        <Sym name="edit_note" className="text-[18px]" />
        Make an inquiry
      </button>
    </div>
  );
}
