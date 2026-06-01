'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';

import { registerWithEmail } from '@/src/features/auth/services/auth.service';
import { auth } from '@/src/lib/firebase/auth';
import { functions } from '@/src/lib/firebase/functions';
import { useAuthStore } from '@/src/stores/authStore';

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
  const [submitError, setSubmitError] = useState<string | null>(null);

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

      // 3. Force token refresh to fetch updated claims (tenantId, role)
      await currentUser.getIdToken(true);
      const idTokenResult = await currentUser.getIdTokenResult();
      const tenantId = (idTokenResult.claims.tenantId as string) ?? null;
      const role = (idTokenResult.claims.role as string) ?? null;

      // 4. Update state in Zustand auth store
      useAuthStore.getState().setAuth(currentUser, role, tenantId);

      // 5. Redirect to Dashboard
      router.replace('/dashboard');
    } catch (error) {
      console.error('[register] Pendaftaran gagal:', error);
      setSubmitError(getRegisterErrorMessage(error));
    }
  };

  return (
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
        disabled={isSubmitting}
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
    </form>
  );
}
