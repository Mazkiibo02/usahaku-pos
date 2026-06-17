'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';
import { GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

import { registerWithEmail } from '@/src/features/auth/services/auth.service';
import { auth, db, functions } from '@/src/lib/firebase';
import { useAuthStore } from '@/src/stores/authStore';
import { OnboardingModal } from './onboarding-modal';
import { useAuth } from '@/src/features/auth/hooks/use-auth';

const registerSchema = z.object({
  tenantName: z
    .string()
    .trim()
    .min(3, 'Nama Toko / Bisnis minimal 3 karakter.'),
  email: z.string().trim().email('Masukkan alamat email yang valid.'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter.'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function getRegisterErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.';
      case 'auth/invalid-email':
        return 'Format email tidak valid.';
      case 'auth/weak-password':
        return 'Password terlalu lemah. Minimal 6 karakter.';
      case 'functions/invalid-argument':
        return 'Nama Toko / Bisnis tidak valid.';
      default:
        return error.message || 'Pendaftaran gagal. Silakan coba lagi.';
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('auth/email-already-in-use')) {
      return 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.';
    }
    return error.message || 'Pendaftaran gagal. Silakan coba lagi.';
  }

  return 'Pendaftaran gagal. Silakan coba lagi.';
}

export function RegisterForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tenantName: '',
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  });

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
        // Force refreshing the token ensures we get the latest custom claims from Firebase and updates contexts
        await refresh();
        const role = useAuthStore.getState().role;

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
        setSubmitError('Pendaftaran dibatalkan oleh pengguna.');
      } else {
        setSubmitError('Gagal mendaftar dengan Google. Silakan coba lagi.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitError(null);

    try {
      // 1. Register user via Firebase Auth
      await registerWithEmail(values.email, values.password);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Gagal mengautentikasi pengguna setelah pendaftaran.');
      }

      // 2. Call Cloud Function: onboardTenant
      const onboardTenant = httpsCallable<{ tenantName: string }, { message: string; tenantId: string }>(
        functions,
        'onboardTenant'
      );
      await onboardTenant({ tenantName: values.tenantName });

      // 3. Force token refresh and sync auth states
      await refresh();

      // 4. Redirect to Dashboard
      router.replace('/dashboard');
    } catch (error) {
      console.error('[register] Pendaftaran gagal:', error);
      setSubmitError(getRegisterErrorMessage(error));
    }
  };

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <label htmlFor="tenantName" className="block text-sm font-medium text-slate-700">
            Nama Toko / Bisnis
          </label>
          <input
            id="tenantName"
            type="text"
            autoComplete="organization"
            {...register('tenantName')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
            placeholder="Contoh: Kedai Kopi Sukses"
            disabled={isSubmitting}
          />
          {errors.tenantName ? <p className="text-xs text-rose-600">{errors.tenantName.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
            placeholder="pemilik@bisnis.com"
            disabled={isSubmitting}
          />
          {errors.email ? <p className="text-xs text-rose-600">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
            placeholder="Buat password minimal 6 karakter"
            disabled={isSubmitting}
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
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
          disabled={isSubmitting || isGoogleLoading}
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-white" />
              Mendaftar & Menyiapkan Toko...
            </>
          ) : (
            'Daftar Sekarang'
          )}
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">atau</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting || isGoogleLoading}
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
          {isGoogleLoading ? 'Menghubungkan ke Google...' : 'Daftar dengan Google'}
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
