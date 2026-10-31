import { P } from '@/lib/adminPermissionCodes';

/**
 * Path prefix → any-of permission codes for nav + route gates.
 * Main-admin-only paths use `mainAdmin: true` (no code list).
 * Empty `anyOf` = any logged-in admin (e.g. dashboard home).
 */
export type NavPermissionRule = {
  /** Match longest prefix first. */
  pathPrefix: string;
  /** Need at least one of these codes (unless mainAdmin / unscoped). */
  anyOf?: string[];
  /** Only main admin (roles/admins). */
  mainAdminOnly?: boolean;
};

export const ADMIN_NAV_PERMISSIONS: NavPermissionRule[] = [
  { pathPrefix: '/admin-sara/products/edit', anyOf: [P.PRODUCTS_VIEW] },
  { pathPrefix: '/admin-sara/products', anyOf: [P.PRODUCTS_VIEW] },
  { pathPrefix: '/admin-sara/categories', anyOf: [P.CATEGORIES_VIEW] },
  { pathPrefix: '/admin-sara/coupons', anyOf: [P.COUPONS_VIEW] },
  { pathPrefix: '/admin-sara/orders', anyOf: [P.ORDERS_VIEW, P.ORDERS_VIEW_DETAIL] },
  { pathPrefix: '/admin-sara/shipping', anyOf: [P.SHIPPING_VIEW] },
  { pathPrefix: '/admin-sara/users', anyOf: [P.USERS_VIEW] },
  { pathPrefix: '/admin-sara/maintenance', anyOf: [P.MAINTENANCE_VIEW] },
  {
    pathPrefix: '/admin-sara/cms',
    anyOf: [P.CMS_ANNOUNCEMENT, P.CMS_BEST_SELLERS, P.CMS_NEW_ARRIVALS, P.CMS_BANNERS],
  },
  { pathPrefix: '/admin-sara/blog', anyOf: [P.BLOG_VIEW] },
  { pathPrefix: '/admin-sara/homepage-blogs', anyOf: [P.HOMEPAGE_BLOGS_VIEW] },
  { pathPrefix: '/admin-sara/faq', anyOf: [P.FAQ_VIEW] },
  { pathPrefix: '/admin-sara/whatsapp', anyOf: [P.WHATSAPP_TEMPLATES] },
  { pathPrefix: '/admin-sara/contact-submissions', anyOf: [P.CONTACT_VIEW] },
  { pathPrefix: '/admin-sara/notifications', anyOf: [P.NOTIFICATIONS_LOGS] },
  { pathPrefix: '/admin-sara/custom-config', anyOf: [P.CUSTOM_CONFIG_VIEW] },
  { pathPrefix: '/admin-sara/ai-context', anyOf: [P.AI_CONTEXT_VIEW] },
  { pathPrefix: '/admin-sara/business-config', anyOf: [P.BUSINESS_CONFIG_VIEW] },
  { pathPrefix: '/admin-sara/payment-config', anyOf: [P.PAYMENT_CONFIG_VIEW] },
  { pathPrefix: '/admin-sara/currency-multipliers', anyOf: [P.CURRENCY_VIEW] },
  { pathPrefix: '/admin-sara/logs', anyOf: [P.LOGS_VIEW] },
  { pathPrefix: '/admin-sara/designs', anyOf: [P.DESIGNS_VIEW] },
  { pathPrefix: '/admin-sara/fabrics', anyOf: [P.FABRICS_VIEW] },
  { pathPrefix: '/admin-sara/admins', mainAdminOnly: true },
  { pathPrefix: '/admin-sara/roles', mainAdminOnly: true },
  { pathPrefix: '/admin-sara/runtime-config', mainAdminOnly: true },
  // Internal platform payment ledger (dev / project dues) — main admin only.
  { pathPrefix: '/admin-sara/payments', mainAdminOnly: true },
  // Dashboard home — any authenticated admin (widgets still respect API permissions).
  { pathPrefix: '/admin-sara' },
];

/** Longest matching rule for a path (exact menu path or deep link). */
export function resolveNavPermissionRule(path: string): NavPermissionRule | null {
  const normalized = path.split('?')[0] || path;
  let best: NavPermissionRule | null = null;
  for (const rule of ADMIN_NAV_PERMISSIONS) {
    if (normalized === rule.pathPrefix || normalized.startsWith(`${rule.pathPrefix}/`)) {
      if (!best || rule.pathPrefix.length > best.pathPrefix.length) {
        best = rule;
      }
    }
  }
  // Exact dashboard home: `/admin-sara` matches the dashboard rule above.
  if (!best && (normalized === '/admin-sara' || normalized === '/admin-sara/')) {
    return ADMIN_NAV_PERMISSIONS.find((r) => r.pathPrefix === '/admin-sara') ?? null;
  }
  return best;
}
