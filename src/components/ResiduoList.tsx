import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Power, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Residuo {
  id_residuo: number;
  nom_residuo: string;
  id_tipo_residuo: number;
  des_status: string;
  des_locked: string;
  tipo_residuo?: {
    des_tipo_residuo: string;
  };
}

interface ResiduoListProps {
  onAddNew: () => void;
  onEdit: (residuo: Residuo) => void;
}

export function ResiduoList({ onAddNew, onEdit }: ResiduoListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [residuoToDelete, setResiduoToDelete] = useState<Residuo | null>(null);

  const { data: residuos = [], isLoading, error } = useQuery({
    queryKey: ['residuos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('residuo')
        .select(`
          *,
          tipo_residuo:id_tipo_residuo (
            des_tipo_residuo
          )
        `)
        .order('nom_residuo');

      if (error) throw error;
      return data as Residuo[];
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: number; newStatus: string }) => {
      const { error } = await supabase
        .from('residuo')
        .update({
          des_status: newStatus,
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: 1, // TODO: get from auth context
        })
        .eq('id_residuo', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residuos'] });
      toast({
        title: "Sucesso",
        description: "Status do resíduo atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do resíduo.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Check if residuo is linked to any coleta_residuo
      const { data: linkedData, error: checkError } = await supabase
        .from('coleta_residuo')
        .select('id_coleta_residuo')
        .eq('id_residuo', id)
        .limit(1);

      if (checkError) throw checkError;

      if (linkedData && linkedData.length > 0) {
        throw new Error('Este resíduo não pode ser excluído pois está vinculado a coletas.');
      }

      // If not linked, proceed with deletion
      const { error } = await supabase
        .from('residuo')
        .delete()
        .eq('id_residuo', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residuos'] });
      toast({
        title: "Sucesso",
        description: "Resíduo excluído com sucesso!",
      });
      setDeleteDialogOpen(false);
      setResiduoToDelete(null);
    },
    onError: (error: any) => {
      console.error('Erro ao excluir resíduo:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir resíduo.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setResiduoToDelete(null);
    },
  });

  const handleToggleStatus = (residuo: Residuo) => {
    const newStatus = residuo.des_status === 'A' ? 'I' : 'A';
    toggleStatusMutation.mutate({ id: residuo.id_residuo, newStatus });
  };

  const handleDeleteClick = (residuo: Residuo) => {
    setResiduoToDelete(residuo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (residuoToDelete) {
      deleteMutation.mutate(residuoToDelete.id_residuo);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Carregando resíduos...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-destructive">Erro ao carregar resíduos</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Resíduos
          </CardTitle>
          <Button onClick={onAddNew} className="gap-2">
            <Package className="h-4 w-4" />
            Novo Resíduo
          </Button>
        </CardHeader>
        <CardContent>
          {residuos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum resíduo encontrado.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Resíduo</TableHead>
                    <TableHead>Tipo de Resíduo</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {residuos.map((residuo) => (
                    <TableRow key={residuo.id_residuo}>
                      <TableCell className="font-medium">
                        {residuo.nom_residuo}
                      </TableCell>
                      <TableCell>
                        {residuo.tipo_residuo?.des_tipo_residuo || 'N/A'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={residuo.des_status === 'A' ? 'default' : 'secondary'}
                        >
                          {residuo.des_status === 'A' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(residuo)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(residuo)}
                            disabled={toggleStatusMutation.isPending}
                            className="gap-1"
                          >
                            <Power className="h-3 w-3" />
                            {residuo.des_status === 'A' ? 'Inativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(residuo)}
                            disabled={deleteMutation.isPending}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                            Excluir
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o resíduo "{residuoToDelete?.nom_residuo}"?
              <br />
              <strong>Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}