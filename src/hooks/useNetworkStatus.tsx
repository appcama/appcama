import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    // Check if we're in a browser environment
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Default to online for SSR
  });

  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('[Network] Going online');
      setWasOffline(!navigator.onLine ? true : wasOffline);
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[Network] Going offline');
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return {
    isOnline,
    wasOffline,
    justCameOnline: isOnline && wasOffline
  };
}