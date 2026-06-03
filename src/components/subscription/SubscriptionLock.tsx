'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, LogOut, ShieldAlert, Sparkles, MessageCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/src/features/auth/hooks/use-auth';

export function SubscriptionLock() {
  const { role, signOut } = useAuth();
  const [isRenewing, setIsRenewing] = useState(false);
  const isOwner = role === 'owner';

  const handleRenew = () => {
    console.log('Perpanjang Langganan clicked. Midtrans will be integrated here later.');
    setIsRenewing(true);
    setTimeout(() => {
      setIsRenewing(false);
    }, 2000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-slate-50 via-slate-100 to-indigo-50/30 px-4 py-12 dark:bg-slate-950">
      
      {/* Background Decorative Blur Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-40%] left-[-20%] h-[80%] w-[60%] rounded-full bg-indigo-200/30 blur-[120px] dark:bg-indigo-900/20" />
        <div className="absolute bottom-[-40%] right-[-20%] h-[80%] w-[60%] rounded-full bg-rose-200/20 blur-[120px] dark:bg-rose-900/10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70 md:p-10"
      >
        {/* Glow Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-tr from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/25">
            <ShieldAlert className="h-9 w-9" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-400 text-[10px] text-slate-950 font-bold"
            >
              !
            </motion.div>
          </div>

          <h1 className="bg-linear-to-r from-slate-950 to-slate-700 bg-clip-text text-2xl font-black tracking-tight text-transparent dark:from-white dark:to-slate-350 sm:text-3xl">
            {isOwner ? 'Masa Percobaan Telah Habis' : 'Layanan Ditangguhkan'}
          </h1>
          
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
            Expired / Perlu Pembaruan
          </div>

          <p className="mt-6 text-sm leading-relaxed text-slate-650 dark:text-slate-400 sm:text-base">
            {isOwner ? (
              'Terima kasih telah mempercayakan pengelolaan bisnis Anda kepada Usahaku POS. Masa uji coba gratis 30 hari Anda telah berakhir. Perbarui langganan Anda sekarang untuk membuka kembali akses dashboard, pencatatan transaksi kasir, dan fitur premium lainnya.'
            ) : (
              'Masa berlangganan aktif untuk usaha ini telah berakhir. Silakan hubungi pemilik usaha (Owner) Anda agar mereka dapat memperpanjang masa aktif layanan dan Anda dapat kembali menggunakan aplikasi kasir.'
            )}
          </p>
        </div>

        {/* Feature Benefits List (only for owners to encourage upgrading) */}
        {isOwner && (
          <div className="mt-8 rounded-2xl bg-slate-50/80 p-5 dark:bg-slate-800/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Benefit Langganan Usahaku POS:
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-650 dark:text-slate-350">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Transaksi Kasir Tanpa Batas & Multi-Outlet
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Laporan Penjualan Real-time & Analisis Bisnis (AI)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Manajemen Karyawan (Kasir) & Shift Kerja Aman
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Cetak Struk Thermal & Kustom Logo Usaha
              </li>
            </ul>
          </div>
        )}

        {/* Cashier Informative Banner */}
        {!isOwner && (
          <div className="mt-8 flex gap-3 rounded-2xl bg-amber-50/50 p-4 border border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-900/30">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-left">
              <h4 className="text-xs font-bold text-amber-850 dark:text-amber-400">Hubungi Pemilik Usaha</h4>
              <p className="mt-0.5 text-xs text-amber-850/80 dark:text-amber-500">
                Hubungi owner toko untuk melakukan pembayaran langganan melalui halaman Pengaturan di akun pemilik.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {isOwner ? (
            <button
              onClick={handleRenew}
              disabled={isRenewing}
              className="relative flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed dark:from-slate-100 dark:to-white dark:text-slate-950"
            >
              <CreditCard className="h-4.5 w-4.5" />
              {isRenewing ? 'Memproses...' : 'Perpanjang Langganan'}
            </button>
          ) : (
            <a
              href="https://wa.me/628123456789" // Placeholder or support link
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition active:scale-98 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <MessageCircle className="h-4.5 w-4.5 text-emerald-500" />
              Hubungi Owner
            </a>
          )}

          <button
            onClick={() => signOut()}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-650 transition hover:bg-slate-50 active:scale-98 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50"
          >
            <LogOut className="h-4.5 w-4.5" />
            Keluar Akun
          </button>
        </div>

        {/* Footer text */}
        <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
          Usahaku POS v1.0 • Aman & Terpercaya
        </div>

      </motion.div>
    </div>
  );
}
