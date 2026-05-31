'use client';

import { useState } from 'react';
import { Edit2, Trash2, Phone, MapPin, Store, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import type { Outlet } from '../types';
import { outletService } from '../api/outlet-service';
import { Timestamp } from 'firebase/firestore';

type OutletListProps = {
  outlets: Outlet[];
  tenantId: string;
  onEdit: (outlet: Outlet) => void;
  onAddTrigger: () => void;
  onRefresh: () => void;
};

export function OutletList({
  outlets,
  tenantId,
  onEdit,
  onAddTrigger,
  onRefresh,
}: OutletListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Outlet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await outletService.deleteOutlet(tenantId, deleteTarget.id);
      setIsDeleting(false);
      setDeleteTarget(null);
      onRefresh();
    } catch (err: unknown) {
      setIsDeleting(false);
      if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError('Failed to delete outlet. Please try again.');
      }
    }
  };

  const formatDate = (timestamp: Date | Timestamp | null | undefined) => {
    if (!timestamp) return '-';
    // If it's a Firestore Timestamp, it has an toDate() method
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp as Date);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  if (outlets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
          <Store className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-800">No outlets registered</h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Set up physical outlets or stores under your business so your cashiers can process checkouts.
        </p>
        <button
          onClick={onAddTrigger}
          className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950/20"
        >
          Add Your First Outlet
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-4">Outlet Name</th>
                <th scope="col" className="px-6 py-4">Address</th>
                <th scope="col" className="px-6 py-4">Phone</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4">Date Added</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outlets.map((outlet) => (
                <tr
                  key={outlet.id}
                  className="transition duration-150 hover:bg-slate-50/50"
                >
                  <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                        <Store className="h-4.5 w-4.5" />
                      </div>
                      <span>{outlet.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate" title={outlet.address}>{outlet.address}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{outlet.phone}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        outlet.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                          : 'bg-slate-50 text-slate-600 border-slate-200/50'
                      }`}
                    >
                      <span
                        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                          outlet.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {outlet.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                    {formatDate(outlet.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEdit(outlet)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                        title="Edit outlet"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(outlet)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-white text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                        title="Delete outlet"
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteTarget(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Outlet?</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Are you sure you want to delete <span className="font-semibold text-slate-800">&quot;{deleteTarget.name}&quot;</span>?
                    This action is permanent and cannot be undone. Any cashiers assigned to this branch will need to be reassigned.
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {deleteError}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end space-x-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 min-w-[80px]"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
