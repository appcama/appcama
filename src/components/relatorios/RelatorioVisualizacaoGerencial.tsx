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
  Line 
} from "recharts";
import { DollarSign, Zap, AlertTriangle, TrendingUp, BarChart2 } from "lucide-react";
import type { RelatorioData } from "@/hooks/useRelatorioData";

interface RelatorioVisualizacaoGerencialProps {
  data: RelatorioData;
  reportType: string;
}

export function RelatorioVisualizacaoGerencial({ data, reportType }: RelatorioVisualizacaoGerencialProps) {
  // Análise de Faturamento
  if (reportType === 'faturamento' || reportType === 'analise-faturamento') {
    const faturamentoPorTipo = (data.residuosPorTipo || []).map(t => ({
      name: t.nome,
      valor: t.valor,
      quantidade: t.quantidade,
      precoMedio: t.quantidade > 0 ? t.valor / t.quantidade : 0
    }));

    return (
      <Card className="border-border/80">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-recycle-green" />
                Receita Gerada por Tipo de Resíduo
              </CardTitle>
              <CardDescription className="text-xs">
                Distribuição financeira e valor comercial por fração de material
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              Financeiro
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faturamentoPorTipo} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" interval={0} />
                <YAxis fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="valor" name="Receita (R$)" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Produtividade
  if (reportType === 'produtividade') {
    const produtividadeData = (data.items || []).slice(0, 8).map(item => ({
      name: item.nome.length > 18 ? `${item.nome.substring(0, 18)}...` : item.nome,
      fullNome: item.nome,
      residuos: item.quantidade || 0,
      valor: item.valor || 0
    }));

    return (
      <Card className="border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-eco-orange" />
            Eficiência e Volume por Entidade
          </CardTitle>
          <CardDescription className="text-xs">
            Volume total coletado e indicador de produtividade
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={produtividadeData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} angle={-20} textAnchor="end" interval={0} />
                <YAxis fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`, 'Volume']}
                  labelFormatter={(lbl: any, payload: any) => payload?.[0]?.payload?.fullNome || lbl}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="residuos" name="Volume Total (kg)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rejeitos Coletados
  if (reportType === 'rejeitos-coletados') {
    const rejeitosData = (data.items || []).slice(0, 10).map((r, idx) => ({
      name: r.entidade || `Item ${idx + 1}`,
      rejeito: r.quantidade || 0
    }));

    return (
      <Card className="border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Índice de Rejeitos por Entidade Geradora
          </CardTitle>
          <CardDescription className="text-xs">
            Volume de materiais não aproveitáveis identificados na triagem
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rejeitosData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} angle={-20} textAnchor="end" interval={0} />
                <YAxis fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString('pt-BR')} kg`, 'Rejeito']}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="rejeito" name="Rejeito (kg)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dashboard Executivo (Visão consolidada)
  const topEntidades = (data.items || []).slice(0, 5).map(item => ({
    name: item.nome.length > 20 ? `${item.nome.substring(0, 20)}...` : item.nome,
    fullNome: item.nome,
    residuos: item.quantidade || 0,
    valor: item.valor || 0
  }));

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-recycle-green" />
          Top Entidades em Volume e Faturamento
        </CardTitle>
        <CardDescription className="text-xs">
          Panorama executivo dos principais parceiros no período
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topEntidades} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" interval={0} />
              <YAxis yAxisId="left" fontSize={11} stroke="#22c55e" />
              <YAxis yAxisId="right" orientation="right" fontSize={11} stroke="#0ea5e9" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any, name: any) => [
                  name === 'Volume (kg)' ? `${Number(val).toLocaleString('pt-BR')} kg` : `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  name
                ]}
                labelFormatter={(lbl: any, payload: any) => payload?.[0]?.payload?.fullNome || lbl}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar yAxisId="left" dataKey="residuos" name="Volume (kg)" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="valor" name="Valor (R$)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
