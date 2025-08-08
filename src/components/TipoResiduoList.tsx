
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit, Power } from "lucide-react";
import { toast } from "sonner";

interface TipoResiduo {
  id_tipo_residuo: number;
  des_tipo_residuo: string;
  des_recurso_natural: string;
  des_status: string;
  des_locked: string;
}

interface TipoResiduoListProps {
  onAddNew: () => void;
  onEdit: (tipoResiduo: TipoResiduo) => void;
}

export function TipoResiduoList({ onAddNew, onEdit }: TipoResiduoListProps) {
  const queryClient = useQueryClient();

  const { data: tiposResiduo = [], isLoading, error } = useQuery({
    queryKey: ['tipos-residuo'],
    queryFn: async () => {
      console.log('Fetching tipos de resíduo...');
      const { data, error } = await supabase
        .from('tipo_residuo')
        .select('*')
        .order('des_tipo_residuo');
      
      if (error) {
        console.error('Error fetching tipos de resíduo:', error);
        throw error;
      }
      
      console.log('Tipos de resíduo fetched:', data);
      return data as TipoResiduo[];
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: number; currentStatus: string }) => {
      const newStatus = currentStatus === 'A' ? 'I' : 'A';
      const { error } = await supabase
        .from('tipo_residuo')
        .update({ 
          des_status: newStatus,
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: 1 // TODO: get from auth context
        })
        .eq('id_tipo_residuo', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-residuo'] });
      toast.success('Status do tipo de resíduo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating tipo residuo status:', error);
      toast.error('Erro ao atualizar status do tipo de resíduo');
    }
  });

  const handleToggleStatus = (tipoResiduo: TipoResiduo) => {
    toggleStatusMutation.mutate({
      id: tipoResiduo.id_tipo_residuo,
      currentStatus: tipoResiduo.des_status
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Carregando tipos de resíduo...</div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    console.error('Query error:', error);
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-red-500">
            Erro ao carregar tipos de resíduo: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          <CardTitle>Tipos de Resíduos</CardTitle>
        </div>
        <Button onClick={onAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Tipo de Resíduo
        </Button>
      </CardHeader>
      <CardContent>
        {tiposResiduo.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhum tipo de resíduo encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Recurso Natural</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiposResiduo.map((tipo) => (
                  <TableRow key={tipo.id_tipo_residuo}>
                    <TableCell className="font-medium">
                      {tipo.des_tipo_residuo}
                    </TableCell>
                    <TableCell>
                      {tipo.des_recurso_natural || '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tipo.des_status === 'A' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tipo.des_status === 'A' ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(tipo)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(tipo)}
                          disabled={toggleStatusMutation.isPending}
                          className={`h-8 w-8 p-0 ${
                            tipo.des_status === 'A' 
                              ? 'hover:bg-red-50 hover:text-red-600' 
                              : 'hover:bg-green-50 hover:text-green-600'
                          }`}
                        >
                          <Power className="h-4 w-4" />
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
