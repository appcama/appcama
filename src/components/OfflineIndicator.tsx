import { Wifi, WifiOff, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showText?: boolean;
}

export function OfflineIndicator({ className, showText = true }: OfflineIndicatorProps) {
  const { 
    isOnline, 
    isSyncing, 
    pendingOperations, 
    syncPendingOperations 
  } = useOfflineSync();

  const handleSyncClick = () => {
    if (isOnline && !isSyncing) {
      syncPendingOperations();
    }
  };

  if (isOnline && pendingOperations.length === 0 && !isSyncing) {
    return null; // Don't show anything when online and no pending operations
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Network Status */}
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {showText && (isOnline ? "Online" : "Offline")}
      </Badge>

      {/* Sync Status */}
      {(pendingOperations.length > 0 || isSyncing) && (
        <>
          <Badge 
            variant="secondary"
            className="flex items-center gap-1"
          >
            {isSyncing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isOnline ? (
              <Cloud className="h-3 w-3" />
            ) : (
              <CloudOff className="h-3 w-3" />
            )}
            {showText && (
              isSyncing 
                ? "Sincronizando..." 
                : `${pendingOperations.length} pendente${pendingOperations.length > 1 ? 's' : ''}`
            )}
          </Badge>

          {/* Sync Button */}
          {isOnline && !isSyncing && pendingOperations.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncClick}
              className="h-6 px-2 text-xs"
            >
              Sincronizar
            </Button>
          )}
        </>
      )}
    </div>
  );
}