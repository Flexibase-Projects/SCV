import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { FloatingHelpButton } from './FloatingHelpButton';

interface ModuleLayoutProps {
  children: ReactNode;
}

export function ModuleLayout({ children }: ModuleLayoutProps) {
  return (
    <div className="flex h-screen bg-white dark:bg-[#0f1115] font-sans transition-colors duration-300">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <FloatingHelpButton />
    </div>
  );
}
