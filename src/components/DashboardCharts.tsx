import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area } from "recharts";
import type { ResiduoTipoData } from "@/hooks/useDashboardData";

interface DashboardChartsProps {
  residuosPorTipo: ResiduoTipoData[] | Array<{
    nome: string;
    quantidade: number;
    valor: number;
    percentual: number;
  }>;
  chartType?: 'default' | 'financeiro' | 'crescimento' | 'produtividade';
  data?: any; // Para dados adicionais dos relatórios gerenciais
}

const COLORS = [
  'hsl(var(--recycle-green))',
  'hsl(var(--eco-blue))',
  'hsl(var(--eco-orange))',
  'hsl(var(--earth-brown))',
  'hsl(var(--progress-green))',
  'hsl(var(--stats-gray))',
];

export function DashboardCharts({ residuosPorTipo, chartType = 'default', data }: DashboardChartsProps) {
  // Normalizar dados para formato consistente
  const normalizeData = (data: any[]) => {
    return data.map(item => ({
      name: item.nome || item.des_tipo_residuo,
      value: item.quantidade || item.total_quantidade,
      valor: item.valor || item.total_valor,
      percentage: item.percentual || (item.total_quantidade ? ((item.total_quantidade / data.reduce((sum, i) => sum + (i.total_quantidade || i.quantidade), 0)) * 100).toFixed(1) : 0)
    }));
  };

  const chartData = normalizeData(residuosPorTipo || []);
  // Prepare data for pie chart (percentage distribution)
  const totalQuantidade = chartData.reduce((sum, item) => sum + item.value, 0);
  const pieData = chartData.map((item, index) => ({
    name: item.name,
    value: item.value,
    percentage: totalQuantidade > 0 ? ((item.value / totalQuantidade) * 100).toFixed(1) : 0,
    fill: COLORS[index % COLORS.length],
  }));

  // Prepare data for bar chart (financial totals)
  const barData = chartData
    .sort((a, b) => (b.valor || 0) - (a.valor || 0))
    .map((item, index) => ({
      name: item.name,
      valor: item.valor || 0,
      fill: COLORS[index % COLORS.length],
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'valor' 
                ? `Valor: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : `${entry.name}: ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} toneladas (${entry.payload.percentage}%)`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null; // Hide labels for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${percentage}%`}
      </text>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo de Resíduo</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Totais Financeiros por Tipo</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderizar gráficos específicos por tipo de relatório
  if (chartType === 'crescimento' && data?.metricas?.crescimento) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução do Crescimento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data.metricas.crescimento}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--eco-blue))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--recycle-green))" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" className="stroke-muted/30" />
                <XAxis dataKey="mes" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="coletas" 
                  stroke="hsl(var(--recycle-green))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--recycle-green))", strokeWidth: 2, r: 4 }}
                  name="Coletas"
                />
                <Line 
                  type="monotone" 
                  dataKey="residuos" 
                  stroke="hsl(var(--eco-blue))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--eco-blue))", strokeWidth: 2, r: 4 }}
                  name="Resíduos (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (chartType === 'financeiro' && data?.metricas?.receitas) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução da Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data.metricas.receitas}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--eco-orange))" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="hsl(var(--eco-orange))" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" className="stroke-muted/30" />
                <XAxis dataKey="periodo" className="text-xs fill-muted-foreground" />
                <YAxis 
                  tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                  className="text-xs fill-muted-foreground" 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="hsl(var(--eco-orange))" 
                  strokeWidth={2}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gráficos padrão para outros tipos de relatório
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart - Distribution by Weight */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo de Resíduo * Peso</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={60}
                formatter={(value, entry) => (
                  <span className="text-sm" style={{ color: entry.color }}>
                    {value}
                  </span>
                )}
                wrapperStyle={{
                  paddingTop: '20px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar Chart - Financial Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Totais Financeiros por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={barData}
              margin={{
                top: 20,
                right: 40,
                left: 20,
                bottom: 60,
              }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--recycle-green))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--eco-blue))" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="2 2" 
                className="stroke-muted/30" 
                vertical={false}
              />
              <XAxis 
                type="category" 
                dataKey="name" 
                className="text-xs fill-muted-foreground"
                axisLine={false}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                type="number" 
                tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                className="text-xs fill-muted-foreground"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor Total']}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
              />
              <Bar 
                 dataKey="valor" 
                 fill="url(#barGradient)"
                 radius={[6, 6, 0, 0]}
                 stroke="hsl(var(--border))"
                 strokeWidth={0.5}
               />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}