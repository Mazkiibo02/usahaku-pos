'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

import { outletFormSchema, type OutletFormValues, type Outlet } from '../types';
import { outletService } from '../api/outlet-service';

type OutletFormProps = {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  outlet?: Outlet | null;
  onSuccess: () => void;
};

export function OutletForm({
  isOpen,
  onClose,
  tenantId,
  outlet,
  onSuccess,
}: OutletFormProps) {
  const isEditMode = !!outlet;
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OutletFormValues>({
    resolver: zodResolver(outletFormSchema),
    defaultValues: {
      name: outlet?.name ?? '',
      address: outlet?.address ?? '',
      phone: outlet?.phone ?? '',
      isActive: outlet?.isActive ?? true,
    },
  });

  const isActiveValue = watch('isActive');

  const onSubmit = async (data: OutletFormValues) => {
    setError(null);
    try {
      if (isEditMode && outlet) {
        await outletService.updateOutlet(tenantId, outlet.id, data);
      } else {
        await outletService.createOutlet(tenantId, data);
      }
      onSuccess();
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
                {isEditMode ? 'Edit Cabang Outlet' : 'Tambah Cabang Outlet Baru'}
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
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
              {/* Name */}
              <div className="space-y-1">
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                  Nama Outlet
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Contoh: Cabang Utama Sudirman"
                  {...register('name')}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70"
                />
                {errors.name && (
                  <p className="text-xs font-medium text-rose-600">{errors.name.message}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label htmlFor="address" className="block text-sm font-semibold text-slate-700">
                  Alamat Lengkap
                </label>
                <textarea
                  id="address"
                  placeholder="Contoh: Jl. Jenderal Sudirman No. 21, Jakarta Selatan"
                  rows={3}
                  {...register('address')}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70 resize-none"
                />
                {errors.address && (
                  <p className="text-xs font-medium text-rose-600">{errors.address.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                  Nomor Telepon
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Contoh: 08123456789"
                  {...register('phone')}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70"
                />
                {errors.phone && (
                  <p className="text-xs font-medium text-rose-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Switch / Status toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Status Operasional</h4>
                  <p className="text-xs text-slate-500">
                    {isActiveValue
                      ? 'Outlet ini buka dan aktif untuk transaksi kasir'
                      : 'Outlet ini dinonaktifkan sementara'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setValue('isActive', !isActiveValue)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950/20 disabled:cursor-not-allowed ${
                    isActiveValue ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      isActiveValue ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
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
                  disabled={isSubmitting}
                  className="flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 min-w-[100px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : isEditMode ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambah Outlet'
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
