// src/lib/firebase/firestore.ts
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator
} from "firebase/firestore";
import { app } from "./app";

// Initialize Firestore with modern persistent cache for offline support (PWA ready)
// This replaces the deprecated enableIndexedDbPersistence()
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Hubungkan ke Emulator di mode Development
if (process.env.NODE_ENV === 'development') {
  const globalWithFirestore = globalThis as typeof globalThis & { _firestoreEmulatorConnected?: boolean };

  if (!globalWithFirestore._firestoreEmulatorConnected) {
    connectFirestoreEmulator(db, '127.0.0.1', 8085);
    globalWithFirestore._firestoreEmulatorConnected = true;
    console.log('Firestore Emulator connected di port 8085');
  }
}

export { db };