
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Building2, Edit, Power } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredTiposEntidade = tiposEntidade.filter(tipo =>
    tipo.des_tipo_entidade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Carregando tipos de entidade...</div>
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
            Erro ao carregar tipos de entidade: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Tipos de Entidades</CardTitle>
          </div>
          <Button onClick={onAddNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Tipo de Entidade
          </Button>
        </div>
        <div className="flex gap-4 mt-4">
          <Input
            placeholder="Buscar por nome do tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredTiposEntidade.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? 'Nenhum tipo de entidade encontrado com os critérios de busca' : 'Nenhum tipo de entidade encontrado'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Geradora</TableHead>
                  <TableHead>Coletora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTiposEntidade.map((tipo) => (
                  <TableRow key={tipo.id_tipo_entidade}>
                    <TableCell className="font-medium">
                      {tipo.des_tipo_entidade}
                    </TableCell>
                    <TableCell>
                      {tipo.des_geradora_residuo === 'A' ? 'Sim' : 'Não'}
                    </TableCell>
                    <TableCell>
                      {tipo.des_coletora_residuo === 'A' ? 'Sim' : 'Não'}
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
