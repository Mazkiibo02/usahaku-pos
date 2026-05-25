'use client';

import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore';

import { app } from './app';

export const db = getFirestore(app);

let persistenceInitialized = false;

function setupFirestorePersistence(): void {
  if (typeof window === 'undefined' || persistenceInitialized) {
    return;
  }

  persistenceInitialized = true;

  void enableIndexedDbPersistence(db).catch((error: unknown) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error.code === 'failed-precondition' || error.code === 'unimplemented')
    ) {
      console.warn(
        '[firebase] Firestore persistence unavailable. Continuing without offline persistence.',
        error,
      );
      return;
    }

    console.warn('[firebase] Failed to enable Firestore persistence.', error);
  });
}

setupFirestorePersistence();
