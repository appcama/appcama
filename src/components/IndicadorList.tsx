
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Power, PowerOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Indicador {
  id_indicador: number;
  nom_indicador: string;
  id_unidade_medida: number;
  qtd_referencia: number | null;
  des_status: string;
  unidade_medida?: {
    des_unidade_medida: string;
    cod_unidade_medida: string;
  };
}

interface IndicadorListProps {
  onEdit: (indicador: Indicador) => void;
  onNew: () => void;
}

export function IndicadorList({ onEdit, onNew }: IndicadorListProps) {
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log("[IndicadorList] Component mounted, fetching indicadores...");
    fetchIndicadores();
  }, []);

  const fetchIndicadores = async () => {
    try {
      console.log("[IndicadorList] Starting fetch...");
      const { data, error } = await supabase
        .from('indicador')
        .select(`
          *,
          unidade_medida:id_unidade_medida (
            des_unidade_medida,
            cod_unidade_medida
          )
        `)
        .order('nom_indicador');

      console.log("[IndicadorList] Supabase response:", { data, error });

      if (error) {
        console.error("[IndicadorList] Supabase error:", error);
        throw error;
      }
      
      console.log("[IndicadorList] Successfully fetched indicadores:", data?.length || 0);
      setIndicadores(data || []);
    } catch (error) {
      console.error('[IndicadorList] Error fetching indicadores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar indicadores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (indicador: Indicador) => {
    setUpdatingStatus(indicador.id_indicador);
    
    try {
      const newStatus = indicador.des_status === 'A' ? 'I' : 'A';
      
      const { error } = await supabase
        .from('indicador')
        .update({ 
          des_status: newStatus,
          id_usuario_atualizador: 1,
          dat_atualizacao: new Date().toISOString()
        })
        .eq('id_indicador', indicador.id_indicador);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Indicador ${newStatus === 'A' ? 'ativado' : 'desativado'} com sucesso!`,
      });

      fetchIndicadores();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do indicador",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredIndicadores = indicadores.filter(indicador =>
    indicador.nom_indicador?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Indicadores</h2>
          <p className="text-gray-600">Gerencie os indicadores do sistema</p>
        </div>
        <Button onClick={onNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Indicador
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Indicadores</span>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar indicadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade de Medida</TableHead>
                <TableHead>Qtd. Referência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIndicadores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {searchTerm ? "Nenhum indicador encontrado" : "Nenhum indicador cadastrado"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredIndicadores.map((indicador) => (
                  <TableRow key={indicador.id_indicador}>
                    <TableCell className="font-medium">
                      {indicador.nom_indicador}
                    </TableCell>
                    <TableCell>
                      {indicador.unidade_medida ? (
                        `${indicador.unidade_medida.des_unidade_medida} (${indicador.unidade_medida.cod_unidade_medida})`
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {indicador.qtd_referencia ? indicador.qtd_referencia.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={indicador.des_status === 'A' ? 'default' : 'secondary'}>
                        {indicador.des_status === 'A' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(indicador)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(indicador)}
                          disabled={updatingStatus === indicador.id_indicador}
                        >
                          {updatingStatus === indicador.id_indicador ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : indicador.des_status === 'A' ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
