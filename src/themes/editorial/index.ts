import type { ThemePlugin } from '../types';
import Masthead from './Masthead';
import EditorialFooter from './EditorialFooter';
import EditorialHome from './EditorialHome';
import EditorialProducts from './EditorialProducts';
import EditorialCategories from './EditorialCategories';
import EditorialCategory from './EditorialCategory';
import './theme.css';

/**
 * Editorial theme plugin. To uninstall, delete this folder (src/themes/editorial/).
 * It reaches a store only through Marketplace (trial or purchase); ?theme-preview=editorial shows it without saving anything.
 */
const editorial: ThemePlugin = {
  id: 'editorial',
  name: 'Editorial',
  version: '1.0.0',
  description: 'A print-magazine storefront: paper and ink, serif headlines, staggered photography and scroll-led motion.',
  author: 'Studio Sara',
  subdomain: 'editorial',
  hideDecor: true,
  checkoutSteps: true,
  components: { Navbar: Masthead, Footer: EditorialFooter, Home: EditorialHome, Products: EditorialProducts, Categories: EditorialCategories, Category: EditorialCategory },
};

export default editorial;
