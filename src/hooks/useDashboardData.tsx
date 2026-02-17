import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardFilters {
  entidadeId?: number;
  tipoEntidadeId?: number;
  eventoId?: number;
  dataInicial: string;  
  dataFinal: string;
}

export interface IndicadorData {
  id_indicador: number;
  nom_indicador: string;
  des_unidade_medida: string;
  cod_unidade_medida: string;
  total: number;
  des_tipo_residuo?: string;
}

export interface ResiduoTipoData {
  id_tipo_residuo: number;
  des_tipo_residuo: string;
  total_quantidade: number;
  total_valor: number;
}

export interface DashboardData {
  indicadores: IndicadorData[];
  totalResiduos: number;
  residuosPorTipo: ResiduoTipoData[];
}

export function useDashboardData(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard-data", filters],
    queryFn: async (): Promise<DashboardData> => {
      const { data, error } = await supabase.rpc("get_dashboard_data", {
        p_data_inicial: filters.dataInicial,
        p_data_final: filters.dataFinal,
        p_entidade_id: filters.entidadeId || null,
        p_tipo_entidade_id: filters.tipoEntidadeId || null,
        p_evento_id: filters.eventoId || null,
        p_usuario_ids: null,
      });

      if (error) throw error;

      const result = data as any;
      const residuos: any[] = result?.residuos || [];
      const indicadoresRaw: any[] = result?.indicadores || [];

      // Process residuos - convert to tons
      const residuosPorTipo: ResiduoTipoData[] = residuos.map((r: any) => ({
        id_tipo_residuo: r.id_tipo_residuo,
        des_tipo_residuo: r.des_tipo_residuo,
        total_quantidade: r.total_quantidade / 1000,
        total_valor: r.total_valor,
      }));

      const totalResiduos = residuos.reduce((sum: number, r: any) => sum + (r.total_quantidade || 0), 0) / 1000;

      // Aggregate indicators (sum across tipo_residuo for the main dashboard view)
      const indicadoresMap = new Map<number, IndicadorData>();
      indicadoresRaw.forEach((ind: any) => {
        const existing = indicadoresMap.get(ind.id_indicador);
        if (existing) {
          existing.total += ind.total || 0;
        } else {
          indicadoresMap.set(ind.id_indicador, {
            id_indicador: ind.id_indicador,
            nom_indicador: ind.nom_indicador,
            des_unidade_medida: ind.des_unidade_medida,
            cod_unidade_medida: ind.cod_unidade_medida,
            total: ind.total || 0,
          });
        }
      });

      return {
        indicadores: Array.from(indicadoresMap.values()),
        totalResiduos,
        residuosPorTipo,
      };
    },
    refetchInterval: 30000,
    enabled: !!filters.dataInicial && !!filters.dataFinal,
  });
}
