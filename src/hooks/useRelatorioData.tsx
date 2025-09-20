import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RelatorioFiltersType } from "@/components/RelatorioFilters";
import { format } from "date-fns";

interface RelatorioData {
  totalColetas?: number;
  totalResiduos?: number;
  valorTotal?: number;
  entidadesAtivas?: number;
  residuosPorTipo?: Array<{
    nome: string;
    quantidade: number;
    valor: number;
    percentual: number;
  }>;
  items?: Array<any>;
  indicadores?: Array<{
    nome: string;
    valor: number;
    unidade: string;
  }>;
}

export function useRelatorioData(reportType: string, category: string, filters: RelatorioFiltersType) {
  const query = useQuery({
    queryKey: ['relatorio', reportType, category, filters],
    queryFn: () => fetchRelatorioData(reportType, category, filters),
    enabled: !!reportType,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return query;
}

async function fetchRelatorioData(
  reportType: string, 
  category: string, 
  filters: RelatorioFiltersType
): Promise<RelatorioData> {
  try {
    // Base query comum para a maioria dos relatórios
    let baseQuery = supabase
      .from('coleta')
      .select(`
        id_coleta,
        cod_coleta,
        dat_coleta,
        vlr_total,
        coleta_residuo (
          id_coleta_residuo,
          qtd_total,
          vlr_total,
          residuo (
            nom_residuo,
            tipo_residuo (
              des_tipo_residuo
            )
          )
        ),
        ponto_coleta (
          nom_ponto_coleta,
          entidade:entidade!ponto_coleta_id_entidade_gestora_fkey (
            nom_entidade
          )
        ),
        entidade:entidade!coleta_id_entidade_geradora_fkey (
          nom_entidade
        ),
        evento (
          nom_evento
        )
      `)
      .eq('des_status', 'A');

    // Aplicar filtros de data
    if (filters.dataInicial) {
      baseQuery = baseQuery.gte('dat_coleta', format(filters.dataInicial, 'yyyy-MM-dd'));
    }
    if (filters.dataFinal) {
      baseQuery = baseQuery.lte('dat_coleta', format(filters.dataFinal, 'yyyy-MM-dd'));
    }

    const { data: coletas, error } = await baseQuery;

    if (error) {
      console.error('Erro ao buscar dados:', error);
      throw error;
    }

    // Processar dados baseado no tipo de relatório
    return processRelatorioData(reportType, category, coletas || [], filters);
    
  } catch (error) {
    console.error('Erro na consulta do relatório:', error);
    throw error;
  }
}

function processRelatorioData(
  reportType: string, 
  category: string, 
  coletas: any[], 
  filters: RelatorioFiltersType
): RelatorioData {
  
  // Calcular métricas básicas
  const totalColetas = coletas.length;
  const valorTotal = coletas.reduce((sum, coleta) => sum + (Number(coleta.vlr_total) || 0), 0);
  
  // Calcular total de resíduos
  const totalResiduos = coletas.reduce((sum, coleta) => {
    if (coleta.coleta_residuo) {
      return sum + coleta.coleta_residuo.reduce((subSum: number, residuo: any) => {
        return subSum + (Number(residuo.qtd_total) || 0);
      }, 0);
    }
    return sum;
  }, 0);

  // Entidades únicas
  const entidadesUnicas = new Set();
  coletas.forEach(coleta => {
    if (coleta.entidade?.nom_entidade) {
      entidadesUnicas.add(coleta.entidade.nom_entidade);
    }
    if (coleta.ponto_coleta?.entidade?.nom_entidade) {
      entidadesUnicas.add(coleta.ponto_coleta.entidade.nom_entidade);
    }
  });

  // Processar resíduos por tipo
  const residuosPorTipo = processResiduosPorTipo(coletas);

  // Processar indicadores ambientais (simulados)
  const indicadores = processIndicadoresAmbientais(totalResiduos);

  // Items para tabela (primeiras coletas)
  const items = coletas.slice(0, 50).map(coleta => ({
    id: coleta.id_coleta,
    nome: coleta.cod_coleta || `Coleta ${coleta.id_coleta}`,
    quantidade: coleta.coleta_residuo?.reduce((sum: number, r: any) => sum + (Number(r.qtd_total) || 0), 0) || 0,
    valor: Number(coleta.vlr_total) || 0,
    data: coleta.dat_coleta,
    entidade: coleta.entidade?.nom_entidade || coleta.ponto_coleta?.entidade?.nom_entidade || 'N/A',
    ponto: coleta.ponto_coleta?.nom_ponto_coleta || 'N/A'
  }));

  return {
    totalColetas,
    totalResiduos: Math.round(totalResiduos),
    valorTotal: Math.round(valorTotal * 100) / 100,
    entidadesAtivas: entidadesUnicas.size,
    residuosPorTipo,
    indicadores,
    items
  };
}

function processResiduosPorTipo(coletas: any[]) {
  const tiposMap = new Map<string, { quantidade: number; valor: number }>();

  coletas.forEach(coleta => {
    if (coleta.coleta_residuo) {
      coleta.coleta_residuo.forEach((residuo: any) => {
        const tipoNome = residuo.residuo?.tipo_residuo?.des_tipo_residuo || 
                        residuo.residuo?.nom_residuo || 
                        'Não classificado';
        
        const quantidade = Number(residuo.qtd_total) || 0;
        const valor = Number(residuo.vlr_total) || 0;

        if (tiposMap.has(tipoNome)) {
          const existing = tiposMap.get(tipoNome)!;
          tiposMap.set(tipoNome, {
            quantidade: existing.quantidade + quantidade,
            valor: existing.valor + valor
          });
        } else {
          tiposMap.set(tipoNome, { quantidade, valor });
        }
      });
    }
  });

  const totalQuantidade = Array.from(tiposMap.values())
    .reduce((sum, item) => sum + item.quantidade, 0);

  return Array.from(tiposMap.entries()).map(([nome, data]) => ({
    nome,
    quantidade: Math.round(data.quantidade),
    valor: Math.round(data.valor * 100) / 100,
    percentual: totalQuantidade > 0 ? Math.round((data.quantidade / totalQuantidade) * 100) : 0
  })).sort((a, b) => b.quantidade - a.quantidade);
}

function processIndicadoresAmbientais(totalResiduos: number) {
  // Cálculos aproximados de benefícios ambientais
  const co2Evitado = totalResiduos * 2.1; // kg CO2 por kg de resíduo reciclado
  const aguaEconomizada = totalResiduos * 15; // litros por kg
  const energiaPoupada = totalResiduos * 3.2; // kWh por kg

  return [
    {
      nome: "CO2 Evitado",
      valor: Math.round(co2Evitado),
      unidade: "kg"
    },
    {
      nome: "Água Economizada", 
      valor: Math.round(aguaEconomizada),
      unidade: "litros"
    },
    {
      nome: "Energia Poupada",
      valor: Math.round(energiaPoupada),
      unidade: "kWh"
    },
    {
      nome: "Árvores Equivalentes",
      valor: Math.round(co2Evitado / 22), // 1 árvore = ~22kg CO2/ano
      unidade: "unidades"
    }
  ];
}