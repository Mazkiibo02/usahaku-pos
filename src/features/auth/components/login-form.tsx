'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { auth, db, functions } from '@/src/lib/firebase';
import { sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'next/navigation';
import { OnboardingModal } from './onboarding-modal';

const loginSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Sign in failed. Please try again.';
  }

  switch (error.message) {
    case 'Firebase: Error (auth/invalid-credential).':
      return 'Invalid email or password.';
    case 'Firebase: Error (auth/too-many-requests).':
      return 'Too many attempts. Please try again later.';
    default:
      return error.message || 'Sign in failed. Please try again.';
  }
}

export function LoginForm() {
  const { signInWithEmail } = useAuth();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setSubmitError(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Query root Firestore users collection using authenticated user's uid
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // Case 1: User Exists
        // Force refreshing the token ensures we get the latest custom claims from Firebase
        await user.getIdToken(true);
        const idTokenResult = await user.getIdTokenResult();
        const tenantId = (idTokenResult.claims.tenantId as string) ?? null;
        const role = (idTokenResult.claims.role as string) ?? null;
        const outletId = (idTokenResult.claims.outletId as string) ?? null;

        // Coordinate the successful auth result with the Zustand useAuthStore
        useAuthStore.getState().setAuth(user, role, tenantId, outletId);

        showToast('Berhasil masuk dengan Google!', 'success');

        // Redirection based on role
        if (role === 'cashier') {
          router.replace('/pos');
        } else {
          router.replace('/dashboard');
        }
      } else {
        // Case 2: User Does Not Exist (New Owner Registration)
        // Block redirection and trigger onboarding modal
        setGoogleUser(user);
        setShowOnboardingModal(true);
      }
    } catch (error: any) {
      console.error('[Google Sign-In Error]', error);

      if (error?.code === 'auth/popup-closed-by-user') {
        showToast('Login dibatalkan oleh pengguna.', 'info');
      } else {
        showToast('Gagal masuk dengan Google. Silakan coba lagi.', 'error');
        setSubmitError('Gagal masuk dengan Google. Silakan coba lagi.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
    trigger,
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);

    try {
      await signInWithEmail(values.email, values.password);
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error));
    }
  };

  const handleForgotPassword = async () => {
    const email = getValues('email');
    if (!email || email.trim() === '') {
      showToast('Silakan masukkan email Anda terlebih dahulu di kolom input Email.', 'warning');
      setError('email', {
        type: 'manual',
        message: 'Masukkan email Anda di sini untuk reset password.',
      });
      return;
    }

    const isValid = await trigger('email');
    if (!isValid) {
      showToast('Format email salah. Silakan periksa kembali email Anda.', 'error');
      return;
    }

    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showToast(
        'Email reset password telah dikirim! Silakan periksa kotak masuk atau folder spam Anda.',
        'success'
      );
    } catch (error: unknown) {
      console.error('Password reset failed:', error);
      let errorMsg = 'Gagal mengirim email reset password. Silakan coba lagi.';
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.message?.includes('user-not-found')) {
        errorMsg = 'Email tidak terdaftar.';
      } else if (firebaseError.code === 'auth/invalid-email' || firebaseError.message?.includes('invalid-email')) {
        errorMsg = 'Format email salah.';
      } else if (firebaseError.code === 'auth/too-many-requests' || firebaseError.message?.includes('too-many-requests')) {
        errorMsg = 'Terlalu banyak permintaan. Silakan coba lagi nanti.';
      }
      showToast(errorMsg, 'error');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <>
      {/* Floating Animated Toast Banner */}
      <div className="pointer-events-none fixed right-6 top-6 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md min-w-[280px] max-w-sm pointer-events-auto ${
                toast.type === 'success'
                  ? 'border-emerald-200/50 bg-emerald-50/90 text-emerald-800'
                  : toast.type === 'error'
                  ? 'border-rose-200/50 bg-rose-50/90 text-rose-800'
                  : toast.type === 'warning'
                  ? 'border-amber-200/50 bg-amber-50/90 text-amber-800'
                  : 'border-blue-200/50 bg-blue-50/90 text-blue-800'
              }`}
            >
              {toast.type === 'success' && <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />}
              {toast.type === 'error' && <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />}
              {toast.type === 'info' && <Info className="h-5 w-5 shrink-0 text-blue-600" />}
              <span className="text-sm font-semibold">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            placeholder="you@business.com"
            disabled={isSubmitting || isResettingPassword || isGoogleLoading}
          />
          {errors.email ? <p className="text-xs text-rose-600">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isSubmitting || isResettingPassword || isGoogleLoading}
              className="text-xs font-semibold text-slate-600 transition hover:text-slate-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResettingPassword ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Sending...
                </span>
              ) : (
                'Lupa Password?'
              )}
            </button>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            placeholder="Enter your password"
            disabled={isSubmitting || isResettingPassword || isGoogleLoading}
          />
          {errors.password ? <p className="text-xs text-rose-600">{errors.password.message}</p> : null}
        </div>

        {submitError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {submitError}
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || isResettingPassword || isGoogleLoading}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">atau</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting || isResettingPassword || isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          ) : (
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {isGoogleLoading ? 'Menghubungkan ke Google...' : 'Masuk dengan Google'}
        </button>
      </form>

      <OnboardingModal
        isOpen={showOnboardingModal}
        firebaseUser={googleUser}
        onCancel={() => {
          setShowOnboardingModal(false);
          setGoogleUser(null);
        }}
      />
    </>
  );
}

