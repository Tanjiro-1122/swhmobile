import { useEffect } from 'react';

export default function ServiceWorkerSetup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('✅ Back online');
      document.body.classList.remove('offline-mode');
    });

    window.addEventListener('offline', () => {
      console.log('📴 Offline mode');
      document.body.classList.add('offline-mode');
    });

    return () => {
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
    };
  }, []);

  return null; // This component doesn't render anything
}