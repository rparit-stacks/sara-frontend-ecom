import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sym } from './Sym';
import { getUserEmailFromToken } from '@/lib/api';
import { useAdminNotificationCounts } from '@/hooks/useAdminNotificationCounts';
import '@/pages/portal/portal.css';

type NavItem = { icon: string; label: string; to: string; badge?: number };
type NavGroup = { title?: string; items: NavItem[] };

function buildNavGroups(counts: { inquiries: number; paymentLinks: number; paymentHistory: number }): NavGroup[] {
  return [
    {
      items: [{ icon: 'grid_view', label: 'Dashboard', to: '/portal-admin' }],
    },
    {
      title: 'Inquiries',
      items: [
        { icon: 'inbox', label: 'Inquiries', to: '/portal-admin/inquiries', badge: counts.inquiries },
        { icon: 'contract_edit', label: 'Inquiry Form', to: '/portal-admin/inquiry-form' },
        { icon: 'web', label: 'Inquiry Page', to: '/portal-admin/inquiry-content' },
      ],
    },
    {
      title: 'Sales & Billing',
      items: [
        { icon: 'request_quote', label: 'Quotations', to: '/portal-admin/quotations' },
        { icon: 'receipt_long', label: 'Invoices', to: '/portal-admin/invoices' },
        { icon: 'link', label: 'Payment Links', to: '/portal-admin/payment-links', badge: counts.paymentLinks },
        { icon: 'history', label: 'Payment History', to: '/portal-admin/payment-history', badge: counts.paymentHistory },
      ],
    },
    {
      title: 'Work',
      items: [
        { icon: 'folder_open', label: 'Projects', to: '/portal-admin/projects' },
        { icon: 'description', label: 'Tech Packs', to: '/portal-admin/tech-packs' },
        { icon: 'group', label: 'Clients', to: '/portal-admin/clients' },
      ],
    },
    {
      title: 'Tools',
      items: [{ icon: 'dynamic_form', label: 'Forms', to: '/portal-admin/forms' }],
    },
  ];
}
const NAV_BOTTOM: NavItem[] = [
  { icon: 'settings', label: 'Settings', to: '/portal-admin/settings' },
];

/**
 * Admin chrome for the Manufacturing Portal — same warm Material theme as the
 * client portal, but a management-focused sidebar. Self-contained (.portal-root).
 */
