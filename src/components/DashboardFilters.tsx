import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarIcon, Filter, RotateCcw, AlertCircle, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { DashboardFilters } from "@/hooks/useDashboardData";
import { FinancialPrivacyToggle } from "@/components/FinancialPrivacyToggle";

interface Entidade {
  id_entidade: number;
  nom_entidade: string;
}

interface TipoEntidade {
  id_tipo_entidade: number;
  des_tipo_entidade: string;
}

interface Evento {
  id_evento: number;
  nom_evento: string;
}

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export function DashboardFiltersComponent({ filters, onFiltersChange }: DashboardFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [tiposEntidade, setTiposEntidade] = useState<TipoEntidade[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [dataInicial, setDataInicial] = useState<Date | undefined>(() => {
    if (filters.dataInicial) {
      const [year, month, day] = filters.dataInicial.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return undefined;
  });
  const [dataFinal, setDataFinal] = useState<Date | undefined>(() => {
    if (filters.dataFinal) {
      const [year, month, day] = filters.dataFinal.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return undefined;
  });
  const [dateError, setDateError] = useState<string>("");
  const [openInicial, setOpenInicial] = useState(false);
  const [openFinal, setOpenFinal] = useState(false);

  useEffect(() => {
    fetchEntidades();
    fetchTiposEntidade();
    fetchEventos();
  }, []);

  // Sync local date states with filters from parent component
  useEffect(() => {
    if (filters.dataInicial) {
      // Parse date string as local date to avoid timezone issues
      const [year, month, day] = filters.dataInicial.split('-').map(Number);
      setDataInicial(new Date(year, month - 1, day));
    }
    if (filters.dataFinal) {
      // Parse date string as local date to avoid timezone issues
      const [year, month, day] = filters.dataFinal.split('-').map(Number);
      setDataFinal(new Date(year, month - 1, day));
    }
  }, [filters.dataInicial, filters.dataFinal]);

  const fetchEntidades = async () => {
    try {
      const { data, error } = await supabase
        .from("entidade")
        .select("id_entidade, nom_entidade")
        .eq("des_status", "A")
        .order("nom_entidade");

      if (error) throw error;
      setEntidades(data || []);
    } catch (error) {
      console.error("Erro ao carregar entidades:", error);
    }
  };

  const fetchTiposEntidade = async () => {
    try {
      const { data, error } = await supabase
        .from("tipo_entidade")
        .select("id_tipo_entidade, des_tipo_entidade")
        .eq("des_status", "A")
        .order("des_tipo_entidade");

      if (error) throw error;
      setTiposEntidade(data || []);
    } catch (error) {
      console.error("Erro ao carregar tipos de entidade:", error);
    }
  };

  const fetchEventos = async () => {
    try {
      const { data, error } = await supabase
        .from("evento")
        .select("id_evento, nom_evento")
        .eq("des_status", "A")
        .order("nom_evento");

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    }
  };

  const getCurrentYearDates = () => ({
    dataInicial: `${new Date().getFullYear()}-01-01`,
    dataFinal: (() => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    })(),
  });

  const validateDates = (inicial: Date | undefined, final: Date | undefined): boolean => {
    if (inicial && final && final < inicial) {
      setDateError("A data final não pode ser anterior à inicial.");
      return false;
    }
    setDateError("");
    return true;
  };

  const handleDataInicialChange = (date: Date | undefined) => {
    setDataInicial(date);
    if (date && dataFinal && dataFinal < date) {
      setDataFinal(date);
    }
    validateDates(date, dataFinal && dataFinal < (date || new Date()) ? date : dataFinal);
    // Fechar o popover após selecionar
    setOpenInicial(false);
  };

  const handleDataFinalChange = (date: Date | undefined) => {
    if (dataInicial && date && date < dataInicial) {
      setDateError("A data final não pode ser anterior à inicial.");
      return;
    }
    setDataFinal(date);
    validateDates(dataInicial, date);
    // Fechar o popover após selecionar
    setOpenFinal(false);
  };

  const handleApplyFilters = () => {
    const inicial = dataInicial || new Date(getCurrentYearDates().dataInicial);
    const final = dataFinal || new Date(getCurrentYearDates().dataFinal);
    
    if (!validateDates(inicial, final)) {
      return;
    }

    const newFilters: DashboardFilters = {
      ...filters,
      dataInicial: format(inicial, "yyyy-MM-dd"),
      dataFinal: format(final, "yyyy-MM-dd"),
    };
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const currentYear = getCurrentYearDates();
    setDataInicial(new Date(currentYear.dataInicial));
    setDataFinal(new Date(currentYear.dataFinal));
    setDateError("");
    
    onFiltersChange({
      entidadeId: undefined,
      tipoEntidadeId: undefined,
      eventoId: undefined,
      dataInicial: currentYear.dataInicial,
      dataFinal: currentYear.dataFinal,
    });
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="mb-6">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-recycle-green" />
                <CardTitle>Filtros</CardTitle>
              </div>
              <ChevronDown className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-200",
                isExpanded && "transform rotate-180"
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Entidade Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Entidade</label>
            <Select
              value={filters.entidadeId?.toString() || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  entidadeId: value !== "all" ? parseInt(value) : undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as entidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as entidades</SelectItem>
                {entidades.map((entidade) => (
                  <SelectItem key={entidade.id_entidade} value={entidade.id_entidade.toString()}>
                    {entidade.nom_entidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Entidade Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Entidade</label>
            <Select
              value={filters.tipoEntidadeId?.toString() || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  tipoEntidadeId: value !== "all" ? parseInt(value) : undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {tiposEntidade.map((tipo) => (
                  <SelectItem key={tipo.id_tipo_entidade} value={tipo.id_tipo_entidade.toString()}>
                    {tipo.des_tipo_entidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Evento Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Evento</label>
            <Select
              value={filters.eventoId?.toString() || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  eventoId: value !== "all" ? parseInt(value) : undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os eventos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                {eventos.map((evento) => (
                  <SelectItem key={evento.id_evento} value={evento.id_evento.toString()}>
                    {evento.nom_evento}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Inicial */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Inicial</label>
            <Popover open={openInicial} onOpenChange={setOpenInicial}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataInicial && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInicial ? format(dataInicial, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataInicial}
                  onSelect={handleDataInicialChange}
                  locale={ptBR}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data Final */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Final</label>
            <Popover open={openFinal} onOpenChange={setOpenFinal}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataFinal && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataFinal ? format(dataFinal, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataFinal}
                  onSelect={handleDataFinalChange}
                  disabled={(date) => dataInicial ? date < dataInicial : false}
                  locale={ptBR}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Date Error Message */}
        {dateError && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{dateError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button onClick={handleApplyFilters} disabled={!!dateError} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
            <Filter className="h-4 w-4" />
            Aplicar Filtros
          </Button>
          <Button variant="outline" onClick={handleClearFilters} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Limpar Filtros
          </Button>
          <FinancialPrivacyToggle />
        </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}