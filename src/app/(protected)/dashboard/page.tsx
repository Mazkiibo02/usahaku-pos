'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Award,
  FileSpreadsheet,
  Printer,
  Calendar,
  Loader2,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';

import { useAuthStore } from '@/src/stores/authStore';
import { db } from '@/src/lib/firebase/firebase';
import { analyticsService, type DashboardStats } from '@/src/features/dashboard/services/analyticsService';
import { exportDashboardToExcel, printDashboardToPDF } from '@/src/features/dashboard/utils/exportUtils';

export default function DashboardPage() {
  const { tenantId, user } = useAuthStore();
  const [storeName, setStoreName] = useState<string>('Usahaku POS');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Fetch Tenant store details (Store Name & Custom Logo)
  useEffect(() => {
    async function fetchTenantDetails() {
      if (!tenantId) return;
      try {
        const docRef = doc(db, 'tenants', tenantId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStoreName(data.name || 'Usahaku POS');
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
          }
        }
      } catch (err) {
        console.error('Failed to fetch tenant details in dashboard:', err);
      }
    }
    fetchTenantDetails();
  }, [tenantId]);

  // 1. Date Range State: Default to current month (e.g. June 1 to June 30)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return format(new Date(d.getFullYear(), d.getMonth(), 1), 'yyyy-MM-dd');
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    return format(new Date(d.getFullYear(), d.getMonth() + 1, 0), 'yyyy-MM-dd');
  });

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Fetch statistics data
  const fetchStats = useCallback(async (showRefreshing = false) => {
    if (!tenantId) return;

    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await analyticsService.getDashboardStats(tenantId, startDate, endDate);
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
      setError('Gagal memuat data statistik dashboard. Silakan periksa kembali filter Anda.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tenantId, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Helper formatting utilities
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const calculateAOV = (revenue: number, transactions: number) => {
    if (transactions === 0) return 0;
    return Math.round(revenue / transactions);
  };

  const handleExportExcel = () => {
    if (!stats) return;
    const fromDate = parseISO(startDate);
    const toDate = parseISO(endDate);
    exportDashboardToExcel(stats, { from: fromDate, to: toDate });
  };

  const handlePrintPDF = () => {
    printDashboardToPDF();
  };

  // Skeleton Loader Component
  const DashboardSkeleton = () => (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="h-10 w-80 animate-pulse rounded-lg bg-slate-200" />
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-200/60 bg-slate-100/50 p-6" />
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[400px] animate-pulse rounded-2xl border border-slate-200/60 bg-slate-100/50" />
        <div className="h-[400px] animate-pulse rounded-2xl border border-slate-200/60 bg-slate-100/50" />
      </div>
    </div>
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="print-full-width space-y-6">
      {/* Print-Only Header */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo Toko"
              className="h-16 w-auto object-contain"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xl">
              {storeName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">{storeName}</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Laporan Analisis Bisnis</p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 font-medium">
          <p>Dicetak Pada: {format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
          <p>Periode: {format(parseISO(startDate), 'dd MMM yyyy')} - {format(parseISO(endDate), 'dd MMM yyyy')}</p>
        </div>
      </div>

      {/* 1. Header & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Analisis Bisnis
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">
            Pantau performa pendapatan outlet dan inventaris Anda secara real-time.
          </p>
        </div>

        {/* Date Filters & Action Buttons */}
        <div className="no-print flex flex-wrap items-center gap-3">
          {/* Custom Native Date Range Inputs */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-sm transition hover:border-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
              />
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStats(true)}
              disabled={isRefreshing}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 shadow-sm"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 shadow-sm"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {/* 2. Metrics Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Revenue Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Total Pendapatan
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {stats ? formatCurrency(stats.aggregateRevenue) : 'Rp 0'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-1">
              <span className="text-emerald-600 font-semibold inline-flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5" /> Terhitung
              </span>{' '}
              selama rentang tanggal terpilih
            </p>
          </div>
        </div>

        {/* Transactions Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Total Transaksi
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {stats ? stats.aggregateTransactions : 0}{' '}
              <span className="text-sm font-medium text-slate-500">Sales</span>
            </h3>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Jumlah struk belanja diselesaikan
            </p>
          </div>
        </div>

        {/* Average Order Value Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Rata-rata Transaksi (AOV)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {stats ? formatCurrency(calculateAOV(stats.aggregateRevenue, stats.aggregateTransactions)) : 'Rp 0'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Nilai belanja rata-rata per transaksi
            </p>
          </div>
        </div>
      </div>

      {/* 3. Charts & Top Selling List Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily Revenue Chart Panel */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Grafik Pendapatan Harian</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Tren fluktuasi omset penjualan harian
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
              IDR (Rupiah)
            </span>
          </div>

          <div className="h-[300px] w-full pt-4">
            {stats && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.chartData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(str) => {
                      try {
                        return format(parseISO(str), 'dd MMM');
                      } catch {
                        return str;
                      }
                    }}
                    stroke="#94a3b8"
                    fontSize={11}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(num) => {
                      if (num >= 1000000) {
                        return `${(num / 1000000).toFixed(1)}jt`;
                      }
                      if (num >= 1000) {
                        return `${(num / 1000).toFixed(0)}rb`;
                      }
                      return num;
                    }}
                    stroke="#94a3b8"
                    fontSize={11}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        let formattedDate = data.date;
                        try {
                          formattedDate = format(parseISO(data.date), 'dd MMMM yyyy');
                        } catch {}
                        return (
                          <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3.5 shadow-lg backdrop-blur-sm">
                            <p className="text-xs font-semibold text-slate-400">{formattedDate}</p>
                            <p className="mt-1 text-sm font-extrabold text-indigo-700">
                              {formatCurrency(data.revenue)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Tidak ada data grafik dalam rentang waktu terpilih
              </div>
            )}
          </div>
        </div>

        {/* Top-Selling Products list */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="pb-4">
            <h2 className="text-lg font-bold text-slate-950">Produk Terlaris</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Peringkat produk terlaris berdasarkan kuantitas item terjual
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {stats && stats.topProducts.length > 0 ? (
              stats.topProducts.slice(0, 5).map((item, index) => {
                const maxQty = stats.topProducts[0]?.quantity || 1;
                const percentage = Math.round((item.quantity / maxQty) * 100);

                return (
                  <div key={item.id} className="group space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2.5 max-w-[70%]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition">
                          {index + 1}
                        </span>
                        <span className="truncate font-semibold text-slate-800" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">
                        {item.quantity} pcs
                      </span>
                    </div>

                    {/* Custom progress bar to visually represent popularity */}
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-900 transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
                Belum ada transaksi produk terdaftar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
