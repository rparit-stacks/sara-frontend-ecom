import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import AnimatedWaveBackground from '@/components/animations/AnimatedWaveBackground';
import FloatingCurlyLines from '@/components/animations/FloatingCurlyLines';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export const Layout = ({ children, showFooter = true }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden max-w-[100vw] relative">
      <AnimatedWaveBackground />
      <FloatingCurlyLines />
      <Navbar />
      <main className="flex-1 pb-16 lg:pb-0 w-full overflow-x-hidden max-w-full relative z-10">
        {children}
      </main>
      {showFooter && <Footer />}
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
