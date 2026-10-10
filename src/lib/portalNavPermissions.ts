import { P } from '@/lib/adminPermissionCodes';
import type { NavPermissionRule } from '@/lib/adminNavPermissions';

/** Path prefix → any-of codes for Manufacturing Portal admin nav + routes. */
export const PORTAL_NAV_PERMISSIONS: NavPermissionRule[] = [
  { pathPrefix: '/portal-admin/workspace-preview', anyOf: [P.PORTAL_PROJECTS_VIEW, P.PORTAL_PROJECTS_OPEN] },
  { pathPrefix: '/portal-admin/projects', anyOf: [P.PORTAL_PROJECTS_VIEW, P.PORTAL_PROJECTS_OPEN] },
  { pathPrefix: '/portal-admin/tech-packs', anyOf: [P.PORTAL_TECHPACKS_VIEW] },
  { pathPrefix: '/portal-admin/clients', anyOf: [P.PORTAL_CLIENTS_VIEW] },
  { pathPrefix: '/portal-admin/assignments', mainAdminOnly: true },
  { pathPrefix: '/portal-admin/inquiries', anyOf: [P.PORTAL_INQUIRIES_VIEW, P.PORTAL_INQUIRIES_VIEW_DETAIL] },
  { pathPrefix: '/portal-admin/inquiry-form', anyOf: [P.PORTAL_INQUIRY_FORM_VIEW] },
  { pathPrefix: '/portal-admin/inquiry-content', anyOf: [P.PORTAL_INQUIRY_CONTENT_VIEW] },
  { pathPrefix: '/portal-admin/quote-editor', anyOf: [P.PORTAL_QUOTES_VIEW, P.PORTAL_QUOTES_CREATE, P.PORTAL_QUOTES_EDIT] },
  { pathPrefix: '/portal-admin/quotations', anyOf: [P.PORTAL_QUOTES_VIEW] },
  { pathPrefix: '/portal-admin/invoices', anyOf: [P.PORTAL_INVOICES_VIEW] },
  { pathPrefix: '/portal-admin/payment-links', anyOf: [P.PORTAL_PAYMENT_LINKS_VIEW] },
  {
    pathPrefix: '/portal-admin/payment-history',
    anyOf: [P.PORTAL_PAYMENT_HISTORY_VIEW, P.PORTAL_PAYMENT_LINKS_VIEW_ALL_PAYMENTS],
  },
  { pathPrefix: '/portal-admin/forms', anyOf: [P.PORTAL_FORMS_VIEW, P.PORTAL_FORMS_OPEN_BUILDER] },
  {
    pathPrefix: '/portal-admin/settings',
    anyOf: [P.PORTAL_SETTINGS_VIEW, P.PORTAL_SETTINGS_VIEW_COMPANY],
  },
  // Dashboard home — any authenticated portal admin
  { pathPrefix: '/portal-admin' },
];

export function resolvePortalNavPermissionRule(path: string): NavPermissionRule | null {
  const normalized = (path.split('?')[0] || path).replace(/\/$/, '') || path;
  let best: NavPermissionRule | null = null;
  for (const rule of PORTAL_NAV_PERMISSIONS) {
    const prefix = rule.pathPrefix.replace(/\/$/, '');
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      if (!best || rule.pathPrefix.length > best.pathPrefix.length) {
        best = rule;
      }
    }
  }
  return best;
}
