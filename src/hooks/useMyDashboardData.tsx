import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MyDashboardFilters {
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
}

export interface ResiduoTipoData {
  id_tipo_residuo: number;
  des_tipo_residuo: string;
  total_quantidade: number;
  total_valor: number;
}

export interface MyDashboardData {
  indicadores: IndicadorData[];
  totalResiduos: number;
  residuosPorTipo: ResiduoTipoData[];
}

export function useMyDashboardData(entityId: number, filters: MyDashboardFilters) {
  return useQuery({
    queryKey: ["my-dashboard-data", entityId, filters],
    queryFn: async (): Promise<MyDashboardData> => {
      // Fetch users from the entity
      const { data: usuariosDaEntidade, error: usuariosError } = await supabase
        .from("usuario")
        .select("id_usuario")
        .eq("id_entidade", entityId)
        .eq("des_status", "A");

      if (usuariosError) throw usuariosError;

      const usuarioIds = usuariosDaEntidade?.map(u => u.id_usuario) || [];

      if (usuarioIds.length === 0) {
        return { indicadores: [], totalResiduos: 0, residuosPorTipo: [] };
      }

      const { data, error } = await supabase.rpc("get_dashboard_data", {
        p_data_inicial: filters.dataInicial,
        p_data_final: filters.dataFinal,
        p_entidade_id: null,
        p_tipo_entidade_id: filters.tipoEntidadeId || null,
        p_evento_id: filters.eventoId || null,
        p_usuario_ids: usuarioIds,
      });

      if (error) throw error;

      const result = data as any;
      const residuos: any[] = result?.residuos || [];
      const indicadoresRaw: any[] = result?.indicadores || [];

      // Keep quantities in kg for "Meus Números"
      const residuosPorTipo: ResiduoTipoData[] = residuos.map((r: any) => ({
        id_tipo_residuo: r.id_tipo_residuo,
        des_tipo_residuo: r.des_tipo_residuo,
        total_quantidade: r.total_quantidade,
        total_valor: r.total_valor,
      }));

      const totalResiduos = residuos.reduce((sum: number, r: any) => sum + (r.total_quantidade || 0), 0);

      // Aggregate indicators (sum across tipo_residuo)
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
    enabled: !!entityId && !!filters.dataInicial && !!filters.dataFinal,
  });
}
