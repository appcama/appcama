import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, X, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface RelatorioFiltersType {
  dataInicial?: Date;
  dataFinal?: Date;
  entidade?: string;
  tipoEntidade?: string;
  tipoResiduo?: string;
  pontoColeta?: string;
  evento?: string;
  municipio?: string;
}

interface RelatorioFiltersProps {
  filters: RelatorioFiltersType;
  onFiltersChange: (filters: RelatorioFiltersType) => void;
  onReset: () => void;
}

export function RelatorioFilters({ filters, onFiltersChange, onReset }: RelatorioFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const activeFiltersCount = Object.keys(filters).length;

  const quickDateRanges = [
    { label: "Últimos 7 dias", days: 7 },
    { label: "Últimos 30 dias", days: 30 },
    { label: "Últimos 90 dias", days: 90 },
    { label: "Este ano", days: 365 }
  ];

  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    updateFilter('dataInicial', start);
    updateFilter('dataFinal', end);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-recycle-green-light text-recycle-green-dark">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Período - sempre visível */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground">PERÍODO</Label>
          
          {/* Botões de período rápido */}
          <div className="grid grid-cols-1 gap-1">
            {quickDateRanges.map((range) => (
              <Button
                key={range.days}
                variant="ghost"
                size="sm"
                onClick={() => setQuickDateRange(range.days)}
                className="justify-start text-xs h-8"
              >
                {range.label}
              </Button>
            ))}
          </div>

          {/* Seleção customizada de datas */}
          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label htmlFor="dataInicial" className="text-xs">Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-8 text-xs",
                      !filters.dataInicial && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {filters.dataInicial ? (
                      format(filters.dataInicial, "PPP", { locale: ptBR })
                    ) : (
                      "Selecione..."
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataInicial}
                    onSelect={(date) => updateFilter('dataInicial', date)}
                    locale={ptBR}
                    disabled={(date) =>
                      date > new Date() || (filters.dataFinal && date > filters.dataFinal)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="dataFinal" className="text-xs">Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-8 text-xs",
                      !filters.dataFinal && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {filters.dataFinal ? (
                      format(filters.dataFinal, "PPP", { locale: ptBR })
                    ) : (
                      "Selecione..."
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataFinal}
                    onSelect={(date) => updateFilter('dataFinal', date)}
                    locale={ptBR}
                    disabled={(date) =>
                      date > new Date() || (filters.dataInicial && date < filters.dataInicial)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Filtros avançados */}
        <div className="pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-start text-xs h-8 text-muted-foreground"
          >
            {showAdvanced ? "Ocultar filtros avançados" : "Mostrar filtros avançados"}
          </Button>
        </div>

        {showAdvanced && (
          <div className="space-y-3 pt-2">
            {/* Entidade */}
            <div>
              <Label htmlFor="entidade" className="text-xs font-medium text-muted-foreground">
                ENTIDADE
              </Label>
              <Select
                value={filters.entidade || ""}
                onValueChange={(value) => updateFilter('entidade', value || undefined)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todas as entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as entidades</SelectItem>
                  {/* TODO: Carregar entidades da base */}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Entidade */}
            <div>
              <Label htmlFor="tipoEntidade" className="text-xs font-medium text-muted-foreground">
                TIPO DE ENTIDADE
              </Label>
              <Select
                value={filters.tipoEntidade || ""}
                onValueChange={(value) => updateFilter('tipoEntidade', value || undefined)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  {/* TODO: Carregar tipos da base */}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Resíduo */}
            <div>
              <Label htmlFor="tipoResiduo" className="text-xs font-medium text-muted-foreground">
                TIPO DE RESÍDUO
              </Label>
              <Select
                value={filters.tipoResiduo || ""}
                onValueChange={(value) => updateFilter('tipoResiduo', value || undefined)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  {/* TODO: Carregar tipos da base */}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Tags de filtros ativos */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t border-border">
            {filters.dataInicial && (
              <Badge variant="secondary" className="text-xs gap-1">
                Início: {format(filters.dataInicial, "dd/MM/yy")}
                <button onClick={() => removeFilter('dataInicial')}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.dataFinal && (
              <Badge variant="secondary" className="text-xs gap-1">
                Fim: {format(filters.dataFinal, "dd/MM/yy")}
                <button onClick={() => removeFilter('dataFinal')}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.entidade && (
              <Badge variant="secondary" className="text-xs gap-1">
                Entidade
                <button onClick={() => removeFilter('entidade')}>
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