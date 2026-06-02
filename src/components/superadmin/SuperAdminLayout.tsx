import { ReactNode } from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';

export const SuperAdminLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <SuperAdminSidebar />
      <main className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};
