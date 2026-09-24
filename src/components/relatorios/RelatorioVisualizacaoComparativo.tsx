import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from "recharts";
import { TrendingUp, BarChart3, Calendar, Layers, Award } from "lucide-react";
import type { RelatorioData } from "@/hooks/useRelatorioData";

interface RelatorioVisualizacaoComparativoProps {
  data: RelatorioData;
  reportType: string;
}

export function RelatorioVisualizacaoComparativo({ data, reportType }: RelatorioVisualizacaoComparativoProps) {
  // Gráfico Temporal (Evolução Mês a Mês)
  if (reportType === 'comparativo-temporal' || reportType === 'crescimento' || reportType === 'analise-crescimento') {
    const crescimentoData = data.metricas?.crescimento || [];

    return (
      <Card className="border-border/80">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-recycle-green" />
                Evolução Temporal das Operações
              </CardTitle>
              <CardDescription className="text-xs">
                Acompanhamento mensal de volume coletado e quantidade de operações
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs bg-recycle-green/10 text-recycle-green-dark border-recycle-green/20">
              Série Histórica
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={crescimentoData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorResiduos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorColetas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mes" fontSize={11} stroke="currentColor" className="text-muted-foreground" />
                <YAxis yAxisId="left" fontSize={11} stroke="#22c55e" />
                <YAxis yAxisId="right" orientation="right" fontSize={11} stroke="#0ea5e9" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [
                    name === 'Volume (kg)' ? `${Number(val).toLocaleString('pt-BR')} kg` : val,
                    name
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="residuos" 
                  name="Volume (kg)" 
                  stroke="#22c55e" 
                  fillOpacity={1} 
                  fill="url(#colorResiduos)" 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="coletas" 
                  name="Coletas" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  dot={{ r: 4 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gráfico de Benchmark de Entidades
  if (reportType === 'benchmark-entidades') {
    const benchmarkData = (data.metricas?.benchmark || []).slice(0, 10).map(b => ({
      name: b.nome.length > 20 ? `${b.nome.substring(0, 20)}...` : b.nome,
      fullNome: b.nome,
      volume: b.volume,
      coletas: b.coletas,
      media: b.mediaPorColeta
    }));

    return (
      <Card className="border-border/80">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Award className="w-4 h-4 text-eco-orange" />
                Benchmark de Entidades Geradoras
              </CardTitle>
              <CardDescription className="text-xs">
                Comparativo de volume total gerado (kg) entre as principais entidades
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              Top 10 Geradoras
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarkData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={10} angle={-25} textAnchor="end" interval={0} />
                <YAxis fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [
                    name === 'Volume (kg)' ? `${Number(val).toLocaleString('pt-BR')} kg` : val,
                    name
                  ]}
                  labelFormatter={(lbl: any, payload: any) => payload?.[0]?.payload?.fullNome || lbl}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="volume" name="Volume (kg)" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gráfico de Sazonalidade (Dias da Semana)
  if (reportType === 'sazonalidade') {
    const sazonalidadeData = data.metricas?.sazonalidade?.diasSemana || [];

    return (
      <Card className="border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-eco-blue" />
            Padrão de Coleta por Dia da Semana
          </CardTitle>
          <CardDescription className="text-xs">
            Identificação de dias com maior fluxo e volume de resíduos coletados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sazonalidadeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="dia" fontSize={11} />
                <YAxis yAxisId="left" fontSize={11} stroke="#0ea5e9" />
                <YAxis yAxisId="right" orientation="right" fontSize={11} stroke="#f97316" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [
                    name === 'Volume (kg)' ? `${Number(val).toLocaleString('pt-BR')} kg` : `${val} coletas`,
                    name
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey="volume" name="Volume (kg)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="coletas" name="Nº Coletas" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gráfico por Tipo de Resíduo
  const tipoResiduoData = (data.residuosPorTipo || []).map(t => ({
    name: t.nome,
    volume: t.quantidade,
    valor: t.valor,
    precoMedio: t.quantidade > 0 ? t.valor / t.quantidade : 0
  }));

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Layers className="w-4 h-4 text-recycle-green" />
          Volume e Cotação por Tipo de Resíduo
        </CardTitle>
        <CardDescription className="text-xs">
          Comparativo de volume coletado e receita obtida por categoria de material
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tipoResiduoData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" interval={0} />
              <YAxis yAxisId="left" fontSize={11} stroke="#22c55e" />
              <YAxis yAxisId="right" orientation="right" fontSize={11} stroke="#f97316" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any, name: any) => [
                  name === 'Volume (kg)' ? `${Number(val).toLocaleString('pt-BR')} kg` : `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  name
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar yAxisId="left" dataKey="volume" name="Volume (kg)" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="valor" name="Receita (R$)" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
