'server-only';

import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Check if emulator mode is enabled
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';
  
  // Configure Firebase Admin SDK environment variables for emulators
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = `${host}:8085`;
  }
  if (!process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${host}:9199`;
  }
}

// Initialize Firebase Admin app singleton
let app;
if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'usahaku-69700';

  if (privateKey && clientEmail) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // Critical fix for Vercel multi-line newlines string handling:
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Fallback for emulator or default credentials (e.g. in local development / CLI)
    app = initializeApp({
      projectId,
    });
  }
} else {
  app = getApp();
}

const adminDb = getFirestore(app);

export { adminDb };
