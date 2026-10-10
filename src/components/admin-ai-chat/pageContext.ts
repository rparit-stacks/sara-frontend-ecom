import type { AdminPageContextDto, AdminPageType } from '@/lib/api';

/**
 * Stable Ops AI page key from /admin-sara route (must match backend AdminPageBriefRegistry).
 */
export function resolveAdminPageKey(pathname: string): string {
  const route = pathname || '/admin-sara';

  // Manufacturing portal (same Ops AI widget + MFG tools)
  if (route.startsWith('/portal-admin')) {
    if (route.includes('/inquiries/')) return 'portal.inquiry-detail';
    if (route.startsWith('/portal-admin/inquiries')) return 'portal.inquiries';
    if (route.startsWith('/portal-admin/quotations') || route.includes('/quote-editor')) return 'portal.quotes';
    if (route.startsWith('/portal-admin/invoices')) return 'portal.invoices';
    if (route.startsWith('/portal-admin/payment-links')) return 'portal.payment-links';
    if (route.startsWith('/portal-admin/payment-history')) return 'portal.payment-history';
    if (route.startsWith('/portal-admin/tech-packs')) return 'portal.tech-packs';
    if (route.startsWith('/portal-admin/clients')) return 'portal.clients';
    if (route.startsWith('/portal-admin/workspace-preview') || route.startsWith('/portal-admin/projects')) {
      return 'portal.workspace';
    }
    if (route.startsWith('/portal-admin/assignments')) return 'portal.assignments';
    if (route === '/portal-admin' || route === '/portal-admin/') return 'portal.dashboard';
    return 'portal.unknown';
  }

  if (/^\/admin-sara\/orders\/\d+/.test(route)) return 'store.order-detail';
  if (/^\/admin-sara\/products\/edit\/\d+/.test(route)) return 'store.product-edit';
  if (route === '/admin-sara' || route === '/admin-sara/') return 'store.dashboard';
  if (route.startsWith('/admin-sara/maintenance')) return 'store.maintenance';
  if (route.startsWith('/admin-sara/products')) return 'store.products';
  if (route.startsWith('/admin-sara/categories')) return 'store.categories';
  if (route.startsWith('/admin-sara/coupons')) return 'store.coupons';
  if (route.startsWith('/admin-sara/orders')) return 'store.orders';
  if (route.startsWith('/admin-sara/shipping')) return 'store.shipping';
  if (route.startsWith('/admin-sara/users')) return 'store.users';
  if (route.startsWith('/admin-sara/cms')) return 'store.cms';
  if (route.startsWith('/admin-sara/blog')) return 'store.blog';
  if (route.startsWith('/admin-sara/homepage-blogs')) return 'store.homepage-blogs';
  if (route.startsWith('/admin-sara/faq')) return 'store.faq';
  if (route.startsWith('/admin-sara/whatsapp')) return 'store.whatsapp';
  if (route.startsWith('/admin-sara/contact-submissions')) return 'store.contact';
  if (route.startsWith('/admin-sara/notifications')) return 'store.notifications';
  if (route.startsWith('/admin-sara/custom-config')) return 'store.custom-config';
  if (route.startsWith('/admin-sara/ai-context')) return 'store.ai-context';
  if (route.startsWith('/admin-sara/business-config')) return 'store.business-config';
  if (route.startsWith('/admin-sara/payment-config')) return 'store.payment-config';
  if (route.startsWith('/admin-sara/currency-multipliers')) return 'store.currency';
  if (route.startsWith('/admin-sara/admins')) return 'store.admins';
  if (route.startsWith('/admin-sara/roles')) return 'store.roles';
  if (route.startsWith('/admin-sara/logs')) return 'store.logs';
  if (route.startsWith('/admin-sara/designs')) return 'store.designs';
  if (route.startsWith('/admin-sara/fabrics')) return 'store.fabrics';
  return 'store.unknown';
}

/**
 * Derive Admin AI page context from the current /admin-sara route so tools can
 * resolve "this order" / "this product" without asking again.
 */
export function buildAdminPageContext(pathname: string): AdminPageContextDto {
  const route = pathname || '/admin-sara';
  const pageKey = resolveAdminPageKey(route);

  const orderMatch = route.match(/^\/admin-sara\/orders\/(\d+)/);
  if (orderMatch) {
    return {
      pageType: 'ORDER_DETAIL',
      route,
      pageKey,
      orderId: Number(orderMatch[1]),
      orderNumber: null,
      productId: null,
      userEmail: null,
      cmsTab: null,
      focusHint: null,
    };
  }

  const productMatch = route.match(/^\/admin-sara\/products\/edit\/(\d+)/);
  if (productMatch) {
    return {
      pageType: 'PRODUCT_EDIT',
      route,
      pageKey,
      orderId: null,
      orderNumber: null,
      productId: Number(productMatch[1]),
      userEmail: null,
      cmsTab: null,
      focusHint: null,
    };
  }

  let pageType: AdminPageType = 'OTHER';
  if (pageKey === 'store.dashboard') pageType = 'DASHBOARD';
  else if (pageKey === 'store.cms') pageType = 'CMS';
  else if (pageKey === 'store.users') pageType = 'USERS';

  return {
    pageType,
    route,
    pageKey,
    orderId: null,
    orderNumber: null,
    productId: null,
    userEmail: null,
    cmsTab: pageKey === 'store.cms' ? route.split('/').pop() || null : null,
    focusHint: null,
  };
}
