import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Leaf,
  Droplets,
  Wind,
  Battery,
  Trees,
  Recycle,
  Zap,
  Maximize,
  Minimize,
} from "lucide-react";
import { toast } from "sonner";
import { useMyDashboardData, type MyDashboardFilters } from "@/hooks/useMyDashboardData";
import { MeusNumeroFilters } from "@/components/MeusNumeroFilters";
import { DashboardCharts } from "@/components/DashboardCharts";
import { DashboardMap } from "@/components/DashboardMap";
import { DashboardInfographic } from "@/components/DashboardInfographic";
import { FinancialPrivacyProvider } from "@/hooks/useFinancialPrivacy";
import { useAuth } from "@/hooks/useAuth";

// Helper function to get appropriate icon for each indicator
const getIndicatorIcon = (nomIndicador: string) => {
  const nome = nomIndicador.toLowerCase();
  if (nome.includes("água") || nome.includes("agua")) return Droplets;
  if (nome.includes("energia")) return Zap;
  if (nome.includes("co2") || nome.includes("carbono")) return Wind;
  if (nome.includes("petróleo") || nome.includes("petroleo")) return Battery;
  if (nome.includes("árvore") || nome.includes("arvore")) return Trees;
  return Leaf;
};

// Helper function to get color classes for each indicator
const getIndicatorColor = (nomIndicador: string) => {
  const nome = nomIndicador.toLowerCase();
  if (nome.includes("água") || nome.includes("agua")) 
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  if (nome.includes("energia")) 
    return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
  if (nome.includes("co2") || nome.includes("carbono")) 
    return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
  if (nome.includes("petróleo") || nome.includes("petroleo")) 
    return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
  if (nome.includes("árvore") || nome.includes("arvore")) 
    return "bg-green-500/10 text-green-600 dark:text-green-400";
  return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
};


function MeusNumerosContent() {
  const { user } = useAuth();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filters, setFilters] = useState<MyDashboardFilters>({
    dataInicial: new Date().getFullYear() + "-01-01",
    dataFinal: (() => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    })(),
  });

  const { data, isLoading, error } = useMyDashboardData(user?.entityId || 0, filters);

  const handleFiltersChange = (newFilters: MyDashboardFilters) => {
    setFilters({
      ...filters,
      ...newFilters,
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
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Meus Números</h1>
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
          Visão geral dos números da sua entidade
        </p>
      </div>

      <MeusNumeroFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Ecoindicators Section */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              Erro ao carregar ecoindicadores. Por favor, tente novamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Ecoindicadores</h2>
            {data?.indicadores && data.indicadores.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {data.indicadores.map((indicador) => {
                  const Icon = getIndicatorIcon(indicador.nom_indicador);
                  const colorClass = getIndicatorColor(indicador.nom_indicador);
                  
                  return (
                    <Card key={indicador.id_indicador} className="overflow-hidden">
                      <CardHeader className={`pb-3 ${colorClass}`}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <CardTitle className="text-sm font-medium">
                            {indicador.nom_indicador}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold">
                            {indicador.total.toLocaleString("pt-BR", {
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {indicador.des_unidade_medida}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    Nenhum ecoindicador disponível para o período selecionado.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Recyclometer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Recycle className="h-5 w-5" />
            Reciclômetro
          </CardTitle>
          <CardDescription>Total de resíduos coletados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">
                {data?.totalResiduos?.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0,00"}
                <span className="text-2xl ml-2">toneladas</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Coletados no período selecionado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waste by Type Table */}
      <Card>
        <CardHeader>
          <CardTitle>Totais por Tipo de Resíduo</CardTitle>
          <CardDescription>Quantidade e valor arrecadado por tipo</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : data?.residuosPorTipo && data.residuosPorTipo.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Resíduo</TableHead>
                    <TableHead className="text-right">Quantidade (ton)</TableHead>
                    <TableHead className="text-right">Valor Total (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.residuosPorTipo.map((residuo) => (
                    <TableRow key={residuo.id_tipo_residuo}>
                      <TableCell className="font-medium">
                        {residuo.des_tipo_residuo}
                      </TableCell>
                      <TableCell className="text-right">
                        {residuo.total_quantidade.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {residuo.total_valor.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {data.residuosPorTipo
                        .reduce((sum, r) => sum + r.total_quantidade, 0)
                        .toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {data.residuosPorTipo
                        .reduce((sum, r) => sum + r.total_valor, 0)
                        .toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum resíduo registrado para o período selecionado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <DashboardCharts residuosPorTipo={data?.residuosPorTipo || []} />

      {/* Map */}
      <DashboardMap 
        startDate={filters.dataInicial}
        endDate={filters.dataFinal}
        entityId={user?.entityId}
      />

      {/* Infographic */}
      <DashboardInfographic filters={filters} entityId={user?.entityId} />
    </div>
  );
}

export function MeusNumeros() {
  return (
    <FinancialPrivacyProvider>
      <MeusNumerosContent />
    </FinancialPrivacyProvider>
  );
}
