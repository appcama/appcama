import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export function PWAOfflineBanner() {
  const { isOnline, pendingOperations, syncPendingOperations, isSyncing } = useOfflineSync();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // Show reconnection message briefly
      setShowBanner(true);
      setTimeout(() => {
        setShowBanner(false);
      }, 3000);
    } else {
      setShowBanner(false);
    }
  }, [isOnline, wasOffline]);

  const handleRetry = async () => {
    if (isOnline) {
      await syncPendingOperations();
    }
  };

  if (!showBanner) return null;

  return (
    <Alert 
      className={`
        fixed top-safe-top left-0 right-0 z-50 mx-4 mt-2 border-2
        ${!isOnline 
          ? 'border-orange-500 bg-orange-50 text-orange-800' 
          : 'border-green-500 bg-green-50 text-green-800'
        }
        animate-slide-up
      `}
    >
      <div className="flex items-center gap-3">
        {!isOnline ? (
          <WifiOff className="w-5 h-5 text-orange-600" />
        ) : (
          <Wifi className="w-5 h-5 text-green-600" />
        )}
        
        <div className="flex-1">
          <AlertDescription className="font-medium">
            {!isOnline ? (
              <>
                Modo Offline - Suas alterações serão sincronizadas quando a conexão for restabelecida
                {pendingOperations.length > 0 && (
                  <span className="block text-sm mt-1">
                    {pendingOperations.length} operação{pendingOperations.length > 1 ? 'ões' : ''} pendente{pendingOperations.length > 1 ? 's' : ''}
                  </span>
                )}
              </>
            ) : wasOffline ? (
              <>
                Conectado! 
                {pendingOperations.length > 0 && (
                  <span className="block text-sm mt-1">
                    Sincronizando {pendingOperations.length} operação{pendingOperations.length > 1 ? 'ões' : ''}...
                  </span>
                )}
              </>
            ) : (
              'Conectado'
            )}
          </AlertDescription>
        </div>

        {isOnline && pendingOperations.length > 0 && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleRetry}
            disabled={isSyncing}
            className="border-current"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                Sincronizar
              </>
            )}
          </Button>
        )}
      </div>
    </Alert>
  );
}