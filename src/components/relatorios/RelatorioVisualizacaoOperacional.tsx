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
  Legend 
} from "recharts";
import { Package, MapPin, Award, Calendar, Layers } from "lucide-react";
import type { RelatorioData } from "@/hooks/useRelatorioData";

interface RelatorioVisualizacaoOperacionalProps {
  data: RelatorioData;
  reportType: string;
}

export function RelatorioVisualizacaoOperacional({ data, reportType }: RelatorioVisualizacaoOperacionalProps) {
  // Gráfico para Performance dos Pontos
  if (reportType === 'performance-pontos' || reportType === 'pontos-performance') {
    const pontosData = (data.items || []).slice(0, 8).map(p => ({
      name: p.nome.length > 20 ? `${p.nome.substring(0, 20)}...` : p.nome,
      fullNome: p.nome,
      volume: p.quantidade || 0,
      valor: p.valor || 0
    }));

    return (
      <Card className="border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-recycle-green" />
            Volume Coletado por Ponto de Coleta (Top Pontos)
          </CardTitle>
          <CardDescription className="text-xs">
            Eficiência e arrecadação dos principais Pontos de Entrega Voluntária
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pontosData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" interval={0} />
                <YAxis fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`, 'Volume']}
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

  // Gráfico para Ranking de Geradoras
  if (reportType === 'ranking-entidades-geradoras') {
    const geradorasData = (data.items || []).slice(0, 8).map(g => ({
      name: g.nome.length > 20 ? `${g.nome.substring(0, 20)}...` : g.nome,
      fullNome: g.nome,
      volume: g.quantidade || 0
    }));

    return (
      <Card className="border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Award className="w-4 h-4 text-eco-orange" />
            Maiores Geradoras de Resíduos no Período
          </CardTitle>
          <CardDescription className="text-xs">
            Volume gerado pelas principais empresas e condomínios parceiros
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geradorasData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" interval={0} />
                <YAxis fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`, 'Volume Gerado']}
                  labelFormatter={(lbl: any, payload: any) => payload?.[0]?.payload?.fullNome || lbl}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="volume" name="Volume (kg)" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gráfico para Eventos de Coleta
  if (reportType === 'eventos-coleta') {
    const eventosData = (data.items || []).slice(0, 8).map(e => ({
      name: e.nome.length > 20 ? `${e.nome.substring(0, 20)}...` : e.nome,
      fullNome: e.nome,
      volume: e.quantidade || 0,
      valor: e.valor || 0
    }));

    return (
      <Card className="border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-eco-blue" />
            Resultados por Evento e Ação Coletiva
          </CardTitle>
          <CardDescription className="text-xs">
            Volume arrecadado em mutirões e campanhas ambientais
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventosData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" interval={0} />
                <YAxis fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`, 'Volume']}
                  labelFormatter={(lbl: any, payload: any) => payload?.[0]?.payload?.fullNome || lbl}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="volume" name="Volume (kg)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gráfico Padrão: Resíduos por Tipo no Período
  const chartData = (data.residuosPorTipo || []).map(r => ({
    name: r.nome,
    volume: r.quantidade,
    valor: r.valor
  }));

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Layers className="w-4 h-4 text-recycle-green" />
          Distribuição Operacional por Tipo de Resíduo
        </CardTitle>
        <CardDescription className="text-xs">
          Panorama dos volumes manuseados nas coletas do período selecionado
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" interval={0} />
              <YAxis fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`, 'Volume']}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="volume" name="Volume Coletado (kg)" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
