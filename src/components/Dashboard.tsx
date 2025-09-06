import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Droplet,
  Globe,
  Leaf,
  Package,
  Recycle,
  Zap,
} from "lucide-react";
import { useDashboardData, type DashboardFilters } from "@/hooks/useDashboardData";
import { DashboardFiltersComponent } from "@/components/DashboardFilters";
import { DashboardCharts } from "@/components/DashboardCharts";

// Environmental indicators configuration with icons
const getIndicatorIcon = (nomIndicador: string) => {
  const name = nomIndicador.toLowerCase();
  if (name.includes('árvore') || name.includes('floresta')) return Leaf;
  if (name.includes('água') || name.includes('hídric')) return Droplet;
  if (name.includes('energia') || name.includes('elétric')) return Zap;
  if (name.includes('co2') || name.includes('carbono') || name.includes('gee')) return Globe;
  if (name.includes('aterro') || name.includes('espaço')) return Package;
  return Recycle; // Default icon
};

const getIndicatorColor = (nomIndicador: string) => {
  const name = nomIndicador.toLowerCase();
  if (name.includes('árvore') || name.includes('floresta')) return "bg-recycle-green-light text-recycle-green";
  if (name.includes('água') || name.includes('hídric')) return "bg-blue-100 text-eco-blue";
  if (name.includes('energia') || name.includes('elétric')) return "bg-yellow-100 text-eco-orange";
  if (name.includes('co2') || name.includes('carbono') || name.includes('gee')) return "bg-green-100 text-earth-brown";
  if (name.includes('aterro') || name.includes('espaço')) return "bg-gray-100 text-stats-gray";
  return "bg-recycle-green-light text-recycle-green"; // Default color
};

export function Dashboard() {
  // Initialize filters with current year
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState<DashboardFilters>({
    dataInicial: `${currentYear}-01-01`,
    dataFinal: `${currentYear}-12-31`,
  });

  const { data, isLoading, error } = useDashboardData(filters);

  const formatNumber = (value: number, decimals = 1) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard ReciclaE</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de controle de reciclagem
        </p>
      </div>

      {/* Filters */}
      <DashboardFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* Total Collected Waste Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Recycle className="h-5 w-5 text-recycle-green" />
            <CardTitle>Total de Resíduos Coletados</CardTitle>
          </div>
          <CardDescription>
            Período: {new Date(filters.dataInicial).toLocaleDateString('pt-BR')} - {new Date(filters.dataFinal).toLocaleDateString('pt-BR')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16 w-32" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold text-recycle-green">
                {formatNumber(data?.totalResiduos || 0)}
              </span>
              <span className="text-lg text-muted-foreground">toneladas</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environmental Indicators */}
      {data?.indicadores && data.indicadores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Indicadores de Impacto Ambiental</CardTitle>
            <CardDescription>
              Benefícios ambientais calculados com base nos resíduos coletados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.indicadores.map((indicador) => {
                const Icon = getIndicatorIcon(indicador.nom_indicador);
                const colorClass = getIndicatorColor(indicador.nom_indicador);
                
                return (
                  <div key={indicador.id_indicador} className={`p-4 rounded-lg ${colorClass}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {formatNumber(indicador.total, 1)}
                      </p>
                      <p className="text-sm font-medium">
                        {indicador.nom_indicador}
                      </p>
                      <p className="text-xs opacity-75">
                        {indicador.des_unidade_medida}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waste Totals by Type */}
      {data?.residuosPorTipo && data.residuosPorTipo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Totais por Tipo de Resíduo</CardTitle>
            <CardDescription>
              Quantidade coletada em toneladas por tipo de material
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Resíduo</TableHead>
                    <TableHead className="text-right">Quantidade (t)</TableHead>
                    <TableHead className="text-right">Valor Total (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.residuosPorTipo
                    .sort((a, b) => b.total_quantidade - a.total_quantidade)
                    .map((residuo) => (
                    <TableRow key={residuo.id_tipo_residuo}>
                      <TableCell className="font-medium">
                        {residuo.des_tipo_residuo}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(residuo.total_quantidade)}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {formatNumber(residuo.total_valor, 2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {data?.residuosPorTipo && (
        <DashboardCharts residuosPorTipo={data.residuosPorTipo} />
      )}

      {/* Empty State */}
      {!isLoading && (!data?.totalResiduos || data.totalResiduos === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Recycle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum dado encontrado
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Não foram encontrados dados de coleta para o período e filtros selecionados. 
              Tente ajustar os filtros ou verificar se existem coletas cadastradas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-destructive mb-2">
              Erro ao carregar dados
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Ocorreu um erro ao carregar os dados do dashboard. Tente recarregar a página.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}