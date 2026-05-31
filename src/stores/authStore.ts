'use client';

import { create } from 'zustand';
import type { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  role: string | null;
  tenantId: string | null;
  isLoading: boolean;
  setAuth: (user: User | null, role: string | null, tenantId: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  tenantId: null,
  isLoading: true,
  setAuth: (user, role, tenantId) => set({ user, role, tenantId }),
  setLoading: (isLoading) => set({ isLoading }),
}));
