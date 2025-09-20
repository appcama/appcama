
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Power, PowerOff, RotateCcw, X, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCpfCnpj } from "@/lib/cpf-cnpj-utils";
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
    num_cpf_cnpj: string;
  };
  perfil?: {
    nom_perfil: string;
  };
}

interface UsuariosListProps {
  onAddNew: () => void;
  onEdit: (usuario: Usuario) => void;
  perfilFilter?: number | null;
}

export function UsuariosList({ onAddNew, onEdit, perfilFilter }: UsuariosListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleClearFilter = () => {
    // Recarregar a query sem o filtro
    queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    // Disparar evento customizado para notificar o componente pai
    window.dispatchEvent(new CustomEvent('clearPerfilFilter'));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios', perfilFilter],
    queryFn: async () => {
      let query = supabase
        .from('usuario')
        .select(`
          *,
          entidade:id_entidade(nom_entidade, num_cpf_cnpj),
          perfil:id_perfil(nom_perfil)
        `)
        .order('id_usuario', { ascending: true });

      // Aplicar filtro por perfil se fornecido
      if (perfilFilter) {
        query = query.eq('id_perfil', perfilFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Usuario[];
    },
  });

  // Buscar nome do perfil se houver filtro
  const { data: perfilData } = useQuery({
    queryKey: ['perfil', perfilFilter],
    queryFn: async () => {
      if (!perfilFilter) return null;
      const { data, error } = await supabase
        .from('perfil')
        .select('nom_perfil')
        .eq('id_perfil', perfilFilter)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!perfilFilter,
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

  const filteredUsuarios = usuarios?.filter(usuario =>
    usuario.des_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.entidade?.nom_entidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.perfil?.nom_perfil?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Usuários</CardTitle>
            {perfilFilter && perfilData && (
              <span className="text-base font-normal text-muted-foreground ml-2">
                - Perfil: {perfilData.nom_perfil}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {perfilFilter && (
              <Button 
                variant="outline" 
                onClick={handleClearFilter}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar Filtro
              </Button>
            )}
            <Button onClick={onAddNew} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <Input
            placeholder="Buscar por email, entidade ou perfil"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent>
        {perfilFilter && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Filtro ativo:</strong> Exibindo apenas usuários do perfil ID {perfilFilter}
            </p>
          </div>
        )}
        {filteredUsuarios.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? 'Nenhum usuário encontrado com os critérios de busca' : (isLoading ? 'Carregando usuários...' : 'Nenhum usuário cadastrado')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Senha</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id_usuario}>
                    <TableCell className="font-medium">
                      {usuario.des_email || `Usuário ${usuario.id_usuario}`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {usuario.entidade?.nom_entidade || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {usuario.entidade?.num_cpf_cnpj ? formatCpfCnpj(usuario.entidade.num_cpf_cnpj) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {usuario.perfil?.nom_perfil || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        usuario.des_status === 'A' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.des_status === 'A' ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        usuario.des_senha_validada === 'A' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {usuario.des_senha_validada === 'A' ? 'Validada' : 'Pendente'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(usuario)}
                          className="h-8 w-8 p-0"
                          title="Editar usuário"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Resetar senha">
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
                          className="h-8 w-8 p-0"
                          title={usuario.des_status === 'A' ? 'Desativar usuário' : 'Ativar usuário'}
                        >
                          {usuario.des_status === 'A' ? (
                            <PowerOff className="h-4 w-4" />
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
