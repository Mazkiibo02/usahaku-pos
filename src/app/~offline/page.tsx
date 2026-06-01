'use client';

import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xl transition-all duration-300 hover:shadow-2xl">
        {/* Offline Icon Illustration */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <WifiOff className="h-10 w-10 animate-pulse" />
          <span className="absolute right-0 top-0 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-rose-500"></span>
          </span>
        </div>

        {/* Content */}
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Koneksi Terputus
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Anda sedang offline. Silakan periksa koneksi internet Anda. Jangan khawatir, Usahaku POS akan mensinkronisasi data penjualan secara otomatis saat koneksi Anda kembali online.
        </p>

        {/* Status Badge */}
        <div className="mt-5 inline-flex items-center rounded-full border border-amber-200/50 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Mode Offline Siap
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={handleRetry}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-650/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Coba Lagi
          </button>
          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500/10 cursor-pointer"
          >
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
