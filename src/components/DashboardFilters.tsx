import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { DashboardFilters } from "@/hooks/useDashboardData";

interface Entidade {
  id_entidade: number;
  nom_entidade: string;
}

interface TipoEntidade {
  id_tipo_entidade: number;
  des_tipo_entidade: string;
}

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export function DashboardFiltersComponent({ filters, onFiltersChange }: DashboardFiltersProps) {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [tiposEntidade, setTiposEntidade] = useState<TipoEntidade[]>([]);
  const [dataInicial, setDataInicial] = useState<Date | undefined>(
    filters.dataInicial ? new Date(filters.dataInicial) : undefined
  );
  const [dataFinal, setDataFinal] = useState<Date | undefined>(
    filters.dataFinal ? new Date(filters.dataFinal) : undefined
  );

  useEffect(() => {
    fetchEntidades();
    fetchTiposEntidade();
  }, []);

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

  const getCurrentYearDates = () => ({
    dataInicial: `${new Date().getFullYear()}-01-01`,
    dataFinal: `${new Date().getFullYear()}-12-31`,
  });

  const handleApplyFilters = () => {
    const newFilters: DashboardFilters = {
      ...filters,
      dataInicial: dataInicial ? format(dataInicial, "yyyy-MM-dd") : getCurrentYearDates().dataInicial,
      dataFinal: dataFinal ? format(dataFinal, "yyyy-MM-dd") : getCurrentYearDates().dataFinal,
    };
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const currentYear = getCurrentYearDates();
    setDataInicial(new Date(currentYear.dataInicial));
    setDataFinal(new Date(currentYear.dataFinal));
    
    onFiltersChange({
      entidadeId: undefined,
      tipoEntidadeId: undefined,
      dataInicial: currentYear.dataInicial,
      dataFinal: currentYear.dataFinal,
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-recycle-green" />
          <CardTitle>Filtros</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Entidade Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Entidade</label>
            <Select
              value={filters.entidadeId?.toString() || ""}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  entidadeId: value ? parseInt(value) : undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as entidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as entidades</SelectItem>
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
              value={filters.tipoEntidadeId?.toString() || ""}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  tipoEntidadeId: value ? parseInt(value) : undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                {tiposEntidade.map((tipo) => (
                  <SelectItem key={tipo.id_tipo_entidade} value={tipo.id_tipo_entidade.toString()}>
                    {tipo.des_tipo_entidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Inicial */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Inicial</label>
            <Popover>
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
                  onSelect={setDataInicial}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data Final */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Final</label>
            <Popover>
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
                  onSelect={setDataFinal}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button onClick={handleApplyFilters} className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Aplicar Filtros
          </Button>
          <Button variant="outline" onClick={handleClearFilters} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}