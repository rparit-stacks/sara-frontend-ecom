/**
 * Shared logout signal — mirrors the existing `auth:sessionInvalid` custom-event pattern
 * (see AuthSessionListener.tsx). Logout is implemented independently in ~8 places (Navbar,
 * Dashboard, PortalSettings, PortalShell, Checkout, api.ts's reactive 401 clear) with no
 * shared AuthContext, so a dispatched event is how any of them tells other mounted components
 * (e.g. the site-wide chat widget) that the customer just logged out.
 */
export function dispatchLoggedOut() {
  window.dispatchEvent(new CustomEvent('auth:loggedOut'));
}
