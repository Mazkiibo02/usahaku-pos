'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onIdTokenChanged, type User } from 'firebase/auth';

import { auth } from '@/src/lib/firebase';
import { useAuthStore } from '@/src/stores/authStore';
import type { AppUser, UserRole } from '@/src/types/auth';
import {
  mapFirebaseUserToAppUser,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
} from '@/src/features/auth/services/auth.service';

type AuthContextValue = {
  user: AppUser | null;
  firebaseUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  tenantId: string | null;
  outletId: string | null;
  isOwner: boolean;
  isCashier: boolean;
  signInWithGoogle: typeof signInWithGoogle;
  signInWithEmail: typeof signInWithEmail;
  signOut: typeof signOutUser;
  refresh: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (nextFirebaseUser) => {
      setFirebaseUser(nextFirebaseUser);
      
      const { setAuth, setLoading: setStoreLoading } = useAuthStore.getState();

      if (!nextFirebaseUser) {
        setUser(null);
        setLoading(false);
        setAuth(null, null, null, null);
        setStoreLoading(false);
        return;
      }

      try {
        const nextUser = await mapFirebaseUserToAppUser(nextFirebaseUser);
        setUser(nextUser);
        setAuth(nextFirebaseUser, nextUser.role, nextUser.tenantId, nextUser.outletId);
        setStoreLoading(false);
      } catch (error) {
        console.error('[auth] Failed to map firebase user to app user', error);
        setUser(null);
        setAuth(null, null, null, null);
        setStoreLoading(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await currentUser.getIdToken(true);
      const nextUser = await mapFirebaseUserToAppUser(currentUser, true);
      setUser(nextUser);
      const { setAuth } = useAuthStore.getState();
      setAuth(currentUser, nextUser.role, nextUser.tenantId, nextUser.outletId);
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutUser();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = user?.role ?? null;

    return {
      user,
      firebaseUser,
      loading,
      isAuthenticated: Boolean(firebaseUser),
      role,
      tenantId: user?.tenantId ?? null,
      outletId: user?.outletId ?? null,
      isOwner: role === 'owner',
      isCashier: role === 'cashier',
      signInWithGoogle,
      signInWithEmail,
      signOut,
      refresh,
    };
  }, [firebaseUser, loading, signOut, user, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
