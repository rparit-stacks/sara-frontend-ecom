export const SUPER_ADMIN_USERNAME = 'admin';

export type StoredAdminUser = {
  id?: number;
  username?: string;
  name?: string;
  email?: string;
  portalAdminAccess?: boolean;
};

export function getStoredAdminUser(): StoredAdminUser | null {
  try {
    const raw = localStorage.getItem('adminUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isSuperAdmin(admin?: StoredAdminUser | null): boolean {
  return admin?.username === SUPER_ADMIN_USERNAME;
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
