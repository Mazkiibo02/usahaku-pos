'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

import { firebaseEnv } from '../constants/env';

const firebaseConfig = {
  apiKey: firebaseEnv.apiKey,
  authDomain: firebaseEnv.authDomain,
  projectId: firebaseEnv.projectId,
  storageBucket: firebaseEnv.storageBucket,
  messagingSenderId: firebaseEnv.messagingSenderId,
  appId: firebaseEnv.appId,
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);

// Initialize Firestore with modern persistent cache for offline support (PWA ready)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const functions = getFunctions(app, 'us-central1');

const storage = getStorage(app);

// ONLY connect to emulator if running locally
if (process.env.NODE_ENV === 'development') {
  // Prevent double-connection errors in Next.js fast refresh
  const globalWithEmulators = globalThis as typeof globalThis & { _emulatorsStarted?: boolean };
  
  if (!globalWithEmulators._emulatorsStarted) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8085);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    globalWithEmulators._emulatorsStarted = true;
    console.log('Firebase Emulators connected (Auth: 9099, Firestore: 8085, Functions: 5001, Storage: 9199)');
  }
}

export { app, auth, db, functions, storage };
