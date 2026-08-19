import React from 'react';
import { Sparkles, RefreshCw, Lock, ArrowUpRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAiStore } from '@/src/stores/aiStore';
import { auth } from '@/src/lib/firebase';
import { useRouter } from 'next/navigation';

interface AiInsightsPanelProps {
  isPaidTier: boolean;
}

export function AiInsightsPanel({ isPaidTier }: AiInsightsPanelProps) {
  const { insights, isLoading, error, fetchInsights } = useAiStore();
  const router = useRouter();

  const handleGenerate = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      await fetchInsights(token);
    }
  };

  if (!isPaidTier) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 shadow-sm">
        <div className="flex items-center gap-3 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              AI Business Analyst
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider">Premium</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Dapatkan analisis mendalam secara otomatis dengan Google Gemini AI.</p>
          </div>
        </div>

        <div className="relative mt-2 flex flex-col items-center justify-center rounded-xl border border-slate-200/60 bg-white/60 p-8 text-center backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 rounded-xl" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Fitur Terkunci</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              Tingkatkan ke Paket 1 Outlet atau lebih untuk membuka AI Analyst dan menemukan pola penjualan tersembunyi.
            </p>
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500"
            >
              Upgrade Sekarang <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-100/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">AI Business Analyst</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Didukung oleh Google Gemini AI
            </p>
          </div>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-700 border border-indigo-200 shadow-sm transition hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Menganalisis...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Buat Analisis Baru</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 animate-pulse pt-2">
            <div className="h-4 w-3/4 rounded bg-indigo-100"></div>
            <div className="h-4 w-full rounded bg-indigo-100"></div>
            <div className="h-4 w-5/6 rounded bg-indigo-100"></div>
            <div className="h-4 w-1/2 rounded bg-indigo-100"></div>
          </div>
        ) : insights ? (
          <div className="prose prose-sm prose-indigo max-w-none text-slate-700">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-indigo-100/50 p-3">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              Klik tombol "Buat Analisis Baru" untuk mulai menghasilkan insight dari data transaksi Anda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
