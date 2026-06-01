'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/stores/authStore';
import type { UserRole } from '@/src/types/auth';

type AuthGuardProps = {
  children: ReactNode;
  allowedRoles?: UserRole[];
  fallback?: ReactNode;
};

export function AuthGuard({ children, allowedRoles, fallback }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, tenantId, isLoading } = useAuthStore();

  const isLoginPage = pathname === '/login';
  const isRegisterPage = pathname === '/register';
  const isPublicPage = isLoginPage || isRegisterPage;
  const isOnboardingPage = pathname === '/onboarding' || pathname.startsWith('/onboarding/');

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Logic 2: If no user, redirect to /login
    if (!user) {
      if (!isPublicPage) {
        router.replace('/login');
      }
      return;
    }

    // Logic 3: If user exists but tenantId is null/undefined (meaning they haven't finished onboarding), redirect strictly to /onboarding
    if (!tenantId) {
      if (!isOnboardingPage) {
        router.replace('/onboarding');
      }
      return;
    }

    // If tenantId exists and user is on /onboarding or any public page, redirect to /dashboard
    if (tenantId && (isOnboardingPage || isPublicPage)) {
      router.replace('/dashboard');
    }
  }, [user, tenantId, isLoading, router, pathname, isPublicPage, isOnboardingPage]);

  // Logic 1: If isLoading is true, return a loading spinner or null
  if (isLoading) {
    return <>{fallback ?? (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
      </div>
    )}</>;
  }

  // Logic 2 fallback
  if (!user) {
    return null;
  }

  // Logic 3 fallback
  if (!tenantId) {
    if (isOnboardingPage) {
      return <>{children}</>;
    }
    return null;
  }

  // Role authorization check
  if (allowedRoles && (!role || !allowedRoles.includes(role as UserRole))) {
    return <>{fallback ?? <div className="p-4 text-center text-rose-600">You are not authorized to access this content.</div>}</>;
  }

  // Logic 4: If user exists AND tenantId exists, render {children}
  return <>{children}</>;
}
