import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useIsAdmin } from './useIsAdmin';

export interface EntityFilterConfig {
  isAdmin: boolean;
  userEntityId: number | null;
  shouldFilterByEntity: boolean;
}

export function useEntityFilter(): EntityFilterConfig {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();

  const config = useMemo(() => ({
    isAdmin,
    userEntityId: user?.entityId || null,
    shouldFilterByEntity: !isAdmin && Boolean(user?.entityId),
  }), [isAdmin, user?.entityId]);

  return config;
}