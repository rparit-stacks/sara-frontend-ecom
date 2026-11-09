import type { ComponentType } from 'react';

/**
 * A storefront theme plugin. A plugin is one folder under src/themes/<id>/ whose index.ts
 * default-exports this object. Drop the folder in to install it, delete the folder to remove it.
 * Nothing else in the app needs editing either way.
 *
 * A plugin restyles every page with CSS scoped to  html[data-theme-plugin="<id>"]  (tokens, fonts,
 * radii, shadows), can re-lay-out the product page through the data-ed="gallery|info|title" hooks,
 * and may replace the whole pieces below. Anything it does not provide falls back
 * to the classic storefront.
 */
export interface ThemePlugin {
  /** Short unique id, also used in ?theme=<id> and the CSS scope. */
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  /** Hostname prefix that switches this theme on, e.g. "apple" for apple.localhost / apple.studiosara.com. */
  subdomain?: string;
  /** Hide the classic decorative animated backgrounds. */
  hideDecor?: boolean;
  /** Checkout: show delivery, payment and the order button as steps beside the form, leaving only items and totals in the summary. */
  checkoutSteps?: boolean;
  components: {
    Navbar?: ComponentType;
    Footer?: ComponentType;
    /** The landing page at "/". */
    Home?: ComponentType;
    /** The shop listing at "/products". */
    Products?: ComponentType;
    /** The collections index at "/categories". */
    Categories?: ComponentType;
    /** One collection (and its sub-collections) at "/category/...". */
    Category?: ComponentType;
  };
}
