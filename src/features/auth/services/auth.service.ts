'use client';

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getIdTokenResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type IdTokenResult,
  type User,
} from 'firebase/auth';

import { auth } from '@/src/lib/firebase';
import type { AppUser, AuthClaims, UserRole } from '@/src/types/auth';

const googleProvider = new GoogleAuthProvider();

function isUserRole(value: unknown): value is UserRole {
  return value === 'owner' || value === 'cashier';
}

function mapClaimsToAuthClaims(claims: Record<string, unknown>): AuthClaims {
  const tenantId = typeof claims.tenantId === 'string' && claims.tenantId.length > 0 ? claims.tenantId : null;
  const role = isUserRole(claims.role) ? claims.role : null;
  const outletId = typeof claims.outletId === 'string' && claims.outletId.length > 0 ? claims.outletId : null;

  return { tenantId, role, outletId };
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  await signOut(auth);
}

export async function getCurrentIdTokenResult(forceRefresh = false): Promise<IdTokenResult | null> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return null;
  }

  return getIdTokenResult(currentUser, forceRefresh);
}

export async function mapFirebaseUserToAppUser(firebaseUser: User, forceRefresh = false): Promise<AppUser> {
  const tokenResult = await getIdTokenResult(firebaseUser, forceRefresh);
  const claims = mapClaimsToAuthClaims(tokenResult.claims);

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    tenantId: claims.tenantId,
    role: claims.role,
    outletId: claims.outletId,
    isActive: true,
    claims,
  };
}
