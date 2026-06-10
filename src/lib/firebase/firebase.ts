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
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

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

// Initialize Firebase App Check in browser environment
if (typeof window !== 'undefined') {
  // Use debug token in local development or emulator modes
  if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(firebaseEnv.recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

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
if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  // Prevent double-connection errors in Next.js fast refresh
  const globalWithEmulators = globalThis as typeof globalThis & { _emulatorsStarted?: boolean };
  
  if (!globalWithEmulators._emulatorsStarted) {
    const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';
    
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorHost, 8085);
    connectFunctionsEmulator(functions, emulatorHost, 5001);
    connectStorageEmulator(storage, emulatorHost, 9199);
    
    globalWithEmulators._emulatorsStarted = true;
    console.log(`Firebase Emulators connected to ${emulatorHost} (Auth: 9099, Firestore: 8085, Functions: 5001, Storage: 9199)`);
  }
}

export { app, auth, db, functions, storage };
