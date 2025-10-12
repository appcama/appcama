import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MapEntidade {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
  endereco: string;
  telefone: string | null;
  tipo: string;
  isColetora: boolean;
}

export interface MapPontoColeta {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
  endereco: string;
  tipo: string;
}

interface UseDashboardMapDataProps {
  startDate?: string;
  endDate?: string;
  entityId?: number;
}

export const useDashboardMapData = ({ startDate, endDate, entityId }: UseDashboardMapDataProps = {}) => {
  return useQuery({
    queryKey: ['dashboard-map', startDate, endDate, entityId],
    queryFn: async () => {
      // Buscar entidades com coordenadas válidas
      let entidadesQuery = supabase
        .from('entidade')
        .select(`
          id_entidade,
          nom_entidade,
          num_latitude,
          num_longitude,
          des_logradouro,
          des_bairro,
          num_cep,
          num_telefone,
          tipo_entidade!inner (
            des_tipo_entidade,
            des_coletora_residuo
          )
        `)
        .eq('des_status', 'A')
        .eq('des_locked', 'D')
        .not('num_latitude', 'is', null)
        .not('num_longitude', 'is', null);

      if (entityId) {
        entidadesQuery = entidadesQuery.eq('id_entidade', entityId);
      }

      const { data: entidadesData, error: entidadesError } = await entidadesQuery;

      if (entidadesError) throw entidadesError;

      // Buscar pontos de coleta com coordenadas válidas
      let pontosQuery = supabase
        .from('ponto_coleta')
        .select(`
          id_ponto_coleta,
          nom_ponto_coleta,
          num_latitude,
          num_longitude,
          des_logradouro,
          des_bairro,
          num_cep,
          tipo_ponto_coleta!inner (
            des_tipo_ponto_coleta
          )
        `)
        .eq('des_status', 'A')
        .eq('des_locked', 'D')
        .not('num_latitude', 'is', null)
        .not('num_longitude', 'is', null);

      const { data: pontosData, error: pontosError } = await pontosQuery;

      if (pontosError) throw pontosError;

      // Formatar dados de entidades
      const entidades: MapEntidade[] = (entidadesData || []).map((item: any) => ({
        id: item.id_entidade,
        nome: item.nom_entidade,
        latitude: parseFloat(item.num_latitude),
        longitude: parseFloat(item.num_longitude),
        endereco: `${item.des_logradouro}, ${item.des_bairro} - CEP: ${item.num_cep}`,
        telefone: item.num_telefone,
        tipo: item.tipo_entidade?.des_tipo_entidade || 'N/A',
        isColetora: item.tipo_entidade?.des_coletora_residuo === 'A'
      }));

      // Formatar dados de pontos de coleta
      const pontosColeta: MapPontoColeta[] = (pontosData || []).map((item: any) => ({
        id: item.id_ponto_coleta,
        nome: item.nom_ponto_coleta,
        latitude: parseFloat(item.num_latitude),
        longitude: parseFloat(item.num_longitude),
        endereco: `${item.des_logradouro}, ${item.des_bairro} - CEP: ${item.num_cep}`,
        tipo: item.tipo_ponto_coleta?.des_tipo_ponto_coleta || 'N/A'
      }));

      return {
        entidades,
        pontosColeta
      };
    }
  });
};
