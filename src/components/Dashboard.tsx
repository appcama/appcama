import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  Maximize,
  Minimize,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardData, type DashboardFilters } from "@/hooks/useDashboardData";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { DashboardFiltersComponent } from "@/components/DashboardFilters";
import { DashboardCharts } from "@/components/DashboardCharts";
import { DashboardInfographic } from "@/components/DashboardInfographic";
import { DashboardMap } from "@/components/DashboardMap";
import { FinancialPrivacyProvider, useFinancialPrivacy } from "@/hooks/useFinancialPrivacy";
import { formatFinancialValue } from "@/lib/financial-utils";
import { cn } from "@/lib/utils";

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

// Função utilitária para formatação de porcentagens
const formatPercentage = (percentage: number) => {
  const isPositive = percentage >= 0;
  const color = isPositive ? 'text-green-600' : 'text-red-600';
  const sign = isPositive ? '+' : '';
  
  return {
    text: `${sign}${percentage.toFixed(1)}% este período`,
    className: `text-xs mt-1 ${color}`
  };
};

function DashboardContent() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>({
    dataInicial: new Date().getFullYear() + "-01-01",
    dataFinal: (() => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    })(),
  });

  const { data, isLoading, error } = useDashboardData(filters);
  const { data: statsData, isLoading: statsLoading } = useDashboardStats(filters);
  const { showFinancialValues } = useFinancialPrivacy();

  const formatNumber = (value: number, decimals = 1) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await dashboardRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      toast.error("Não foi possível ativar tela cheia");
    }
  };

  // Detectar saída de tela cheia pelo ESC
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={dashboardRef} className="p-4 sm:p-6 space-y-6 bg-background">
      <div>
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-nowrap">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Reciclômetro e Ecoindicadores do RcyclaÊ</h1>
            <img
              src="/rodapecama.png"
              alt="Marca institucional - Ministério e Governo"
              className="h-16 sm:h-20 md:h-24 w-auto object-contain shrink-0"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-muted-foreground">
          Visão geral do sistema de controle de reciclagem
        </p>
      </div>

      <DashboardFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* KPIs - Collapsible */}
      <Collapsible open={isStatsExpanded} onOpenChange={setIsStatsExpanded}>
        <Card className="mb-6">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-recycle-green" />
                  <CardTitle className="text-lg">Resumo Geral</CardTitle>
                </div>
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  isStatsExpanded && "transform rotate-180"
                )} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total de Entidades */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Entidades</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          {statsLoading ? <Skeleton className="h-8 w-8" /> : (statsData?.totalEntidades || 0)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Cadastradas no sistema</p>
                      <p className={formatPercentage(statsData?.totalEntidadesPercentage || 0).className}>
                        {formatPercentage(statsData?.totalEntidadesPercentage || 0).text}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Card 2: Entidades Coletoras */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Entidades Coletoras</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          {statsLoading ? <Skeleton className="h-8 w-8" /> : (statsData?.entidadesColetoras || 0)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Cooperativas e catadores</p>
                      <p className={formatPercentage(statsData?.entidadesColetorasPercentage || 0).className}>
                        {formatPercentage(statsData?.entidadesColetorasPercentage || 0).text}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Card 3: Eventos de Coleta */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Eventos de Coleta</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          {statsLoading ? <Skeleton className="h-8 w-8" /> : (statsData?.eventosColeta || 0)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Eventos ativos</p>
                      <p className={formatPercentage(statsData?.eventosColetaPercentage || 0).className}>
                        {formatPercentage(statsData?.eventosColetaPercentage || 0).text}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Card 4: Geradores de Resíduo */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Geradores de Resíduo</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          {statsLoading ? <Skeleton className="h-8 w-8" /> : (statsData?.geradoresResiduos || 0)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Empresas e geradores</p>
                      <p className={formatPercentage(statsData?.geradoresResiduosPercentage || 0).className}>
                        {formatPercentage(statsData?.geradoresResiduosPercentage || 0).text}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-brown-100 rounded-full flex items-center justify-center">
                      <Factory className="h-4 w-4 text-brown-600" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Reciclômetro and Totais por Tipo de Resíduo */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Recycle className="h-5 w-5 text-recycle-green" />
                <CardTitle>Reciclômetro</CardTitle>
              </div>
              <CardDescription>
                Período: {(() => {
                  const [yearInicial, monthInicial, dayInicial] = filters.dataInicial.split('-').map(Number);
                  const [yearFinal, monthFinal, dayFinal] = filters.dataFinal.split('-').map(Number);
                  const dataInicialLocal = new Date(yearInicial, monthInicial - 1, dayInicial);
                  const dataFinalLocal = new Date(yearFinal, monthFinal - 1, dayFinal);
                  return `${dataInicialLocal.toLocaleDateString('pt-BR')} - ${dataFinalLocal.toLocaleDateString('pt-BR')}`;
                })()} 
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-16 w-32" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold text-recycle-green">
                    {formatNumber((data?.totalResiduos || 0) * 1000, 2)}
                  </span>
                  <span className="text-lg text-muted-foreground">quilos</span>
                </div>
              )}
            </CardContent>
          </Card>

          {data?.residuosPorTipo && data.residuosPorTipo.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Totais por Tipo de Resíduo</CardTitle>
                <CardDescription>
                  Quantidade coletada em quilos por tipo de material
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo de Resíduo</TableHead>
                        <TableHead className="text-right">Quantidade (kg)</TableHead>
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
                            {formatNumber((residuo.total_quantidade || 0) * 1000, 2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatFinancialValue(residuo.total_valor || 0, showFinancialValues)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Ecoindicadores */}
        <div>
          {data?.indicadores && data.indicadores.length > 0 && (
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Ecoindicadores</CardTitle>
                <CardDescription>
                  Benefícios ambientais calculados com base nos resíduos coletados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>
      </div>

      {data?.residuosPorTipo && (
        <DashboardCharts residuosPorTipo={data.residuosPorTipo} />
      )}

      <DashboardMap 
        startDate={filters.dataInicial}
        endDate={filters.dataFinal}
        entityId={filters.entidadeId}
      />

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

export function Dashboard() {
  return (
    <FinancialPrivacyProvider>
      <DashboardContent />
    </FinancialPrivacyProvider>
  );
}