import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/** True when the JWT's `exp` claim is in the past. Unparsable tokens are treated as valid. */
function isJwtExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = JSON.parse(json)?.exp;
    return typeof exp === 'number' && exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

/**
 * Same user-auth gate the rest of the app uses: require a JWT in
 * localStorage.authToken, else bounce to /login with returnTo so the user
 * lands back on the portal after OTP login. An expired access token is treated
 * as missing unless a refresh token exists (api.ts silently renews on first 401).
 */
export default function PortalGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const hasRefresh = typeof window !== 'undefined' && !!localStorage.getItem('refreshToken');
  const expired = !!token && !hasRefresh && isJwtExpired(token);
  const authed = !!token && !expired;

  useEffect(() => {
    if (!authed) {
      if (expired) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authEmail');
      }
      // Keep the full path — a deep link like a copied message link (?project=...#msg-123)
      // must still land on that exact pane/message after login, not just the bare page.
      const returnTo = `${location.pathname}${location.search}${location.hash}`;
      navigate('/login', { replace: true, state: { returnTo } });
    }
  }, [authed, expired, navigate, location.pathname, location.search, location.hash]);

  if (!authed) return null;
  return <>{children}</>;
}
