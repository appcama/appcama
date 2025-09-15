import { useMemo } from 'react';
import { useAuth } from './useAuth';

export function useIsAdmin() {
  const { user } = useAuth();
  
  const isAdmin = useMemo(() => {
    // Considerar administrador se o profileId for 2 ou se o nome do perfil contém "admin"
    return user?.profileId === 2;
  }, [user?.profileId]);

  return isAdmin;
}