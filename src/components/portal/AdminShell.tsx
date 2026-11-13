import { useEffect, useRef, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { Sym } from './Sym';
import { adminAuthApi, getUserEmailFromToken } from '@/lib/api';
import { getAdminChatDisplayName, getStoredAdminUser, isSuperAdmin } from '@/lib/adminAccess';
import { useAdminNotificationCounts } from '@/hooks/useAdminNotificationCounts';
import { useAdminActivityToast } from '@/hooks/useAdminActivityToast';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { resolvePortalNavPermissionRule } from '@/lib/portalNavPermissions';
import { AdminPresenceProvider } from '@/context/AdminPresenceContext';
import WhatsAppNumberGate from './WhatsAppNumberGate';
import '@/pages/portal/portal.css';
import '@/pages/portal/portal-admin-skin.css';

type NavItem = { icon: string; label: string; to: string; badge?: number };
type NavGroup = { title?: string; items: NavItem[] };

function buildNavGroups(counts: { inquiries: number; paymentLinks: number; paymentHistory: number }, superAdmin: boolean): NavGroup[] {
  const workItems: NavItem[] = [
    { icon: 'folder_open', label: 'Projects', to: '/portal-admin/projects' },
    { icon: 'description', label: 'Tech Packs', to: '/portal-admin/tech-packs' },
    { icon: 'group', label: 'Clients', to: '/portal-admin/clients' },
  ];
  if (superAdmin) {
    workItems.push({ icon: 'assignment_ind', label: 'Assignments', to: '/portal-admin/assignments' });
  }
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
      items: workItems,
    },
  ];
}
const NAV_BOTTOM: NavItem[] = [
  { icon: 'settings', label: 'Settings', to: '/portal-admin/settings' },
];

/**
 * Pages that carry the redesigned look (page skin + bold title bar). Everything else that uses AdminShell
 * (project workspaces, the inquiry form, the inquiry page, quote editor, form builder, inquiry detail) keeps its
 * original page chrome; only the sidebar and top bar are shared.
 */
const SKIN_PATHS = new Set([
  '/portal-admin',
  '/portal-admin/inquiries',
  '/portal-admin/quotations',
  '/portal-admin/invoices',
  '/portal-admin/payment-links',
  '/portal-admin/payment-history',
  '/portal-admin/tech-packs',
  '/portal-admin/clients',
  '/portal-admin/assignments',
  '/portal-admin/settings',
]);

const PAGE_SUBTITLES: Record<string, string> = {
  '/portal-admin': 'What needs you today, and where every project stands.',
  '/portal-admin/inquiries': 'New requests from your website, waiting for a first answer.',
  '/portal-admin/quotations': 'Every quote you have sent and where it stands.',
  '/portal-admin/invoices': 'What has been billed, what is paid and what is still due.',
  '/portal-admin/payment-links': 'Shareable links your clients use to pay.',
  '/portal-admin/payment-history': 'Every payment received, in order.',
  '/portal-admin/tech-packs': 'Production documents and the templates they start from.',
  '/portal-admin/clients': 'The people and brands you work with.',
  '/portal-admin/assignments': 'Who can see and work on which project.',
  '/portal-admin/settings': 'Your identity, company details and notifications.',
};

