import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminAuthApi } from '@/lib/api';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      const loginTime = localStorage.getItem('adminLoginTime');
      
      if (!token || !loginTime) {
        console.log('[Admin Auth] No token or login time found');
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Check if session expired (1 hour = 3600000ms)
      const loginTimestamp = parseInt(loginTime);
      const now = Date.now();
      const sessionDuration = 60 * 60 * 1000; // 1 hour
      
      if (now - loginTimestamp > sessionDuration) {
        console.log('[Admin Auth] Session expired');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminLoginTime');
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        console.log('[Admin Auth] Verifying token...');
        // Verify token by calling getCurrentAdmin
        await adminAuthApi.getCurrentAdmin();
        console.log('[Admin Auth] Token verified successfully');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('[Admin Auth] Token verification failed:', error);
        // Token is invalid, clear it
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminLoginTime');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Check session every minute
    const interval = setInterval(() => {
      const loginTime = localStorage.getItem('adminLoginTime');
      if (loginTime) {
        const loginTimestamp = parseInt(loginTime);
        const now = Date.now();
        const sessionDuration = 60 * 60 * 1000; // 1 hour
        
        if (now - loginTimestamp > sessionDuration) {
          console.log('[Admin Auth] Session expired, logging out');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          localStorage.removeItem('adminLoginTime');
          window.location.href = '/admin-sara/login';
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, saving the attempted location
    return <Navigate to="/admin-sara/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
