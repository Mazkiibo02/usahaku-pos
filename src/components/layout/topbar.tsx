'use client';

import { useState } from 'react';
import { Menu, LogOut, Lock } from 'lucide-react';

import type { UserRole } from '@/src/types/auth';
import { useShiftStore } from '@/src/stores/shiftStore';
import { CloseShiftModal } from '@/src/features/shifts/components/close-shift-modal';

type TopbarProps = {
  email: string | null;
  role: UserRole | null;
  onOpenMobileSidebar: () => void;
  onSignOut: () => Promise<void>;
};

function formatRole(role: UserRole | null) {
  if (!role) {
    return 'Peran Tidak Diketahui';
  }

  if (role === 'owner') return 'Pemilik';
  if (role === 'cashier') return 'Kasir';
  return String(role).charAt(0).toUpperCase() + String(role).slice(1);
}

export function Topbar({ email, role, onOpenMobileSidebar, onSignOut }: TopbarProps) {
  const { activeShift } = useShiftStore();
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="ml-auto flex items-center gap-3">
        {activeShift && (
          <>
            <button
              type="button"
              onClick={() => setIsCloseModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 shadow-sm"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>Tutup Shift</span>
            </button>
            <CloseShiftModal
              isOpen={isCloseModalOpen}
              onClose={() => setIsCloseModalOpen(false)}
            />
          </>
        )}

        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{email ?? 'No email'}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">{formatRole(role)}</p>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
}
