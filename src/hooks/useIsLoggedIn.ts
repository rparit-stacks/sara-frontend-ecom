import { useEffect, useState } from 'react';

const hasToken = () => typeof window !== 'undefined' && !!localStorage.getItem('authToken');

/** Reactive "is a customer logged in" flag; refreshes on login/logout events and cross-tab storage changes. */
export function useIsLoggedIn(): boolean {
  const [isLoggedIn, setIsLoggedIn] = useState(hasToken);
  useEffect(() => {
    const sync = () => setIsLoggedIn(hasToken());
    window.addEventListener('storage', sync);
    window.addEventListener('auth:loggedIn', sync);
    window.addEventListener('auth:loggedOut', sync);
    sync();
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('auth:loggedIn', sync);
      window.removeEventListener('auth:loggedOut', sync);
    };
  }, []);
  return isLoggedIn;
}
