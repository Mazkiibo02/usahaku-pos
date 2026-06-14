'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Store, Sparkles } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';

import { functions } from '@/src/lib/firebase';
import { useAuthStore } from '@/src/stores/authStore';
import { signOutUser } from '@/src/features/auth/services/auth.service';

const onboardingSchema = z.object({
  tenantName: z
    .string()
    .trim()
    .min(3, 'Nama Toko / Bisnis minimal 3 karakter.'),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

interface OnboardingModalProps {
  isOpen: boolean;
  firebaseUser: User | null;
  onCancel: () => void;
}

export function OnboardingModal({ isOpen, firebaseUser, onCancel }: OnboardingModalProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      tenantName: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (values: OnboardingFormValues) => {
    if (!firebaseUser) {
      setSubmitError('Autentikasi diperlukan. Silakan coba lagi.');
      return;
    }

    setSubmitError(null);

    try {
      // 1. Call onboardTenant Cloud Function
      const onboardTenantFn = httpsCallable<{ tenantName: string; name?: string }, { message: string; tenantId: string }>(
        functions,
        'onboardTenant'
      );
      
      await onboardTenantFn({ 
        tenantName: values.tenantName,
        name: firebaseUser.displayName || undefined
      });

      // 2. Force token refresh to apply Custom Claims
      await firebaseUser.getIdToken(true);
      const idTokenResult = await firebaseUser.getIdTokenResult();
      const tenantId = (idTokenResult.claims.tenantId as string) ?? null;
      const role = (idTokenResult.claims.role as string) ?? null;

      // 3. Update Zustand Store
      useAuthStore.getState().setAuth(firebaseUser, role, tenantId, null);

      // 4. Redirect to dashboard
      router.replace('/dashboard');
    } catch (error: any) {
      console.error('[Onboarding Error]', error);
      setSubmitError(error?.message || 'Gagal menyimpan data bisnis. Silakan coba lagi.');
    }
  };

  const handleCancel = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Failed to sign out user on cancel', err);
    }
    onCancel();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={handleCancel}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header decoration */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Langkah Terakhir <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Siapkan nama bisnis untuk mengaktifkan akun Anda.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="tenantName" className="block text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Nama Toko / Bisnis
                </label>
                <input
                  id="tenantName"
                  type="text"
                  autoComplete="organization"
                  {...register('tenantName')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-100 dark:focus:ring-slate-800 disabled:opacity-75 disabled:cursor-not-allowed"
                  placeholder="Contoh: Kedai Kopi Sukses"
                  disabled={isSubmitting}
                  autoFocus
                />
                {errors.tenantName && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">{errors.tenantName.message}</p>
                )}
              </div>

              {submitError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-750 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>Menyiapkan Toko...</span>
                    </>
                  ) : (
                    <span>Aktifkan Free Trial 30 Hari</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-650 hover:bg-slate-100 rounded-lg transition active:scale-[0.98] disabled:opacity-60 cursor-pointer dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
