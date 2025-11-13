import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, Printer, Share2, RefreshCw, BarChart3, Table, PieChart } from "lucide-react";
import { useRelatorioData } from "@/hooks/useRelatorioData";
import { useRelatorioExport } from "@/hooks/useRelatorioExport";
import { RelatorioFiltersType } from "./RelatorioFilters";
import { DashboardCharts } from "./DashboardCharts";
import { RelatorioVisualizacao } from "./RelatorioVisualizacao";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RelatorioViewerProps {
  reportType: string;
  category: string;
  filters: RelatorioFiltersType;
}

export function RelatorioViewer({ reportType, category, filters }: RelatorioViewerProps) {
  const { data, isLoading, error, refetch } = useRelatorioData(reportType, category, filters);
  const { exportToPDF, printPDF, exportToExcel, exportToCSV, isExporting } = useRelatorioExport();

  const reportTitles: Record<string, string> = {
    "coletas-periodo": "Coletas por Período",
    "residuos-coletados": "Resíduos Coletados",
    "pontos-performance": "Performance dos Pontos de Coleta",
    "entidades-ranking": "Ranking de Entidades Coletoras",
    "eventos-coleta": "Relatório de Eventos",
    "dashboard-executivo": "Dashboard Executivo",
    "analise-faturamento": "Análise de Faturamento",
    "produtividade": "Relatório de Produtividade",
    "analise-crescimento": "Análise de Crescimento",
    "ranking-entidades-geradoras": "Ranking de Entidades Geradoras",
    "custos-beneficios": "Análise de Custos vs Benefícios",
    "rejeitos-coletados": "Rejeitos Coletados por Entidade Geradora",
    "indicadores-ambientais": "Indicadores Ambientais",
    "impacto-ecologico": "Impacto Ecológico Detalhado",
    "reciclometro": "Reciclômetro - Impacto Acumulado",
    "certificacao": "Dados para Certificação Ambiental",
    "sustentabilidade": "Métricas de Sustentabilidade",
    "comparativo-temporal": "Comparativo Temporal",
    "benchmark-entidades": "Benchmark entre Entidades",
    "performance-regional": "Performance Regional",
    "tipos-residuo": "Comparativo por Tipo de Resíduo",
    "sazonalidade": "Análise de Sazonalidade"
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    const reportTitle = reportTitles[reportType] || "Relatório";
    
    // Buscar logo da entidade do usuário logado
    let logoUrl: string | undefined = undefined;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const storedUser = localStorage.getItem('recicla_e_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const { data: entidadeData } = await supabase
            .from('entidade')
            .select('des_logo_url')
            .eq('id_entidade', userData.entityId)
            .single();
          
          logoUrl = entidadeData?.des_logo_url || undefined;
        }
      }
    } catch (error) {
      console.warn('Erro ao buscar logo da entidade:', error);
    }
    
    try {
      switch (format) {
        case 'pdf':
          await exportToPDF(data, reportTitle, filters, reportType, logoUrl);
          toast.success('PDF gerado com sucesso!', {
            description: 'O arquivo foi baixado para seu dispositivo.'
          });
          break;
        case 'excel':
          await exportToExcel(data, reportTitle, filters);
          toast.success('Excel exportado com sucesso!', {
            description: 'O arquivo foi baixado para seu dispositivo.'
          });
          break;
        case 'csv':
          await exportToCSV(data, reportTitle, filters);
          toast.success('CSV exportado com sucesso!', {
            description: 'O arquivo foi baixado para seu dispositivo.'
          });
          break;
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório', {
        description: 'Tente novamente ou entre em contato com o suporte.'
      });
    }
  };

  const handlePrint = async () => {
    const reportTitle = reportTitles[reportType] || "Relatório";
    
    // Buscar logo da entidade do usuário logado
    let logoUrl: string | undefined = undefined;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const storedUser = localStorage.getItem('recicla_e_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const { data: entidadeData } = await supabase
            .from('entidade')
            .select('des_logo_url')
            .eq('id_entidade', userData.entityId)
            .single();
          
          logoUrl = entidadeData?.des_logo_url || undefined;
        }
      }
    } catch (error) {
      console.warn('Erro ao buscar logo da entidade:', error);
    }
    
    try {
      await printPDF(data, reportTitle, filters, reportType, logoUrl);
      toast.success('Relatório aberto para impressão!', {
        description: 'Uma nova janela foi aberta com o PDF do relatório.'
      });
    } catch (error) {
      console.error('Erro ao imprimir relatório:', error);
      toast.error('Erro ao imprimir relatório', {
        description: 'Tente novamente ou entre em contato com o suporte.'
      });
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Erro ao Carregar Relatório</CardTitle>
          <CardDescription>
            Ocorreu um erro ao carregar os dados do relatório. Tente novamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Relatório */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{reportTitles[reportType]}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                {filters.dataInicial && filters.dataFinal && (
                  <span>
                    Período: {format(filters.dataInicial, "dd/MM/yyyy", { locale: ptBR })} - {format(filters.dataFinal, "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                )}
                <Badge variant="outline">
                  Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </Badge>
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isExporting}
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
              
              <div className="flex">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                  className="gap-2 rounded-r-none"
                >
                  <FileDown className="w-4 h-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                  disabled={isExporting}
                  className="gap-2 rounded-none border-l-0"
                >
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                  className="gap-2 rounded-l-none border-l-0"
                >
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Conteúdo do Relatório */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
              <Skeleton className="h-64" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="visualizacao" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visualizacao" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Visualização
            </TabsTrigger>
            <TabsTrigger value="tabela" className="gap-2">
              <Table className="w-4 h-4" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="graficos" className="gap-2">
              <PieChart className="w-4 h-4" />
              Gráficos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visualizacao" className="space-y-4">
            <RelatorioVisualizacao data={data} reportType={reportType} />
          </TabsContent>

          <TabsContent value="tabela" className="space-y-4">
            <RelatorioTabela data={data} reportType={reportType} />
          </TabsContent>

          <TabsContent value="graficos" className="space-y-4">
            <RelatorioGraficos data={data} reportType={reportType} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Componente para visualização em tabela
function RelatorioTabela({ data, reportType }: { data: any; reportType: string }) {
  if (!data?.items || data.items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Nenhum dado encontrado para exibir na tabela.</p>
        </CardContent>
      </Card>
    );
  }

  // Configurar colunas baseado no tipo de relatório
  const getColumns = () => {
    switch (reportType) {
      case 'performance-pontos':
        return [
          { key: 'nome', label: 'Ponto de Coleta' },
          { key: 'quantidade', label: 'Resíduos (kg)' },
          { key: 'valor', label: 'Valor (R$)' },
          { key: 'ponto', label: 'Coletas' },
          { key: 'entidade', label: 'Entidade Gestora' }
        ];
      case 'ranking-entidades':
        return [
          { key: 'nome', label: 'Entidade Coletora' },
          { key: 'quantidade', label: 'Resíduos (kg)' },
          { key: 'valor', label: 'Valor (R$)' },
          { key: 'entidade', label: 'Coletas' },
          { key: 'ponto', label: 'Média por Coleta' }
        ];
      case 'ranking-entidades-geradoras':
        return [
          { key: 'nome', label: 'Entidade Geradora' },
          { key: 'quantidade', label: 'Resíduos (kg)' },
          { key: 'valor', label: 'Valor (R$)' },
          { key: 'entidade', label: 'Coletas' },
          { key: 'ponto', label: 'Média por Coleta' }
        ];
      case 'eventos-coleta':
        return [
          { key: 'nome', label: 'Evento' },
          { key: 'quantidade', label: 'Resíduos (kg)' },
          { key: 'valor', label: 'Valor (R$)' },
          { key: 'entidade', label: 'Participantes' },
          { key: 'ponto', label: 'Coletas' }
        ];
      case 'residuos-coletados':
        return [
          { key: 'nome', label: 'Tipo de Resíduo' },
          { key: 'quantidade', label: 'Quantidade (kg)' },
          { key: 'valor', label: 'Valor (R$)' },
          { key: 'entidade', label: 'Origem' },
          { key: 'ponto', label: 'Status' }
        ];
      default:
        return [
          { key: 'nome', label: 'Código/Item' },
          { key: 'quantidade', label: 'Quantidade (kg)' },
          { key: 'valor', label: 'Valor (R$)' },
          { key: 'entidade', label: 'Entidade' },
          { key: 'ponto', label: 'Ponto de Coleta' },
          { key: 'data', label: 'Data' }
        ];
    }
  };

  const columns = getColumns();

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {columns.map(column => (
                  <th key={column.key} className="text-left p-4 font-medium">{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.slice(0, 10).map((item: any, index: number) => (
                <tr key={index} className="border-b border-border hover:bg-muted/20">
                  {columns.map(column => (
                    <td key={column.key} className="p-4">
                      {column.key === 'valor' && item[column.key] ? 
                        `R$ ${Number(item[column.key]).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` :
                       column.key === 'quantidade' && item[column.key] ?
                        `${Number(item[column.key]).toLocaleString('pt-BR')} kg` :
                       column.key === 'data' && item[column.key] ?
                        format(new Date(item[column.key]), "dd/MM/yyyy") :
                        item[column.key] || '-'
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.items.length > 10 && (
          <div className="p-4 text-center border-t border-border">
            <p className="text-sm text-muted-foreground">
              Mostrando 10 de {data.items.length} registros. Exporte para ver todos os dados.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para gráficos
function RelatorioGraficos({ data, reportType }: { data: any; reportType: string }) {
  if (!data?.residuosPorTipo) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Dados insuficientes para gerar gráficos.</p>
        </CardContent>
      </Card>
    );
  }

  return <DashboardCharts residuosPorTipo={data.residuosPorTipo} />;
}