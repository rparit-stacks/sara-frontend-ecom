import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { adminAuthApi } from '@/lib/api';
import { isSuperAdmin } from '@/lib/adminAccess';

interface ProtectedSuperAdminRouteProps {
  children: React.ReactNode;
}

function SuperAdminAccessGate({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const admin = await adminAuthApi.getCurrentAdmin();
        localStorage.setItem('adminUser', JSON.stringify(admin));
        if (!cancelled) setAllowed(isSuperAdmin(admin));
      } catch {
        if (!cancelled) setAllowed(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">You are not allowed here</h1>
          <p className="text-muted-foreground mb-6">
            Only the primary administrator can manage admin accounts.
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

const ProtectedSuperAdminRoute = ({ children }: ProtectedSuperAdminRouteProps) => {
  return (
    <ProtectedAdminRoute>
      <SuperAdminAccessGate>{children}</SuperAdminAccessGate>
    </ProtectedAdminRoute>
  );
};

export default ProtectedSuperAdminRoute;
