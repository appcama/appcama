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

      // Single query: fetch coleta_residuo with coleta join filters + embedded indicators
      // Uses coleta!inner join to filter directly, avoiding the old pattern of
      // fetching coleta IDs then using .in() which caused 400 errors with large ID arrays
      const allData = await fetchAllRows(() => {
        let q = supabase
          .from("coleta_residuo")
          .select(`
            qtd_total,
            vlr_total,
            residuo!inner(
              id_tipo_residuo,
              tipo_residuo!inner(des_tipo_residuo)
            ),
            coleta!inner(id_coleta),
            coleta_residuo_indicador(
              id_indicador,
              qtd_total,
              indicador(
                nom_indicador,
                unidade_medida(des_unidade_medida, cod_unidade_medida)
              )
            )
          `)
          .in("coleta.id_usuario_criador", usuarioIds)
          .gte("coleta.dat_coleta", filters.dataInicial)
          .lte("coleta.dat_coleta", filters.dataFinal)
          .eq("coleta.des_status", "A")
          .eq("des_status", "A");

        if (entidadeIds) {
          q = q.in("coleta.id_entidade_geradora", entidadeIds);
        }
        if (filters.eventoId) {
          q = q.eq("coleta.id_evento", filters.eventoId);
        }
        return q;
      });

      // Process waste data by type
      const residuosMap = new Map<number, ResiduoTipoData>();
      let totalResiduos = 0;

      // Process indicators from embedded data
      const indicadoresMap = new Map<number, IndicadorData>();

      allData?.forEach((item: any) => {
        // Process residuo
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

        // Process embedded indicators
        const indicators = item.coleta_residuo_indicador || [];
        indicators.forEach((ind: any) => {
          if (!ind.indicador || !ind.indicador.unidade_medida) return;
          const indicadorId = ind.id_indicador;
          const existingInd = indicadoresMap.get(indicadorId);
          if (existingInd) {
            existingInd.total += ind.qtd_total || 0;
          } else {
            indicadoresMap.set(indicadorId, {
              id_indicador: indicadorId,
              nom_indicador: ind.indicador.nom_indicador,
              des_unidade_medida: ind.indicador.unidade_medida.des_unidade_medida,
              cod_unidade_medida: ind.indicador.unidade_medida.cod_unidade_medida,
              total: ind.qtd_total || 0,
            });
          }
        });
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
