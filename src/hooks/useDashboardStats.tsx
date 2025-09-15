import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type DashboardFilters } from "@/hooks/useDashboardData";

interface DashboardStats {
  totalEntidades: number;
  entidadesColetoras: number;
  eventosColeta: number;
  geradoresResiduos: number;
  totalEntidadesPercentage: number;
  entidadesColetorasPercentage: number;
  eventosColetaPercentage: number;
  geradoresResiduosPercentage: number;
}

// Função auxiliar para buscar estatísticas de um período
async function getStatsForPeriod(dataInicial: string, dataFinal: string) {
  // Total de entidades ativas
  const { count: totalEntidades } = await supabase
    .from("entidade")
    .select("*", { count: "exact", head: true })
    .eq("des_status", "A")
    .gte("dat_criacao", dataInicial)
    .lte("dat_criacao", dataFinal);

  // Entidades coletoras (cooperativas/catadores)
  const { count: entidadesColetoras } = await supabase
    .from("entidade")
    .select(
      `
      *,
      tipo_entidade!inner(*)
    `,
      { count: "exact", head: true }
    )
    .eq("des_status", "A")
    .eq("tipo_entidade.des_coletora_residuo", "A")
    .gte("dat_criacao", dataInicial)
    .lte("dat_criacao", dataFinal);

  // Eventos de coleta ativos
  const { count: eventosColeta } = await supabase
    .from("evento")
    .select("*", { count: "exact", head: true })
    .eq("des_status", "A")
    .gte("dat_criacao", dataInicial)
    .lte("dat_criacao", dataFinal);

  // Entidades geradoras
  const { count: geradoresResiduos } = await supabase
    .from("entidade")
    .select(
      `
      *,
      tipo_entidade!inner(*)
    `,
      { count: "exact", head: true }
    )
    .eq("des_status", "A")
    .eq("tipo_entidade.des_geradora_residuo", "A")
    .gte("dat_criacao", dataInicial)
    .lte("dat_criacao", dataFinal);

  return {
    totalEntidades: totalEntidades || 0,
    entidadesColetoras: entidadesColetoras || 0,
    eventosColeta: eventosColeta || 0,
    geradoresResiduos: geradoresResiduos || 0,
  };
}

// Função para calcular porcentagem
function calculatePercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function useDashboardStats(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard-stats", filters],
    queryFn: async (): Promise<DashboardStats> => {
      // Calcular período anterior
      const startDate = new Date(filters.dataInicial);
      const endDate = new Date(filters.dataFinal);
      const periodDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - periodDays);
      const previousEndDate = new Date(startDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1);

      // Buscar dados do período atual
      const currentStats = await getStatsForPeriod(
        filters.dataInicial,
        filters.dataFinal
      );

      // Buscar dados do período anterior
      const previousStats = await getStatsForPeriod(
        previousStartDate.toISOString().split("T")[0],
        previousEndDate.toISOString().split("T")[0]
      );

      return {
        ...currentStats,
        totalEntidadesPercentage: calculatePercentage(
          currentStats.totalEntidades,
          previousStats.totalEntidades
        ),
        entidadesColetorasPercentage: calculatePercentage(
          currentStats.entidadesColetoras,
          previousStats.entidadesColetoras
        ),
        eventosColetaPercentage: calculatePercentage(
          currentStats.eventosColeta,
          previousStats.eventosColeta
        ),
        geradoresResiduosPercentage: calculatePercentage(
          currentStats.geradoresResiduos,
          previousStats.geradoresResiduos
        ),
      };
    },
    refetchInterval: 30000,
  });
}