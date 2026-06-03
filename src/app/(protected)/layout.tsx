'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell } from '@/src/components/layout/app-shell';
import { AuthGuard } from '@/src/features/auth/components/auth-guard';
import { useAuthStore } from '@/src/stores/authStore';
import { useShiftStore } from '@/src/stores/shiftStore';

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
    </div>
  );
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const { user, tenantId, isLoading } = useAuthStore();
  const { fetchActiveShift } = useShiftStore();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.uid && tenantId) {
      fetchActiveShift(tenantId, user.uid).catch(console.error);
    }
  }, [isAuthenticated, user?.uid, tenantId, fetchActiveShift]);

  if (isLoading || !isAuthenticated) {
    return <FullScreenSpinner />;
  }

  return (
    <AuthGuard fallback={<FullScreenSpinner />}>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
