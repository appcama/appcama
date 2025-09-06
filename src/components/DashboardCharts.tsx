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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="horizontal"
              data={barData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                type="number" 
                tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                className="text-xs"
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                className="text-xs"
                interval={0}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
              />
              <Bar dataKey="valor" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}