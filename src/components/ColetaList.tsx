
import { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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

interface Coleta {
  id_coleta: number;
  cod_coleta: string;
  dat_coleta: string;
  vlr_total: number;
  id_ponto_coleta?: number;
  id_entidade_geradora?: number;
  id_evento?: number;
  id_usuario_criador: number;
  ponto_coleta?: {
    nom_ponto_coleta: string;
  };
  entidade?: {
    nom_entidade: string;
  };
  evento?: {
    nom_evento: string;
  };
}

interface ColetaListProps {
  onAddNew: () => void;
  onEdit: (coleta: Coleta) => void;
}

export function ColetaList({ onAddNew, onEdit }: ColetaListProps) {
  const [coletas, setColetas] = useState<Coleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const loadColetas = async () => {
    try {
      setLoading(true);
      console.log('[ColetaList] Loading coletas...');
      console.log('User data:', user);
      console.log('User entityId:', user?.entityId);
      console.log('User isAdmin:', user?.isAdmin);
      
      // Se não há usuário, não buscar dados
      if (!user) {
        console.log('No user found, not loading coletas');
        setColetas([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('coleta')
        .select(`
          id_coleta,
          cod_coleta,
          dat_coleta,
          vlr_total,
          id_ponto_coleta,
          id_entidade_geradora,
          id_evento,
          id_usuario_criador,
          ponto_coleta:id_ponto_coleta (
            nom_ponto_coleta
          ),
          entidade:id_entidade_geradora (
            nom_entidade
          ),
          evento:id_evento (
            nom_evento
          )
        `)
        .eq('des_status', 'A');

      // Se não é administrador, filtrar pela entidade do usuário
      if (!user.isAdmin && user.entityId) {
        console.log('Non-admin user, filtering by entityId:', user.entityId);
        query = query.eq('id_entidade_geradora', user.entityId);
      } else if (user.isAdmin) {
        console.log('Admin user, showing all coletas');
      } else {
        console.log('No entityId found and not admin, not loading coletas');
        setColetas([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query.order('dat_coleta', { ascending: false });
      
      console.log('Coletas query result:', { data, error });

      if (error) {
        console.error('[ColetaList] Error loading coletas:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar coletas',
          variant: 'destructive',
        });
        return;
      }

      console.log('[ColetaList] Coletas loaded:', data);
      setColetas(data || []);
    } catch (error) {
      console.error('[ColetaList] Unexpected error:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao carregar coletas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColetas();
  }, [user]);

  const filteredColetas = coletas.filter(coleta =>
    coleta.cod_coleta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coleta.ponto_coleta?.nom_ponto_coleta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coleta.entidade?.nom_entidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coleta.evento?.nom_evento?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para verificar se o usuário pode excluir uma coleta
  const canDeleteColeta = (coleta: Coleta) => {
    if (!user) return false;
    
    // Administradores podem excluir qualquer coleta
    if (user.isAdmin) return true;
    
    // Entidade criadora pode excluir suas próprias coletas
    if (coleta.id_entidade_geradora === user.entityId) return true;
    
    // Usuário criador pode excluir suas próprias coletas
    if (coleta.id_usuario_criador === user.id) return true;
    
    return false;
  };

  // Função para excluir coleta
  const handleDeleteColeta = async (coleta: Coleta) => {
    try {
      const { error } = await supabase
        .from('coleta')
        .update({ des_status: 'D' })
        .eq('id_coleta', coleta.id_coleta);

      if (error) {
        console.error('Erro ao excluir coleta:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao excluir coleta',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Coleta excluída com sucesso',
      });

      // Recarregar a lista
      loadColetas();
    } catch (error) {
      console.error('Erro inesperado ao excluir coleta:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao excluir coleta',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-recycle-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Coletas</h1>
        <Button onClick={onAddNew} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Coletas</CardTitle>
          <div className="flex gap-4 mt-4">
            <Input
              placeholder="Buscar por código, ponto de coleta, entidade ou evento"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredColetas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma coleta encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Código</th>
                    <th className="text-left p-4 font-semibold">Data</th>
                    <th className="text-left p-4 font-semibold">Ponto de Coleta</th>
                    <th className="text-left p-4 font-semibold">Entidade Geradora</th>
                    <th className="text-left p-4 font-semibold">Evento</th>
                    <th className="text-right p-4 font-semibold">Valor Total</th>
                    <th className="text-center p-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredColetas.map((coleta) => (
                    <tr key={coleta.id_coleta} className="border-b hover:bg-gray-50">
                      <td className="p-4">{coleta.cod_coleta}</td>
                      <td className="p-4">{formatDate(coleta.dat_coleta)}</td>
                      <td className="p-4">{coleta.ponto_coleta?.nom_ponto_coleta || '-'}</td>
                      <td className="p-4">{coleta.entidade?.nom_entidade || '-'}</td>
                      <td className="p-4">{coleta.evento?.nom_evento || '-'}</td>
                      <td className="p-4 text-right font-semibold text-recycle-green">
                        {formatCurrency(coleta.vlr_total)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(coleta)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {canDeleteColeta(coleta) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Excluir"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir a coleta <strong>{coleta.cod_coleta}</strong>?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteColeta(coleta)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
