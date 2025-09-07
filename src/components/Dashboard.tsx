import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2,
  Calendar,
  Droplet,
  Factory,
  Globe,
  Leaf,
  Package,
  Recycle,
  Users,
  Zap,
} from "lucide-react";
import { useDashboardData, type DashboardFilters } from "@/hooks/useDashboardData";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { DashboardFiltersComponent } from "@/components/DashboardFilters";
import { DashboardCharts } from "@/components/DashboardCharts";
import { DashboardInfographic } from "@/components/DashboardInfographic";

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
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();

  const formatNumber = (value: number, decimals = 1) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard ReciclaE</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de controle de reciclagem
        </p>
      </div>

      <DashboardFiltersComponent filters={filters} onFiltersChange={setFilters} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Entidades</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-8 w-8" /> : (statsData?.totalEntidades || 0)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Cadastradas no sistema</p>
                <p className="text-xs text-green-600 mt-1">+8.2% este mês</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Building2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entidades Coletoras</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-8 w-8" /> : (statsData?.entidadesColetoras || 0)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Cooperativas e catadores</p>
                <p className="text-xs text-green-600 mt-1">+5.1% este mês</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Eventos de Coleta</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-8 w-8" /> : (statsData?.eventosColeta || 0)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Eventos ativos</p>
                <p className="text-xs text-green-600 mt-1">+13.3% este mês</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Geradores de Resíduo</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-8 w-8" /> : (statsData?.geradoresResiduos || 0)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Empresas e geradores</p>
                <p className="text-xs text-green-600 mt-1">+3.8% este mês</p>
              </div>
              <div className="h-8 w-8 bg-brown-100 rounded-full flex items-center justify-center">
                <Factory className="h-4 w-4 text-brown-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                {(data?.totalResiduos || 0).toFixed(3)}
              </span>
              <span className="text-lg text-muted-foreground">toneladas</span>
            </div>
          )}
        </CardContent>
      </Card>

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
                        {(residuo.total_quantidade || 0).toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {(residuo.total_valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {data?.residuosPorTipo && (
        <DashboardCharts residuosPorTipo={data.residuosPorTipo} />
      )}

      <DashboardInfographic filters={filters} />

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