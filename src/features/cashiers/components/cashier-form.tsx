'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Eye, EyeOff, Store } from 'lucide-react';

import { cashierSchema, type CashierFormValues } from '../types';
import { cashierService } from '../api/cashier-service';
import type { Outlet } from '@/src/features/outlets/types';

type CashierFormProps = {
  isOpen: boolean;
  onClose: () => void;
  outlets: Outlet[];
  onSuccess: () => void;
};

export function CashierForm({
  isOpen,
  onClose,
  outlets,
  onSuccess,
}: CashierFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CashierFormValues>({
    resolver: zodResolver(cashierSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      outletId: '',
    },
  });

  const activeOutlets = outlets.filter((o) => o.isActive);

  const onSubmit = async (data: CashierFormValues) => {
    setError(null);
    try {
      await cashierService.createCashier(data);
      onSuccess();
      reset();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
      }
    }
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
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white/95 p-6 shadow-2xl backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Tambah Akun Kasir Baru
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Tutup dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
              {/* Name */}
              <div className="space-y-1">
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  {...register('name')}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70"
                />
                {errors.name && (
                  <p className="text-xs font-medium text-rose-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  Alamat Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Contoh: budi.kasir@email.com"
                  {...register('email')}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70"
                />
                {errors.email && (
                  <p className="text-xs font-medium text-rose-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password Akun
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    {...register('password')}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-3 pr-10 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-rose-600">{errors.password.message}</p>
                )}
              </div>

              {/* Outlet Branch Selection */}
              <div className="space-y-1">
                <label htmlFor="outletId" className="block text-sm font-semibold text-slate-700">
                  Cabang Outlet (Penugasan)
                </label>
                <div className="relative">
                  <select
                    id="outletId"
                    {...register('outletId')}
                    disabled={isSubmitting || activeOutlets.length === 0}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70 appearance-none"
                  >
                    <option value="">Pilih Cabang Outlet...</option>
                    {activeOutlets.map((outlet) => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Store className="h-4.5 w-4.5" />
                  </div>
                </div>
                {errors.outletId && (
                  <p className="text-xs font-medium text-rose-600">{errors.outletId.message}</p>
                )}
                {activeOutlets.length === 0 && (
                  <p className="text-xs font-medium text-amber-600 mt-1">
                    * Anda harus memiliki minimal satu outlet aktif sebelum membuat akun kasir.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || activeOutlets.length === 0}
                  className="flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 min-w-[100px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    'Tambah Kasir'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
