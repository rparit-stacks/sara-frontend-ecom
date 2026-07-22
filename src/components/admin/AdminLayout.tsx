import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { WhatsNewDialog } from './WhatsNewDialog';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { AdminPresenceProvider } from '@/context/AdminPresenceContext';
import PresenceToggle from '@/components/admin/PresenceToggle';

interface AdminLayoutProps {
  children: ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: "tween" as const,
  ease: "anticipate" as const,
  duration: 0.4
};

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const [collapsed] = useSidebarCollapsed();

  return (
    <AdminPresenceProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden bg-muted/30">
        <WhatsNewDialog />
        <AdminSidebar />
        <main className={cn('flex-1 min-h-screen transition-[margin] duration-300', collapsed ? 'lg:ml-20' : 'lg:ml-64')}>
          {/* Slim top bar: the admin's own online/offline toggle. */}
          <div className="h-14 px-6 lg:px-8 flex items-center justify-end border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
            <PresenceToggle />
          </div>
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </AdminPresenceProvider>
  );
};
