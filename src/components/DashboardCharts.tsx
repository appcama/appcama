import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import type { ResiduoTipoData } from "@/hooks/useDashboardData";

interface DashboardChartsProps {
  residuosPorTipo: ResiduoTipoData[];
}

const COLORS = [
  'hsl(var(--recycle-green))',
  'hsl(var(--eco-blue))',
  'hsl(var(--eco-orange))',
  'hsl(var(--earth-brown))',
  'hsl(var(--progress-green))',
  'hsl(var(--stats-gray))',
];

export function DashboardCharts({ residuosPorTipo }: DashboardChartsProps) {
  // Prepare data for pie chart (percentage distribution)
  const totalQuantidade = residuosPorTipo.reduce((sum, item) => sum + item.total_quantidade, 0);
  const pieData = residuosPorTipo.map((item, index) => ({
    name: item.des_tipo_residuo,
    value: item.total_quantidade,
    percentage: totalQuantidade > 0 ? ((item.total_quantidade / totalQuantidade) * 100).toFixed(1) : 0,
    fill: COLORS[index % COLORS.length],
  }));

  // Prepare data for bar chart (financial totals)
  const barData = residuosPorTipo
    .sort((a, b) => b.total_valor - a.total_valor)
    .map((item, index) => ({
      name: item.des_tipo_residuo,
      valor: item.total_valor,
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
                : `${entry.name}: ${entry.value.toFixed(2)} toneladas (${entry.payload.percentage}%)`
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

  if (residuosPorTipo.length === 0) {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart - Distribution by Waste Type */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo de Resíduo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
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
                height={36}
                formatter={(value) => <span className="text-sm">{value}</span>}
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