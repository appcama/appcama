import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useIsAdmin } from './useIsAdmin';

export interface EntityFilterConfig {
  isAdmin: boolean;
  userEntityId: number | null;
  shouldFilterByEntity: boolean;
}

export function useEntityFilter(): EntityFilterConfig {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();

  const config = useMemo(() => {
    const entityConfig = {
      isAdmin,
      userEntityId: user?.entityId || null,
      shouldFilterByEntity: !isAdmin && Boolean(user?.entityId),
    };
    
    // Debug logs para diagnóstico
    console.log('[useEntityFilter] Config:', {
      isAdmin,
      userEntityId: user?.entityId,
      shouldFilterByEntity: entityConfig.shouldFilterByEntity,
      userLoading: loading,
      userExists: !!user
    });
    
    return entityConfig;
  }, [isAdmin, user?.entityId, loading]);

  return config;
}