'use client';

import { User, Mail, Store, Shield, Edit2, Trash2 } from 'lucide-react';
import type { Cashier } from '../types';
import type { Outlet } from '@/src/features/outlets/types';
import { Timestamp } from 'firebase/firestore';

type CashierListProps = {
  cashiers: Cashier[];
  outlets: Outlet[];
  onAddTrigger: () => void;
  onEdit: (cashier: Cashier) => void;
};

export function CashierList({ cashiers, outlets, onAddTrigger, onEdit }: CashierListProps) {
  const getOutletName = (outletId: string) => {
    const outlet = outlets.find((o) => o.id === outletId);
    return outlet ? outlet.name : 'Unknown Branch';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    // If it's a Firestore Timestamp, it has a toDate() method
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  if (cashiers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
          <User className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-800">Belum ada kasir terdaftar</h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500 font-normal">
          Daftarkan akun staf kasir Anda dan tugaskan mereka ke cabang outlet fisik agar dapat mengoperasikan aplikasi kasir (POS).
        </p>
        <button
          onClick={onAddTrigger}
          className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950/20"
        >
          Tambah Kasir Pertama
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-6 py-4">Nama Lengkap</th>
              <th scope="col" className="px-6 py-4">Alamat Email</th>
              <th scope="col" className="px-6 py-4">Cabang Outlet</th>
              <th scope="col" className="px-6 py-4">Peran</th>
              <th scope="col" className="px-6 py-4">Tanggal Bergabung</th>
              <th scope="col" className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cashiers.map((cashier) => (
              <tr
                key={cashier.uid}
                className="transition duration-150 hover:bg-slate-50/50"
              >
                <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <span>{cashier.name}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{cashier.email}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Store className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-slate-700">{getOutletName(cashier.outletId)}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200/50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    <Shield className="mr-1 h-3 w-3 text-indigo-500" />
                    Kasir
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                  {formatDate(cashier.createdAt)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onEdit(cashier)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                      title="Mutasi/Ubah Cabang Kasir"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => alert("Untuk menjaga integritas riwayat transaksi, akun kasir tidak dapat dihapus. Silakan mutasikan kasir ke cabang lain jika diperlukan.")}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-white text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                      title="Hapus Kasir (Dinonaktifkan)"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
