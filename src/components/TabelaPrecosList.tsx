
import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TabelaPrecos {
  id_tabela_precos: number;
  des_tabela_precos: string;
  des_status: string;
  dat_criacao: string;
}

interface TabelaPrecosListProps {
  onAddNew: () => void;
  onEdit: (item: any) => void;
}

export function TabelaPrecosList({ onAddNew, onEdit }: TabelaPrecosListProps) {
  const [tabelas, setTabelas] = useState<TabelaPrecos[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadTabelas();
  }, []);

  const loadTabelas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tabela_precos')
        .select('*')
        .eq('des_status', 'A')
        .order('des_tabela_precos');

      if (error) throw error;
      setTabelas(data || []);
    } catch (error) {
      console.error('Erro ao carregar tabelas de preços:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar tabelas de preços',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tabela: TabelaPrecos) => {
    try {
      // Check if associated with any event
      const { data: eventos, error: checkError } = await supabase
        .from('evento')
        .select('id_evento')
        .eq('id_tabela_precos', tabela.id_tabela_precos)
        .limit(1);

      if (checkError) throw checkError;

      if (eventos && eventos.length > 0) {
        toast({
          title: 'Não é possível excluir',
          description: 'Esta tabela de preços está associada a um ou mais eventos.',
          variant: 'destructive',
        });
        return;
      }

      // Delete residuos first (CASCADE should handle, but be safe)
      await supabase
        .from('tabela_precos_residuo')
        .delete()
        .eq('id_tabela_preco', tabela.id_tabela_precos);

      // Soft delete
      const { error } = await supabase
        .from('tabela_precos')
        .update({ des_status: 'I' })
        .eq('id_tabela_precos', tabela.id_tabela_precos);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tabela de preços excluída com sucesso.',
      });
      loadTabelas();
    } catch (error) {
      console.error('Erro ao excluir tabela de preços:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir tabela de preços',
        variant: 'destructive',
      });
    }
  };

  const filteredTabelas = tabelas.filter(t =>
    t.des_tabela_precos.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold">Tabela de Preços</h1>
        </div>
        <Button onClick={onAddNew} className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nova Tabela de Preços
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Carregando...</p>
        </div>
      ) : filteredTabelas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'Nenhuma tabela de preços encontrada.' : 'Nenhuma tabela de preços cadastrada.'}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">Nome</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-center p-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTabelas.map((tabela) => (
                    <tr key={tabela.id_tabela_precos} className="border-b hover:bg-muted/30">
                      <td className="p-3">{tabela.des_tabela_precos}</td>
                      <td className="p-3">
                        <Badge variant={tabela.des_status === 'A' ? 'default' : 'secondary'}>
                          {tabela.des_status === 'A' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onEdit(tabela)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Editar</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(tabela)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Excluir</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
