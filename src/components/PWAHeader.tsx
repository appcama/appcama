import { useState, useEffect } from 'react';
import { PWAUtils } from '@/lib/pwa-config';

export function PWAHeader() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(PWAUtils.isStandalone());
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // Only show custom header in standalone PWA mode
  if (!isStandalone) return null;

  return (
    <div className="pwa-header bg-primary text-primary-foreground p-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <img 
          src="/icon-192x192.png" 
          alt="ReciclaÊ" 
          className="w-6 h-6"
        />
        <span>ReciclaÊ - Gestão de Reciclagem</span>
      </div>
    </div>
  );
}