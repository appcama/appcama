import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Leaf, Droplets, Wind, Battery, Trees, Recycle, Zap, Maximize, Minimize, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useMyDashboardData, type MyDashboardFilters } from "@/hooks/useMyDashboardData";
import { MeusNumeroFilters } from "@/components/MeusNumeroFilters";
import { DashboardCharts } from "@/components/DashboardCharts";
import { DashboardMap } from "@/components/DashboardMap";
import { DashboardInfographic } from "@/components/DashboardInfographic";
import { FinancialPrivacyProvider, useFinancialPrivacy } from "@/hooks/useFinancialPrivacy";
import { formatFinancialValue } from "@/lib/financial-utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserEntity } from "@/hooks/useUserEntity";

// Configuração das seções visíveis
interface VisibleSections {
  filtros: boolean;
  reciclometro: boolean;
  ecoindicadores: boolean;
  graficos: boolean;
  mapa: boolean;
  infografico: boolean;
}

const SECTIONS_STORAGE_KEY = "meus-numeros-visible-sections";

const defaultVisibleSections: VisibleSections = {
  filtros: true,
  reciclometro: true,
  ecoindicadores: true,
  graficos: true,
  mapa: true,
  infografico: true,
};

const sectionLabels: Record<keyof VisibleSections, string> = {
  filtros: "Filtros",
  reciclometro: "Reciclômetro",
  ecoindicadores: "Ecoindicadores",
  graficos: "Gráficos",
  mapa: "Mapa",
  infografico: "Infográfico de Ecoindicadores",
};

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
  if (nome.includes("água") || nome.includes("agua")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  if (nome.includes("energia")) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
  if (nome.includes("co2") || nome.includes("carbono")) return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
  if (nome.includes("petróleo") || nome.includes("petroleo"))
    return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
  if (nome.includes("árvore") || nome.includes("arvore")) return "bg-green-500/10 text-green-600 dark:text-green-400";
  return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
};

function MeusNumerosContent() {
  const { user } = useAuth();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { showFinancialValues } = useFinancialPrivacy();
  const { data: userEntity } = useUserEntity();
  const [eventLogoUrl, setEventLogoUrl] = useState<string | null>(null);
  
  // Estado para visibilidade das seções - carrega do localStorage
  const [visibleSections, setVisibleSections] = useState<VisibleSections>(() => {
    try {
      const saved = localStorage.getItem(SECTIONS_STORAGE_KEY);
      if (saved) {
        return { ...defaultVisibleSections, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Erro ao carregar preferências de seções:", e);
    }
    return defaultVisibleSections;
  });
  
  const [filters, setFilters] = useState<MyDashboardFilters>({
    dataInicial: new Date().getFullYear() + "-01-01",
    dataFinal: (() => {
      const today = new Date();
      return today.toISOString().split("T")[0];
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

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Salvar preferências de seções no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(visibleSections));
    } catch (e) {
      console.error("Erro ao salvar preferências de seções:", e);
    }
  }, [visibleSections]);

  const toggleSection = (section: keyof VisibleSections) => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div ref={dashboardRef} className={`p-4 sm:p-6 space-y-6 bg-background ${isFullscreen ? "h-screen overflow-y-auto" : ""}`}>
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
          <div className="flex items-center gap-2">
            {userEntity?.des_logo_url && (
              <img
                src={userEntity.des_logo_url}
                alt={userEntity.nom_entidade}
                className="h-16 sm:h-20 md:h-24 w-auto object-contain shrink-0"
              />
            )}
            
            {/* Botão de Configurar Visualização */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  title="Configurar visualização"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-4">
                  <div className="font-medium text-sm">Seções Visíveis</div>
                  <div className="space-y-3">
                    {(Object.keys(sectionLabels) as Array<keyof VisibleSections>).map((section) => (
                      <div key={section} className="flex items-center space-x-2">
                        <Checkbox
                          id={`meus-numeros-${section}`}
                          checked={visibleSections[section]}
                          onCheckedChange={() => toggleSection(section)}
                        />
                        <Label htmlFor={`meus-numeros-${section}`} className="text-sm cursor-pointer">
                          {sectionLabels[section]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">Visão geral dos números da sua entidade</p>
      </div>

      {/* Event Logo Banner */}
      {eventLogoUrl && (
        <div className="flex justify-center mb-6">
          <img
            src={eventLogoUrl}
            alt="Logo do evento"
            className="max-h-24 w-auto object-contain rounded-lg shadow-sm"
          />
        </div>
      )}

      {visibleSections.filtros && (
        <MeusNumeroFilters filters={filters} onFiltersChange={handleFiltersChange} onEventLogoChange={setEventLogoUrl} />
      )}

      {/* Reciclômetro e Ecoindicadores */}
      {(visibleSections.reciclometro || visibleSections.ecoindicadores) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Reciclômetro and Totais por Tipo de Resíduo */}
          {visibleSections.reciclometro && (
            <div className="space-y-6">
              {/* Recyclometer */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Recycle className="h-5 w-5 text-primary" />
                    Reciclômetro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    {isLoading ? (
                      <Skeleton className="h-20" />
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-primary">
                          {data?.totalResiduos?.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0,00"}
                        </div>
                        <p className="text-sm text-muted-foreground">Kg coletados</p>
                      </>
                    )}
                  </div>
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
                            <TableHead className="text-right">Quantidade (kg)</TableHead>
                            <TableHead className="text-right">Valor Total (R$)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.residuosPorTipo.map((residuo) => (
                            <TableRow key={residuo.id_tipo_residuo}>
                              <TableCell className="font-medium">{residuo.des_tipo_residuo}</TableCell>
                              <TableCell className="text-right">
                                {residuo.total_quantidade.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatFinancialValue(residuo.total_valor, showFinancialValues)}
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
                              {formatFinancialValue(
                                data.residuosPorTipo.reduce((sum, r) => sum + r.total_valor, 0),
                                showFinancialValues,
                              )}
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
            </div>
          )}

          {/* Right column: Ecoindicadores */}
          {visibleSections.ecoindicadores && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    Ecoindicadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-24" />
                      ))}
                    </div>
                  ) : error ? (
                    <p className="text-destructive text-center">
                      Erro ao carregar ecoindicadores. Por favor, tente novamente.
                    </p>
                  ) : data?.indicadores && data.indicadores.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {data.indicadores.map((indicador) => {
                        const IconComponent = getIndicatorIcon(indicador.nom_indicador);
                        const colorClass = getIndicatorColor(indicador.nom_indicador);

                        return (
                          <Card key={indicador.id_indicador} className={`${colorClass} border-2`}>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-muted-foreground">{indicador.nom_indicador}</p>
                                  <p className="text-2xl font-bold">
                                    {indicador.total.toLocaleString("pt-BR", {
                                      maximumFractionDigits: 2,
                                    })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{indicador.des_unidade_medida}</p>
                                </div>
                                <IconComponent className="h-8 w-8 text-muted-foreground" />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum ecoindicador disponível para o período selecionado.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      {visibleSections.graficos && (
        <DashboardCharts residuosPorTipo={data?.residuosPorTipo || []} />
      )}

      {/* Map */}
      {visibleSections.mapa && (
        <DashboardMap startDate={filters.dataInicial} endDate={filters.dataFinal} entityId={user?.entityId} />
      )}

      {/* Infographic */}
      {visibleSections.infografico && (
        <DashboardInfographic filters={filters} entityId={user?.entityId} />
      )}
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
