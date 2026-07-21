'use client';

import { useEffect } from 'react';

export default function PwaRegistry() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if ((window as any).workbox !== undefined) {
        (window as any).workbox.register();
      } else {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.error('Service Worker registration failed: ', err);
        });
      }
    }
  }, []);

  return null;
}
