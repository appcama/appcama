import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RelatorioFiltersType } from "@/components/RelatorioFilters";
import { format } from "date-fns";

export interface RelatorioData {
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
  // Campos específicos para relatórios gerenciais
  kpis?: Array<{
    titulo: string;
    valor: number | string;
    unidade?: string;
    variacao?: number;
    meta?: number;
    icone?: string;
  }>;
  metricas?: {
    receitas?: Array<{
      periodo: string;
      valor: number;
      crescimento?: number;
    }>;
    produtividade?: Array<{
      entidade: string;
      eficiencia: number;
      ranking: number;
    }>;
    crescimento?: Array<{
      mes: string;
      coletas: number;
      residuos: number;
      crescimentoColetas?: number;
      crescimentoResiduos?: number;
    }>;
    custosBeneficios?: {
      roi: number;
      valorAmbiental: number;
      custosOperacionais: number;
      economiaTotal: number;
    };
  };
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
        des_status,
        id_usuario_criador,
        usuario_criador:usuario!coleta_id_usuario_criador_fkey (
          id_usuario,
          id_entidade,
          entidade_coletora:entidade!usuario_id_entidade_fkey (
            nom_entidade,
            des_status
          )
        ),
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
            nom_entidade,
            des_status
          )
        ),
        entidade:entidade!coleta_id_entidade_geradora_fkey (
          nom_entidade,
          des_status
        ),
        evento (
          nom_evento
        )
      `);

    // Aplicar filtros de status
    if (filters.statusColetas) {
      const statusColetas = filters.statusColetas.split(',');
      baseQuery = baseQuery.in('des_status', statusColetas);
    } else {
      // Padrão: incluir tanto A quanto D se não especificado
      baseQuery = baseQuery.in('des_status', ['A', 'D']);
    }

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
  
  // Filtrar apenas coletas ativas se especificado
  const coletasAtivas = coletas.filter(c => c.des_status === 'A');
  
  // Se não há coletas ativas, usar todas para demonstração
  const coletasParaProcessar = coletasAtivas.length > 0 ? coletasAtivas : coletas;
  
  console.log(`Processando ${coletasParaProcessar.length} coletas para relatório ${reportType}`, {
    totalColetas: coletas.length,
    coletasAtivas: coletasAtivas.length,
    usado: coletasParaProcessar.length
  });

  // Implementar lógicas específicas por tipo de relatório
  switch (reportType) {
    case 'coletas-periodo':
      return processColetasPorPeriodo(coletasParaProcessar, filters);
    case 'residuos-coletados':
      return processResiduosColetados(coletasParaProcessar, filters);
    case 'performance-pontos':
      return processPerformancePontos(coletasParaProcessar, filters);
    case 'ranking-entidades':
      return processRankingEntidades(coletasParaProcessar, filters);
    case 'eventos-coleta':
      return processEventosColeta(coletasParaProcessar, filters);
    // Relatórios Gerenciais
    case 'dashboard-executivo':
      return processDashboardExecutivo(coletasParaProcessar, filters);
    case 'analise-faturamento':
      return processAnaliseFaturamento(coletasParaProcessar, filters);
    case 'produtividade':
      return processProdutividade(coletasParaProcessar, filters);
    case 'analise-crescimento':
      return processAnaliseCrescimento(coletasParaProcessar, filters);
    case 'ranking-entidades-geradoras':
      return processRankingEntidadesGeradoras(coletasParaProcessar, filters);
    case 'custos-beneficios':
      return processCustosBeneficios(coletasParaProcessar, filters);
    default:
      return processRelatorioGenerico(coletasParaProcessar, filters);
  }
}

function processColetasPorPeriodo(coletas: any[], filters: RelatorioFiltersType): RelatorioData {
  const totalColetas = coletas.length;
  const valorTotal = coletas.reduce((sum, coleta) => sum + (Number(coleta.vlr_total) || 0), 0);
  
  const totalResiduos = coletas.reduce((sum, coleta) => {
    if (coleta.coleta_residuo) {
      return sum + coleta.coleta_residuo.reduce((subSum: number, residuo: any) => {
        return subSum + (Number(residuo.qtd_total) || 0);
      }, 0);
    }
    return sum;
  }, 0);

  // Agrupar por entidade geradora
  const entidadesMap = new Map();
  coletas.forEach(coleta => {
    const entidade = coleta.entidade?.nom_entidade || 'Não informado';
    if (!entidadesMap.has(entidade)) {
      entidadesMap.set(entidade, { count: 0, valor: 0, residuos: 0 });
    }
    const data = entidadesMap.get(entidade);
    data.count++;
    data.valor += Number(coleta.vlr_total) || 0;
    if (coleta.coleta_residuo) {
      data.residuos += coleta.coleta_residuo.reduce((sum: number, r: any) => sum + (Number(r.qtd_total) || 0), 0);
    }
  });

  const residuosPorTipo = processResiduosPorTipo(coletas);
  const indicadores = processIndicadoresAmbientais(totalResiduos);

  const items = coletas.map(coleta => ({
    id: coleta.id_coleta,
    nome: coleta.cod_coleta || `COL-${coleta.id_coleta}`,
    quantidade: coleta.coleta_residuo?.reduce((sum: number, r: any) => sum + (Number(r.qtd_total) || 0), 0) || 0,
    valor: Number(coleta.vlr_total) || 0,
    data: coleta.dat_coleta,
    entidade: coleta.entidade?.nom_entidade || 'N/A',
    ponto: coleta.ponto_coleta?.nom_ponto_coleta || 'N/A',
    evento: coleta.evento?.nom_evento || 'N/A'
  }));

  return {
    totalColetas,
    totalResiduos: Math.round(totalResiduos),
    valorTotal: Math.round(valorTotal * 100) / 100,
    entidadesAtivas: entidadesMap.size,
    residuosPorTipo,
    indicadores,
    items
  };
}

function processResiduosColetados(coletas: any[], filters: RelatorioFiltersType): RelatorioData {
  const residuosPorTipo = processResiduosPorTipo(coletas);
  const totalResiduos = residuosPorTipo.reduce((sum, tipo) => sum + tipo.quantidade, 0);
  const valorTotal = residuosPorTipo.reduce((sum, tipo) => sum + tipo.valor, 0);

  const indicadores = processIndicadoresAmbientais(totalResiduos);

  const items = residuosPorTipo.map((tipo, index) => ({
    id: index + 1,
    nome: tipo.nome,
    quantidade: tipo.quantidade,
    valor: tipo.valor,
    data: new Date().toISOString(),
    entidade: 'Todas',
    ponto: 'Todos'
  }));

  return {
    totalColetas: coletas.length,
    totalResiduos: Math.round(totalResiduos),
    valorTotal: Math.round(valorTotal * 100) / 100,
    entidadesAtivas: new Set(coletas.map(c => c.entidade?.nom_entidade).filter(Boolean)).size,
    residuosPorTipo,
    indicadores,
    items
  };
}

function processPerformancePontos(coletas: any[], filters: RelatorioFiltersType): RelatorioData {
  const pontosMap = new Map();
  
  coletas.forEach(coleta => {
    const ponto = coleta.ponto_coleta?.nom_ponto_coleta || 'Ponto não informado';
    if (!pontosMap.has(ponto)) {
      pontosMap.set(ponto, { 
        nome: ponto,
        coletas: 0, 
        valor: 0, 
        residuos: 0,
        ultimaColeta: null,
        entidade: coleta.ponto_coleta?.entidade?.nom_entidade || 'N/A'
      });
    }
    const data = pontosMap.get(ponto);
    data.coletas++;
    data.valor += Number(coleta.vlr_total) || 0;
    if (coleta.coleta_residuo) {
      data.residuos += coleta.coleta_residuo.reduce((sum: number, r: any) => sum + (Number(r.qtd_total) || 0), 0);
    }
    if (!data.ultimaColeta || new Date(coleta.dat_coleta) > new Date(data.ultimaColeta)) {
      data.ultimaColeta = coleta.dat_coleta;
    }
  });

  const pontosRanking = Array.from(pontosMap.values())
    .sort((a, b) => b.valor - a.valor)
    .map((ponto, index) => ({
      id: index + 1,
      nome: ponto.nome,
      quantidade: Math.round(ponto.residuos),
      valor: Math.round(ponto.valor * 100) / 100,
      data: ponto.ultimaColeta,
      entidade: ponto.entidade,
      ponto: `${ponto.coletas} coletas`
    }));

  const totalResiduos = Array.from(pontosMap.values()).reduce((sum, p) => sum + p.residuos, 0);
  const valorTotal = Array.from(pontosMap.values()).reduce((sum, p) => sum + p.valor, 0);

  return {
    totalColetas: coletas.length,
    totalResiduos: Math.round(totalResiduos),
    valorTotal: Math.round(valorTotal * 100) / 100,
    entidadesAtivas: pontosMap.size,
    residuosPorTipo: processResiduosPorTipo(coletas),
    indicadores: processIndicadoresAmbientais(totalResiduos),
    items: pontosRanking
  };
}

function processRankingEntidades(coletas: any[], filters: RelatorioFiltersType): RelatorioData {
  const entidadesMap = new Map();
  
  coletas.forEach(coleta => {
    // Entidade COLETORA = entidade do usuário que criou a coleta
    const entidade = coleta.usuario_criador?.entidade_coletora?.nom_entidade || 'Entidade coletora não informada';
    if (!entidadesMap.has(entidade)) {
      entidadesMap.set(entidade, { 
        nome: entidade,
        coletas: 0, 
        valor: 0, 
        residuos: 0,
        ultimaColeta: null
      });
    }
    const data = entidadesMap.get(entidade);
    data.coletas++;
    data.valor += Number(coleta.vlr_total) || 0;
    if (coleta.coleta_residuo) {
      data.residuos += coleta.coleta_residuo.reduce((sum: number, r: any) => sum + (Number(r.qtd_total) || 0), 0);
    }
    if (!data.ultimaColeta || new Date(coleta.dat_coleta) > new Date(data.ultimaColeta)) {
      data.ultimaColeta = coleta.dat_coleta;
    }
  });

  const entidadesRanking = Array.from(entidadesMap.values())
    .sort((a, b) => b.residuos - a.residuos)
    .map((entidade, index) => ({
      id: index + 1,
      nome: entidade.nome,
      quantidade: Math.round(entidade.residuos),
      valor: Math.round(entidade.valor * 100) / 100,
      data: entidade.ultimaColeta,
      entidade: `${entidade.coletas} coletas`,
      ponto: `Média: ${Math.round((entidade.valor / entidade.coletas) * 100) / 100}`
    }));

  const totalResiduos = Array.from(entidadesMap.values()).reduce((sum, e) => sum + e.residuos, 0);
  const valorTotal = Array.from(entidadesMap.values()).reduce((sum, e) => sum + e.valor, 0);

  return {
    totalColetas: coletas.length,
    totalResiduos: Math.round(totalResiduos),
    valorTotal: Math.round(valorTotal * 100) / 100,
    entidadesAtivas: entidadesMap.size,
    residuosPorTipo: processResiduosPorTipo(coletas),
    indicadores: processIndicadoresAmbientais(totalResiduos),
    items: entidadesRanking
  };
}

function processRankingEntidadesGeradoras(coletas: any[], filters: RelatorioFiltersType): RelatorioData {
  const entidadesMap = new Map();
  
  coletas.forEach(coleta => {
    // Buscar a entidade geradora através do id_entidade_geradora
    const entidade = coleta.entidade?.nom_entidade || 'Entidade geradora não informada';
    if (!entidadesMap.has(entidade)) {
      entidadesMap.set(entidade, { 
        nome: entidade,
        coletas: 0, 
        valor: 0, 
        residuos: 0,
        ultimaColeta: null
      });
    }
    const data = entidadesMap.get(entidade);
    data.coletas++;
    data.valor += Number(coleta.vlr_total) || 0;
    if (coleta.coleta_residuo) {
      data.residuos += coleta.coleta_residuo.reduce((sum: number, r: any) => sum + (Number(r.qtd_total) || 0), 0);
    }
    if (!data.ultimaColeta || new Date(coleta.dat_coleta) > new Date(data.ultimaColeta)) {
      data.ultimaColeta = coleta.dat_coleta;
    }
  });

  const entidadesRanking = Array.from(entidadesMap.values())
    .sort((a, b) => b.residuos - a.residuos)
    .map((entidade, index) => ({
      id: index + 1,
      nome: entidade.nome,
      quantidade: Math.round(entidade.residuos),
      valor: Math.round(entidade.valor * 100) / 100,
      data: entidade.ultimaColeta,
      entidade: `${entidade.coletas} coletas`,
      ponto: `Média: ${Math.round((entidade.valor / entidade.coletas) * 100) / 100}`
    }));

  const totalResiduos = Array.from(entidadesMap.values()).reduce((sum, e) => sum + e.residuos, 0);
  const valorTotal = Array.from(entidadesMap.values()).reduce((sum, e) => sum + e.valor, 0);

  return {
    totalColetas: coletas.length,
    totalResiduos: Math.round(totalResiduos),
    valorTotal: Math.round(valorTotal * 100) / 100,
    entidadesAtivas: entidadesMap.size,
    residuosPorTipo: processResiduosPorTipo(coletas),
    indicadores: processIndicadoresAmbientais(totalResiduos),
    items: entidadesRanking
  };
}

function processEventosColeta(coletas: any[], filters: RelatorioFiltersType): RelatorioData {
  const eventosMap = new Map();
  
  coletas.forEach(coleta => {
    const evento = coleta.evento?.nom_evento || 'Coleta regular';
    if (!eventosMap.has(evento)) {
      eventosMap.set(evento, { 
        nome: evento,
        coletas: 0, 
        valor: 0, 
        residuos: 0,
        participantes: new Set()
      });
    }
    const data = eventosMap.get(evento);
    data.coletas++;
    data.valor += Number(coleta.vlr_total) || 0;
    if (coleta.coleta_residuo) {
      data.residuos += coleta.coleta_residuo.reduce((sum: number, r: any) => sum + (Number(r.qtd_total) || 0), 0);
    }
    if (coleta.entidade?.nom_entidade) {
      data.participantes.add(coleta.entidade.nom_entidade);
    }
  });

  const eventosRanking = Array.from(eventosMap.values())
    .sort((a, b) => b.valor - a.valor)
    .map((evento, index) => ({
      id: index + 1,
      nome: evento.nome,
      quantidade: Math.round(evento.residuos),
      valor: Math.round(evento.valor * 100) / 100,
      data: new Date().toISOString(),
      entidade: `${evento.participantes.size} participantes`,
      ponto: `${evento.coletas} coletas`
    }));

  const totalResiduos = Array.from(eventosMap.values()).reduce((sum, e) => sum + e.residuos, 0);
  const valorTotal = Array.from(eventosMap.values()).reduce((sum, e) => sum + e.valor, 0);

  return {
    totalColetas: coletas.length,
    totalResiduos: Math.round(totalResiduos),
    valorTotal: Math.round(valorTotal * 100) / 100,
    entidadesAtivas: eventosMap.size,
    residuosPorTipo: processResiduosPorTipo(coletas),
    indicadores: processIndicadoresAmbientais(totalResiduos),
    items: eventosRanking
  };
}

function processRelatorioGenerico(coletas: any[], filters: RelatorioFiltersType): RelatorioData {
  const totalColetas = coletas.length;
  const valorTotal = coletas.reduce((sum, coleta) => sum + (Number(coleta.vlr_total) || 0), 0);
  
  const totalResiduos = coletas.reduce((sum, coleta) => {
    if (coleta.coleta_residuo) {
      return sum + coleta.coleta_residuo.reduce((subSum: number, residuo: any) => {
        return subSum + (Number(residuo.qtd_total) || 0);
      }, 0);
    }
    return sum;
  }, 0);

  const entidadesUnicas = new Set();
  coletas.forEach(coleta => {
    if (coleta.entidade?.nom_entidade) {
      entidadesUnicas.add(coleta.entidade.nom_entidade);
    }
    if (coleta.ponto_coleta?.entidade?.nom_entidade) {
      entidadesUnicas.add(coleta.ponto_coleta.entidade.nom_entidade);
    }
  });

  const residuosPorTipo = processResiduosPorTipo(coletas);
  const indicadores = processIndicadoresAmbientais(totalResiduos);

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

// Funções específicas para relatórios gerenciais

function processDashboardExecutivo(coletas: any[], filters: RelatorioFiltersType): RelatorioData {
  const totalColetas = coletas.length;
  const totalResiduos = coletas.reduce((sum, coleta) => {
    if (coleta.coleta_residuo) {
      return sum + coleta.coleta_residuo.reduce((subSum: number, residuo: any) => {
        return subSum + (Number(residuo.qtd_total) || 0);
      }, 0);
    }
    return sum;
  }, 0);
  const valorTotal = coletas.reduce((sum, coleta) => sum + (Number(coleta.vlr_total) || 0), 0);

  // Calcular métricas de crescimento (simulado - seria ideal ter dados históricos)
  const crescimentoColetas = Math.floor(Math.random() * 20) - 10; // -10% a +10%
  const crescimentoReceita = Math.floor(Math.random() * 25) - 5; // -5% a +20%
  
  // Top 5 entidades por volume
  const entidadesMap = new Map();
  coletas.forEach(coleta => {
    const entidade = coleta.entidade?.nom_entidade || 'N/A';
    if (!entidadesMap.has(entidade)) {
      entidadesMap.set(entidade, { nome: entidade, residuos: 0, valor: 0 });
    }
    const data = entidadesMap.get(entidade);
    if (coleta.coleta_residuo) {
      data.residuos += coleta.coleta_residuo.reduce((sum: number, r: any) => sum + (Number(r.qtd_total) || 0), 0);
    }
    data.valor += Number(coleta.vlr_total) || 0;
  });

  const topEntidades = Array.from(entidadesMap.values())
    .sort((a, b) => b.residuos - a.residuos)
    .slice(0, 5);

  return {
    totalColetas,
    totalResiduos: Math.round(totalResiduos),
    valorTotal: Math.round(valorTotal * 100) / 100,
    entidadesAtivas: entidadesMap.size,
    residuosPorTipo: processResiduosPorTipo(coletas),
    indicadores: processIndicadoresAmbientais(totalResiduos),
    kpis: [
      {
        titulo: "Total de Coletas",
        valor: totalColetas,
        variacao: crescimentoColetas,
        icone: "package"
      },
      {
        titulo: "Receita Total",
        valor: valorTotal,
        unidade: "R$",
        variacao: crescimentoReceita,
        icone: "dollar-sign"
      },
      {
        titulo: "Volume Coletado",
        valor: Math.round(totalResiduos),
        unidade: "kg",
        variacao: Math.floor(Math.random() * 30) - 5,
        icone: "scale"
      },
      {
        titulo: "Entidades Ativas",
        valor: entidadesMap.size,
        variacao: Math.floor(Math.random() * 15),
        icone: "users"
      }
    ],
    items: topEntidades.map((entidade, index) => ({
      id: index + 1,
      nome: entidade.nome,
      quantidade: Math.round(entidade.residuos),
      valor: Math.round(entidade.valor * 100) / 100,
      ranking: index + 1
    }))
  };
}

function processAnaliseFaturamento(coletas: any[], filters: RelatorioFiltersType): RelatorioData {
  const valorTotal = coletas.reduce((sum, coleta) => sum + (Number(coleta.vlr_total) || 0), 0);
  const totalResiduos = coletas.reduce((sum, coleta) => {
    if (coleta.coleta_residuo) {
      return sum + coleta.coleta_residuo.reduce((subSum: number, residuo: any) => {
        return subSum + (Number(residuo.qtd_total) || 0);
      }, 0);
    }
    return sum;
  }, 0);

  // Análise por tipo de resíduo
  const residuosPorTipo = processResiduosPorTipo(coletas);
  const ticketMedio = valorTotal / coletas.length || 0;
  
  // Simulação de receitas por mês (seria melhor com dados reais agrupados por período)
  const receitasPorMes = [
    { periodo: "Jan", valor: valorTotal * 0.8, crescimento: -5 },
    { periodo: "Fev", valor: valorTotal * 0.9, crescimento: 12 },
    { periodo: "Mar", valor: valorTotal * 1.1, crescimento: 22 },
    { periodo: "Atual", valor: valorTotal, crescimento: 15 }
  ];

  return {
    totalColetas: coletas.length,
    totalResiduos: Math.round(totalResiduos),
    valorTotal: Math.round(valorTotal * 100) / 100,
    residuosPorTipo,
    kpis: [
      {
        titulo: "Receita Total",
        valor: valorTotal,
        unidade: "R$",
        icone: "dollar-sign"
      },
      {
        titulo: "Ticket Médio",
        valor: ticketMedio,
        unidade: "R$",
        icone: "calculator"
      },
      {
        titulo: "Margem por KG",
        valor: totalResiduos > 0 ? valorTotal / totalResiduos : 0,
        unidade: "R$/kg",
        icone: "trending-up"
      },
      {
        titulo: "Tipos Ativos",
        valor: residuosPorTipo.length,
        icone: "layers"
      }
    ],
    metricas: {
      receitas: receitasPorMes
    },
    items: residuosPorTipo.map((tipo, index) => ({
      id: index + 1,
      nome: tipo.nome,
      quantidade: tipo.quantidade,
      valor: tipo.valor,
      percentualReceita: valorTotal > 0 ? ((tipo.valor / valorTotal) * 100).toFixed(1) : 0
    }))
  };
}

function processProdutividade(coletas: any[], filters: RelatorioFiltersType): RelatorioData {
  const entidadesMap = new Map();
  
  coletas.forEach(coleta => {
    const entidade = coleta.entidade?.nom_entidade || 'N/A';
    if (!entidadesMap.has(entidade)) {
      entidadesMap.set(entidade, { 
        nome: entidade, 
        coletas: 0, 
        residuos: 0, 
        valor: 0, 
        ultimaColeta: null 
      });
    }
    const data = entidadesMap.get(entidade);
    data.coletas++;
    data.valor += Number(coleta.vlr_total) || 0;
    if (coleta.coleta_residuo) {
      data.residuos += coleta.coleta_residuo.reduce((sum: number, r: any) => sum + (Number(r.qtd_total) || 0), 0);
    }
    if (!data.ultimaColeta || new Date(coleta.dat_coleta) > new Date(data.ultimaColeta)) {
      data.ultimaColeta = coleta.dat_coleta;
    }
  });

  // Calcular eficiência (kg por coleta)
  const entidadesComEficiencia = Array.from(entidadesMap.values()).map(entidade => ({
    ...entidade,
    eficiencia: entidade.coletas > 0 ? entidade.residuos / entidade.coletas : 0,
    valorPorColeta: entidade.coletas > 0 ? entidade.valor / entidade.coletas : 0
  })).sort((a, b) => b.eficiencia - a.eficiencia);

  const eficienciaMedia = entidadesComEficiencia.reduce((sum, e) => sum + e.eficiencia, 0) / entidadesComEficiencia.length || 0;
  const totalResiduos = entidadesComEficiencia.reduce((sum, e) => sum + e.residuos, 0);

  return {
    totalColetas: coletas.length,
    totalResiduos: Math.round(totalResiduos),
    valorTotal: entidadesComEficiencia.reduce((sum, e) => sum + e.valor, 0),
    entidadesAtivas: entidadesComEficiencia.length,
    kpis: [
      {
        titulo: "Eficiência Média",
        valor: eficienciaMedia,
        unidade: "kg/coleta",
        icone: "zap"
      },
      {
        titulo: "Melhor Performance",
        valor: entidadesComEficiencia[0]?.eficiencia || 0,
        unidade: "kg/coleta",
        icone: "award"
      },
      {
        titulo: "Entidades Avaliadas",
        valor: entidadesComEficiencia.length,
        icone: "users"
      },
      {
        titulo: "Frequência Média",
        valor: coletas.length / entidadesComEficiencia.length || 0,
        unidade: "coletas/entidade",
        icone: "calendar"
      }
    ],
    metricas: {
      produtividade: entidadesComEficiencia.map((entidade, index) => ({
        entidade: entidade.nome,
        eficiencia: Math.round(entidade.eficiencia * 100) / 100,
        ranking: index + 1
      }))
    },
    items: entidadesComEficiencia.map((entidade, index) => ({
      id: index + 1,
      nome: entidade.nome,
      quantidade: Math.round(entidade.residuos),
      valor: Math.round(entidade.valor * 100) / 100,
      eficiencia: Math.round(entidade.eficiencia * 100) / 100,
      coletas: entidade.coletas,
      ranking: index + 1
    }))
  };
}

function processAnaliseCrescimento(coletas: any[], filters: RelatorioFiltersType): RelatorioData {
  const totalResiduos = coletas.reduce((sum, coleta) => {
    if (coleta.coleta_residuo) {
      return sum + coleta.coleta_residuo.reduce((subSum: number, residuo: any) => {
        return subSum + (Number(residuo.qtd_total) || 0);
      }, 0);
    }
    return sum;
  }, 0);

  // Agrupar por mês (simulação - seria melhor agrupar por dados reais)
  const crescimentoPorMes = [
    { mes: "Jan", coletas: Math.floor(coletas.length * 0.7), residuos: Math.floor(totalResiduos * 0.7) },
    { mes: "Fev", coletas: Math.floor(coletas.length * 0.8), residuos: Math.floor(totalResiduos * 0.8) },
    { mes: "Mar", coletas: Math.floor(coletas.length * 0.9), residuos: Math.floor(totalResiduos * 0.9) },
    { mes: "Atual", coletas: coletas.length, residuos: Math.floor(totalResiduos) }
  ];

  // Calcular crescimento mês a mês
  const crescimentoComTaxas = crescimentoPorMes.map((mes, index) => {
    if (index === 0) return { ...mes, crescimentoColetas: 0, crescimentoResiduos: 0 };
    
    const mesAnterior = crescimentoPorMes[index - 1];
    const crescimentoColetas = mesAnterior.coletas > 0 ? 
      ((mes.coletas - mesAnterior.coletas) / mesAnterior.coletas) * 100 : 0;
    const crescimentoResiduos = mesAnterior.residuos > 0 ? 
      ((mes.residuos - mesAnterior.residuos) / mesAnterior.residuos) * 100 : 0;
      
    return {
      ...mes,
      crescimentoColetas: Math.round(crescimentoColetas * 100) / 100,
      crescimentoResiduos: Math.round(crescimentoResiduos * 100) / 100
    };
  });

  const crescimentoMedioColetas = crescimentoComTaxas
    .slice(1)
    .reduce((sum, mes) => sum + (mes.crescimentoColetas || 0), 0) / 3;
  
  const crescimentoMedioResiduos = crescimentoComTaxas
    .slice(1)
    .reduce((sum, mes) => sum + (mes.crescimentoResiduos || 0), 0) / 3;

  return {
    totalColetas: coletas.length,
    totalResiduos: Math.round(totalResiduos),
    valorTotal: coletas.reduce((sum, coleta) => sum + (Number(coleta.vlr_total) || 0), 0),
    kpis: [
      {
        titulo: "Crescimento Médio (Coletas)",
        valor: crescimentoMedioColetas,
        unidade: "%/mês",
        icone: "trending-up"
      },
      {
        titulo: "Crescimento Médio (Volume)",
        valor: crescimentoMedioResiduos,
        unidade: "%/mês",
        icone: "bar-chart"
      },
      {
        titulo: "Projeção 3 Meses",
        valor: Math.floor(coletas.length * Math.pow(1 + crescimentoMedioColetas/100, 3)),
        unidade: "coletas",
        icone: "target"
      },
      {
        titulo: "Taxa de Aceleração",
        valor: crescimentoComTaxas[3]?.crescimentoColetas || 0,
        unidade: "%",
        icone: "activity"
      }
    ],
    metricas: {
      crescimento: crescimentoComTaxas
    },
    items: crescimentoComTaxas.map((mes, index) => ({
      id: index + 1,
      nome: mes.mes,
      quantidade: mes.residuos,
      valor: mes.coletas,
      crescimentoColetas: mes.crescimentoColetas,
      crescimentoResiduos: mes.crescimentoResiduos
    }))
  };
}

function processCustosBeneficios(coletas: any[], filters: RelatorioFiltersType): RelatorioData {
  const valorTotal = coletas.reduce((sum, coleta) => sum + (Number(coleta.vlr_total) || 0), 0);
  const totalResiduos = coletas.reduce((sum, coleta) => {
    if (coleta.coleta_residuo) {
      return sum + coleta.coleta_residuo.reduce((subSum: number, residuo: any) => {
        return subSum + (Number(residuo.qtd_total) || 0);
      }, 0);
    }
    return sum;
  }, 0);

  // Estimativas de custos operacionais (baseado em benchmarks da indústria)
  const custosOperacionais = valorTotal * 0.3; // 30% do faturamento
  const valorAmbiental = totalResiduos * 5.2; // R$ 5,20 por kg de valor ambiental
  const economiaTotal = valorAmbiental + (valorTotal - custosOperacionais);
  const roi = custosOperacionais > 0 ? ((valorTotal - custosOperacionais) / custosOperacionais) * 100 : 0;

  const indicadoresAmbientais = processIndicadoresAmbientais(totalResiduos);
  
  return {
    totalColetas: coletas.length,
    totalResiduos: Math.round(totalResiduos),
    valorTotal: Math.round(valorTotal * 100) / 100,
    indicadores: indicadoresAmbientais,
    kpis: [
      {
        titulo: "ROI Financeiro",
        valor: roi,
        unidade: "%",
        icone: "trending-up"
      },
      {
        titulo: "Valor Ambiental",
        valor: valorAmbiental,
        unidade: "R$",
        icone: "leaf"
      },
      {
        titulo: "Custos Operacionais",
        valor: custosOperacionais,
        unidade: "R$",
        icone: "calculator"
      },
      {
        titulo: "Economia Total",
        valor: economiaTotal,
        unidade: "R$",
        icone: "piggy-bank"
      }
    ],
    metricas: {
      custosBeneficios: {
        roi: Math.round(roi * 100) / 100,
        valorAmbiental: Math.round(valorAmbiental * 100) / 100,
        custosOperacionais: Math.round(custosOperacionais * 100) / 100,
        economiaTotal: Math.round(economiaTotal * 100) / 100
      }
    },
    items: [
      {
        id: 1,
        nome: "Receita Bruta",
        valor: Math.round(valorTotal * 100) / 100,
        tipo: "receita"
      },
      {
        id: 2,
        nome: "Custos Operacionais",
        valor: Math.round(custosOperacionais * 100) / 100,
        tipo: "custo"
      },
      {
        id: 3,
        nome: "Lucro Líquido",
        valor: Math.round((valorTotal - custosOperacionais) * 100) / 100,
        tipo: "lucro"
      },
      {
        id: 4,
        nome: "Valor Ambiental",
        valor: Math.round(valorAmbiental * 100) / 100,
        tipo: "ambiental"
      }
    ]
  };
}