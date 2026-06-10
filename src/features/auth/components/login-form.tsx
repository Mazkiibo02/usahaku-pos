'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { auth } from '@/src/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

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
            disabled={isSubmitting || isResettingPassword}
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
              disabled={isSubmitting || isResettingPassword}
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
            disabled={isSubmitting || isResettingPassword}
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
          disabled={isSubmitting || isResettingPassword}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </>
  );
}

