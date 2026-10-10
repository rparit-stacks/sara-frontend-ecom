export const SUPER_ADMIN_USERNAME = 'admin';
export const SUPER_ADMIN_EMAIL = 'admin@studiosara.com';

export type StoredAdminUser = {
  id?: number;
  username?: string;
  name?: string;
  email?: string;
  portalAdminAccess?: boolean;
  mainAdmin?: boolean;
  readOnly?: boolean;
  role?: { id: number; name: string; description?: string; active?: boolean } | null;
};

export function getStoredAdminUser(): StoredAdminUser | null {
  try {
    const raw = localStorage.getItem('adminUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Main admin — roles do not apply; only this user manages roles/admins. */
export function isSuperAdmin(admin?: StoredAdminUser | null): boolean {
  if (!admin) return false;
  if (admin.mainAdmin === true) return true;
  if (admin.username === SUPER_ADMIN_USERNAME) return true;
  return (admin.email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

/** Name shown in manufacturing portal project chat for the logged-in admin. */
export function getAdminChatDisplayName(): string {
  const admin = getStoredAdminUser();
  if (admin?.name?.trim()) return admin.name.trim();
  if (admin?.username?.trim()) return admin.username.trim();
  if (admin?.email) {
    const local = admin.email.split('@')[0].replace(/[._]/g, ' ').trim();
    if (local) return local;
  }
  return 'Admin Team';
}
