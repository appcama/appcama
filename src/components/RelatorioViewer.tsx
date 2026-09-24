import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, Printer, RefreshCw, AlertCircle } from "lucide-react";
import { useRelatorioData } from "@/hooks/useRelatorioData";
import { useRelatorioExport } from "@/hooks/useRelatorioExport";
import { RelatorioFiltersType } from "./RelatorioFilters";
import { RelatorioVisualizacao } from "./RelatorioVisualizacao";
import { RelatorioTabelaPaginada } from "./relatorios/RelatorioTabelaPaginada";
import { RelatorioVisualizacaoOperacional } from "./relatorios/RelatorioVisualizacaoOperacional";
import { RelatorioVisualizacaoGerencial } from "./relatorios/RelatorioVisualizacaoGerencial";
import { RelatorioVisualizacaoAmbiental } from "./relatorios/RelatorioVisualizacaoAmbiental";
import { RelatorioVisualizacaoComparativo } from "./relatorios/RelatorioVisualizacaoComparativo";
import { getUserEntityLogo } from "@/lib/relatorio-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface RelatorioViewerProps {
  reportType: string;
  category: string;
  filters: RelatorioFiltersType;
}

export function RelatorioViewer({ reportType, category, filters }: RelatorioViewerProps) {
  const { data, isLoading, error, refetch } = useRelatorioData(reportType, category, filters);
  const { exportToPDF, printPDF, exportToExcel, exportToCSV, isExporting } = useRelatorioExport();

  const reportTitles: Record<string, string> = {
    // Operacionais
    "coletas-periodo": "Coletas por Período",
    "residuos-coletados": "Resíduos Coletados",
    "pontos-performance": "Performance dos Pontos de Coleta",
    "performance-pontos": "Performance dos Pontos de Coleta",
    "ranking-entidades-geradoras": "Ranking de Entidades Geradoras",
    "ranking-entidades": "Ranking de Entidades Coletoras",
    "eventos-coleta": "Relatório de Eventos",
    
    // Gerenciais
    "dashboard-executivo": "Dashboard Executivo",
    "analise-faturamento": "Análise de Faturamento",
    "faturamento": "Análise de Faturamento",
    "produtividade": "Relatório de Produtividade",
    "rejeitos-coletados": "Rejeitos Coletados por Entidade Geradora",
    "custos-beneficios": "Custos vs Benefícios",
    
    // Ambientais
    "indicadores-ambientais": "Indicadores Ambientais",
    "reciclometro": "Reciclômetro - Impacto Acumulado",
    
    // Comparativos
    "comparativo-temporal": "Comparativo Temporal",
    "crescimento": "Comparativo Temporal",
    "analise-crescimento": "Comparativo Temporal",
    "benchmark-entidades": "Benchmark de Entidades Geradoras",
    "tipos-residuo": "Comparativo por Tipo de Resíduo",
    "sazonalidade": "Análise de Sazonalidade"
  };

  const reportTitle = reportTitles[reportType] || "Relatório Analítico";

  const handleExport = async (formatType: 'pdf' | 'excel' | 'csv') => {
    const logoUrl = await getUserEntityLogo();
    
    try {
      switch (formatType) {
        case 'pdf':
          await exportToPDF(data, reportTitle, filters, reportType, logoUrl);
          toast.success('PDF gerado com sucesso!', {
            description: 'O arquivo foi baixado para seu dispositivo.'
          });
          break;
        case 'excel':
          await exportToExcel(data, reportTitle, filters);
          toast.success('Excel exportado com sucesso!', {
            description: 'A planilha foi baixada para seu dispositivo.'
          });
          break;
        case 'csv':
          await exportToCSV(data, reportTitle, filters);
          toast.success('CSV exportado com sucesso!', {
            description: 'Os dados tabulares foram baixados com sucesso.'
          });
          break;
      }
    } catch (err) {
      console.error('Erro ao exportar relatório:', err);
      toast.error('Erro ao exportar relatório', {
        description: 'Tente novamente ou verifique os filtros selecionados.'
      });
    }
  };

  const handlePrint = async () => {
    const logoUrl = await getUserEntityLogo();
    
    try {
      await printPDF(data, reportTitle, filters, reportType, logoUrl);
      toast.success('Relatório aberto para impressão!', {
        description: 'Uma nova janela foi aberta com o documento pronto.'
      });
    } catch (err) {
      console.error('Erro ao imprimir relatório:', err);
      toast.error('Erro ao imprimir relatório', {
        description: 'Tente novamente ou entre em contato com o suporte.'
      });
    }
  };

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <CardTitle className="text-base">Erro ao Carregar Relatório</CardTitle>
          </div>
          <CardDescription>
            Ocorreu uma falha ao consultar os registros no banco de dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Renderiza o gráfico específico da categoria/relatório
  const renderVisualizacaoGrafico = () => {
    if (!data) return null;

    if (category === 'relatorios-ambientais' || reportType === 'indicadores-ambientais' || reportType === 'reciclometro') {
      return <RelatorioVisualizacaoAmbiental data={data} reportType={reportType} />;
    }

    if (category === 'relatorios-comparativos' || ['comparativo-temporal', 'benchmark-entidades', 'tipos-residuo', 'sazonalidade', 'crescimento'].includes(reportType)) {
      return <RelatorioVisualizacaoComparativo data={data} reportType={reportType} />;
    }

    if (category === 'relatorios-gerenciais' || ['dashboard-executivo', 'faturamento', 'analise-faturamento', 'produtividade', 'rejeitos-coletados'].includes(reportType)) {
      return <RelatorioVisualizacaoGerencial data={data} reportType={reportType} />;
    }

    return <RelatorioVisualizacaoOperacional data={data} reportType={reportType} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Barra de Título e Ações */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
                  {reportTitle}
                </CardTitle>
                <Badge variant="outline" className="text-xs bg-muted/50 border-border/70">
                  {category.replace('relatorios-', '').toUpperCase()}
                </Badge>
              </div>
              <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
                {filters.dataInicial && filters.dataFinal && (
                  <span>
                    Período: <strong>{format(filters.dataInicial, "dd/MM/yyyy", { locale: ptBR })}</strong> até <strong>{format(filters.dataFinal, "dd/MM/yyyy", { locale: ptBR })}</strong>
                  </span>
                )}
                <span>•</span>
                <span>
                  Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </CardDescription>
            </div>
            
            {/* Ações de Exportação e Atualização */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="h-8 gap-1.5 text-xs border-border/70"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isExporting || isLoading}
                className="h-8 gap-1.5 text-xs border-border/70"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </Button>
              
              {/* Botões de Exportação agrupados */}
              <div className="inline-flex rounded-lg border border-border/70 p-0.5 bg-muted/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting || isLoading}
                  className="h-7 px-2.5 text-xs font-semibold gap-1 hover:bg-background"
                >
                  <FileDown className="w-3 h-3 text-destructive" />
                  PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('excel')}
                  disabled={isExporting || isLoading}
                  className="h-7 px-2.5 text-xs font-semibold gap-1 hover:bg-background"
                >
                  Excel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  disabled={isExporting || isLoading}
                  className="h-7 px-2.5 text-xs font-semibold gap-1 hover:bg-background"
                >
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Conteúdo Principal Split-View */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* 1. KPIs no topo */}
          <RelatorioVisualizacao data={data} reportType={reportType} />

          {/* 2. Gráfico analítico contextual (Split Superior) */}
          {renderVisualizacaoGrafico()}

          {/* 3. Tabela paginada detalhada (Split Inferior) */}
          <RelatorioTabelaPaginada data={data} reportType={reportType} />
        </div>
      ) : null}
    </div>
  );
}