
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, MapPin, Edit, Power, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatCep } from "@/lib/cpf-cnpj-utils";
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

interface PontoColeta {
  id_ponto_coleta: number;
  nom_ponto_coleta: string;
  des_logradouro: string;
  des_bairro: string;
  num_cep: string;
  des_locked: string;
  des_status: string;
  id_entidade_gestora: number;
  id_municipio: number;
  id_unidade_federativa: number;
  id_tipo_ponto_coleta: number;
  id_tipo_situacao: number;
  num_latitude: number | null;
  num_longitude: number | null;
  dat_criacao: string;
  dat_atualizacao: string | null;
  id_usuario_criador: number;
  id_usuario_atualizador: number | null;
}

interface PontosColetaListProps {
  onAddNew: () => void;
  onEdit: (pontoColeta: PontoColeta) => void;
}

export function PontosColetaList({ onAddNew, onEdit }: PontosColetaListProps) {
  const [pontosColeta, setPontosColeta] = useState<PontoColeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteErrorDialog, setShowDeleteErrorDialog] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPontosColeta = async () => {
    try {
      console.log('User data:', user);
      console.log('User entityId:', user?.entityId);
      console.log('User isAdmin:', user?.isAdmin);
      
      // Se não há usuário, não buscar dados
      if (!user) {
        console.log('No user found, not loading points');
        setPontosColeta([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('ponto_coleta')
        .select('*');

      // Se não é administrador, filtrar pela entidade do usuário
      if (!user.isAdmin && user.entityId) {
        console.log('Non-admin user, filtering by entityId:', user.entityId);
        query = query.eq('id_entidade_gestora', user.entityId);
      } else if (user.isAdmin) {
        console.log('Admin user, showing all points');
      } else {
        console.log('No entityId found and not admin, not loading points');
        setPontosColeta([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query.order('nom_ponto_coleta');
      
      console.log('Points query result:', { data, error });
      
      if (error) throw error;
      setPontosColeta(data || []);
    } catch (error) {
      console.error('Erro ao buscar pontos de coleta:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pontos de coleta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPontosColeta();
    }
  }, [user]);

  const handleToggleStatus = async (pontoColeta: PontoColeta) => {
    try {
      const newStatus = pontoColeta.des_status === 'A' ? 'D' : 'A';
      
      const { error } = await supabase
        .from('ponto_coleta')
        .update({ des_status: newStatus })
        .eq('id_ponto_coleta', pontoColeta.id_ponto_coleta);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Ponto de coleta ${newStatus === 'A' ? 'Ativado' : 'Desativado'} com sucesso`,
      });

      fetchPontosColeta();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do ponto de coleta",
        variant: "destructive",
      });
    }
  };

  // Função para verificar se o usuário pode excluir o ponto de coleta
  const canDeletePonto = (pontoColeta: PontoColeta): boolean => {
    if (!user) return false;
    
    // Administradores podem excluir qualquer ponto
    if (user.isAdmin) return true;
    
    // Usuários da entidade gestora podem excluir pontos da sua entidade
    if (user.entityId && pontoColeta.id_entidade_gestora === user.entityId) return true;
    
    // Criador do ponto pode excluir (assumindo que user.id corresponde ao id_usuario_criador)
    if (user.id && pontoColeta.id_usuario_criador === user.id) return true;
    
    return false;
  };

  // Função para verificar se há coletas vinculadas ao ponto
  const checkColetasVinculadas = async (idPontoColeta: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('coleta')
        .select('id_coleta')
        .eq('id_ponto_coleta', idPontoColeta)
        .eq('des_status', 'A')
        .limit(1);

      if (error) throw error;
      
      return (data && data.length > 0);
    } catch (error) {
      console.error('Erro ao verificar coletas vinculadas:', error);
      return true; // Em caso de erro, assumir que há coletas para prevenir exclusão
    }
  };

  // Função para excluir ponto de coleta
  const handleDeletePonto = async (pontoColeta: PontoColeta) => {
    try {
      // Verificar se há coletas vinculadas
      const hasColetas = await checkColetasVinculadas(pontoColeta.id_ponto_coleta);
      
      if (hasColetas) {
        setDeleteErrorMessage("Este ponto de coleta possui coletas cadastradas vinculadas. Não é possível excluí-lo.");
        setShowDeleteErrorDialog(true);
        return;
      }

      // Realizar exclusão lógica (alterar status para 'D')
      const { error } = await supabase
        .from('ponto_coleta')
        .update({ 
          des_status: 'D',
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: user?.id || 1
        })
        .eq('id_ponto_coleta', pontoColeta.id_ponto_coleta);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ponto de coleta excluído com sucesso",
      });

      // Recarregar a lista
      fetchPontosColeta();
    } catch (error) {
      console.error('Erro ao excluir ponto de coleta:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir ponto de coleta",
        variant: "destructive",
      });
    }
  };

  const filteredPontosColeta = pontosColeta.filter(ponto =>
    ponto.nom_ponto_coleta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ponto.des_logradouro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ponto.des_bairro?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Carregando pontos de coleta...</div>
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
              <CardTitle>Pontos de Coleta</CardTitle>
            </div>
            <Button onClick={onAddNew} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          </div>
          <div className="flex gap-4 mt-4">
            <Input
              placeholder="Buscar por nome, logradouro ou bairro"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredPontosColeta.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchTerm ? 'Nenhum ponto de coleta encontrado com os critérios de busca' : 'Nenhum ponto de coleta cadastrado'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Logradouro</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead>CEP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPontosColeta.map((pontoColeta) => (
                    <TableRow key={pontoColeta.id_ponto_coleta}>
                      <TableCell className="font-medium">
                        {pontoColeta.nom_ponto_coleta}
                      </TableCell>
                      <TableCell>{pontoColeta.des_logradouro}</TableCell>
                      <TableCell>{pontoColeta.des_bairro}</TableCell>
                      <TableCell>{formatCep(pontoColeta.num_cep)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          pontoColeta.des_status === 'A' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {pontoColeta.des_status === 'A' ? 'Ativo' : 'Inativo'}
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
                                  onClick={() => onEdit(pontoColeta)}
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
                                  onClick={() => handleToggleStatus(pontoColeta)}
                                  className={`h-8 w-8 p-0 ${
                                    pontoColeta.des_status === 'A' 
                                      ? 'hover:bg-red-50 hover:text-red-600' 
                                      : 'hover:bg-green-50 hover:text-green-600'
                                  }`}
                                >
                                  <Power className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{pontoColeta.des_status === 'A' ? 'Desativar' : 'Ativar'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {canDeletePonto(pontoColeta) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o ponto de coleta "{pontoColeta.nom_ponto_coleta}"?
                                    <br />
                                    <strong>Esta ação não pode ser desfeita.</strong>
                                    <br />
                                    <br />
                                    <em>Nota: A exclusão só será permitida se não houver coletas cadastradas vinculadas a este ponto.</em>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePonto(pontoColeta)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

      {/* AlertDialog para erro de exclusão - centralizado na tela */}
      <AlertDialog open={showDeleteErrorDialog} onOpenChange={setShowDeleteErrorDialog}>
        <AlertDialogContent className="max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Não é possível excluir</AlertDialogTitle>
            <AlertDialogDescription className="text-center py-4">
              {deleteErrorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center">
            <AlertDialogAction
              onClick={() => setShowDeleteErrorDialog(false)}
              className="bg-red-600 hover:bg-red-700"
            >
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
