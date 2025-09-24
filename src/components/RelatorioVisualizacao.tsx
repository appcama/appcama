import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  Scale, 
  Users, 
  Calculator,
  Zap,
  Award,
  Calendar,
  BarChart,
  Target,
  Activity,
  Leaf,
  PiggyBank,
  Layers
} from "lucide-react";
import type { RelatorioData } from "@/hooks/useRelatorioData";

interface RelatorioVisualizacaoProps {
  data: RelatorioData;
  reportType: string;
}

const iconMap = {
  package: Package,
  "dollar-sign": DollarSign,
  scale: Scale,
  users: Users,
  calculator: Calculator,
  "trending-up": TrendingUp,
  zap: Zap,
  award: Award,
  calendar: Calendar,
  "bar-chart": BarChart,
  target: Target,
  activity: Activity,
  leaf: Leaf,
  "piggy-bank": PiggyBank,
  layers: Layers
};

export function RelatorioVisualizacao({ data, reportType }: RelatorioVisualizacaoProps) {
  // Renderizar KPIs específicos para relatórios gerenciais
  if (data.kpis && data.kpis.length > 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.kpis.map((kpi, index) => {
            const IconComponent = kpi.icone ? iconMap[kpi.icone as keyof typeof iconMap] : Package;
            const isNegative = kpi.variacao !== undefined && kpi.variacao < 0;
            
            return (
              <Card key={index} className="relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.titulo}
                  </CardTitle>
                  <IconComponent className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {kpi.unidade === "R$" ? 
                      `R$ ${typeof kpi.valor === 'number' ? kpi.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : kpi.valor}` :
                      `${typeof kpi.valor === 'number' ? kpi.valor.toLocaleString('pt-BR') : kpi.valor}${kpi.unidade ? ` ${kpi.unidade}` : ''}`
                    }
                  </div>
                  {kpi.variacao !== undefined && (
                    <div className="flex items-center space-x-2 text-xs mt-1">
                      {isNegative ? (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      ) : (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      )}
                      <Badge 
                        variant={isNegative ? "destructive" : "default"}
                        className={isNegative ? "" : "bg-emerald-500 hover:bg-emerald-600"}
                      >
                        {kpi.variacao > 0 ? '+' : ''}{kpi.variacao}%
                      </Badge>
                      <span className="text-muted-foreground">vs. período anterior</span>
                    </div>
                  )}
                  {kpi.meta && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Meta: {kpi.meta.toLocaleString('pt-BR')} {kpi.unidade}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Seção específica por tipo de relatório */}
        {reportType === 'analise-faturamento' && data.metricas?.receitas && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.metricas.receitas.map((receita, index) => (
                  <div key={index} className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">{receita.periodo}</div>
                    <div className="text-lg font-bold">R$ {receita.valor.toLocaleString('pt-BR')}</div>
                    {receita.crescimento !== undefined && (
                      <Badge 
                        variant={receita.crescimento < 0 ? "destructive" : "default"}
                        className={receita.crescimento < 0 ? "" : "bg-emerald-500 hover:bg-emerald-600"}
                      >
                        {receita.crescimento > 0 ? '+' : ''}{receita.crescimento}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Indicadores Ambientais para Custos vs Benefícios */}
        {reportType === 'custos-beneficios' && data.indicadores && (
          <Card>
            <CardHeader>
              <CardTitle>Impacto Ambiental</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.indicadores.map((indicador, index) => (
                  <div key={index} className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{indicador.nome}</div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {indicador.valor.toLocaleString('pt-BR')} {indicador.unidade}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Fallback para relatórios operacionais (mantém o comportamento original)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Coletas
          </CardTitle>
          <Package className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalColetas?.toLocaleString('pt-BR') || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Resíduos
          </CardTitle>
          <Scale className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalResiduos?.toLocaleString('pt-BR') || 0} kg</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Valor Total
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {data.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Entidades Ativas
          </CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.entidadesAtivas?.toLocaleString('pt-BR') || 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}