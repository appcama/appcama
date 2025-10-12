import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardFilters } from "./useDashboardData";

export interface MapMarker {
  id: number;
  type: 'entidade' | 'ponto_coleta';
  subtype: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  isCollector?: boolean;
}

export function useDashboardMapData(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard-map-data", filters],
    queryFn: async (): Promise<MapMarker[]> => {
      const markers: MapMarker[] = [];

      // Fetch entidades with coordinates
      let entidadesQuery = supabase
        .from("entidade")
        .select(`
          id_entidade,
          nom_entidade,
          num_latitude,
          num_longitude,
          des_logradouro,
          des_bairro,
          tipo_entidade!inner(
            des_tipo_entidade,
            des_coletora_residuo
          )
        `)
        .eq("des_status", "A")
        .not("num_latitude", "is", null)
        .not("num_longitude", "is", null);

      // Apply entity type filter if provided
      if (filters.tipoEntidadeId) {
        entidadesQuery = entidadesQuery.eq("id_tipo_entidade", filters.tipoEntidadeId);
      }

      // Apply specific entity filter if provided
      if (filters.entidadeId) {
        entidadesQuery = entidadesQuery.eq("id_entidade", filters.entidadeId);
      }

      const { data: entidades, error: entidadesError } = await entidadesQuery;
      
      if (entidadesError) throw entidadesError;

      // Add entidade markers
      entidades?.forEach((entidade: any) => {
        markers.push({
          id: entidade.id_entidade,
          type: 'entidade',
          subtype: entidade.tipo_entidade.des_tipo_entidade,
          name: entidade.nom_entidade,
          latitude: Number(entidade.num_latitude),
          longitude: Number(entidade.num_longitude),
          address: `${entidade.des_logradouro}, ${entidade.des_bairro}`,
          isCollector: entidade.tipo_entidade.des_coletora_residuo === 'A',
        });
      });

      // Fetch pontos de coleta with coordinates
      const { data: pontos, error: pontosError } = await supabase
        .from("ponto_coleta")
        .select(`
          id_ponto_coleta,
          nom_ponto_coleta,
          num_latitude,
          num_longitude,
          des_logradouro,
          des_bairro,
          tipo_ponto_coleta!inner(
            des_tipo_ponto_coleta
          )
        `)
        .eq("des_status", "A")
        .not("num_latitude", "is", null)
        .not("num_longitude", "is", null);

      if (pontosError) throw pontosError;

      // Add ponto de coleta markers
      pontos?.forEach((ponto: any) => {
        markers.push({
          id: ponto.id_ponto_coleta,
          type: 'ponto_coleta',
          subtype: ponto.tipo_ponto_coleta.des_tipo_ponto_coleta,
          name: ponto.nom_ponto_coleta,
          latitude: Number(ponto.num_latitude),
          longitude: Number(ponto.num_longitude),
          address: `${ponto.des_logradouro}, ${ponto.des_bairro}`,
        });
      });

      return markers;
    },
    refetchInterval: 30000,
    enabled: !!filters.dataInicial && !!filters.dataFinal,
  });
}
