import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Listens for auth:sessionInvalid (e.g. 401 User not found) and redirects to login.
 * Session clear is done in api.ts before dispatching this event.
 */
const AuthSessionListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = () => {
      toast.info('Session invalid. Please log in again.');
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:sessionInvalid', handle);
    return () => window.removeEventListener('auth:sessionInvalid', handle);
  }, [navigate]);

  return null;
};

export default AuthSessionListener;
