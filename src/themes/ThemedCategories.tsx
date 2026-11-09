import Categories from '@/pages/Categories';
import CategoryHierarchy from '@/pages/CategoryHierarchy';
import { useTheme } from './ThemeProvider';

/** The route element for "/categories": the active theme's collections index, or the classic one. */
export const ThemedCategories = () => {
  const { active } = useTheme();
  const Page = active?.components.Categories ?? Categories;
  return <Page />;
};

/** The route element for "/category/*": the active theme's collection page, or the classic one. */
export const ThemedCategory = () => {
  const { active } = useTheme();
  const Page = active?.components.Category ?? CategoryHierarchy;
  return <Page />;
};
