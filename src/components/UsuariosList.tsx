
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Power, PowerOff, RotateCcw, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface Usuario {
  id_usuario: number;
  des_email: string;
  des_status: string;
  des_locked: string;
  des_senha_validada: string;
  id_entidade: number;
  id_perfil: number;
  entidade?: {
    nom_entidade: string;
  };
  perfil?: {
    nom_perfil: string;
  };
}

interface UsuariosListProps {
  onAddNew: () => void;
  onEdit: (usuario: Usuario) => void;
  perfilFilter?: {
    id_perfil: number;
    nom_perfil: string;
  } | null;
  onClearFilter?: () => void;
}

export function UsuariosList({ onAddNew, onEdit, perfilFilter, onClearFilter }: UsuariosListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios', perfilFilter?.id_perfil],
    queryFn: async () => {
      let query = supabase
        .from('usuario')
        .select(`
          *,
          entidade:id_entidade(nom_entidade),
          perfil:id_perfil(nom_perfil)
        `)
        .order('id_usuario', { ascending: true });

      // Aplicar filtro por perfil se fornecido
      if (perfilFilter) {
        query = query.eq('id_perfil', perfilFilter.id_perfil);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Usuario[];
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: number; newStatus: string }) => {
      const { error } = await supabase
        .from('usuario')
        .update({
          des_status: newStatus,
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: 1 // TODO: Use actual logged user id
        })
        .eq('id_usuario', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast({
        title: "Sucesso",
        description: "Status do usuário atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do usuário",
        variant: "destructive",
      });
      console.error('Erro ao atualizar status:', error);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      const { error } = await supabase.rpc('reset_user_password', {
        user_id_param: userId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast({
        title: "Sucesso",
        description: "Senha do usuário foi resetada para '123456789'",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao resetar senha do usuário",
        variant: "destructive",
      });
      console.error('Erro ao resetar senha:', error);
    },
  });

  const handleToggleStatus = (usuario: Usuario) => {
    const newStatus = usuario.des_status === 'A' ? 'D' : 'A';
    toggleStatusMutation.mutate({ id: usuario.id_usuario, newStatus });
  };

  const handleResetPassword = (userId: number) => {
    resetPasswordMutation.mutate(userId);
  };

  if (isLoading) {
    return <div className="p-6">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                Usuários
                {perfilFilter && (
                  <span className="text-base font-normal text-muted-foreground ml-2">
                    - Perfil: {perfilFilter.nom_perfil}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {perfilFilter 
                  ? `Usuários com o perfil "${perfilFilter.nom_perfil}"` 
                  : "Gerencie os usuários do sistema"
                }
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {perfilFilter && onClearFilter && (
                <Button 
                  variant="outline" 
                  onClick={onClearFilter}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar Filtro
                </Button>
              )}
              <Button onClick={onAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {perfilFilter && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Filtro ativo:</strong> Exibindo apenas usuários do perfil "{perfilFilter.nom_perfil}"
              </p>
            </div>
          )}
          {usuarios && usuarios.length > 0 ? (
            <div className="grid gap-4">
              {usuarios.map((usuario) => (
                <Card key={usuario.id_usuario} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">
                          {usuario.des_email || `Usuário ${usuario.id_usuario}`}
                        </h3>
                        <Badge variant={usuario.des_status === 'A' ? 'default' : 'secondary'}>
                          {usuario.des_status === 'A' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant={usuario.des_senha_validada === 'A' ? 'default' : 'destructive'}>
                          {usuario.des_senha_validada === 'A' ? 'Senha Validada' : 'Senha Pendente'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Entidade:</strong> {usuario.entidade?.nom_entidade || 'N/A'}</p>
                        <p><strong>Perfil:</strong> {usuario.perfil?.nom_perfil || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(usuario)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Resetar Senha</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja resetar a senha deste usuário? 
                              A nova senha será "123456789" e o usuário precisará validá-la no próximo login.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleResetPassword(usuario.id_usuario)}>
                              Resetar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button
                        variant={usuario.des_status === 'A' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleToggleStatus(usuario)}
                      >
                        {usuario.des_status === 'A' ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {perfilFilter 
                ? `Nenhum usuário encontrado com o perfil "${perfilFilter.nom_perfil}"` 
                : "Nenhum usuário encontrado"
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
