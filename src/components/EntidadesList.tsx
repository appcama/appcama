import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Users, Edit, Power, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatCpfCnpj, formatPhone, formatCep } from "@/lib/cpf-cnpj-utils";

interface Entidade {
  id_entidade: number;
  nom_entidade: string;
  num_cpf_cnpj: string;
  nom_razao_social: string | null;
  des_logradouro: string;
  des_bairro: string;
  num_cep: string;
  num_telefone: string | null;
  id_tipo_pessoa: number;
  id_tipo_entidade: number;
  id_tipo_situacao: number;
  id_municipio: number;
  des_status: string;
  des_tipo_entidade?: string;
}

interface EntidadesListProps {
  onAddNew: () => void;
  onEdit: (entidade: Entidade) => void;
}

export function EntidadesList({ onAddNew, onEdit }: EntidadesListProps) {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entidadeToDelete, setEntidadeToDelete] = useState<Entidade | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchEntidades();
  }, []);

  const fetchEntidades = async () => {
    try {
      let query = supabase
        .from('entidade')
        .select(`
          *,
          tipo_entidade!id_tipo_entidade (
            des_tipo_entidade
          )
        `)
        .in('des_status', ['A', 'D']);

      // Apenas administradores têm acesso à lista completa de entidades
      // Demais tipos de usuário só podem ver as entidades criadas por eles
      if (user && !user.isAdmin) {
        query = query.eq('id_usuario_criador', user.id);
      }

      const { data, error } = await query.order('nom_entidade');

      if (error) throw error;

      const formattedData = data.map((item: any) => ({
        ...item,
        des_tipo_entidade: item.tipo_entidade?.des_tipo_entidade || 'N/A'
      }));

      setEntidades(formattedData);
    } catch (error) {
      console.error('Erro ao buscar entidades:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de entidades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const getTipoPessoa = (tipo: number) => {
    return tipo === 1 ? 'Pessoa Física' : 'Pessoa Jurídica';
  };

  const handleToggleStatus = async (entidade: Entidade) => {
    try {
      const newStatus = entidade.des_status === 'A' ? 'D' : 'A';
      
      const { error } = await supabase
        .from('entidade')
        .update({ des_status: newStatus })
        .eq('id_entidade', entidade.id_entidade);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Entidade ${newStatus === 'A' ? 'ativada' : 'desativada'} com sucesso`,
      });

      fetchEntidades();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da entidade",
        variant: "destructive",
      });
    }
  };

  // Função para verificar se o usuário pode excluir entidades
  const canDeleteEntidade = (): boolean => {
    if (!user) return false;
    
    // Apenas administradores podem excluir entidades
    if (user.isAdmin) return true;
    
    return false;
  };

  // Função para abrir o diálogo de exclusão
  const handleDeleteClick = (entidade: Entidade) => {
    setEntidadeToDelete(entidade);
    setDeleteDialogOpen(true);
  };

  // Função para excluir entidade (exclusão lógica)
  const handleDeleteEntidade = async () => {
    if (!entidadeToDelete) return;

    try {
      // Realizar exclusão lógica (alterar status para 'D')
      const { error } = await supabase
        .from('entidade')
        .update({ 
          des_status: 'D',
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: user?.id || 1
        })
        .eq('id_entidade', entidadeToDelete.id_entidade);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Entidade excluída com sucesso",
      });

      // Recarregar a lista
      fetchEntidades();
      setDeleteDialogOpen(false);
      setEntidadeToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir entidade:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir entidade",
        variant: "destructive",
      });
    }
  };

  const filteredEntidades = entidades.filter(entidade =>
    entidade.nom_entidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entidade.num_cpf_cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entidade.des_tipo_entidade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Carregando entidades...</div>
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
              <Users className="h-5 w-5" />
              <CardTitle>Entidades</CardTitle>
            </div>
            <Button onClick={onAddNew} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          </div>
          <div className="flex gap-4 mt-4">
            <Input
              placeholder="Buscar por nome, CPF/CNPJ ou tipo"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntidades.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchTerm ? 'Nenhuma entidade encontrada com os critérios de busca' : 'Nenhuma entidade cadastrada'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntidades.map((entidade) => (
                    <TableRow key={entidade.id_entidade}>
                      <TableCell className="font-medium">
                        {entidade.nom_entidade}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatCpfCnpj(entidade.num_cpf_cnpj)}
                          <div className="text-xs text-muted-foreground">
                            {getTipoPessoa(entidade.id_tipo_pessoa)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{entidade.des_tipo_entidade}</TableCell>
                      <TableCell>{entidade.nom_razao_social || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {entidade.des_logradouro}, {entidade.des_bairro}
                        <div className="text-xs text-muted-foreground">
                          CEP: {formatCep(entidade.num_cep)}
                        </div>
                      </TableCell>
                      <TableCell>{entidade.num_telefone ? formatPhone(entidade.num_telefone) : '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          entidade.des_status === 'A' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {entidade.des_status === 'A' ? 'Ativo' : 'Inativo'}
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
                                  onClick={() => onEdit(entidade)}
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
                                  onClick={() => handleToggleStatus(entidade)}
                                  className={`h-8 w-8 p-0 ${
                                    entidade.des_status === 'A' 
                                      ? 'hover:bg-red-50 hover:text-red-600' 
                                      : 'hover:bg-green-50 hover:text-green-600'
                                  }`}
                                >
                                  <Power className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{entidade.des_status === 'A' ? 'Desativar' : 'Ativar'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          {canDeleteEntidade() && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteClick(entidade)}
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
        </CardContent>
      </Card>

      {/* AlertDialog para confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a entidade "{entidadeToDelete?.nom_entidade}"?
              <br />
              <strong>Esta ação alterará o status da entidade para inativo.</strong>
              <br />
              <br />
              <em>Nota: Esta é uma exclusão lógica - a entidade não será removida do banco de dados.</em>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntidade}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}