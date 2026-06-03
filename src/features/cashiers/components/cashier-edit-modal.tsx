'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Store } from 'lucide-react';

import { cashierService } from '../api/cashier-service';
import type { Cashier } from '../types';
import type { Outlet } from '@/src/features/outlets/types';

type CashierEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cashier: Cashier | null;
  outlets: Outlet[];
  onSuccess: () => void;
};

export function CashierEditModal({
  isOpen,
  onClose,
  cashier,
  outlets,
  onSuccess,
}: CashierEditModalProps) {
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeOutlets = outlets.filter((o) => o.isActive);

  // Sync state with selected cashier
  useEffect(() => {
    if (cashier) {
      setSelectedOutletId(cashier.outletId || '');
      setError(null);
    }
  }, [cashier]);

  if (!cashier) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutletId) {
      setError('Silakan pilih cabang outlet penugasan.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await cashierService.updateCashierOutlet(cashier.uid, selectedOutletId);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal memutasi kasir. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
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
                Mutasi Cabang Kasir
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
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Name (Disabled) */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-500">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={cashier.name}
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed font-medium"
                />
              </div>

              {/* Email (Disabled) */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-500">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={cashier.email}
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed font-medium"
                />
              </div>

              {/* Outlet Branch Selection */}
              <div className="space-y-1">
                <label htmlFor="editOutletId" className="block text-sm font-semibold text-slate-700">
                  Cabang Outlet (Mutasi Penugasan)
                </label>
                <div className="relative">
                  <select
                    id="editOutletId"
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    disabled={isSubmitting || activeOutlets.length === 0}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70 appearance-none font-semibold text-slate-800"
                  >
                    <option value="">Pilih Cabang Outlet...</option>
                    {activeOutlets.map((outlet) => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name} {outlet.id === cashier.outletId ? '(Saat Ini)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Store className="h-4.5 w-4.5" />
                  </div>
                </div>
                {activeOutlets.length === 0 && (
                  <p className="text-xs font-medium text-amber-600 mt-1">
                    * Anda harus memiliki minimal satu outlet aktif untuk memutasi kasir.
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
                  disabled={isSubmitting || activeOutlets.length === 0 || selectedOutletId === cashier.outletId}
                  className="flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 min-w-[100px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Mutasi'
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