function NavBtn({ item, active, collapsed, onGo, reduced }: {
  item: NavItem; active: boolean; collapsed: boolean; onGo: (to: string) => void; reduced: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onGo(item.to)}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`pa-nav-item ${active ? 'is-active' : ''} ${collapsed ? 'justify-center !px-0' : ''}`}
    >
      {active && (
        <motion.span
          layoutId="pa-nav-active"
          className="absolute inset-0 rounded-[12px]"
          style={{ background: 'var(--p-primary)', boxShadow: '0 10px 20px -12px rgba(0,103,106,.9)' }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 40 }}
        />
      )}
      <Sym name={item.icon} fill={active} />
      {!collapsed && <span className="pa-nav-label">{item.label}</span>}
      {item.badge ? (
        collapsed ? <span className="pa-nav-dot" /> : <span className="pa-nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
      ) : null}
    </button>
  );
}

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
  const reduced = !!useReducedMotion();
  const searchRef = useRef<HTMLInputElement>(null);
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
  const [displayName, setDisplayName] = useState(() => getAdminChatDisplayName());
  // undefined = still checking (render nothing extra); false = confirmed missing, block entry.
  const [needsWhatsapp, setNeedsWhatsapp] = useState<boolean | undefined>(undefined);
  const initials = (displayName || email).slice(0, 2).toUpperCase();
  const searchValue = search ?? localSearch;
  const setSearch = onSearchChange ?? setLocalSearch;
  const notifCounts = useAdminNotificationCounts();
  useAdminActivityToast();
  const { ready, canAccessPath, isMainAdmin } = useAdminPermissions();
  const superAdmin = isSuperAdmin(getStoredAdminUser()) || isMainAdmin;
  const navGroups = buildNavGroups(notifCounts, superAdmin)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const rule = resolvePortalNavPermissionRule(item.to);
        if (rule?.mainAdminOnly) return superAdmin;
        if (!ready) return true;
        return canAccessPath(item.to, rule);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const bottomNav = NAV_BOTTOM.filter((item) => {
    const rule = resolvePortalNavPermissionRule(item.to);
    if (!ready) return true;
    return canAccessPath(item.to, rule);
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // "/" jumps to the top search, like most work tools.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const refreshCurrentAdmin = () => {
    adminAuthApi.getCurrentAdmin()
      .then((admin) => {
        localStorage.setItem('adminUser', JSON.stringify(admin));
        setDisplayName(admin.name?.trim() || admin.username?.trim() || getAdminChatDisplayName());
        setNeedsWhatsapp(!admin.whatsappNumber || !admin.whatsappNumber.trim());
      })
      .catch(() => setDisplayName(getAdminChatDisplayName()));
  };

  useEffect(() => {
    refreshCurrentAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (!workspace) return;
    setNavCollapsed(true);
  }, [workspace]);

  const isActive = (to: string) => (to === '/portal-admin' ? location.pathname === to : location.pathname.startsWith(to));

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    navigate('/admin-sara/login', { replace: true });
  };

  const path = location.pathname.replace(/\/+$/, '') || '/portal-admin';
  const skinOn = !workspace && SKIN_PATHS.has(path);
  const subtitle = PAGE_SUBTITLES[path];

  return (
    <AdminPresenceProvider>
    {needsWhatsapp && <WhatsAppNumberGate onSaved={() => setNeedsWhatsapp(false)} />}
    <div className="portal-root">
      {/* top bar */}
      <header className="pa-topbar h-14 flex items-center justify-between px-4 shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center text-white font-display font-bold text-[16px] border border-white/20">SS</div>
          <div className="hidden sm:block leading-tight">
            <p className="text-white font-bold text-[14px]">Studio Sara</p>
            <p className="text-white/70 text-[11.5px] font-medium">Manufacturing · Admin</p>
          </div>
        </div>
        <div className="flex-1 max-w-xl px-4">
          <div className="pa-search rounded-xl h-9 flex items-center px-3 gap-2">
            <span className="msym text-white/80" style={{ fontSize: 19 }}>search</span>
            <input
              ref={searchRef}
              value={searchValue}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects, clients, inquiries…"
              className="bg-transparent border-none outline-none focus:ring-0 text-white placeholder:text-white/70 text-[13.5px] w-full"
            />
            <span className="pa-kbd hidden sm:inline">/</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(!ready || canAccessPath('/portal-admin/inquiries', resolvePortalNavPermissionRule('/portal-admin/inquiries'))) && (
          <motion.button
            whileTap={reduced ? undefined : { scale: 0.9 }}
            onClick={() => navigate('/portal-admin/inquiries')}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-white/85 hover:text-white hover:bg-white/15 transition-colors"
            title="Inquiries"
          >
            <span className="msym" style={{ fontSize: 22 }}>inbox</span>
            {notifCounts.inquiries > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[10.5px] font-bold flex items-center justify-center" style={{ color: 'var(--p-primary)' }}>
                {notifCounts.inquiries > 99 ? '99+' : notifCounts.inquiries}
              </span>
            )}
          </motion.button>
          )}
          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2.5 group rounded-xl pl-2 pr-1 py-1 hover:bg-white/10 transition-colors">
              <span className="text-white text-[13.5px] font-semibold hidden sm:inline capitalize">{displayName}</span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-[12px] font-bold border border-white/25 group-hover:bg-white/30 transition-colors">{initials}</div>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={reduced ? false : { opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduced ? undefined : { opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                    style={{ transformOrigin: 'top right', background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                    className="absolute right-0 top-11 w-60 rounded-2xl border py-1.5 z-50 shadow-xl"
                  >
                    <div className="px-4 pt-2 pb-2.5 mb-1 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
                      <p className="font-bold text-[14px] capitalize truncate">{displayName}</p>
                      <p className="text-[12px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{email}</p>
                    </div>
                    {[
                      { icon: 'visibility', label: 'View client portal', action: () => navigate('/portal') },
                      { icon: 'storefront', label: 'Store admin', action: () => navigate('/admin-sara') },
                      { icon: 'settings', label: 'Settings', action: () => navigate('/portal-admin/settings') },
                    ].map((m) => (
                      <button key={m.label} onClick={() => { setMenuOpen(false); m.action(); }} className="w-full text-left px-4 py-2.5 text-[13.5px] font-medium flex items-center gap-3 hover:bg-[var(--pa-teal-06)] active:bg-[var(--pa-teal-10)] transition-colors" style={{ color: 'var(--p-on-surface)' }}>
                        <Sym name={m.icon} className="text-[19px]" style={{ color: 'var(--p-on-surface-variant)' }} /> {m.label}
                      </button>
                    ))}
                    <div className="border-t my-1" style={{ borderColor: 'var(--p-outline-variant)' }} />
                    <button onClick={() => { setMenuOpen(false); logout(); }} className="w-full text-left px-4 py-2.5 text-[13.5px] font-medium flex items-center gap-3 hover:bg-black/5" style={{ color: 'var(--p-error)' }}>
                      <Sym name="logout" className="text-[19px]" /> Log out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* sidebar */}
        <aside className={`pa-side ${navCollapsed ? 'w-[72px]' : 'w-[256px]'} flex-col shrink-0 hidden md:flex transition-[width] duration-300 ease-out overflow-hidden`}>
          <LayoutGroup id="pa-nav">
            {!workspace && (
              <button
                type="button"
                onClick={toggleNav}
                className={`h-11 flex items-center ${navCollapsed ? 'justify-center' : 'justify-between px-4'} shrink-0 transition-colors hover:bg-[var(--pa-teal-06)]`}
                style={{ color: 'var(--p-on-surface-variant)' }}
                title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {!navCollapsed && <span className="text-[12px] font-bold">Navigation</span>}
                <Sym name={navCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'} />
              </button>
            )}
            <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-3 space-y-5">
              {navGroups.map((group, gi) => (
                <div key={group.title ?? `grp-${gi}`} className="space-y-1">
                  {group.title && (
                    navCollapsed ? (
                      gi > 0 && <div className="mx-3 my-1 border-t" style={{ borderColor: 'var(--p-outline-variant)' }} />
                    ) : (
                      <p className="pa-nav-title">{group.title}</p>
                    )
                  )}
                  {group.items.map((item) => (
                    <NavBtn key={item.to} item={item} active={isActive(item.to)} collapsed={navCollapsed} onGo={(to) => navigate(to)} reduced={reduced} />
                  ))}
                </div>
              ))}
            </nav>
            <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--p-outline-variant)' }}>
              {bottomNav.map((item) => (
                <NavBtn key={item.to} item={item} active={isActive(item.to)} collapsed={navCollapsed} onGo={(to) => navigate(to)} reduced={reduced} />
              ))}
              {!navCollapsed && (
                <div className="pa-user">
                  <div className="pa-avatar !w-9 !h-9 !text-[12px]">{initials}</div>
                  <div className="min-w-0 leading-tight">
                    <p className="font-bold text-[13px] capitalize truncate">{displayName}</p>
                    <p className="text-[11.5px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{superAdmin ? 'Super admin' : 'Portal admin'}</p>
                  </div>
                </div>
              )}
            </div>
          </LayoutGroup>
        </aside>

        {/* main */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: skinOn ? 'var(--p-surface)' : 'var(--p-surface-container-lowest)' }}>
          {!workspace && (
            skinOn ? (
              <div className="pa-titlebar px-5 sm:px-8 pt-5 pb-4 flex items-end justify-between shrink-0 gap-4">
                <div className="min-w-0">
                  <h1 className="pa-title truncate">{title}</h1>
                  {subtitle && <p className="pa-subtitle">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-2 shrink-0 pb-0.5">{actions}</div>}
              </div>
            ) : (
              <div className="h-14 px-5 sm:px-8 border-b flex items-center justify-between shrink-0 gap-3" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <h1 className="font-bold text-[18px] sm:text-[20px] truncate">{title}</h1>
                {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
              </div>
            )
          )}
          {workspace ? (
            <div className="flex-1 flex overflow-hidden min-h-0">{children}</div>
          ) : (
            <div className={`flex-1 overflow-y-auto ${skinOn ? 'pa-skin' : ''}`}>
              {skinOn ? <div key={path} className="pa-page">{children}</div> : children}
            </div>
          )}
        </main>
      </div>
    </div>
    </AdminPresenceProvider>
  );
}

/** Small reusable primary button for admin actions. */
export function AdminBtn({ icon, children, onClick, variant = 'primary' }: { icon?: string; children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all hover:brightness-110 active:scale-[0.97]"
      style={variant === 'primary' ? { background: 'var(--p-primary)', color: '#fff' } : { border: '1px solid var(--p-outline)', color: 'var(--p-on-surface)' }}
    >
      {icon && <Sym name={icon} className="text-[18px]" />} {children}
    </button>
  );
}
