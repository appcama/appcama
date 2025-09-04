import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalEntidades: number;
  entidadesColetoras: number;
  eventosColeta: number;
  geradoresResiduos: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Total de entidades ativas
      const { count: totalEntidades } = await supabase
        .from("entidade")
        .select("*", { count: "exact", head: true })
        .eq("des_status", "A");

      // Entidades coletoras (cooperativas/catadores)
      const { count: entidadesColetoras } = await supabase
        .from("entidade")
        .select(`
          *,
          tipo_entidade!inner(*)
        `, { count: "exact", head: true })
        .eq("des_status", "A")
        .eq("tipo_entidade.des_coletora_residuo", "A");

      // Eventos de coleta ativos
      const { count: eventosColeta } = await supabase
        .from("evento")
        .select("*", { count: "exact", head: true })
        .eq("des_status", "A");

      // Entidades geradoras
      const { count: geradoresResiduos } = await supabase
        .from("entidade")
        .select(`
          *,
          tipo_entidade!inner(*)
        `, { count: "exact", head: true })
        .eq("des_status", "A")
        .eq("tipo_entidade.des_geradora_residuo", "A");

      return {
        totalEntidades: totalEntidades || 0,
        entidadesColetoras: entidadesColetoras || 0,
        eventosColeta: eventosColeta || 0,
        geradoresResiduos: geradoresResiduos || 0,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}