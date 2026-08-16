import type { AdminPageContextDto, AdminPageType } from '@/lib/api';

/**
 * Derive Admin AI page context from the current /admin-sara route so tools can
 * resolve "this order" / "this product" without asking again.
 */
export function buildAdminPageContext(pathname: string): AdminPageContextDto {
  const route = pathname || '/admin-sara';
  const orderMatch = route.match(/^\/admin-sara\/orders\/(\d+)/);
  if (orderMatch) {
    return {
      pageType: 'ORDER_DETAIL',
      route,
      orderId: Number(orderMatch[1]),
      orderNumber: null,
      productId: null,
      userEmail: null,
      cmsTab: null,
    };
  }

  const productMatch = route.match(/^\/admin-sara\/products\/edit\/(\d+)/);
  if (productMatch) {
    return {
      pageType: 'PRODUCT_EDIT',
      route,
      orderId: null,
      orderNumber: null,
      productId: Number(productMatch[1]),
      userEmail: null,
      cmsTab: null,
    };
  }

  let pageType: AdminPageType = 'OTHER';
  if (route === '/admin-sara' || route === '/admin-sara/') pageType = 'DASHBOARD';
  else if (route.startsWith('/admin-sara/cms')) pageType = 'CMS';
  else if (route.startsWith('/admin-sara/users')) pageType = 'USERS';
  else if (route.startsWith('/admin-sara/orders')) pageType = 'OTHER';
  else if (route.startsWith('/admin-sara/products')) pageType = 'OTHER';

  return {
    pageType,
    route,
    orderId: null,
    orderNumber: null,
    productId: null,
    userEmail: null,
    cmsTab: route.startsWith('/admin-sara/cms') ? route.split('/').pop() || null : null,
  };
}
