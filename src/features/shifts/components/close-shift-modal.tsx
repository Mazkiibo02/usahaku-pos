'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Coins, 
  CreditCard, 
  AlertTriangle, 
  Clock, 
  Wallet,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { useAuthStore } from '@/src/stores/authStore';
import { useShiftStore } from '@/src/stores/shiftStore';

type CloseShiftModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CloseShiftModal({ isOpen, onClose, onSuccess }: CloseShiftModalProps) {
  const { tenantId } = useAuthStore();
  const { activeShift, closeShift } = useShiftStore();
  const [actualEndingCashInput, setActualEndingCashInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parse starting cash and sales
  const startingCash = activeShift?.startingCash ?? 0;
  const totalCashSales = activeShift?.totalCashSales ?? 0;
  const totalQrisSales = activeShift?.totalQrisSales ?? 0;

  // Expected cash (Starting Cash + Cash Sales)
  const expectedEndingCash = useMemo(() => {
    return startingCash + totalCashSales;
  }, [startingCash, totalCashSales]);

  // Actual cash entered
  const actualEndingCash = useMemo(() => {
    const val = parseFloat(actualEndingCashInput);
    return isNaN(val) ? 0 : val;
  }, [actualEndingCashInput]);

  // Variance = Actual - Expected
  const variance = useMemo(() => {
    if (actualEndingCashInput === '') return 0;
    return actualEndingCash - expectedEndingCash;
  }, [actualEndingCash, expectedEndingCash, actualEndingCashInput]);

  // Formatter for currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format date time
  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '-';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return '-';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !activeShift) return;
    if (actualEndingCashInput === '') {
      setErrorMsg('Silakan masukkan jumlah uang fisik di laci.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await closeShift(tenantId, activeShift.id, {
        actualEndingCash,
        notes,
      });
      setNotes('');
      setActualEndingCashInput('');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menutup shift kerja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-150 px-6 py-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Tutup Shift Kerja</h3>
                <p className="text-xs text-slate-400 font-medium">Lakukan rekonsiliasi uang laci kasir</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-4">
                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-700">
                    <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Cashier Info & Timing */}
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/60 text-slate-700 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Waktu Mulai Shift</p>
                    <p className="text-sm font-bold text-slate-800">{formatDateTime(activeShift.startTime)}</p>
                  </div>
                </div>

                {/* Stats Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-slate-500" /> Modal Awal
                    </span>
                    <span className="text-md font-extrabold text-slate-900 mt-2">
                      {formatPrice(startingCash)}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-emerald-500" /> Penjualan Cash
                    </span>
                    <span className="text-md font-extrabold text-emerald-700 mt-2">
                      +{formatPrice(totalCashSales)}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-blue-500" /> Penjualan QRIS
                    </span>
                    <span className="text-md font-extrabold text-blue-700 mt-2">
                      +{formatPrice(totalQrisSales)}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-emerald-600 animate-pulse" /> Ekspektasi Kas Laci
                    </span>
                    <span className="text-md font-black text-slate-900 mt-2">
                      {formatPrice(expectedEndingCash)}
                    </span>
                  </div>
                </div>

                {/* Input: Uang Fisik */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Uang Fisik di Laci (Kasir Hitung Manual) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-450">Rp</span>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Masukkan total uang fisik..."
                      value={actualEndingCashInput}
                      onChange={(e) => setActualEndingCashInput(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-450 focus:bg-white font-extrabold"
                    />
                  </div>
                </div>

                {/* Input: Catatan Perubahan */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Catatan Perubahan / Alasan Selisih
                  </label>
                  <textarea
                    placeholder="Masukkan alasan jika ada selisih kas atau catatan lainnya..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-450 focus:bg-white font-medium resize-none"
                  />
                </div>

                {/* Variance Display */}
                {actualEndingCashInput !== '' && (
                  <div className={`rounded-2xl border p-4 flex items-center justify-between transition-all duration-300 ${
                    variance === 0 
                      ? 'border-emerald-200 bg-emerald-50/20 text-emerald-800'
                      : variance > 0
                      ? 'border-blue-200 bg-blue-50/20 text-blue-800'
                      : 'border-rose-200 bg-rose-50/20 text-rose-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                        variance === 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : variance > 0
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {variance === 0 ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : variance > 0 ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">Selisih / Variansi</p>
                        <p className="text-sm font-black mt-0.5">
                          {variance === 0 
                            ? 'Uang Pas (Sesuai)' 
                            : variance > 0 
                            ? `Surplus: ${formatPrice(variance)}` 
                            : `Minus/Defisit: ${formatPrice(variance)}`}
                        </p>
                      </div>
                    </div>
                    {variance < 0 && (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full animate-bounce shrink-0">
                        Harap Periksa!
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 border-t border-slate-150 px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-850 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Proses Penutupan...
                    </>
                  ) : (
                    'Tutup Shift Sekarang'
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
