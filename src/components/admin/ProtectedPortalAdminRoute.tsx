import { Link, useLocation } from 'react-router-dom';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { resolvePortalNavPermissionRule } from '@/lib/portalNavPermissions';

interface ProtectedPortalAdminRouteProps {
  children: React.ReactNode;
  /** Optional any-of codes; defaults from portal path map. */
  anyOf?: string[];
  mainAdminOnly?: boolean;
}

/** Enter portal only if main admin or role has at least one PORTAL_* permission. */
function PortalAccessGate({ children }: { children: React.ReactNode }) {
  const { ready, isLoading, hasPortalAccess } = useAdminPermissions();

  if (isLoading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasPortalAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
        <div className="max-w-md w-full text-center bg-white border border-border rounded-2xl p-8 shadow-sm">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">No portal access</h1>
          <p className="text-muted-foreground mb-6">
            Your role has no Manufacturing Portal permissions. Contact the main admin to assign portal access.
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

function PortalPermissionGate({
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
  const rule = resolvePortalNavPermissionRule(location.pathname);
  const requireMain = mainAdminOnly === true || rule?.mainAdminOnly === true;
  const codes = anyOf?.length ? anyOf : rule?.anyOf;

  if (isLoading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
        <div className="max-w-md w-full text-center bg-white border border-border rounded-2xl p-8 shadow-sm">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Access denied</h1>
          <p className="text-muted-foreground mb-6">
            Your role does not include permission for this portal page.
          </p>
          <Button asChild className="btn-primary">
            <Link to="/portal-admin">Back to Portal Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

const ProtectedPortalAdminRoute = ({
  children,
  anyOf,
  mainAdminOnly,
}: ProtectedPortalAdminRouteProps) => {
  return (
    <ProtectedAdminRoute enforcePermissions={false}>
      <PortalAccessGate>
        <PortalPermissionGate anyOf={anyOf} mainAdminOnly={mainAdminOnly}>
          {children}
        </PortalPermissionGate>
      </PortalAccessGate>
    </ProtectedAdminRoute>
  );
};

export default ProtectedPortalAdminRoute;
