
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, TrendingUp, Edit, Power, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Indicador {
  id_indicador: number;
  nom_indicador: string;
  id_unidade_medida: number;
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


  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Carregando indicadores...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <CardTitle>Indicadores</CardTitle>
        </div>
        <Button onClick={onNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Indicador
        </Button>
      </CardHeader>
      <CardContent>
        {indicadores.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhum indicador encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade de Medida</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indicadores.map((indicador) => (
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
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        indicador.des_status === 'A' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {indicador.des_status === 'A' ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(indicador)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(indicador)}
                          disabled={updatingStatus === indicador.id_indicador}
                          className={`h-8 w-8 p-0 ${
                            indicador.des_status === 'A' 
                              ? 'hover:bg-red-50 hover:text-red-600' 
                              : 'hover:bg-green-50 hover:text-green-600'
                          }`}
                        >
                          {updatingStatus === indicador.id_indicador ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
