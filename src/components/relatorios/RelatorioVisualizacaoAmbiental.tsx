import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Leaf, 
  Award, 
  Droplets, 
  Zap, 
  Car, 
  Lightbulb, 
  Trash2, 
  Target, 
  Trees, 
  Scale, 
  TrendingUp,
  Sparkles
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { RelatorioData } from "@/hooks/useRelatorioData";

interface RelatorioVisualizacaoAmbientalProps {
  data: RelatorioData;
  reportType: string;
}

const COLORS = [
  '#22c55e', // recycle-green
  '#0ea5e9', // eco-blue
  '#f97316', // eco-orange
  '#84cc16', // lime
  '#a855f7', // purple
  '#eab308'  // yellow
];

export function RelatorioVisualizacaoAmbiental({ data, reportType }: RelatorioVisualizacaoAmbientalProps) {
  const isReciclometro = reportType === 'reciclometro';
  const reciclometro = data.metricas?.reciclometro;
  const pieData = (data.residuosPorTipo || []).map(r => ({
    name: r.nome,
    value: r.quantidade,
    percentual: r.percentual
  }));

  const getEquivalenciaIcon = (icone: string) => {
    switch (icone) {
      case 'zap': return Droplets;
      case 'trending-up': return Car;
      case 'activity': return Lightbulb;
      case 'package': return Trash2;
      default: return Sparkles;
    }
  };

  return (
    <div className="space-y-6">
      {/* SEÇÃO RECICLÔMETRO */}
      {isReciclometro && reciclometro && (
        <div className="space-y-4">
          {/* Card do Selo Ecológico */}
          <Card className="border-border/80 bg-gradient-to-r from-card via-card to-recycle-green/5 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md shrink-0"
                    style={{ 
                      backgroundColor: `${reciclometro.corSelo}20`,
                      borderColor: reciclometro.corSelo,
                      borderWidth: '2px'
                    }}
                  >
                    <Award className="w-8 h-8" style={{ color: reciclometro.corSelo }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">
                        Selo Ecológico: Nível {reciclometro.nivelSelo}
                      </h2>
                      <Badge 
                        variant="secondary" 
                        className="font-bold text-xs"
                        style={{ backgroundColor: `${reciclometro.corSelo}25`, color: reciclometro.corSelo }}
                      >
                        {reciclometro.pontosSelo.toLocaleString('pt-BR')} Eco-Pontos
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                      Reconhecimento institucional pela destinação sustentável de materiais recicláveis e preservação da biodiversidade.
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-64 space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Rumo a: <strong className="text-foreground">{reciclometro.proximoNivel}</strong></span>
                    <span className="font-semibold text-recycle-green">{reciclometro.progressoNivel}%</span>
                  </div>
                  <Progress value={reciclometro.progressoNivel} className="h-2" />
                  <p className="text-[10px] text-muted-foreground text-right">
                    Volume reciclado: {(data.totalResiduos || 0).toLocaleString('pt-BR')} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de Equivalências Visuais */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-eco-orange" />
              Equivalências de Impacto no Mundo Real
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {reciclometro.equivalencias.map((eq, idx) => {
                const IconComp = getEquivalenciaIcon(eq.icone);
                return (
                  <Card key={idx} className="border-border/70 hover:border-recycle-green/60 transition-all hover:shadow-xs">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        {eq.titulo}
                      </CardTitle>
                      <div className="w-7 h-7 rounded-lg bg-recycle-green/10 flex items-center justify-center text-recycle-green">
                        <IconComp className="w-4 h-4" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <div className="text-xl font-bold text-foreground">
                        {eq.valor}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {eq.descricao}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO INDICADORES AMBIENTAIS DETALHADOS COM METAS */}
      {!isReciclometro && data.indicadores && data.indicadores.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-recycle-green" />
            Progresso dos Indicadores Ambientais vs Metas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.indicadores.map((ind, idx) => (
              <Card key={idx} className="border-border/70">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-recycle-green" />
                      {ind.nome}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] border-recycle-green/40 text-recycle-green">
                      {ind.progresso !== undefined ? `${ind.progresso}% da meta` : 'Ativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-foreground font-mono">
                      {ind.valor.toLocaleString('pt-BR')} <span className="text-xs font-normal text-muted-foreground">{ind.unidade}</span>
                    </span>
                    {ind.meta && (
                      <span className="text-[11px] text-muted-foreground">
                        Meta: {ind.meta.toLocaleString('pt-BR')} {ind.unidade}
                      </span>
                    )}
                  </div>
                  {ind.progresso !== undefined && (
                    <Progress value={Math.min(100, ind.progresso)} className="h-1.5" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Gráfico de Proporção de Resíduos */}
      {pieData.length > 0 && (
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Scale className="w-4 h-4 text-recycle-green" />
              Composição dos Resíduos que Geraram Este Impacto
            </CardTitle>
            <CardDescription className="text-xs">
              Distribuição por fração de material reciclado no período
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percentual }) => `${name} (${percentual}%)`}
                    labelLine={true}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [`${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`, 'Volume']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
