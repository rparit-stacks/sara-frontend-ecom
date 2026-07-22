import { useAdminPresenceContext } from '@/context/AdminPresenceContext';

/**
 * Live set of online admin ids. Thin wrapper over AdminPresenceContext so
 * existing callers (AdminAdmins, AdminAssignments) keep working unchanged.
 * Presence is manual (admin-toggled) with a connection safety net — see
 * AdminPresenceContext.
 */
export function useAdminPresence(): Set<number> {
  return useAdminPresenceContext().onlineAdminIds;
}
