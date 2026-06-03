'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Store, Activity, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuthStore } from '@/src/stores/authStore';
import { outletService } from '@/src/features/outlets/api/outlet-service';
import type { Outlet } from '@/src/features/outlets/types';
import { OutletList } from '@/src/features/outlets/components/outlet-list';
import { OutletForm } from '@/src/features/outlets/components/outlet-form';

export default function OutletsPage() {
  const { tenantId } = useAuthStore();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Control States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);

  const fetchOutlets = useCallback(async () => {
    if (!tenantId) return;
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
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchOutlets();
    }
  }, [tenantId, fetchOutlets]);

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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950/20"
        >
          <Plus className="mr-1.5 h-5 w-5" />
          Tambah Outlet
        </button>
      </div>

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

      {isLoading ? (
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
