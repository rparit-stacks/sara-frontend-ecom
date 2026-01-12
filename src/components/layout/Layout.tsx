import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { MobileBottomNav } from './MobileBottomNav';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export const Layout = ({ children, showFooter = true }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden max-w-[100vw]">
      <Navbar />
      <main className="flex-1 pb-16 lg:pb-0 w-full overflow-x-hidden max-w-full">
        {children}
      </main>
      {showFooter && <Footer />}
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
