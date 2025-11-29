import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Evento {
  id_evento: number;
  nom_evento: string;
}

interface MyDashboardFilters {
  eventoId?: number;
  dataInicial: string;
  dataFinal: string;
}

interface MeusNumeroFiltersProps {
  filters: MyDashboardFilters;
  onFiltersChange: (filters: MyDashboardFilters) => void;
}

export function MeusNumeroFilters({ filters, onFiltersChange }: MeusNumeroFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from("evento")
      .select("id_evento, nom_evento")
      .eq("des_status", "A")
      .gte("dat_termino", today)
      .order("nom_evento");

    if (!error && data) {
      setEventos(data);
    }
  };

  const handleFilterChange = (key: keyof MyDashboardFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
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
                  value={filters.eventoId?.toString() || "all"}
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
                  value={filters.dataInicial}
                  onChange={(e) => handleFilterChange("dataInicial", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-final">Data Final</Label>
                <input
                  id="data-final"
                  type="date"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={filters.dataFinal}
                  onChange={(e) => handleFilterChange("dataFinal", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
