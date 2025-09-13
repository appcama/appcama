import { useState, useCallback } from 'react';
import { useOfflineSync } from './useOfflineSync';
import { toast } from './use-toast';

interface UseOfflineFormOptions {
  table: string;
  onlineSubmit: (data: any) => Promise<any>;
  onSuccess?: () => void;
}

export function useOfflineForm({ table, onlineSubmit, onSuccess }: UseOfflineFormOptions) {
  const { isOnline, addOfflineOperation } = useOfflineSync();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForm = useCallback(async (data: any, isEdit: boolean = false, originalId?: number) => {
    setIsSubmitting(true);
    
    try {
      if (isOnline) {
        // Try online submission first
        try {
          const result = await onlineSubmit(data);
          toast({
            title: "Sucesso",
            description: `${isEdit ? 'Atualização' : 'Cadastro'} realizado com sucesso.`,
          });
          onSuccess?.();
          return result;
        } catch (error) {
          console.warn('[OfflineForm] Online submission failed, falling back to offline:', error);
          // Fall through to offline mode
        }
      }

      // Offline submission
      const operationType = isEdit ? 'UPDATE' : 'CREATE';
      await addOfflineOperation(operationType, table, data, originalId);
      
      onSuccess?.();
      return { offline: true };
      
    } catch (error) {
      console.error('[OfflineForm] Form submission failed:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os dados. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [isOnline, addOfflineOperation, onlineSubmit, onSuccess, table]);

  const deleteItem = useCallback(async (id: number) => {
    setIsSubmitting(true);
    
    try {
      if (isOnline) {
        // Try online deletion first
        try {
          await onlineSubmit({ deleted: true, id });
          toast({
            title: "Sucesso",
            description: "Item excluído com sucesso.",
          });
          onSuccess?.();
          return;
        } catch (error) {
          console.warn('[OfflineForm] Online deletion failed, falling back to offline:', error);
          // Fall through to offline mode
        }
      }

      // Offline deletion
      await addOfflineOperation('DELETE', table, {}, id);
      onSuccess?.();
      
    } catch (error) {
      console.error('[OfflineForm] Delete operation failed:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [isOnline, addOfflineOperation, onlineSubmit, onSuccess, table]);

  return {
    submitForm,
    deleteItem,
    isSubmitting,
    isOnline
  };
}