import { Link, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminAuthApi } from '@/lib/api';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { resolveNavPermissionRule } from '@/lib/adminNavPermissions';
import AdminNoRoleScreen from '@/components/admin/AdminNoRoleScreen';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  /**
   * Optional any-of permission codes. If omitted, resolved from the current path
   * via {@link resolveNavPermissionRule}.
   */
  anyOf?: string[];
  /** Force main-admin-only (overrides path rule). */
  mainAdminOnly?: boolean;
  /** When false, skip page permission check (auth + no-role gate still apply). Default true. */
  enforcePermissions?: boolean;
}

function NoRoleGate({ children }: { children: React.ReactNode }) {
  const { ready, isLoading, hasNoRole } = useAdminPermissions();

  if (isLoading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasNoRole) {
    return <AdminNoRoleScreen />;
  }

  return <>{children}</>;
}

function PermissionGate({
  children,
  anyOf,
  mainAdminOnly,
}: {
  children: React.ReactNode;
  anyOf?: string[];
  mainAdminOnly?: boolean;
}) {
  const location = useLocation();
  const { ready, isLoading, isMainAdmin, hasAny } = useAdminPermissions();

  const rule = resolveNavPermissionRule(location.pathname);
  const requireMain = mainAdminOnly === true || rule?.mainAdminOnly === true;
  const codes = anyOf?.length ? anyOf : rule?.anyOf;

  if (isLoading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const allowed = requireMain
    ? isMainAdmin
    : codes?.length
      ? hasAny(...codes)
      : true;

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Access denied</h1>
          <p className="text-muted-foreground mb-6">
            Your role does not include permission for this page.
          </p>
          <Button asChild className="btn-primary">
            <Link to="/admin-sara">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

const ProtectedAdminRoute = ({
  children,
  anyOf,
  mainAdminOnly,
  enforcePermissions = true,
}: ProtectedAdminRouteProps) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const validatedOnce = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      const loginTime = localStorage.getItem('adminLoginTime');

      if (!token || !loginTime) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const loginTimestamp = parseInt(loginTime);
      const now = Date.now();
      const sessionDuration = 30 * 24 * 60 * 60 * 1000;

      if (now - loginTimestamp > sessionDuration) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminLoginTime');
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const admin = await adminAuthApi.getCurrentAdmin();
        localStorage.setItem('adminUser', JSON.stringify(admin));
        validatedOnce.current = true;
        setIsAuthenticated(true);
      } catch (err) {
        // Background re-validation: a network blip must not log the admin out.
        const status = (err as { status?: number })?.status;
        if (validatedOnce.current && status !== 401 && status !== 403) {
          return;
        }
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminLoginTime');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Validate on mount, then on window focus and every 5 min (not on every navigation).
    checkAuth();
    const onFocus = () => { checkAuth(); };
    window.addEventListener('focus', onFocus);
    const revalidateInterval = setInterval(checkAuth, 5 * 60 * 1000);

    const interval = setInterval(() => {
      const loginTime = localStorage.getItem('adminLoginTime');
      if (loginTime) {
        const loginTimestamp = parseInt(loginTime);
        const now = Date.now();
        const sessionDuration = 30 * 24 * 60 * 60 * 1000;
        if (now - loginTimestamp > sessionDuration) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
          localStorage.removeItem('adminUser');
          localStorage.removeItem('adminLoginTime');
          window.location.href = '/admin-sara/login';
        }
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(revalidateInterval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-sara/login" state={{ from: location }} replace />;
  }

  return (
    <NoRoleGate>
      {enforcePermissions ? (
        <PermissionGate anyOf={anyOf} mainAdminOnly={mainAdminOnly}>
          {children}
        </PermissionGate>
      ) : (
        children
      )}
    </NoRoleGate>
  );
};

export default ProtectedAdminRoute;
