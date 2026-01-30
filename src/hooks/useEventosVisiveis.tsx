import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Evento {
  id_evento: number;
  nom_evento: string;
  des_logo_url: string | null;
}

interface UseEventosVisiveisOptions {
  includeExpired?: boolean; // Se true, inclui eventos com data de término passada
}

/**
 * Hook para buscar eventos visíveis para o usuário logado
 * Considera as regras de visibilidade (público/privado)
 */
export function useEventosVisiveis(options: UseEventosVisiveisOptions = {}) {
  const { includeExpired = false } = options;
  const { user } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.isAdmin || user?.entityId === 1;

  useEffect(() => {
    const fetchEventos = async () => {
      if (!user) {
        setEventos([]);
        setLoading(false);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];

        // Base query - fetch all active events with creator info
        let query = supabase
          .from('evento')
          .select(`
            id_evento, 
            nom_evento, 
            des_logo_url, 
            des_visibilidade,
            usuario_criador:usuario!id_usuario_criador(id_entidade)
          `)
          .eq('des_status', 'A')
          .order('nom_evento');

        // Só filtra por data de término se não quiser incluir expirados
        if (!includeExpired) {
          query = query.gte('dat_termino', today);
        }

        const { data: allEventos, error } = await query;

        if (error) throw error;

        let filteredEventos = allEventos || [];

        // If not admin, filter by visibility rules
        if (!isAdmin) {
          // Get events where user's entity has access (for private events)
          const { data: eventoEntidades } = await supabase
            .from('evento_entidade')
            .select('id_evento')
            .eq('id_entidade', user.entityId);

          const authorizedEventoIds = new Set((eventoEntidades || []).map(ee => ee.id_evento));

          filteredEventos = filteredEventos.filter((evento: any) => {
            // Public events are visible to all
            if (evento.des_visibilidade === 'P') return true;
            
            // Private events: visible if creator's entity matches user's entity
            const creatorEntityId = evento.usuario_criador?.id_entidade;
            if (creatorEntityId === user.entityId) return true;
            
            // Or if user's entity is in the access list
            if (authorizedEventoIds.has(evento.id_evento)) return true;
            
            return false;
          });
        }

        setEventos(filteredEventos.map((e: any) => ({
          id_evento: e.id_evento,
          nom_evento: e.nom_evento,
          des_logo_url: e.des_logo_url,
        })));
      } catch (error) {
        console.error('Erro ao buscar eventos visíveis:', error);
        setEventos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, [user, isAdmin, includeExpired]);

  return { eventos, loading, isAdmin };
}
