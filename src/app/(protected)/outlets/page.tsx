'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Store, Activity, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { doc, onSnapshot } from 'firebase/firestore';

import { useAuthStore } from '@/src/stores/authStore';
import { outletService } from '@/src/features/outlets/api/outlet-service';
import type { Outlet } from '@/src/features/outlets/types';
import { OutletList } from '@/src/features/outlets/components/outlet-list';
import { OutletForm } from '@/src/features/outlets/components/outlet-form';
import { db } from '@/src/lib/firebase/firebase';

export default function OutletsPage() {
  const { tenantId, role } = useAuthStore();
  const router = useRouter();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Control States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);

  // Subscription Gatekeeping States
  const [maxOutlets, setMaxOutlets] = useState<number>(2);
  const [isTenantLoading, setIsTenantLoading] = useState<boolean>(true);

  // Redirect cashier users
  useEffect(() => {
    if (role === 'cashier') {
      router.replace('/pos');
    }
  }, [role, router]);

  const fetchOutlets = useCallback(async () => {
    if (!tenantId || role === 'cashier') return;
    // Defer state updates to avoid synchronous setState inside useEffect hook
    await Promise.resolve();
    setIsLoading(true);
    setError(null);
    try {
      const data = await outletService.getOutlets(tenantId);
      setOutlets(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal memuat outlet. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, role]);

  useEffect(() => {
    if (tenantId && role !== 'cashier') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchOutlets();
    }
  }, [tenantId, role, fetchOutlets]);

  const handleAddClick = () => {
    setSelectedOutlet(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setIsFormOpen(true);
  };

  // Compute Stats
  const totalOutlets = outlets.length;
  const activeOutlets = outlets.filter((o) => o.isActive).length;
  const inactiveOutlets = totalOutlets - activeOutlets;

  if (role === 'cashier') {
    return null;
  }

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

  // Listen to the tenant's maxOutlets in real time
  useEffect(() => {
    if (!tenantId || role === 'cashier') {
      setIsTenantLoading(false);
      return;
    }

    setIsTenantLoading(true);
    const docRef = doc(db, 'tenants', tenantId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMaxOutlets(data.maxOutlets ?? 2);
        }
        setIsTenantLoading(false);
      },
      (err) => {
        console.error('Error fetching tenant details:', err);
        setIsTenantLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId, role]);

  const isLimitReached = outlets.length >= maxOutlets;

  return (
    <div className="mx-auto w-full max-w-full lg:max-w-7xl overflow-x-hidden space-y-6 p-0.5">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Cabang & Outlet
          </h1>
          <p className="text-sm text-slate-500 md:text-base">
            Kelola lokasi toko fisik dan profil cabang Anda.
          </p>
        </div>
        <button
          onClick={handleAddClick}
          disabled={isLimitReached}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="mr-1.5 h-5 w-5" />
          Tambah Outlet
        </button>
      </div>

      {/* Warning Banner when limit is reached */}
      {isLimitReached && !isLoading && !isTenantLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shadow-inner">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Batas Outlet Tercapai</h4>
              <p className="mt-0.5 text-xs text-amber-705 leading-relaxed">
                Batas outlet untuk paket Anda telah tercapai. Silakan upgrade paket langganan Anda untuk menambah outlet.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings?tab=subscription"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-slate-800 shrink-0"
          >
            Upgrade Langganan
          </Link>
        </motion.div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Outlets */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Outlet</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {isLoading ? (
                  <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
                ) : (
                  totalOutlets
                )}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
              <Store className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/* Active Outlets */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outlet Aktif</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {isLoading ? (
                  <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
                ) : (
                  activeOutlets
                )}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/* Inactive Outlets */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outlet Tidak Aktif</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {isLoading ? (
                  <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
                ) : (
                  inactiveOutlets
                )}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
              <EyeOff className="h-5 w-5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {isLoading || isTenantLoading ? (
        <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="space-y-3 pt-4">
            <div className="h-10 w-full animate-pulse rounded bg-slate-50" />
            <div className="h-12 w-full animate-pulse rounded bg-slate-50" />
            <div className="h-12 w-full animate-pulse rounded bg-slate-50" />
            <div className="h-12 w-full animate-pulse rounded bg-slate-50" />
          </div>
        </div>
      ) : (
        <OutletList
          outlets={outlets}
          tenantId={tenantId}
          onEdit={handleEditClick}
          onAddTrigger={handleAddClick}
          onRefresh={fetchOutlets}
        />
      )}

      {/* Form Drawer / Modal Overlay */}
      {isFormOpen && (
        <OutletForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          tenantId={tenantId}
          outlet={selectedOutlet}
          onSuccess={fetchOutlets}
        />
      )}
    </div>
  );
}
