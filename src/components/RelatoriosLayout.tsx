import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  TrendingUp, 
  Recycle, 
  BarChart3, 
  Calendar, 
  MapPin, 
  Award, 
  Users, 
  DollarSign, 
  Zap, 
  AlertTriangle, 
  Target, 
  Leaf, 
  Layers,
  CheckCircle2
} from "lucide-react";
import { RelatorioFilters } from "./RelatorioFilters";
import { RelatorioViewer } from "./RelatorioViewer";
import { useRelatorioFilters } from "@/hooks/useRelatorioFilters";
import { cn } from "@/lib/utils";

interface RelatoriosLayoutProps {
  activeItem: string;
}

export function RelatoriosLayout({ activeItem }: RelatoriosLayoutProps) {
  const { filters, updateFilters, resetFilters } = useRelatorioFilters();

  const reportCategories = {
    "relatorios-operacionais": {
      title: "Relatórios Operacionais",
      description: "Acompanhamento detalhado das operações de coleta, volume por tipo de resíduo, desempenho de pontos e geradoras",
      icon: FileText,
      badgeColor: "bg-recycle-green/10 text-recycle-green-dark border-recycle-green/20",
      reports: [
        { 
          id: "coletas-periodo", 
          title: "Coletas por Período", 
          description: "Listagem detalhada das operações com status e responsáveis",
          icon: Calendar
        },
        { 
          id: "residuos-coletados", 
          title: "Resíduos Coletados", 
          description: "Balanço agregado por tipo de material, peso e valor comercial",
          icon: Recycle
        },
        { 
          id: "performance-pontos", 
          title: "Performance dos Pontos", 
          description: "Estatísticas de volume e frequência por ponto de coleta (PEV)",
          icon: MapPin
        },
        { 
          id: "ranking-entidades-geradoras", 
          title: "Ranking de Geradoras", 
          description: "Classificação das empresas geradoras por volume coletado",
          icon: Award
        },
        { 
          id: "eventos-coleta", 
          title: "Eventos de Coleta", 
          description: "Resultados consolidados de campanhas e mutirões especiais",
          icon: Users
        }
      ]
    },
    "relatorios-gerenciais": {
      title: "Relatórios Gerenciais", 
      description: "Análises estratégicas, rentabilidade financeira, indicadores de produtividade e controle de rejeitos",
      icon: TrendingUp,
      badgeColor: "bg-eco-blue/10 text-eco-blue border-eco-blue/20",
      reports: [
        { 
          id: "dashboard-executivo", 
          title: "Dashboard Executivo", 
          description: "Visão consolidada com metas, ticket médio e volume global",
          icon: BarChart3
        },
        { 
          id: "faturamento", 
          title: "Análise Financeira", 
          description: "Receita comercial, margem operacional e cotação por resíduo",
          icon: DollarSign
        },
        { 
          id: "produtividade", 
          title: "Produtividade Operacional", 
          description: "Eficiência de coleta e volume médio gerado por parceiro",
          icon: Zap
        },
        { 
          id: "rejeitos-coletados", 
          title: "Rejeitos por Geradora", 
          description: "Controle de refugo e pureza dos materiais recebidos na triagem",
          icon: AlertTriangle
        }
      ]
    },
    "relatorios-ambientais": {
      title: "Relatórios Ambientais",
      description: "Métricas de sustentabilidade, preservação de recursos naturais e créditos ecológicos",
      icon: Leaf,
      badgeColor: "bg-recycle-green/10 text-recycle-green-dark border-recycle-green/20",
      reports: [
        { 
          id: "indicadores-ambientais", 
          title: "Indicadores Ambientais", 
          description: "CO₂ evitado, água e energia poupadas com metas institucionais",
          icon: Target
        },
        { 
          id: "reciclometro", 
          title: "Reciclômetro Visual", 
          description: "Painel infográfico com equivalências reais e selo ecológico",
          icon: Award
        }
      ]
    },
    "relatorios-comparativos": {
      title: "Relatórios Comparativos",
      description: "Séries temporais, sazonalidade e benchmark entre entidades (CAMA: global; outras: restrito)",
      icon: BarChart3,
      badgeColor: "bg-eco-orange/10 text-eco-orange border-eco-orange/20",
      reports: [
        { 
          id: "comparativo-temporal", 
          title: "Evolução Temporal", 
          description: "Evolução mês a mês das operações e taxas de crescimento",
          icon: TrendingUp
        },
        { 
          id: "benchmark-entidades", 
          title: "Benchmark de Geradoras", 
          description: "Comparativo de performance entre geradoras (CAMA: todas)",
          icon: Award
        },
        { 
          id: "tipos-residuo", 
          title: "Por Tipo de Resíduo", 
          description: "Comparativo de preço médio e participação no volume total",
          icon: Layers
        },
        { 
          id: "sazonalidade", 
          title: "Análise de Sazonalidade", 
          description: "Padrões por dia da semana e identificação de picos de coleta",
          icon: Calendar
        }
      ]
    }
  };

  const currentCategory = reportCategories[activeItem as keyof typeof reportCategories];
  const [selectedReport, setSelectedReport] = useState<string>("");

  // Auto-selecionar o primeiro relatório da categoria quando ela carregar ou mudar
  useEffect(() => {
    if (currentCategory && currentCategory.reports.length > 0) {
      const isCurrentReportValid = currentCategory.reports.some(r => r.id === selectedReport);
      if (!isCurrentReportValid) {
        setSelectedReport(currentCategory.reports[0].id);
      }
    }
  }, [activeItem, currentCategory]);

  if (!currentCategory) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Categoria de Relatório Não Encontrada</CardTitle>
            <CardDescription>
              A categoria selecionada não foi encontrada. Por favor, selecione uma categoria válida no menu lateral.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const CategoryIcon = currentCategory.icon;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header da Categoria */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-recycle-green/10 text-recycle-green rounded-xl flex items-center justify-center shrink-0 border border-recycle-green/20 shadow-xs">
            <CategoryIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {currentCategory.title}
              </h1>
              <Badge variant="outline" className={cn("text-xs font-semibold", currentCategory.badgeColor)}>
                {currentCategory.reports.length} relatórios
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-3xl">
              {currentCategory.description}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Cards Seletores de Relatórios (Estilo Dashboard no Topo) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Selecione o Relatório
          </span>
          <span className="text-xs text-muted-foreground">
            Clique no card para alternar a visualização
          </span>
        </div>

        <div className={cn(
          "grid gap-3",
          currentCategory.reports.length === 2 && "grid-cols-1 sm:grid-cols-2",
          currentCategory.reports.length === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
          currentCategory.reports.length === 5 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
        )}>
          {currentCategory.reports.map((report) => {
            const isSelected = selectedReport === report.id;
            const ReportIcon = report.icon;

            return (
              <button
                key={report.id}
                type="button"
                onClick={() => setSelectedReport(report.id)}
                className={cn(
                  "flex flex-col text-left p-3.5 rounded-xl border transition-all duration-200 relative group cursor-pointer",
                  isSelected
                    ? "bg-card border-recycle-green ring-2 ring-recycle-green/20 shadow-sm"
                    : "bg-card/70 hover:bg-card border-border/80 hover:border-recycle-green/40 hover:shadow-xs"
                )}
              >
                {/* Indicador Ativo */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5">
                    <CheckCircle2 className="w-4 h-4 text-recycle-green" />
                  </div>
                )}

                <div className="flex items-center gap-2.5 mb-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
                    isSelected 
                      ? "bg-recycle-green text-white shadow-xs" 
                      : "bg-muted text-muted-foreground group-hover:bg-recycle-green/10 group-hover:text-recycle-green"
                  )}>
                    <ReportIcon className="w-4 h-4" />
                  </div>
                  <h3 className={cn(
                    "font-semibold text-xs leading-tight line-clamp-1 pr-4",
                    isSelected ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"
                  )}>
                    {report.title}
                  </h3>
                </div>

                <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                  {report.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtros Horizontais Compactos */}
      <RelatorioFilters 
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
      />

      {/* Área Principal Split-View */}
      {selectedReport && (
        <RelatorioViewer 
          reportType={selectedReport}
          category={activeItem}
          filters={filters}
        />
      )}
    </div>
  );
}