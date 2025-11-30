import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface UserEntity {
  id_entidade: number;
  nom_entidade: string;
  des_logo_url: string | null;
  id_tipo_entidade: number;
  tipo_entidade?: {
    des_tipo_entidade: string | null;
  };
}

export function useUserEntity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-entity', user?.entityId],
    queryFn: async () => {
      if (!user?.entityId) return null;
      
      const { data, error } = await supabase
        .from('entidade')
        .select(`
          id_entidade, 
          nom_entidade, 
          des_logo_url,
          id_tipo_entidade,
          tipo_entidade:tipo_entidade!inner(des_tipo_entidade)
        `)
        .eq('id_entidade', user.entityId)
        .single();
      
      if (error) throw error;
      return data as UserEntity;
    },
    enabled: !!user?.entityId,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
}
