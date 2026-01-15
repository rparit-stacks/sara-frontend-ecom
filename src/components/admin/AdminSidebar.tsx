import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Palette, 
  Image, 
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
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const adminMenuItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    path: '/admin-sara' 
  },
  { 
    icon: Package, 
    label: 'Products', 
    path: '/admin-sara/products' 
  },
  { 
    icon: Image, 
    label: 'Designs', 
    path: '/admin-sara/products?type=DESIGNED' 
  },
  { 
    icon: Palette, 
    label: 'Fabrics', 
    path: '/admin-sara/products?type=PLAIN' 
  },
  { 
    icon: FileText, 
    label: 'CMS', 
    path: '/admin-sara/cms' 
  },
  { 
    icon: FileText, 
    label: 'Blog', 
    path: '/admin-sara/blog' 
  },
  { 
    icon: HelpCircle, 
    label: 'FAQ', 
    path: '/admin-sara/faq' 
  },
  { 
    icon: FolderTree, 
    label: 'Categories', 
    path: '/admin-sara/categories' 
  },
  { 
    icon: Settings, 
    label: 'Custom Config', 
    path: '/admin-sara/custom-config' 
  },
  { 
    icon: Users, 
    label: 'Users', 
    path: '/admin-sara/users' 
  },
  { 
    icon: Shield, 
    label: 'Admins', 
    path: '/admin-sara/admins' 
  },
  { 
    icon: Tag, 
    label: 'Coupons', 
    path: '/admin-sara/coupons' 
  },
  { 
    icon: Truck, 
    label: 'Shipping', 
    path: '/admin-sara/shipping' 
  },
  { 
    icon: MessageSquare, 
    label: 'Contact Submissions', 
    path: '/admin-sara/contact-submissions' 
  },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

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
          x: isDesktop ? 0 : (isMobileOpen ? 0 : -256)
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed left-0 top-0 h-full bg-white border-r border-border z-40 w-64",
          "lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full w-64">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 border-b border-border"
          >
            <Link to="/admin-sara" className="flex items-center">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="font-cursive text-2xl font-bold"
              >
                <span className="text-primary">Studio</span>
                <span className="text-foreground"> Sara</span>
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="ml-2 text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded"
              >
                Admin
              </motion.span>
            </Link>
          </motion.div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {adminMenuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/admin-sara' && location.pathname.startsWith(item.path));
              
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative",
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
                    <span className="font-medium relative z-10">{item.label}</span>
                  </Link>
                </motion.div>
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
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <motion.div
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.9 }}
              >
                <LogOut className="w-5 h-5" />
              </motion.div>
              <span className="font-medium">Logout</span>
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
