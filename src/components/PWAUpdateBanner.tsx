import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, X } from 'lucide-react';

export function PWAUpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [autoUpdateTimeout, setAutoUpdateTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleUpdateAvailable = () => {
      console.log('[PWA Update Banner] Nova atualização disponível');
      setShowBanner(true);

      // Auto-update after 30 seconds if user doesn't interact
      const timeout = setTimeout(() => {
        console.log('[PWA Update Banner] Auto-atualizando após 30s...');
        handleUpdate();
      }, 30000);

      setAutoUpdateTimeout(timeout);
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      if (autoUpdateTimeout) {
        clearTimeout(autoUpdateTimeout);
      }
    };
  }, [autoUpdateTimeout]);

  const handleUpdate = () => {
    console.log('[PWA Update Banner] Usuário aceitou atualização, recarregando...');
    
    // Clear auto-update timeout
    if (autoUpdateTimeout) {
      clearTimeout(autoUpdateTimeout);
    }

    // Reload to activate new service worker
    window.location.reload();
  };

  const handleDismiss = () => {
    console.log('[PWA Update Banner] Usuário dispensou banner');
    setShowBanner(false);

    // Clear auto-update timeout
    if (autoUpdateTimeout) {
      clearTimeout(autoUpdateTimeout);
    }

    // Still auto-update after 2 minutes even if dismissed
    setTimeout(() => {
      console.log('[PWA Update Banner] Auto-atualizando após 2min (dismissed)...');
      window.location.reload();
    }, 120000);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-in slide-in-from-bottom-5">
      <Alert className="bg-primary text-primary-foreground border-primary shadow-lg">
        <div className="flex items-start gap-3">
          <RefreshCw className="h-5 w-5 mt-0.5 animate-spin" />
          <div className="flex-1">
            <AlertDescription className="text-sm">
              <strong>Nova versão disponível!</strong>
              <br />
              Clique para atualizar ou aguarde 30 segundos.
            </AlertDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleUpdate}
              className="h-8"
            >
              Atualizar
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 w-8 hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}
