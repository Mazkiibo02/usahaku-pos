'use client';

import { create } from 'zustand';
import type { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  role: string | null;
  tenantId: string | null;
  outletId: string | null;
  isLoading: boolean;
  setAuth: (user: User | null, role: string | null, tenantId: string | null, outletId?: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  tenantId: null,
  outletId: null,
  isLoading: true,
  setAuth: (user, role, tenantId, outletId = null) => set({ user, role, tenantId, outletId }),
  setLoading: (isLoading) => set({ isLoading }),
}));
