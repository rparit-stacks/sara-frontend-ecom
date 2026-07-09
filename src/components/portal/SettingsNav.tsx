import { useNavigate } from 'react-router-dom';
import { Sym } from './Sym';

/** Shared left sub-nav for the account area (Profile + Notifications). */
export default function SettingsNav({ active }: { active: 'profile' | 'settings' }) {
  const navigate = useNavigate();
  const items = [
    { key: 'profile', icon: 'person', label: 'Profile', to: '/portal/profile' },
    { key: 'settings', icon: 'notifications', label: 'Notifications', to: '/portal/settings' },
  ] as const;
  return (
    <aside className="w-64 border-r hidden md:flex flex-col shrink-0" style={{ background: 'var(--p-surface-container-low)', borderColor: 'var(--p-outline-variant)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
        <h3 className="font-bold text-[16px]">Account</h3>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {items.map((x) => (
          <button
            key={x.key}
            onClick={() => navigate(x.to)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-[14px] text-left"
            style={x.key === active ? { background: 'rgba(146,70,35,0.1)', color: 'var(--p-primary)', fontWeight: 700 } : { color: 'var(--p-on-surface-variant)' }}
          >
            <Sym name={x.icon} fill={x.key === active} /> {x.label}
          </button>
        ))}
        <div className="pt-3 mt-3 border-t space-y-1" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[14px] text-left" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="storefront" /> Back to Studio Sara
          </button>
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[14px] text-left" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="language" /> View website
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Mobile-only companion to SettingsNav — render at the top of the page's <main>, not as a sidebar sibling. */
export function SettingsNavMobile({ active }: { active: 'profile' | 'settings' }) {
  const navigate = useNavigate();
  const items = [
    { key: 'profile', icon: 'person', label: 'Profile', to: '/portal/profile' },
    { key: 'settings', icon: 'notifications', label: 'Notifications', to: '/portal/settings' },
  ] as const;
  return (
    <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b overflow-x-auto shrink-0" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
      {items.map((x) => (
        <button
          key={x.key}
          onClick={() => navigate(x.to)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap"
          style={x.key === active ? { background: 'var(--p-primary)', color: '#fff' } : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
        >
          <Sym name={x.icon} fill={x.key === active} className="text-[16px]" /> {x.label}
        </button>
      ))}
    </div>
  );
}
