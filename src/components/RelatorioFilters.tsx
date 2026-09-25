import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, X, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface RelatorioFiltersType {
  dataInicial?: Date;
  dataFinal?: Date;
  entidade?: string;
  tipoEntidade?: string;
  tipoResiduo?: string;
  pontoColeta?: string;
  evento?: string;
  municipio?: string;
  statusColetas?: string;
  statusEntidades?: string;
}

interface RelatorioFiltersProps {
  filters: RelatorioFiltersType;
  onFiltersChange: (filters: RelatorioFiltersType) => void;
  onReset: () => void;
}

export function RelatorioFilters({ filters, onFiltersChange, onReset }: RelatorioFiltersProps) {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openInicial, setOpenInicial] = useState(false);
  const [openFinal, setOpenFinal] = useState(false);

  const [entidades, setEntidades] = useState<Array<{ id_entidade: number; nom_entidade: string }>>([]);
  const [tiposResiduo, setTiposResiduo] = useState<Array<{ id_tipo_residuo: number; des_tipo_residuo: string }>>([]);

  useEffect(() => {
    if (isAdmin) {
      supabase
        .from('entidade')
        .select('id_entidade, nom_entidade')
        .eq('des_status', 'A')
        .order('nom_entidade')
        .then(({ data, error }) => {
          if (!error && data) {
            setEntidades(data);
          }
        });
    }

    supabase
      .from('tipo_residuo')
      .select('id_tipo_residuo, des_tipo_residuo')
      .order('des_tipo_residuo')
      .then(({ data, error }) => {
        if (!error && data) {
          setTiposResiduo(data);
        }
      });
  }, [isAdmin]);

  const updateFilter = (key: keyof RelatorioFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const removeFilter = (key: keyof RelatorioFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const quickDateRanges = [
    { label: "7D", days: 7, title: "Últimos 7 dias" },
    { label: "30D", days: 30, title: "Últimos 30 dias" },
    { label: "90D", days: 90, title: "Últimos 90 dias" },
    { label: "Este Ano", days: 365, title: "Último ano" },
    { label: "Tudo", days: -1, title: "Todo o histórico disponível" }
  ];

  const setQuickDateRange = (days: number) => {
    if (days === -1) {
      onFiltersChange({
        ...filters,
        dataInicial: undefined,
        dataFinal: undefined
      });
      return;
    }
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    
    onFiltersChange({
      ...filters,
      dataInicial: start,
      dataFinal: end
    });
  };

  // Identificar se período bate com um range rápido
  const getActiveQuickRange = () => {
    if (!filters.dataInicial && !filters.dataFinal) return -1;
    if (!filters.dataInicial || !filters.dataFinal) return null;
    const diffDays = Math.round(
      Math.abs(filters.dataFinal.getTime() - filters.dataInicial.getTime()) / (1000 * 60 * 60 * 24)
    );
    return quickDateRanges.find(r => r.days !== -1 && Math.abs(r.days - diffDays) <= 1)?.days ?? null;
  };

  const activeQuick = getActiveQuickRange();
  const hasCustomFilters = !!(
    (filters.entidade && filters.entidade !== 'all') ||
    (filters.tipoResiduo && filters.tipoResiduo !== 'all') ||
    (filters.statusColetas && filters.statusColetas !== 'A')
  );

  return (
    <Card className="border border-border/80 shadow-sm bg-card/60 backdrop-blur-sm">
      <CardContent className="p-4 space-y-3">
        {/* Barra Principal Horizontal */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Lado Esquerdo: Período e Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
              <Filter className="w-3.5 h-3.5 text-recycle-green" />
              <span>PERÍODO</span>
            </div>

            {/* Chips Rápidos */}
            <div className="inline-flex rounded-lg border border-border/70 p-0.5 bg-muted/40">
              {quickDateRanges.map(range => (
                <button
                  key={range.days}
                  type="button"
                  title={range.title}
                  onClick={() => setQuickDateRange(range.days)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                    activeQuick === range.days
                      ? "bg-recycle-green text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Seletores de Data Inicial e Final */}
            <div className="flex items-center gap-1.5">
              <Popover open={openInicial} onOpenChange={setOpenInicial}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 text-xs font-normal border-border/70 px-2.5",
                      !filters.dataInicial && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-recycle-green" />
                    {filters.dataInicial ? format(filters.dataInicial, "dd/MM/yyyy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataInicial}
                    onSelect={(date) => {
                      if (date) {
                        const d = new Date(date);
                        d.setHours(0, 0, 0, 0);
                        updateFilter('dataInicial', d);
                      }
                      setOpenInicial(false);
                    }}
                    locale={ptBR}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(23, 59, 59, 999);
                      if (date > today) return true;
                      if (filters.dataFinal) {
                        const end = new Date(filters.dataFinal);
                        end.setHours(23, 59, 59, 999);
                        return date > end;
                      }
                      return false;
                    }}
                  />
                </PopoverContent>
              </Popover>

              <span className="text-xs text-muted-foreground">até</span>

              <Popover open={openFinal} onOpenChange={setOpenFinal}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 text-xs font-normal border-border/70 px-2.5",
                      !filters.dataFinal && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-recycle-green" />
                    {filters.dataFinal ? format(filters.dataFinal, "dd/MM/yyyy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataFinal}
                    onSelect={(date) => {
                      if (date) {
                        const d = new Date(date);
                        d.setHours(23, 59, 59, 999);
                        updateFilter('dataFinal', d);
                      }
                      setOpenFinal(false);
                    }}
                    locale={ptBR}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(23, 59, 59, 999);
                      if (date > today) return true;
                      if (filters.dataInicial) {
                        const start = new Date(filters.dataInicial);
                        start.setHours(0, 0, 0, 0);
                        return date < start;
                      }
                      return false;
                    }}
                  />
                </PopoverContent>
              </Popover>

              {(filters.dataInicial || filters.dataFinal) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Limpar período de datas"
                  onClick={() => {
                    const newFilters = { ...filters };
                    delete newFilters.dataInicial;
                    delete newFilters.dataFinal;
                    onFiltersChange(newFilters);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Lado Direito: Select de Entidade (para Admin) + Mais Filtros + Limpar */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <div className="flex items-center gap-1.5 min-w-[200px]">
                <Building2 className="w-3.5 h-3.5 text-eco-blue shrink-0" />
                <Select
                  value={filters.entidade || "all"}
                  onValueChange={(val) => updateFilter('entidade', val === 'all' ? undefined : val)}
                >
                  <SelectTrigger className="h-8 text-xs border-border/70 bg-background/50">
                    <SelectValue placeholder="Todas as entidades (CAMA)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Todas as entidades (Visão Geral)</SelectItem>
                    {entidades.map(ent => (
                      <SelectItem key={ent.id_entidade} value={String(ent.id_entidade)}>
                        {ent.nom_entidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Toggle de Mais Filtros */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                "h-8 text-xs gap-1.5 border-border/70 font-medium",
                showAdvanced && "bg-muted text-foreground"
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Mais filtros</span>
              {showAdvanced ? (
                <ChevronUp className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              )}
            </Button>

            {/* Botão Limpar Filtros */}
            {(hasCustomFilters || !activeQuick) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                title="Redefinir filtros para o padrão de 30 dias"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Linha Expansível de Filtros Avançados */}
        {showAdvanced && (
          <div className="pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in-50 duration-200">
            {/* Tipo de Resíduo */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground font-medium">Tipo de Resíduo</Label>
              <Select
                value={filters.tipoResiduo || "all"}
                onValueChange={(val) => updateFilter('tipoResiduo', val === 'all' ? undefined : val)}
              >
                <SelectTrigger className="h-8 text-xs border-border/70">
                  <SelectValue placeholder="Todos os resíduos" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="all">Todos os tipos de resíduo</SelectItem>
                  {tiposResiduo.map(t => (
                    <SelectItem key={t.id_tipo_residuo} value={t.des_tipo_residuo}>
                      {t.des_tipo_residuo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status da Coleta */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground font-medium">Status das Coletas</Label>
              <Select
                value={filters.statusColetas || "A"}
                onValueChange={(val) => updateFilter('statusColetas', val)}
              >
                <SelectTrigger className="h-8 text-xs border-border/70">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Apenas Ativas (Padrão)</SelectItem>
                  <SelectItem value="all">Todas as coletas (Ativas + Desativadas)</SelectItem>
                  <SelectItem value="D">Apenas Desativadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Escopo de Visualização Informativo */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground font-medium">Escopo de Acesso</Label>
              <div className="h-8 px-3 rounded-md bg-muted/40 border border-border/60 flex items-center text-xs text-muted-foreground">
                {isAdmin ? (
                  <span className="text-eco-blue font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-eco-blue inline-block"></span>
                    Administrador CAMA (Acesso Global)
                  </span>
                ) : (
                  <span className="text-recycle-green font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-recycle-green inline-block"></span>
                    Dados restritos à sua entidade
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Badges de Filtros Ativos */}
        {hasCustomFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-muted-foreground mr-1">Filtros aplicados:</span>
            {filters.entidade && filters.entidade !== 'all' && (
              <Badge variant="secondary" className="text-xs gap-1 bg-eco-blue/10 text-eco-blue border border-eco-blue/20">
                Entidade: {entidades.find(e => String(e.id_entidade) === filters.entidade)?.nom_entidade || filters.entidade}
                <button
                  type="button"
                  onClick={() => removeFilter('entidade')}
                  className="hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.tipoResiduo && filters.tipoResiduo !== 'all' && (
              <Badge variant="secondary" className="text-xs gap-1 bg-recycle-green/10 text-recycle-green-dark border border-recycle-green/20">
                Resíduo: {filters.tipoResiduo}
                <button
                  type="button"
                  onClick={() => removeFilter('tipoResiduo')}
                  className="hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.statusColetas && filters.statusColetas !== 'A' && (
              <Badge variant="secondary" className="text-xs gap-1 bg-eco-orange/10 text-eco-orange border border-eco-orange/20">
                Status: {filters.statusColetas === 'all' ? 'Todas' : 'Desativadas'}
                <button
                  type="button"
                  onClick={() => updateFilter('statusColetas', 'A')}
                  className="hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}