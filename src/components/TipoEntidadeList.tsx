
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Power } from "lucide-react";
import { toast } from "sonner";

interface TipoEntidade {
  id_tipo_entidade: number;
  des_tipo_entidade: string;
  des_geradora_residuo: string;
  des_coletora_residuo: string;
  des_status: string;
  des_locked: string;
}

interface TipoEntidadeListProps {
  onAddNew: () => void;
  onEdit: (tipoEntidade: TipoEntidade) => void;
}

export function TipoEntidadeList({ onAddNew, onEdit }: TipoEntidadeListProps) {
  const queryClient = useQueryClient();

  const { data: tiposEntidade = [], isLoading, error } = useQuery({
    queryKey: ['tipos-entidade'],
    queryFn: async () => {
      console.log('Fetching tipos de entidade...');
      const { data, error } = await supabase
        .from('tipo_entidade')
        .select('*')
        .order('des_tipo_entidade');
      
      if (error) {
        console.error('Error fetching tipos de entidade:', error);
        throw error;
      }
      
      console.log('Tipos de entidade fetched:', data);
      return data as TipoEntidade[];
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: number; currentStatus: string }) => {
      const newStatus = currentStatus === 'A' ? 'I' : 'A';
      const { error } = await supabase
        .from('tipo_entidade')
        .update({ 
          des_status: newStatus,
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: 1 // TODO: get from auth context
        })
        .eq('id_tipo_entidade', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-entidade'] });
      toast.success('Status do tipo de entidade atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating tipo entidade status:', error);
      toast.error('Erro ao atualizar status do tipo de entidade');
    }
  });

  const handleToggleStatus = (tipoEntidade: TipoEntidade) => {
    toggleStatusMutation.mutate({
      id: tipoEntidade.id_tipo_entidade,
      currentStatus: tipoEntidade.des_status
    });
  };

  if (isLoading) return <div>Carregando tipos de entidade...</div>;
  
  if (error) {
    console.error('Query error:', error);
    return <div>Erro ao carregar tipos de entidade: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tipos de Entidades</CardTitle>
            <CardDescription>
              Gerencie os tipos de entidades do sistema
            </CardDescription>
          </div>
          <Button onClick={onAddNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Tipo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Tipo</TableHead>
              <TableHead>Geradora</TableHead>
              <TableHead>Coletora</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiposEntidade.map((tipo) => (
              <TableRow key={tipo.id_tipo_entidade}>
                <TableCell className="font-medium">
                  {tipo.des_tipo_entidade}
                </TableCell>
                <TableCell>
                  <Badge variant={tipo.des_geradora_residuo === 'A' ? "default" : "secondary"}>
                    {tipo.des_geradora_residuo === 'A' ? 'Sim' : 'Não'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={tipo.des_coletora_residuo === 'A' ? "default" : "secondary"}>
                    {tipo.des_coletora_residuo === 'A' ? 'Sim' : 'Não'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={tipo.des_status === 'A' ? "default" : "secondary"}>
                    {tipo.des_status === 'A' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(tipo)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(tipo)}
                      disabled={toggleStatusMutation.isPending}
                    >
                      <Power className={`h-4 w-4 ${tipo.des_status === 'A' ? 'text-green-600' : 'text-gray-400'}`} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {tiposEntidade.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum tipo de entidade encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
