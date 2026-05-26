'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AuthGuard } from '@/src/features/auth/components/auth-guard';
import { useAuth } from '@/src/features/auth/hooks/use-auth';

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
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return <FullScreenSpinner />;
  }

  return <AuthGuard fallback={<FullScreenSpinner />}>{children}</AuthGuard>;
}
