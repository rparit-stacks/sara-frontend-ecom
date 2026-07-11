import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Users, 
  FolderTree,
  Settings,
  LogOut,
  Menu,
  X,
  HelpCircle,
  Shield,
  Tag,
  Truck,
  MessageSquare,
  ShoppingBag,
  CreditCard,
  Percent,
  Activity,
  Wrench,
  Factory,
} from 'lucide-react';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { useAdminNotificationCounts } from '@/hooks/useAdminNotificationCounts';

// Sidebar grouped into sections, each with a heading.
const adminMenuSections = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin-sara' },
      { icon: Wrench, label: 'Maintenance', path: '/admin-sara/maintenance' },
    ],
  },
  {
    title: 'Manufacturing',
    items: [
      { icon: Factory, label: 'Go to Manufacturing Portal', path: '/portal-admin' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { icon: Package, label: 'Products', path: '/admin-sara/products' },
      { icon: FolderTree, label: 'Categories', path: '/admin-sara/categories' },
      { icon: Tag, label: 'Coupons', path: '/admin-sara/coupons' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { icon: ShoppingBag, label: 'Orders', path: '/admin-sara/orders' },
      { icon: Truck, label: 'Shipping', path: '/admin-sara/shipping' },
      { icon: Users, label: 'Users', path: '/admin-sara/users' },
    ],
  },
  {
    title: 'Content',
    items: [
      { icon: FileText, label: 'CMS', path: '/admin-sara/cms' },
      { icon: FileText, label: 'Blog', path: '/admin-sara/blog' },
      { icon: FileText, label: 'Homepage Blogs', path: '/admin-sara/homepage-blogs' },
      { icon: HelpCircle, label: 'FAQ', path: '/admin-sara/faq' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { icon: MessageSquare, label: 'WhatsApp', path: '/admin-sara/whatsapp' },
      { icon: MessageSquare, label: 'Contact Submissions', path: '/admin-sara/contact-submissions' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: Settings, label: 'Custom Config', path: '/admin-sara/custom-config' },
      { icon: Settings, label: 'Business Config', path: '/admin-sara/business-config' },
      { icon: CreditCard, label: 'Payment Settings', path: '/admin-sara/payment-config' },
      { icon: Percent, label: 'Currency Multipliers', path: '/admin-sara/currency-multipliers' },
      { icon: Shield, label: 'Admins', path: '/admin-sara/admins' },
      { icon: Activity, label: 'Logs', path: '/admin-sara/logs' },
    ],
  },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [collapsed, , toggleCollapsed] = useSidebarCollapsed();
  // Collapse only applies on desktop; mobile drawer is always full-width.
  const isCollapsed = collapsed && isDesktop;
  const notifCounts = useAdminNotificationCounts();
  const badgeForPath: Record<string, number> = {
    '/admin-sara/orders': notifCounts.orders,
  };

  // Which section is the active route in — that one stays open by default.
  const activeSectionTitle = adminMenuSections.find((s) =>
    s.items.some((it) => it.path === location.pathname ||
      (it.path !== '/admin-sara' && location.pathname.startsWith(it.path))),
  )?.title;

  // Collapsed sections (accordion). Persisted across reloads.
  const [closedSections, setClosedSections] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('adminSidebarClosedSections');
      if (saved) return new Set(JSON.parse(saved));
    } catch { /* ignore */ }
    return new Set();
  });

  const isSectionOpen = (title: string) =>
    title === activeSectionTitle || !closedSections.has(title);

  const toggleSection = (title: string) => {
    setClosedSections((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      try { localStorage.setItem('adminSidebarClosedSections', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const handleLogout = () => {
    console.log('[Admin Logout] Logging out...');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminLoginTime');
    navigate('/admin-sara/login');
  };

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isMobileOpen ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {isMobileOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isDesktop ? 0 : (isMobileOpen ? 0 : -256),
          width: isCollapsed ? 80 : 256,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed left-0 top-0 h-full bg-white border-r border-border z-40",
          "lg:translate-x-0"
        )}
        style={{ width: isCollapsed ? 80 : 256 }}
      >
        <div className={cn("flex flex-col h-full", isCollapsed ? "w-20" : "w-64")}>
          {/* Logo + collapse toggle */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn("relative border-b border-border", isCollapsed ? "p-4" : "p-6")}
          >
            <Link to="/admin-sara" className="flex items-center justify-center">
              {isCollapsed ? (
                <span className="font-cursive text-2xl font-bold text-primary">S</span>
              ) : (
                <>
                  <motion.span whileHover={{ scale: 1.05 }} className="font-cursive text-2xl font-bold">
                    <span className="text-primary">Studio</span>
                    <span className="text-foreground"> Sara</span>
                  </motion.span>
                  <span className="ml-2 text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">Admin</span>
                </>
              )}
            </Link>

            {/* Desktop-only collapse/expand button */}
            <button
              onClick={toggleCollapsed}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition hover:text-primary"
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
            </button>
          </motion.div>

          {/* Menu Items — grouped into sections */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {adminMenuSections.map((section, sectionIndex) => {
              const open = isCollapsed || isSectionOpen(section.title);
              return (
              <div key={section.title} className="space-y-1">
                {isCollapsed ? (
                  <div className="mx-2 mb-1 border-t border-border/60" />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="flex w-full items-center justify-between px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground"
                  >
                    {section.title}
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} />
                  </button>
                )}
                {open && section.items.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/admin-sara' && location.pathname.startsWith(item.path));
                  const badge = badgeForPath[item.path] || 0;

                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (sectionIndex * 0.04) + (index * 0.03), duration: 0.3 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileOpen(false)}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 relative",
                          isCollapsed ? "justify-center px-0" : "px-4",
                          isActive
                            ? "text-white shadow-md"
                            : "text-foreground hover:bg-secondary hover:text-primary"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-primary rounded-lg -z-10"
                            initial={false}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative z-10"
                        >
                          <Icon className="w-5 h-5" />
                        </motion.div>
                        {!isCollapsed && <span className="font-medium relative z-10 flex-1">{item.label}</span>}
                        {badge > 0 && (
                          <span
                            className={cn(
                              "relative z-10 text-[10px] font-bold rounded-full",
                              isCollapsed ? "absolute top-1 right-1 w-2 h-2 p-0" : "px-1.5 py-0.5 min-w-[18px] text-center",
                              isActive ? "bg-white text-primary" : "bg-primary text-white"
                            )}
                          >
                            {isCollapsed ? '' : (badge > 99 ? '99+' : badge)}
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              );
            })}
          </nav>

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="p-4 border-t border-border"
          >
            <button
              onClick={handleLogout}
              title={isCollapsed ? 'Logout' : undefined}
              className={cn(
                "w-full flex items-center gap-3 py-3 rounded-lg text-foreground hover:bg-destructive/10 hover:text-destructive transition-all",
                isCollapsed ? "justify-center px-0" : "px-4"
              )}
            >
              <motion.div
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.9 }}
              >
                <LogOut className="w-5 h-5" />
              </motion.div>
              {!isCollapsed && <span className="font-medium">Logout</span>}
            </button>
          </motion.div>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
          />
        )}
      </AnimatePresence>
    </>
  );
};
