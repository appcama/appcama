import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/supabase-pagination";

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
      // Primeiro, buscar todos os usuários da entidade do usuário logado
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

      // Get entity IDs for type filter (if needed)
      let entidadeIds: number[] | null = null;
      if (filters.tipoEntidadeId) {
        const { data: entidadesTipo } = await supabase
          .from("entidade")
          .select("id_entidade")
          .eq("id_tipo_entidade", filters.tipoEntidadeId)
          .eq("des_status", "A");
          
        entidadeIds = entidadesTipo?.map(e => e.id_entidade) || [];
        if (entidadeIds.length === 0) {
          return { indicadores: [], totalResiduos: 0, residuosPorTipo: [] };
        }
      }

      // Fetch ALL coleta IDs with pagination
      const coletasIds = await fetchAllRows<{ id_coleta: number }>(() => {
        let q = supabase
          .from("coleta")
          .select("id_coleta")
          .in("id_usuario_criador", usuarioIds)
          .gte("dat_coleta", filters.dataInicial)
          .lte("dat_coleta", filters.dataFinal)
          .eq("des_status", "A");

        if (entidadeIds) {
          q = q.in("id_entidade_geradora", entidadeIds);
        }
        if (filters.eventoId) {
          q = q.eq("id_evento", filters.eventoId);
        }
        return q;
      });

      const coletaIdsArray = coletasIds.map(c => c.id_coleta);

      if (coletaIdsArray.length === 0) {
        return { indicadores: [], totalResiduos: 0, residuosPorTipo: [] };
      }

      // Fetch ALL environmental indicators with pagination
      const indicadoresData = await fetchAllRows(() =>
        supabase
          .from("coleta_residuo_indicador")
          .select(`
            id_indicador,
            qtd_total,
            indicador!inner(
              nom_indicador,
              unidade_medida!inner(
                des_unidade_medida,
                cod_unidade_medida
              )
            ),
            coleta_residuo!inner(
              id_coleta
            )
          `)
          .in("coleta_residuo.id_coleta", coletaIdsArray)
      );

      // Process indicators data
      const indicadoresMap = new Map<number, IndicadorData>();
      indicadoresData?.forEach((item: any) => {
        const indicadorId = item.id_indicador;
        const existing = indicadoresMap.get(indicadorId);
        
        if (existing) {
          existing.total += item.qtd_total || 0;
        } else {
          indicadoresMap.set(indicadorId, {
            id_indicador: indicadorId,
            nom_indicador: item.indicador.nom_indicador,
            des_unidade_medida: item.indicador.unidade_medida.des_unidade_medida,
            cod_unidade_medida: item.indicador.unidade_medida.cod_unidade_medida,
            total: item.qtd_total || 0,
          });
        }
      });

      // Fetch ALL waste totals by type with pagination
      const residuosData = await fetchAllRows(() =>
        supabase
          .from("coleta_residuo")
          .select(`
            qtd_total,
            vlr_total,
            residuo!inner(
              id_tipo_residuo,
              tipo_residuo!inner(
                des_tipo_residuo
              )
            )
          `)
          .in("id_coleta", coletaIdsArray)
          .eq("des_status", "A")
      );

      // Process waste data by type
      const residuosMap = new Map<number, ResiduoTipoData>();
      let totalResiduos = 0;

      residuosData?.forEach((item: any) => {
        const tipoId = item.residuo.id_tipo_residuo;
        const quantidade = item.qtd_total || 0;
        const valor = item.vlr_total || 0;
        const valorCalculado = quantidade * valor;
        
        totalResiduos += quantidade;
        
        const existing = residuosMap.get(tipoId);
        if (existing) {
          existing.total_quantidade += quantidade;
          existing.total_valor += valorCalculado;
        } else {
          residuosMap.set(tipoId, {
            id_tipo_residuo: tipoId,
            des_tipo_residuo: item.residuo.tipo_residuo.des_tipo_residuo,
            total_quantidade: quantidade,
            total_valor: valorCalculado,
          });
        }
      });

      // Keep quantities in kg
      const residuosProcessados = Array.from(residuosMap.values()).map(r => ({
        ...r,
        total_quantidade: r.total_quantidade,
        total_valor: r.total_valor
      }));

      return {
        indicadores: Array.from(indicadoresMap.values()),
        totalResiduos: totalResiduos,
        residuosPorTipo: residuosProcessados,
      };
    },
    refetchInterval: 30000,
    enabled: !!entityId && !!filters.dataInicial && !!filters.dataFinal,
  });
}
