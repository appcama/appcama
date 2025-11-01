
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Plus, Power, MapPin, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface TipoPontoColeta {
  id_tipo_ponto_coleta: number;
  des_tipo_ponto_coleta: string;
  des_status: string;
  des_locked: string;
  id_usuario_criador: number;
  dat_criacao: string;
  id_usuario_atualizador?: number;
  dat_atualizacao?: string;
}

interface TipoPontoColetaListProps {
  onEdit: (tipoPontoColeta: TipoPontoColeta) => void;
  onAddNew: () => void;
}

export function TipoPontoColetaList({ onEdit, onAddNew }: TipoPontoColetaListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tipoToDelete, setTipoToDelete] = useState<TipoPontoColeta | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tiposPontoColeta = [], isLoading, error } = useQuery({
    queryKey: ['tipos-ponto-coleta'],
    queryFn: async () => {
      console.log('Fetching tipos de ponto de coleta...');
      const { data, error } = await supabase
        .from('tipo_ponto_coleta')
        .select('*')
        .order('des_tipo_ponto_coleta');
      
      if (error) {
        console.error('Error fetching tipos de ponto de coleta:', error);
        throw error;
      }
      
      console.log('Tipos de ponto de coleta fetched:', data);
      return data as TipoPontoColeta[];
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: number; currentStatus: string }) => {
      const newStatus = currentStatus === 'A' ? 'I' : 'A';
      const { error } = await supabase
        .from('tipo_ponto_coleta')
        .update({ 
          des_status: newStatus,
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: 1
        })
        .eq('id_tipo_ponto_coleta', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-ponto-coleta'] });
      toast({
        title: "Status atualizado",
        description: "Status do tipo de ponto de coleta atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating tipo ponto coleta status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do tipo de ponto de coleta.",
        variant: "destructive",
      });
    },
  });

  const handleToggleStatus = (tipoPontoColeta: TipoPontoColeta) => {
    toggleStatusMutation.mutate({
      id: tipoPontoColeta.id_tipo_ponto_coleta,
      currentStatus: tipoPontoColeta.des_status
    });
  };

  // Função para verificar se o usuário pode excluir o tipo de ponto de coleta
  const canDeleteTipo = (): boolean => {
    if (!user) return false;
    
    // Administradores podem excluir tipos de ponto de coleta
    if (user.isAdmin) return true;
    
    return false;
  };

  // Função para verificar se há pontos de coleta vinculados
  const checkPontosVinculados = async (idTipo: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('ponto_coleta')
        .select('id_ponto_coleta')
        .eq('id_tipo_ponto_coleta', idTipo)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Erro ao verificar pontos vinculados:', error);
      return true; // Em caso de erro, assumir que há vinculações para evitar exclusão
    }
  };

  // Função para excluir tipo de ponto de coleta
  const handleDeleteTipo = async () => {
    if (!tipoToDelete) return;

    try {
      // Verificar se há pontos de coleta vinculados
      const hasPontos = await checkPontosVinculados(tipoToDelete.id_tipo_ponto_coleta);
      
      if (hasPontos) {
        toast({
          title: "Não é possível excluir",
          description: "Este tipo de ponto de coleta possui pontos de coleta cadastrados vinculados. Não é possível excluí-lo.",
          variant: "destructive",
        });
        setDeleteDialogOpen(false);
        setTipoToDelete(null);
        return;
      }

      // Realizar exclusão lógica (alterar status para 'D')
      const { error } = await supabase
        .from('tipo_ponto_coleta')
        .update({ 
          des_status: 'D',
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: user?.id || 1
        })
        .eq('id_tipo_ponto_coleta', tipoToDelete.id_tipo_ponto_coleta);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de ponto de coleta excluído com sucesso",
      });

      // Recarregar a lista
      queryClient.invalidateQueries({ queryKey: ['tipos-ponto-coleta'] });
      setDeleteDialogOpen(false);
      setTipoToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir tipo de ponto de coleta:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir tipo de ponto de coleta",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (tipo: TipoPontoColeta) => {
    setTipoToDelete(tipo);
    setDeleteDialogOpen(true);
  };

  const filteredTiposPontoColeta = tiposPontoColeta.filter(tipo =>
    tipo.des_tipo_ponto_coleta?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginação
  const totalPages = Math.ceil(filteredTiposPontoColeta.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTipos = filteredTiposPontoColeta.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Carregando tipos de ponto de coleta...</div>
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
            Erro ao carregar tipos de ponto de coleta: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <CardTitle>Tipos de Ponto de Coleta</CardTitle>
            </div>
            <Button onClick={onAddNew} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          </div>
          <div className="flex gap-4 mt-4">
            <Input
              placeholder="Buscar por nome do tipo"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredTiposPontoColeta.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchTerm ? 'Nenhum tipo de ponto de coleta encontrado com os critérios de busca' : 'Nenhum tipo de ponto de coleta encontrado'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTipos.map((tipo) => (
                    <TableRow key={tipo.id_tipo_ponto_coleta}>
                      <TableCell className="font-medium">
                        {tipo.des_tipo_ponto_coleta}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          tipo.des_status === 'A' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {tipo.des_status === 'A' ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onEdit(tipo)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
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
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{tipo.des_status === 'A' ? 'Desativar' : 'Ativar'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {canDeleteTipo() && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteClick(tipo)}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Excluir</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginação */}
          {filteredTiposPontoColeta.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Exibindo {startIndex + 1} a {Math.min(endIndex, filteredTiposPontoColeta.length)} de {filteredTiposPontoColeta.length} tipos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tipo de ponto de coleta "{tipoToDelete?.des_tipo_ponto_coleta}"?
              <br />
              <strong>Esta ação não pode ser desfeita.</strong>
              <br />
              <br />
              <em>Nota: A exclusão só será permitida se não houver pontos de coleta cadastrados vinculados a este tipo.</em>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTipo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
