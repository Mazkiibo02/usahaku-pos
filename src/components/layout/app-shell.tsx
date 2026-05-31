'use client';

import { useState, type ReactNode } from 'react';

import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { cn } from '@/src/lib/utils/cn';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { role, user, signOut } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  const openMobileSidebar = () => setIsMobileSidebarOpen(true);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:block">
        <Sidebar role={role} />
      </div>

      <div className="md:pl-72">
        <Topbar
          email={user?.email ?? null}
          role={role}
          onOpenMobileSidebar={openMobileSidebar}
          onSignOut={signOut}
        />

        <main className="p-4 md:p-6">{children}</main>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden',
          isMobileSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeMobileSidebar}
        aria-hidden="true"
      />

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-out md:hidden',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <Sidebar role={role} onNavigate={closeMobileSidebar} />
      </div>
    </div>
  );
}
