'use client';

import { useEffect } from 'react';

export default function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerSw = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Abaikan jika browser membatasi service worker pada mode tertentu
      });
    };

    if (document.readyState === 'complete') {
      registerSw();
    } else {
      window.addEventListener('load', registerSw, { once: true });
    }
  }, []);

  return null;
}