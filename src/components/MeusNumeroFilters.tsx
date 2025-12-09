import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Filter, RotateCcw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FinancialPrivacyToggle } from "@/components/FinancialPrivacyToggle";

interface Evento {
  id_evento: number;
  nom_evento: string;
  des_logo_url: string | null;
}

interface MyDashboardFilters {
  eventoId?: number;
  dataInicial: string;
  dataFinal: string;
}

interface MeusNumeroFiltersProps {
  filters: MyDashboardFilters;
  onFiltersChange: (filters: MyDashboardFilters) => void;
  onEventLogoChange?: (logoUrl: string | null) => void;
}

export function MeusNumeroFilters({ filters, onFiltersChange, onEventLogoChange }: MeusNumeroFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [tempFilters, setTempFilters] = useState<MyDashboardFilters>(filters);

  useEffect(() => {
    fetchEventos();
  }, []);

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // Update event logo when filter changes
  useEffect(() => {
    if (onEventLogoChange) {
      const selectedEvento = eventos.find(e => e.id_evento === filters.eventoId);
      onEventLogoChange(selectedEvento?.des_logo_url || null);
    }
  }, [filters.eventoId, eventos, onEventLogoChange]);

  const fetchEventos = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from("evento")
      .select("id_evento, nom_evento, des_logo_url")
      .eq("des_status", "A")
      .gte("dat_termino", today)
      .order("nom_evento");

    if (!error && data) {
      setEventos(data);
    }
  };

  const handleFilterChange = (key: keyof MyDashboardFilters, value: any) => {
    setTempFilters({
      ...tempFilters,
      [key]: value || undefined,
    });
  };

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
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

  const handleClearFilters = () => {
    const currentYear = getCurrentYearDates();
    const clearedFilters = {
      eventoId: undefined,
      dataInicial: currentYear.dataInicial,
      dataFinal: currentYear.dataFinal,
    };
    setTempFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtros</CardTitle>
              <ChevronDown 
                className={`h-5 w-5 transition-transform duration-200 ${
                  isExpanded ? "transform rotate-180" : ""
                }`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="evento">Evento</Label>
                <Select
                  value={tempFilters.eventoId?.toString() || "all"}
                  onValueChange={(value) => handleFilterChange("eventoId", value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger id="evento">
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

              <div className="space-y-2">
                <Label htmlFor="data-inicial">Data Inicial</Label>
                <input
                  id="data-inicial"
                  type="date"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={tempFilters.dataInicial}
                  onChange={(e) => handleFilterChange("dataInicial", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-final">Data Final</Label>
                <input
                  id="data-final"
                  type="date"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={tempFilters.dataFinal}
                  onChange={(e) => handleFilterChange("dataFinal", e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleApplyFilters} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
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
