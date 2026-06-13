'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  FileText, 
  Loader2, 
  Search, 
  Calendar, 
  Store, 
  Users, 
  DollarSign, 
  Eye, 
  RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuthStore } from '@/src/stores/authStore';
import { transactionService } from '@/src/features/transactions/api/transaction-service';
import { outletService } from '@/src/features/outlets/api/outlet-service';
import { cashierService } from '@/src/features/cashiers/api/cashier-service';
import type { Transaction } from '@/src/features/transactions/types';
import type { Outlet } from '@/src/features/outlets/types';
import type { Cashier } from '@/src/features/cashiers/types';
import { ReceiptPrint } from '@/src/features/transactions/components/ReceiptPrint';
import { format } from 'date-fns';

export default function TransactionsPage() {
  const { tenantId, user: currentUser, role, outletId: cashierOutletId, isLoading: authLoading } = useAuthStore();

  // Core records state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);

  // Page level indicators
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOutletId, setSelectedOutletId] = useState('ALL');

  // Date range filters (default to current day / Today)
  const [startDateStr, setStartDateStr] = useState<string>(() => {
    return format(new Date(), 'yyyy-MM-dd');
  });
  const [endDateStr, setEndDateStr] = useState<string>(() => {
    return format(new Date(), 'yyyy-MM-dd');
  });

  // Modal receipt states
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Load backend data
  const fetchData = useCallback(async () => {
    if (authLoading || !tenantId || !role) {
      setIsLoading(true);
      return;
    }

    // Strict defensive check for cashier: both tenantId and cashierOutletId must be present
    if (role === 'cashier') {
      if (!cashierOutletId || cashierOutletId.trim() === '') {
        setError('ID Outlet Kasir tidak valid atau tidak ditemukan.');
        setIsLoading(false);
        return;
      }
    }

    await Promise.resolve();
    setIsLoading(true);
    setError(null);

    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T23:59:59.999');

    try {
      if (role === 'cashier') {
        const [txData, outletsData] = await Promise.all([
          transactionService.getTransactions(tenantId, 100, cashierOutletId || undefined, start, end),
          outletService.getOutlets(tenantId),
        ]);
        setTransactions(txData);
        setOutlets(outletsData);
        if (currentUser) {
          setCashiers([{
            uid: currentUser.uid,
            name: currentUser.displayName || 'Kasir',
            email: currentUser.email || '',
            role: 'cashier',
            tenantId,
            outletId: cashierOutletId || '',
            createdAt: new Date(),
          }]);
        } else {
          setCashiers([]);
        }
      } else {
        const [txData, outletsData, cashiersData] = await Promise.all([
          transactionService.getTransactions(tenantId, 100, undefined, start, end),
          outletService.getOutlets(tenantId),
          cashierService.getCashiers(tenantId),
        ]);
        setTransactions(txData);
        setOutlets(outletsData);
        setCashiers(cashiersData);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal memuat riwayat transaksi. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, role, cashierOutletId, currentUser, authLoading, startDateStr, endDateStr]);

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId, fetchData]);

  useEffect(() => {
    if (role === 'cashier' && cashierOutletId) {
      setSelectedOutletId(cashierOutletId);
    }
  }, [role, cashierOutletId]);

  // Name Resolution Maps
  const outletMap = useMemo(() => {
    return new Map(outlets.map((o) => [o.id, o.name]));
  }, [outlets]);

  const cashierMap = useMemo(() => {
    return new Map(cashiers.map((c) => [c.uid, c.name]));
  }, [cashiers]);

  // Map of transactions with resolved display labels
  const resolvedTransactions = useMemo(() => {
    return transactions.map((tx) => {
      // Find branch/outlet label
      const outletName = outletMap.get(tx.outletId) || 'Outlet Tidak Dikenal';
      
      // Find cashier label (handle owner cashier)
      let cashierName = cashierMap.get(tx.cashierId);
      if (!cashierName) {
        if (tx.cashierId === currentUser?.uid) {
          cashierName = currentUser.displayName || 'Owner (Toko)';
        } else {
          cashierName = 'Staf/Owner';
        }
      }

      return {
        ...tx,
        resolvedOutlet: outletName,
        resolvedCashier: cashierName,
      };
    });
  }, [transactions, outletMap, cashierMap, currentUser]);

  // Filters logic on client side
  const filteredTransactions = useMemo(() => {
    return resolvedTransactions.filter((tx) => {
      const matchesSearch =
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.resolvedCashier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesOutlet =
        selectedOutletId === 'ALL' || tx.outletId === selectedOutletId;

      return matchesSearch && matchesOutlet;
    });
  }, [resolvedTransactions, searchQuery, selectedOutletId]);

  // Stats calculation
  const totalSalesVolume = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  }, [filteredTransactions]);

  const totalSalesCount = filteredTransactions.length;

  // Currency masking helper
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Time formatter
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const handleOpenReceipt = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsReceiptOpen(true);
  };

  const handleCloseReceipt = () => {
    setIsReceiptOpen(false);
    setSelectedTx(null);
  };

  if (!tenantId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">Menyinkronkan status autentikasi...</p>
        </div>
      </div>
    );
  }

  // Get active selected cashier & outlet names for the print dialog
  const activeReceiptNames = useMemo(() => {
    if (!selectedTx) return { cashier: '', outlet: '' };
    const outlet = outletMap.get(selectedTx.outletId) || 'Outlet';
    let cashier = cashierMap.get(selectedTx.cashierId);
    if (!cashier) {
      cashier = selectedTx.cashierId === currentUser?.uid ? (currentUser.displayName || 'Owner') : 'Kasir';
    }
    return { cashier, outlet };
  }, [selectedTx, outletMap, cashierMap, currentUser]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 flex flex-col h-full overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Riwayat Transaksi
          </h1>
          <p className="text-sm text-slate-500 md:text-base">
            Pantau semua catatan penjualan yang terdaftar, lihat rincian item, dan cetak ulang struk belanja thermal.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${isLoading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 shrink-0">
        {/* Total Transaksi */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Transaksi</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {isLoading ? (
                  <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
                ) : (
                  totalSalesCount
                )}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-650">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/* Total Pendapatan */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Volume Penjualan</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {isLoading ? (
                  <div className="h-7 w-32 animate-pulse rounded bg-slate-100" />
                ) : (
                  formatPrice(totalSalesVolume)
                )}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main filter controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between shrink-0">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-455" />
          <input
            type="text"
            placeholder="Cari ID transaksi, nama kasir, atau menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white"
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 bg-slate-50/50 text-slate-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm text-sm">
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer w-[115px] sm:w-auto"
            />
            <span className="text-slate-300 font-semibold px-0.5 text-xs">s/d</span>
            <input
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer w-[115px] sm:w-auto"
            />
          </div>
        </div>

        {/* Branch Filter */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 bg-slate-50/50 text-slate-400">
            <Store className="h-4 w-4" />
          </div>
          <select
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(e.target.value)}
            disabled={role === 'cashier'}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition hover:border-slate-350 cursor-pointer font-semibold text-slate-650 disabled:opacity-55 disabled:cursor-not-allowed"
          >
            {role === 'cashier' ? (
              <option value={cashierOutletId || 'ALL'}>
                {outlets.find((o) => o.id === cashierOutletId)?.name || 'Cabang Ditugaskan'}
              </option>
            ) : (
              <>
                <option value="ALL">Semua Cabang Outlet</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
      </div>

      {/* Main Table / Grid Container */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shrink-0">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm flex-1 min-h-[300px]">
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="space-y-3 pt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded bg-slate-50" />
            ))}
          </div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center flex-1">
          <FileText className="h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-md font-bold text-slate-800">Tidak ada riwayat transaksi</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-xs leading-normal">
            Belum ada penjualan tercatat untuk parameter pencarian atau filter cabang ini.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-sm shrink-0">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-slate-150">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Waktu Transaksi
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      ID Transaksi
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Cabang Branch
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Kasir / Staf
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Total Nominal
                    </th>
                    <th scope="col" className="relative px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition duration-150">
                      {/* Time */}
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {formatTime(tx.createdAt)}
                        </div>
                      </td>

                      {/* Receipt ID */}
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-mono font-bold text-slate-550">
                        {tx.id.toUpperCase()}
                      </td>

                      {/* Outlet */}
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-750">
                        <div className="flex items-center gap-1.5">
                          <Store className="h-4 w-4 text-slate-400" />
                          {tx.resolvedOutlet}
                        </div>
                      </td>

                      {/* Cashier */}
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-slate-400" />
                          {tx.resolvedCashier}
                        </div>
                      </td>

                      {/* Total Paid */}
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-black text-slate-900">
                        {formatPrice(tx.totalAmount)}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <button
                          onClick={() => handleOpenReceipt(tx)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Lihat Struk
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Render Print Dialog */}
      {isReceiptOpen && selectedTx && (
        <ReceiptPrint
          isOpen={isReceiptOpen}
          onClose={handleCloseReceipt}
          transaction={selectedTx}
          cashierName={activeReceiptNames.cashier}
          outletName={activeReceiptNames.outlet}
        />
      )}
    </div>
  );
}
