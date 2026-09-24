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
  Layers,
  MapPin,
  Clock
} from "lucide-react";
import type { RelatorioData } from "@/hooks/useRelatorioData";

interface RelatorioVisualizacaoProps {
  data: RelatorioData;
  reportType?: string;
}

const iconMap: Record<string, any> = {
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
  layers: Layers,
  "map-pin": MapPin,
  clock: Clock
};

export function RelatorioVisualizacao({ data }: RelatorioVisualizacaoProps) {
  // Renderizar KPIs configurados no relatório
  if (data.kpis && data.kpis.length > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map((kpi, index) => {
          const IconComponent = kpi.icone && iconMap[kpi.icone] ? iconMap[kpi.icone] : Package;
          const isNegative = kpi.variacao !== undefined && kpi.variacao < 0;
          
          return (
            <Card key={index} className="border-border/80 shadow-xs hover:border-recycle-green/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {kpi.titulo}
                </CardTitle>
                <div className="w-7 h-7 rounded-lg bg-recycle-green/10 flex items-center justify-center text-recycle-green">
                  <IconComponent className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-foreground font-mono">
                  {kpi.unidade === "R$" ? 
                    `R$ ${typeof kpi.valor === 'number' ? kpi.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : kpi.valor}` :
                    `${typeof kpi.valor === 'number' ? kpi.valor.toLocaleString('pt-BR') : kpi.valor}${kpi.unidade ? ` ${kpi.unidade}` : ''}`
                  }
                </div>

                {kpi.subtexto && (
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">
                    {kpi.subtexto}
                  </p>
                )}

                {kpi.variacao !== undefined && (
                  <div className="flex items-center space-x-1.5 text-xs mt-1.5">
                    {isNegative ? (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-recycle-green" />
                    )}
                    <Badge 
                      variant={isNegative ? "destructive" : "default"}
                      className={`text-[10px] px-1.5 py-0 ${isNegative ? "" : "bg-recycle-green hover:bg-recycle-green"}`}
                    >
                      {kpi.variacao > 0 ? '+' : ''}{kpi.variacao}%
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">vs. anterior</span>
                  </div>
                )}

                {kpi.meta && (
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Meta: {kpi.meta.toLocaleString('pt-BR')} {kpi.unidade}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Fallback padrão se não houver kpis customizados
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
            Total de Coletas
          </CardTitle>
          <div className="w-7 h-7 rounded-lg bg-recycle-green/10 flex items-center justify-center text-recycle-green">
            <Package className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold font-mono">{data.totalColetas?.toLocaleString('pt-BR') || 0}</div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
            Total de Resíduos
          </CardTitle>
          <div className="w-7 h-7 rounded-lg bg-eco-blue/10 flex items-center justify-center text-eco-blue">
            <Scale className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold font-mono">
            {typeof data.totalResiduos === 'number'
              ? data.totalResiduos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '0,00'} kg
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
            Valor Total
          </CardTitle>
          <div className="w-7 h-7 rounded-lg bg-eco-orange/10 flex items-center justify-center text-eco-orange">
            <DollarSign className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold font-mono">
            R$ {typeof data.valorTotal === 'number'
              ? data.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '0,00'}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
            Entidades Ativas
          </CardTitle>
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold font-mono">{data.entidadesAtivas?.toLocaleString('pt-BR') || 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}