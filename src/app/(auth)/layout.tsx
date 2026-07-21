'use client';

import { AuthProvider } from '@/src/features/auth/providers/auth-provider';

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
