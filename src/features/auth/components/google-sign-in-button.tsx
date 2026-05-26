'use client';

import { useState } from 'react';

import { useAuth } from '@/src/features/auth/hooks/use-auth';

function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Google sign in failed. Please try again.';
  }

  switch (error.message) {
    case 'Firebase: Error (auth/popup-closed-by-user).':
      return 'Google sign in was canceled.';
    case 'Firebase: Error (auth/popup-blocked).':
      return 'Popup blocked. Please enable popups and try again.';
    default:
      return error.message || 'Google sign in failed. Please try again.';
  }
}

export function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (nextError) {
      setError(getAuthErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Connecting to Google...' : 'Continue with Google'}
      </button>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
