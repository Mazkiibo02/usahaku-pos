'use client';

import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { app } from './app';

// Gunakan region default, atau sesuaikan jika Cloud Function-mu menggunakan region spesifik (misal: 'us-central1')
const functions = getFunctions(app, 'us-central1');

// Hubungkan ke Emulator di mode Development
if (process.env.NODE_ENV === 'development') {
  const globalWithFunctions = globalThis as typeof globalThis & { _functionsEmulatorConnected?: boolean };
  
  if (!globalWithFunctions._functionsEmulatorConnected) {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    globalWithFunctions._functionsEmulatorConnected = true;
    console.log('Functions Emulator connected');
  }
}

export { functions };
