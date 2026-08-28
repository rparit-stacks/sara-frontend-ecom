import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Same user-auth gate the rest of the app uses: require a JWT in
 * localStorage.authToken, else bounce to /login with returnTo so the user
 * lands back on the portal after OTP login.
 */
export default function PortalGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    if (!token) {
      // Keep the full path — a deep link like a copied message link (?project=...#msg-123)
      // must still land on that exact pane/message after login, not just the bare page.
      const returnTo = `${location.pathname}${location.search}${location.hash}`;
      navigate('/login', { replace: true, state: { returnTo } });
    }
  }, [token, navigate, location.pathname, location.search, location.hash]);

  if (!token) return null;
  return <>{children}</>;
}
