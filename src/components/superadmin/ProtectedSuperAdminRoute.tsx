import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { superAdminAuthApi } from '@/lib/api';

const SESSION_DURATION = 60 * 60 * 1000; // 1 hour

const ProtectedSuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const clear = () => {
      localStorage.removeItem('superAdminToken');
      localStorage.removeItem('superAdminLoginTime');
      localStorage.removeItem('superAdminEmail');
    };

    const checkAuth = async () => {
      const token = localStorage.getItem('superAdminToken');
      const loginTime = localStorage.getItem('superAdminLoginTime');
      if (!token || !loginTime) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      if (Date.now() - parseInt(loginTime) > SESSION_DURATION) {
        clear();
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      try {
        await superAdminAuthApi.getCurrent();
        setIsAuthenticated(true);
      } catch {
        clear();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/super-admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedSuperAdminRoute;
