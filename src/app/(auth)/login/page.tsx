'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { LoginForm } from '@/src/features/auth/components/login-form';
import { useAuth } from '@/src/features/auth/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-100 to-slate-200 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-600">Sign in to access your Usahaku dashboard.</p>
        </div>

        <LoginForm />

        <div className="mt-6 text-center text-sm text-slate-600">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="font-medium text-slate-900 underline underline-offset-4 hover:text-slate-700"
          >
            Daftar sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
