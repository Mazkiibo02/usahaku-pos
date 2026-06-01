import type { User } from 'firebase/auth';

export type UserRole = 'owner' | 'cashier';

export type AuthClaims = {
  tenantId: string | null;
  role: UserRole | null;
  outletId: string | null;
};

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  tenantId: string | null;
  role: UserRole | null;
  outletId: string | null;
  isActive: boolean;
  claims: AuthClaims;
};

export type AuthState = {
  user: AppUser | null;
  firebaseUser: User | null;
  loading: boolean;
};
