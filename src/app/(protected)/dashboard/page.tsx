'use client';

import { useState } from 'react';

import { useAuth } from '@/src/features/auth/hooks/use-auth';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setError(null);
    setIsSigningOut(true);

    try {
      await signOut();
    } catch (nextError) {
      if (nextError instanceof Error) {
        setError(nextError.message || 'Failed to sign out.');
      } else {
        setError('Failed to sign out.');
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Welcome, you are signed in.</p>

        <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Email:</span> {user?.email ?? '-'}
          </p>
          <p>
            <span className="font-semibold">Role:</span> {user?.role ?? '-'}
          </p>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="mt-6 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </section>
    </main>
  );
}
