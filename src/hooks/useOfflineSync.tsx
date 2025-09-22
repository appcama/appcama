import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { offlineDB, OfflineOperation } from '@/lib/offline-db';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useOfflineSync() {
  const { isOnline, justCameOnline } = useNetworkStatus();
  const [pendingOperations, setPendingOperations] = useState<OfflineOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load pending operations on mount
  useEffect(() => {
    loadPendingOperations();
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (justCameOnline && pendingOperations.length > 0) {
      console.log('[OfflineSync] Just came online, starting sync...');
      syncPendingOperations();
    }
  }, [justCameOnline, pendingOperations.length]);

  const loadPendingOperations = useCallback(async () => {
    try {
      const operations = await offlineDB.getPendingOperations();
      setPendingOperations(operations);
    } catch (error) {
      console.error('[OfflineSync] Error loading pending operations:', error);
    }
  }, []);

  const addOfflineOperation = useCallback(async (
    type: OfflineOperation['type'],
    table: string,
    data: any,
    originalId?: number
  ) => {
    try {
      const operationId = await offlineDB.addOperation({
        type,
        table,
        data,
        originalId
      });

      console.log(`[OfflineSync] Added offline operation: ${type} ${table}`, { operationId, data });
      
      // Update pending operations
      await loadPendingOperations();

      // Show toast for offline operation
      toast({
        title: "Operação salva offline",
        description: `${type === 'CREATE' ? 'Criação' : type === 'UPDATE' ? 'Edição' : 'Exclusão'} será sincronizada quando conectar.`,
        duration: 3000,
      });

      // If online, try to sync immediately
      if (isOnline) {
        syncPendingOperations();
      }

      return operationId;
    } catch (error) {
      console.error('[OfflineSync] Error adding offline operation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a operação offline.",
        variant: "destructive",
      });
      throw error;
    }
  }, [isOnline, loadPendingOperations]);

  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    console.log('[OfflineSync] Starting sync of pending operations...');

    try {
      const operations = await offlineDB.getPendingOperations();
      
      if (operations.length === 0) {
        console.log('[OfflineSync] No pending operations to sync');
        setIsSyncing(false);
        return;
      }

      console.log(`[OfflineSync] Syncing ${operations.length} operations...`);
      let successCount = 0;
      let errorCount = 0;

      for (const operation of operations) {
        try {
          await offlineDB.updateOperationStatus(operation.id!, 'SYNCING');
          
          let result;
          const { table, data, type, originalId } = operation;

          switch (type) {
            case 'CREATE':
              result = await (supabase as any).from(table).insert(data).select().single();
              break;
            case 'UPDATE':
              // Mapear nome da tabela para o nome correto da coluna ID
              const getIdColumn = (tableName: string) => {
                switch (tableName) {
                  case 'tipo_ponto_coleta':
                    return 'id_tipo_ponto_coleta';
                  case 'tipo_residuo':
                    return 'id_tipo_residuo';
                  case 'tipo_entidade':
                    return 'id_tipo_entidade';
                  default:
                    // Para tabelas que seguem o padrão singular
                    return 'id_' + tableName.replace(/s$/, '');
                }
              };
              const idColumn = getIdColumn(table);
              result = await (supabase as any).from(table).update(data).eq(idColumn, originalId).select().single();
              break;
            case 'DELETE':
              const deleteIdColumn = getIdColumn(table);
              result = await (supabase as any).from(table).delete().eq(deleteIdColumn, originalId);
              break;
          }

          if (result.error) {
            throw result.error;
          }

          await offlineDB.updateOperationStatus(operation.id!, 'COMPLETED');
          successCount++;
          
          console.log(`[OfflineSync] Successfully synced operation ${operation.id}`);
        } catch (error) {
          console.error(`[OfflineSync] Error syncing operation ${operation.id}:`, error);
          await offlineDB.updateOperationStatus(
            operation.id!, 
            'FAILED', 
            error instanceof Error ? error.message : 'Unknown error'
          );
          errorCount++;
        }
      }

      // Clean up completed operations
      await offlineDB.clearCompletedOperations();
      await loadPendingOperations();

      // Show sync result toast
      if (successCount > 0) {
        toast({
          title: "Sincronização concluída",
          description: `${successCount} operação${successCount > 1 ? 'ões' : ''} sincronizada${successCount > 1 ? 's' : ''} com sucesso.`,
        });
      }

      if (errorCount > 0) {
        toast({
          title: "Erro na sincronização",
          description: `${errorCount} operação${errorCount > 1 ? 'ões' : ''} falharam. Tentaremos novamente.`,
          variant: "destructive",
        });
      }

      console.log(`[OfflineSync] Sync completed: ${successCount} success, ${errorCount} errors`);
    } catch (error) {
      console.error('[OfflineSync] Error during sync:', error);
      toast({
        title: "Erro na sincronização",
        description: "Falha ao sincronizar dados offline.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, loadPendingOperations]);

  const clearAllPendingOperations = useCallback(async () => {
    try {
      await offlineDB.operations.clear();
      await loadPendingOperations();
      toast({
        title: "Operações limpas",
        description: "Todas as operações pendentes foram removidas.",
      });
    } catch (error) {
      console.error('[OfflineSync] Error clearing operations:', error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar as operações pendentes.",
        variant: "destructive",
      });
    }
  }, [loadPendingOperations]);

  return {
    isOnline,
    isSyncing,
    pendingOperations,
    addOfflineOperation,
    syncPendingOperations,
    clearAllPendingOperations,
    loadPendingOperations
  };
}