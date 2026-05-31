'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { auth } from '@/src/lib/firebase/auth';
import { functions } from '@/src/lib/firebase/functions';
import { useAuthStore } from '@/src/stores/authStore';

const onboardingSchema = z.object({
  tenantName: z
    .string()
    .trim()
    .min(3, 'Business/Store name must be at least 3 characters.'),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

function getOnboardingErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'functions/unauthenticated':
        return 'Your session has expired. Please sign in again.';
      case 'functions/invalid-argument':
        return 'Please provide a valid business/store name.';
      case 'functions/failed-precondition':
        return 'Your account is missing required data. Please contact support.';
      default:
        return error.message || 'Onboarding failed. Please try again.';
    }
  }

  if (error instanceof Error) {
    return error.message || 'Onboarding failed. Please try again.';
  }

  return 'Onboarding failed. Please try again.';
}

export function OnboardingForm() {
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

  const onSubmit = async (data: OnboardingFormValues) => {
    setSubmitError(null);

    try {
      const onboardTenant = httpsCallable<{ tenantName: string }, { message: string; tenantId: string }>(
        functions,
        'onboardTenant'
      );
      await onboardTenant({ tenantName: data.tenantName });

      // Force token refresh
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.getIdToken(true);
        const idTokenResult = await currentUser.getIdTokenResult();
        const tenantId = (idTokenResult.claims.tenantId as string) ?? null;
        const role = (idTokenResult.claims.role as string) ?? null;

        // Update Zustand store
        useAuthStore.getState().setAuth(currentUser, role, tenantId);
      }

      router.push('/dashboard');
    } catch (error) {
      setSubmitError(getOnboardingErrorMessage(error));
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <label htmlFor="tenantName" className="block text-sm font-medium text-slate-700">
          Business/Store Name
        </label>
        <input
          id="tenantName"
          type="text"
          autoComplete="organization"
          placeholder="e.g. Kedai Suka Maju"
          {...register('tenantName')}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
        />
        {errors.tenantName ? (
          <p className="text-xs text-rose-600">{errors.tenantName.message}</p>
        ) : null}
      </div>

      {submitError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Setting up your business...' : 'Complete Setup'}
      </button>
    </form>
  );
}