export default function AdminShell({
  children,
  title,
  actions,
  search,
  onSearchChange,
  workspace = false,
}: {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
  search?: string;
  onSearchChange?: (v: string) => void;
  /** Slack-style project workspace: auto-shrink main nav, hide page title bar. */
  workspace?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('portalAdminNavCollapsed') === '1';
  });
  const [localSearch, setLocalSearch] = useState('');

  const toggleNav = () =>
    setNavCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem('portalAdminNavCollapsed', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  const email = getUserEmailFromToken() || 'admin@studiosara.com';
  const initials = email.slice(0, 2).toUpperCase();
  const displayName = email.split('@')[0].replace(/[._]/g, ' ');
  const searchValue = search ?? localSearch;
  const setSearch = onSearchChange ?? setLocalSearch;
  const notifCounts = useAdminNotificationCounts();
  const navGroups = buildNavGroups(notifCounts);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (!workspace) return;
    setNavCollapsed(true);
  }, [workspace]);

  const isActive = (to: string) => (to === '/portal-admin' ? location.pathname === to : location.pathname.startsWith(to));

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin-sara/login', { replace: true });
  };

  const NavBtn = ({ item }: { item: { icon: string; label: string; to: string; badge?: number } }) => {
    const on = isActive(item.to);
    return (
      <button
        onClick={() => navigate(item.to)}
        title={navCollapsed ? item.label : undefined}
        className={`w-full flex items-center gap-3 ${navCollapsed ? 'justify-center px-0' : 'px-3'} py-2 rounded-lg text-[14px] text-left transition-colors relative`}
        style={on ? { background: 'rgba(0,103,106,0.12)', color: 'var(--p-primary)', fontWeight: 700 } : { color: 'var(--p-on-surface-variant)' }}
        onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--p-surface-container-high)'; }}
        onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}
      >
        <Sym name={item.icon} fill={on} />
        {!navCollapsed && <span className="flex-1 truncate">{item.label}</span>}
        {item.badge ? (
          <span
            className={`text-[10px] text-white rounded-full font-bold ${navCollapsed ? 'absolute top-1 right-1 w-1.5 h-1.5 p-0' : 'px-1.5 py-0.5'}`}
            style={{ background: 'var(--p-primary)' }}
          >
            {navCollapsed ? '' : item.badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div className="portal-root">
      {/* top bar */}
      <header className="h-12 flex items-center justify-between px-4 shrink-0 z-40" style={{ background: 'var(--p-primary)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white font-display font-bold text-[15px]">SS</div>
          <span className="text-white font-semibold text-[14px] hidden sm:inline">Manufacturing · Admin</span>
        </div>
        <div className="flex-1 max-w-xl px-4">
          <div className="bg-white/10 focus-within:bg-white/20 border border-white/20 rounded-md h-8 flex items-center px-3 gap-2 transition-colors">
            <span className="msym text-white/70" style={{ fontSize: 18 }}>search</span>
            <input value={searchValue} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects, clients, inquiries…" className="bg-transparent border-none outline-none focus:ring-0 text-white placeholder:text-white/60 text-[13px] w-full" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/portal-admin/inquiries')} className="msym text-white/70 hover:text-white relative">
            inbox
            {notifCounts.inquiries > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white" />}
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 group">
              <span className="text-white/90 text-[13px] font-semibold hidden sm:inline capitalize">{displayName}</span>
              <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center text-white text-[11px] font-bold border border-white/10 group-hover:bg-white/30">{initials}</div>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 w-56 rounded-lg border py-1.5 z-50 shadow-xl" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
                  {[
                    { icon: 'visibility', label: 'View client portal', action: () => navigate('/portal') },
                    { icon: 'storefront', label: 'Store admin', action: () => navigate('/admin-sara') },
                    { icon: 'settings', label: 'Settings', action: () => navigate('/portal-admin/settings') },
                  ].map((m) => (
                    <button key={m.label} onClick={() => { setMenuOpen(false); m.action(); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 hover:bg-black/5" style={{ color: 'var(--p-on-surface)' }}>
                      <Sym name={m.icon} className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} /> {m.label}
                    </button>
                  ))}
                  <div className="border-t my-1" style={{ borderColor: 'var(--p-outline-variant)' }} />
                  <button onClick={() => { setMenuOpen(false); logout(); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 hover:bg-black/5" style={{ color: 'var(--p-error)' }}>
                    <Sym name="logout" className="text-[18px]" /> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* sidebar */}
        <aside className={`${navCollapsed ? 'w-16' : 'w-60'} border-r flex-col shrink-0 hidden md:flex transition-[width]`} style={{ background: 'var(--p-surface-container-low)', borderColor: 'var(--p-outline-variant)' }}>
          <button
            onClick={toggleNav}
            className={`h-10 flex items-center ${navCollapsed ? 'justify-center' : 'justify-end px-3'} border-b shrink-0`}
            style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}
            title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Sym name={navCollapsed ? 'menu' : 'menu_open'} />
          </button>
          <nav className="flex-1 overflow-y-auto p-3 space-y-3">
            {navGroups.map((group, gi) => (
              <div key={group.title ?? `grp-${gi}`} className="space-y-1">
                {group.title && (
                  navCollapsed ? (
                    gi > 0 && <div className="mx-2 my-1 border-t" style={{ borderColor: 'var(--p-outline-variant)' }} />
                  ) : (
                    <p
                      className="px-3 pt-1 pb-0.5 text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--p-on-surface-variant)', opacity: 0.65 }}
                    >
                      {group.title}
                    </p>
                  )
                )}
                {group.items.map((item) => <NavBtn key={item.to} item={item} />)}
              </div>
            ))}
          </nav>
          <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--p-outline-variant)' }}>
            {NAV_BOTTOM.map((item) => <NavBtn key={item.to} item={item} />)}
          </div>
        </aside>

        {/* main */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
          {!workspace && (
            <div className="h-14 px-5 sm:px-8 border-b flex items-center justify-between shrink-0 gap-3" style={{ borderColor: 'var(--p-outline-variant)' }}>
              <h1 className="font-display text-[18px] sm:text-[20px] truncate">{title}</h1>
              {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>
          )}
          {workspace ? (
            <div className="flex-1 flex overflow-hidden min-h-0">{children}</div>
          ) : (
            <div className="flex-1 overflow-y-auto">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}

/** Small reusable primary button for admin actions. */
export function AdminBtn({ icon, children, onClick, variant = 'primary' }: { icon?: string; children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-all hover:brightness-110"
      style={variant === 'primary' ? { background: 'var(--p-primary)', color: '#fff' } : { border: '1px solid var(--p-outline)', color: 'var(--p-on-surface)' }}
    >
      {icon && <Sym name={icon} className="text-[18px]" />} {children}
    </button>
  );
}
