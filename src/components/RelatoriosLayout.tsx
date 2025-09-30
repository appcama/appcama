import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileDown, BarChart3, TrendingUp, Recycle, FileText } from "lucide-react";
import { RelatorioFilters } from "./RelatorioFilters";
import { RelatorioViewer } from "./RelatorioViewer";
import { useRelatorioFilters } from "@/hooks/useRelatorioFilters";

interface RelatoriosLayoutProps {
  activeItem: string;
}

export function RelatoriosLayout({ activeItem }: RelatoriosLayoutProps) {
  const [selectedReport, setSelectedReport] = useState<string>("");
  const { filters, updateFilters, resetFilters } = useRelatorioFilters();

  const reportCategories = {
    "relatorios-operacionais": {
      title: "Relatórios Operacionais",
      description: "Relatórios detalhados sobre operações diárias de coleta e gestão de resíduos",
      icon: FileText,
      reports: [
        { id: "coletas-periodo", title: "Coletas por Período", description: "Lista detalhada de todas as coletas realizadas" },
        { id: "residuos-coletados", title: "Resíduos Coletados", description: "Detalhamento por tipo de resíduo, quantidade e valor" },
        { id: "performance-pontos", title: "Performance dos Pontos", description: "Estatísticas e eficiência de cada ponto de coleta" },
        { id: "ranking-entidades", title: "Ranking de Entidades", description: "Ranking das entidades por volume coletado" },
        { id: "eventos-coleta", title: "Eventos de Coleta", description: "Relatório consolidado por evento de coleta" }
      ]
    },
    "relatorios-gerenciais": {
      title: "Relatórios Gerenciais", 
      description: "Análises estratégicas e indicadores de performance para gestão",
      icon: TrendingUp,
      reports: [
        { id: "dashboard-executivo", title: "Dashboard Executivo", description: "Visão consolidada com KPIs principais" },
        { id: "faturamento", title: "Análise de Faturamento", description: "Análise financeira das coletas e receitas" },
        { id: "produtividade", title: "Produtividade", description: "Análise de eficiência por entidade coletora" },
        { id: "crescimento", title: "Análise de Crescimento", description: "Evolução temporal das operações" },
        { id: "custos-beneficios", title: "Custos vs Benefícios", description: "Análise econômica das operações" }
      ]
    },
    "relatorios-ambientais": {
      title: "Relatórios Ambientais",
      description: "Impacto ambiental e indicadores de sustentabilidade",
      icon: Recycle,
      reports: [
        { id: "indicadores-ambientais", title: "Indicadores Ambientais", description: "CO2 evitado, água e energia poupadas" },
        { id: "impacto-ecologico", title: "Impacto Ecológico", description: "Relatório detalhado dos benefícios ambientais" },
        { id: "reciclometro", title: "Reciclômetro", description: "Visualização do impacto ambiental acumulado" },
        { id: "certificacao", title: "Dados para Certificação", description: "Informações para certificações e selos verdes" },
        { id: "sustentabilidade", title: "Métricas de Sustentabilidade", description: "Indicadores de sustentabilidade por período" }
      ]
    },
    "relatorios-comparativos": {
      title: "Relatórios Comparativos",
      description: "Análises comparativas e benchmarks de performance",
      icon: BarChart3,
      reports: [
        { id: "comparativo-temporal", title: "Comparativo Temporal", description: "Evolução mensal e anual das operações" },
        { id: "benchmark-entidades", title: "Benchmark de Entidades", description: "Comparação entre entidades geradoras" },
        { id: "performance-regional", title: "Performance Regional", description: "Análise por municípios e regiões" },
        { id: "tipos-residuo", title: "Por Tipo de Resíduo", description: "Comparativo de eficiência por tipo de material" },
        { id: "sazonalidade", title: "Análise de Sazonalidade", description: "Padrões temporais e sazonais" }
      ]
    }
  };

  const currentCategory = reportCategories[activeItem as keyof typeof reportCategories];

  if (!currentCategory) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Categoria de Relatório Não Encontrada</CardTitle>
            <CardDescription>
              A categoria selecionada não foi encontrada. Por favor, selecione uma categoria válida.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const Icon = currentCategory.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-recycle-green-light rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-recycle-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{currentCategory.title}</h1>
            <p className="text-muted-foreground">{currentCategory.description}</p>
          </div>
        </div>
        
        {selectedReport && (
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-recycle-green-light text-recycle-green-dark">
              <Calendar className="w-3 h-3 mr-1" />
              Relatório Ativo
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
              onClick={() => {/* TODO: Implementar exportação */}}
            >
              <FileDown className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com lista de relatórios */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tipos de Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentCategory.reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedReport === report.id
                      ? 'bg-recycle-green-light border-recycle-green text-recycle-green-dark'
                      : 'hover:bg-muted border-border'
                  }`}
                >
                  <div className="font-medium text-sm">{report.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{report.description}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Filtros */}
          <RelatorioFilters 
            filters={filters}
            onFiltersChange={updateFilters}
            onReset={resetFilters}
          />
        </div>

        {/* Área principal do relatório */}
        <div className="lg:col-span-3">
          {selectedReport ? (
            <RelatorioViewer 
              reportType={selectedReport}
              category={activeItem}
              filters={filters}
            />
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-lg mb-2">Selecione um Relatório</CardTitle>
                <CardDescription>
                  Escolha um tipo de relatório na lista ao lado para visualizar os dados.
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
    
    </div>
  );
}