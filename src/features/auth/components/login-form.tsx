'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useAuth } from '@/src/features/auth/hooks/use-auth';

const loginSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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

  return (
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
          autoComplete="current-password"
          {...register('password')}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          placeholder="Enter your password"
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
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
