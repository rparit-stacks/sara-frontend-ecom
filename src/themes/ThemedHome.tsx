import Index from '@/pages/Index';
import { useTheme } from './ThemeProvider';

/** The route element for "/": the active theme's landing page, or the classic one. */
const ThemedHome = () => {
  const { active } = useTheme();
  const Home = active?.components.Home ?? Index;
  return <Home />;
};

export default ThemedHome;
