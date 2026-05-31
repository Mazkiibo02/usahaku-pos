'use client';

import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { app } from './app';

const auth = getAuth(app);

// Hubungkan ke Emulator di mode Development
if (process.env.NODE_ENV === 'development') {
  const globalWithAuth = globalThis as typeof globalThis & { _authEmulatorConnected?: boolean };
  
  if (!globalWithAuth._authEmulatorConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    globalWithAuth._authEmulatorConnected = true;
    console.log('Auth Emulator connected');
  }
}

export { auth };
