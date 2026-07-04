import { useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sym } from './Sym';
import { getUserEmailFromToken } from '@/lib/api';
import '@/pages/portal/portal.css';

type RailKey = 'home' | 'dms' | 'activity' | 'files' | 'more';

/**
 * Shared chrome for every Manufacturing Portal screen:
 *  - top search bar (functional input; NO macOS traffic-light dots)
 *  - slim left icon rail
 *  - a slot for the page's own secondary sidebar + main + right pane
 *
 * Self-contained: all colors come from `.portal-root` CSS variables so the
 * rest of the StudioSara app is untouched.
 */
export default function PortalShell({
  active = 'home',
  children,
  search,
  onSearchChange,
}: {
  active?: RailKey;
  children: ReactNode;
  search?: string;
  onSearchChange?: (v: string) => void;
}) {
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const email = getUserEmailFromToken() || 'guest@studiosara.com';
  const initials = email.slice(0, 2).toUpperCase();
  const displayName = email.split('@')[0].replace(/[._]/g, ' ');

  const searchValue = search ?? localSearch;
  const setSearch = onSearchChange ?? setLocalSearch;

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authEmail');
    navigate('/login', { replace: true });
  };

  // lock body scroll while the portal (full-screen app shell) is mounted
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const rail: { key: RailKey; icon: string; label: string; to: string }[] = [
    { key: 'home', icon: 'home', label: 'Home', to: '/portal' },
    { key: 'dms', icon: 'factory', label: 'Projects', to: '/portal/messages' },
    { key: 'activity', icon: 'notifications', label: 'Activity', to: '/portal/activity' },
    { key: 'files', icon: 'folder', label: 'Files', to: '/portal/files' },
    { key: 'more', icon: 'more_horiz', label: 'More', to: '/portal/settings' },
  ];

  return (
    <div className="portal-root">
      {/* ---- Top bar (no traffic-light dots) ---- */}
      <header
        className="h-12 flex items-center justify-between px-4 shrink-0 z-40"
        style={{ background: 'var(--p-primary)' }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="msym text-white/70 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
            aria-label="Back"
          >
            arrow_back
          </button>
          <button
            onClick={() => navigate(1)}
            className="msym text-white/70 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
            aria-label="Forward"
          >
            arrow_forward
          </button>
        </div>

        <div className="flex-1 max-w-2xl px-4">
          <div className="bg-white/10 focus-within:bg-white/20 hover:bg-white/15 border border-white/20 rounded-md h-8 flex items-center px-3 gap-2 transition-colors">
            <span className="msym text-white/70" style={{ fontSize: 18 }}>
              search
            </span>
            <input
              value={searchValue}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project resources…"
              className="bg-transparent border-none outline-none focus:ring-0 text-white placeholder:text-white/60 text-[13px] w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/portal/activity')}
            className="msym text-white/70 hover:text-white"
            aria-label="Activity"
          >
            notifications
          </button>
          <button className="msym text-white/70 hover:text-white" aria-label="Help">
            help
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 group"
            >
              <span className="text-white/90 text-[13px] font-semibold hidden sm:inline capitalize">
                {displayName}
              </span>
              <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center text-white text-[11px] font-bold border border-white/10 group-hover:bg-white/30 transition-colors">
                {initials}
              </div>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-10 w-60 rounded-lg border py-1.5 z-50 shadow-xl"
                  style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                >
                  <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
                    <p className="text-[13px] font-bold capitalize" style={{ color: 'var(--p-on-surface)' }}>{displayName}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{email}</p>
                  </div>
                  {[
                    { icon: 'person', label: 'Profile', action: () => navigate('/portal/profile') },
                    { icon: 'notifications', label: 'Notification settings', action: () => navigate('/portal/settings') },
                    { icon: 'storefront', label: 'Back to Studio Sara', action: () => navigate('/dashboard') },
                    { icon: 'language', label: 'View website', action: () => navigate('/') },
                  ].map((m) => (
                    <button
                      key={m.label}
                      onClick={() => { setMenuOpen(false); m.action(); }}
                      className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 hover:bg-black/5 transition-colors"
                      style={{ color: 'var(--p-on-surface)' }}
                    >
                      <Sym name={m.icon} className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                      {m.label}
                    </button>
                  ))}
                  <div className="border-t my-1" style={{ borderColor: 'var(--p-outline-variant)' }} />
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 hover:bg-black/5 transition-colors"
                    style={{ color: 'var(--p-error)' }}
                  >
                    <Sym name="logout" className="text-[18px]" />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ---- Slim left icon rail ---- */}
        <aside
          className="w-16 flex flex-col items-center py-4 gap-6 shrink-0 z-30 border-r border-white/10"
          style={{ background: 'var(--p-primary)' }}
        >
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white font-serif-head font-bold mb-2 font-display">
            SS
          </div>
          <div className="flex flex-col gap-5">
            {rail.map((item) => {
              const on = item.key === active;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.to)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <span
                    className={`msym ${on ? 'fill text-white' : 'text-white/70 group-hover:text-white'}`}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-tighter font-semibold ${
                      on ? 'text-white' : 'text-white/70'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-auto">
            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <span className="msym">add</span>
            </button>
          </div>
        </aside>

        {/* ---- Page content (secondary sidebar + main + optional right pane) ---- */}
        {children}
      </div>
    </div>
  );
}
