import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { adminAuthApi } from '@/lib/api';

interface ProtectedPortalAdminRouteProps {
  children: React.ReactNode;
}

function PortalAdminAccessGate({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAccess = async () => {
      try {
        const admin = await adminAuthApi.getCurrentAdmin();
        localStorage.setItem('adminUser', JSON.stringify(admin));
        if (!cancelled) {
          setHasAccess(admin.portalAdminAccess === true);
        }
      } catch {
        const stored = localStorage.getItem('adminUser');
        if (stored) {
          try {
            const admin = JSON.parse(stored);
            if (!cancelled) {
              setHasAccess(admin.portalAdminAccess === true);
            }
          } catch {
            if (!cancelled) setHasAccess(false);
          }
        } else if (!cancelled) {
          setHasAccess(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    checkAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
        <div className="max-w-md w-full text-center bg-white border border-border rounded-2xl p-8 shadow-sm">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">You are not allowed here</h1>
          <p className="text-muted-foreground mb-6">
            Your admin account does not have access to the Manufacturing Portal. Contact a super admin if you need access.
          </p>
          <Button asChild className="btn-primary">
            <Link to="/admin-sara">Back to Store Admin</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

const ProtectedPortalAdminRoute = ({ children }: ProtectedPortalAdminRouteProps) => {
  return (
    <ProtectedAdminRoute>
      <PortalAdminAccessGate>{children}</PortalAdminAccessGate>
    </ProtectedAdminRoute>
  );
};

export default ProtectedPortalAdminRoute;
