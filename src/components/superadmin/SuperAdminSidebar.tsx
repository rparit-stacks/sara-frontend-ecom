import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, ListChecks, Gift, IndianRupee, Settings, LogOut, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/super-admin' },
  { icon: CheckSquare, label: 'Approvals', path: '/super-admin/approvals' },
  { icon: MessageSquare, label: 'Enquiries', path: '/super-admin/enquiries' },
  { icon: ListChecks, label: 'Subscriptions', path: '/super-admin/subscriptions' },
  { icon: Gift, label: 'Grants', path: '/super-admin/grants' },
  { icon: IndianRupee, label: 'Pricing', path: '/super-admin/pricing' },
  { icon: Settings, label: 'Settings', path: '/super-admin/settings' },
];

export const SuperAdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminLoginTime');
    localStorage.removeItem('superAdminEmail');
    navigate('/super-admin/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-lg font-bold">Super Admin</h1>
        <p className="text-xs text-muted-foreground">Subscription control</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active =
            item.path === '/super-admin'
              ? location.pathname === '/super-admin'
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};
