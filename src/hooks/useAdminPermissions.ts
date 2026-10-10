import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminRolesApi } from '@/lib/api';
import { getStoredAdminUser, isSuperAdmin } from '@/lib/adminAccess';

export const ADMIN_MY_ROLE_QUERY_KEY = ['adminMyRole'] as const;

/**
 * Loads current admin's single role + permission codes via `/api/admin/roles/mine`.
 *
 * - Main admin → all permissions allowed
 * - Role assigned → codes from that role
 * - No role + unscoped-full-access → allow all (legacy); otherwise deny
 */
export function useAdminPermissions() {
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('adminToken');

  const query = useQuery({
    queryKey: ADMIN_MY_ROLE_QUERY_KEY,
    queryFn: () => adminRolesApi.mine(),
    enabled: hasToken,
    staleTime: 60_000,
    retry: 1,
  });

  const stored = getStoredAdminUser();
  const mainAdmin = query.data?.mainAdmin === true || isSuperAdmin(stored);
  const role = query.data?.role ?? null;
  /** Matches backend deny-by-default when unscoped is false — FE also denies with no role. */
  const unscopedFullAccess = false;
  const hasNoRole = !mainAdmin && !role;

  const codes = useMemo(() => {
    const set = new Set<string>();
    for (const p of role?.permissions ?? []) {
      if (p?.code) set.add(p.code);
    }
    return set;
  }, [role]);

  /** At least one PORTAL_* code (or main admin) → Manufacturing Portal entry is visible. */
  const hasPortalAccess = useMemo(() => {
    if (mainAdmin || unscopedFullAccess) return true;
    for (const c of codes) {
      if (c.startsWith('PORTAL_')) return true;
    }
    return false;
  }, [mainAdmin, unscopedFullAccess, codes]);

  const ready = !hasToken || query.isSuccess || query.isError;

  const hasAny = useCallback(
    (...required: string[]) => {
      if (mainAdmin || unscopedFullAccess) return true;
      if (hasNoRole) return false;
      if (!required.length) return true;
      return required.some((c) => codes.has(c));
    },
    [mainAdmin, unscopedFullAccess, hasNoRole, codes],
  );

  const hasAll = useCallback(
    (...required: string[]) => {
      if (mainAdmin || unscopedFullAccess) return true;
      if (hasNoRole) return false;
      if (!required.length) return true;
      return required.every((c) => codes.has(c));
    },
    [mainAdmin, unscopedFullAccess, hasNoRole, codes],
  );

  const canAccessPath = useCallback(
    (path: string, rule?: { anyOf?: string[]; mainAdminOnly?: boolean } | null) => {
      if (!rule) return true;
      if (rule.mainAdminOnly) return mainAdmin;
      if (rule.anyOf?.length) return hasAny(...rule.anyOf);
      return true;
    },
    [mainAdmin, hasAny],
  );

  return {
    ready,
    isLoading: query.isLoading,
    isMainAdmin: mainAdmin,
    hasNoRole,
    /** @deprecated always false after deny-by-default cutover */
    unscopedFullAccess,
    /** True when main admin or role includes any PORTAL_* permission. */
    hasPortalAccess,
    role,
    permissionCodes: codes,
    hasAny,
    hasAll,
    canAccessPath,
    refetch: query.refetch,
  };
}
