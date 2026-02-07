import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import AnimatedWaveBackground from '@/components/animations/AnimatedWaveBackground';
import FloatingCurlyLines from '@/components/animations/FloatingCurlyLines';
import FloatingWhatsApp from '@/components/common/FloatingWhatsApp';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export const Layout = ({ children, showFooter = true }: LayoutProps) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Show loader on route change with minimum visibility
    setIsLoading(true);
    const startTime = Date.now();
    const minDuration = 300; // Minimum 300ms visibility
    
    const timeout = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);
      
      if (remaining > 0) {
        setTimeout(() => setIsLoading(false), remaining);
      } else {
        setIsLoading(false);
      }
    }, 100); // Start checking after 100ms

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] relative">
      <AnimatedWaveBackground />
      <FloatingCurlyLines />
      <Navbar />
      <main className="flex-1 pb-16 lg:pb-0 w-full max-w-full relative z-10 min-w-0">
        {children}
      </main>
      {showFooter && <Footer />}
      <MobileBottomNav />
      <FloatingWhatsApp />

      {/* Global page loader with blurred background */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs sm:text-sm text-muted-foreground">Loading...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
