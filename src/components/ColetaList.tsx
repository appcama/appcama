
import { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Coleta {
  id_coleta: number;
  cod_coleta: string;
  dat_coleta: string;
  vlr_total: number;
  id_ponto_coleta?: number;
  id_entidade_geradora?: number;
  id_evento?: number;
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

  const loadColetas = async () => {
    try {
      setLoading(true);
      console.log('[ColetaList] Loading coletas...');

      const { data, error } = await supabase
        .from('coleta')
        .select(`
          id_coleta,
          cod_coleta,
          dat_coleta,
          vlr_total,
          id_ponto_coleta,
          id_entidade_geradora,
          id_evento,
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
        .eq('des_status', 'A')
        .order('dat_coleta', { ascending: false });

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
  }, []);

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
