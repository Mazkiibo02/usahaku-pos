'use client';

import type { ReactNode } from 'react';

import { useAuth } from '@/src/features/auth/hooks/use-auth';
import type { UserRole } from '@/src/types/auth';

type AuthGuardProps = {
  children: ReactNode;
  allowedRoles?: UserRole[];
  fallback?: ReactNode;
};

export function AuthGuard({ children, allowedRoles, fallback }: AuthGuardProps) {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) {
    return <>{fallback ?? 'Loading...'}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback ?? 'You need to sign in to access this content.'}</>;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <>{fallback ?? 'You are not authorized to access this content.'}</>;
  }

  return <>{children}</>;
}
