import Products from '@/pages/Products';
import { useTheme } from './ThemeProvider';

/** The route element for "/products": the active theme's shop page, or the classic one. */
const ThemedProducts = () => {
  const { active } = useTheme();
  const Shop = active?.components.Products ?? Products;
  return <Shop />;
};

export default ThemedProducts;
