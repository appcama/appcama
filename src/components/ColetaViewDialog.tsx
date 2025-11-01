import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Calendar, MapPin, Building2, Users, Receipt } from 'lucide-react';

interface ColetaViewDialogProps {
  coletaId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ColetaResiduo {
  id_coleta_residuo: number;
  qtd_total: number;
  vlr_total: number;
  residuo: {
    nom_residuo: string;
    tipo_residuo: {
      des_tipo_residuo: string;
    };
  };
}

interface ColetaDetalhes {
  cod_coleta: string;
  dat_coleta: string;
  vlr_total: number;
  ponto_coleta?: {
    nom_ponto_coleta: string;
  };
  entidade?: {
    nom_entidade: string;
  };
  evento?: {
    nom_evento: string;
  };
  usuario?: {
    entidade: {
      nom_entidade: string;
    };
  };
  coleta_residuo: ColetaResiduo[];
}

export function ColetaViewDialog({ coletaId, open, onOpenChange }: ColetaViewDialogProps) {
  const [coleta, setColeta] = useState<ColetaDetalhes | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && coletaId) {
      loadColetaDetalhes();
    }
  }, [open, coletaId]);

  const loadColetaDetalhes = async () => {
    if (!coletaId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coleta')
        .select(`
          cod_coleta,
          dat_coleta,
          vlr_total,
          ponto_coleta:id_ponto_coleta (
            nom_ponto_coleta
          ),
          entidade:id_entidade_geradora (
            nom_entidade
          ),
          evento:id_evento (
            nom_evento
          ),
          usuario!coleta_id_usuario_criador_fkey (
            entidade:id_entidade (
              nom_entidade
            )
          ),
          coleta_residuo!inner (
            id_coleta_residuo,
            qtd_total,
            vlr_total,
            residuo:id_residuo (
              nom_residuo,
              tipo_residuo:id_tipo_residuo (
                des_tipo_residuo
              )
            )
          )
        `)
        .eq('id_coleta', coletaId)
        .eq('des_status', 'A')
        .eq('coleta_residuo.des_status', 'A')
        .single();

      if (error) throw error;

      setColeta(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes da coleta:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar detalhes da coleta',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatWeight = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + ' kg';
  };

  const calculateTotals = () => {
    if (!coleta?.coleta_residuo) return { totalQuantidade: 0, totalValor: 0 };
    
    const totalQuantidade = coleta.coleta_residuo.reduce((sum, r) => sum + Number(r.qtd_total), 0);
    const totalValor = coleta.coleta_residuo.reduce((sum, r) => sum + (Number(r.qtd_total) * Number(r.vlr_total)), 0);
    
    return { totalQuantidade, totalValor };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes da Coleta
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-recycle-green"></div>
          </div>
        ) : coleta ? (
          <div className="space-y-6">
            {/* Informações Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Código</p>
                  <p className="font-semibold">{coleta.cod_coleta}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Data</p>
                  <p className="font-semibold">{formatDate(coleta.dat_coleta)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Ponto de Coleta</p>
                  <p className="font-semibold">{coleta.ponto_coleta?.nom_ponto_coleta || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Entidade Geradora</p>
                  <p className="font-semibold">{coleta.entidade?.nom_entidade || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Entidade Coletora</p>
                  <p className="font-semibold">{coleta.usuario?.entidade?.nom_entidade || '-'}</p>
                </div>
              </div>

              {coleta.evento?.nom_evento && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Evento</p>
                    <p className="font-semibold">{coleta.evento.nom_evento}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Resíduos Coletados */}
            <div>
              <h3 className="font-semibold mb-3 text-lg">Resíduos Coletados</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold">Resíduo</th>
                      <th className="text-left p-3 font-semibold">Tipo</th>
                      <th className="text-right p-3 font-semibold">Quantidade</th>
                      <th className="text-right p-3 font-semibold">Valor Unitário</th>
                      <th className="text-right p-3 font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coleta.coleta_residuo.map((residuo) => (
                      <tr key={residuo.id_coleta_residuo} className="border-b hover:bg-gray-50">
                        <td className="p-3">{residuo.residuo?.nom_residuo || '-'}</td>
                        <td className="p-3">{residuo.residuo?.tipo_residuo?.des_tipo_residuo || '-'}</td>
                        <td className="p-3 text-right">{formatWeight(residuo.qtd_total)}</td>
                        <td className="p-3 text-right">{formatCurrency(residuo.vlr_total)}</td>
                        <td className="p-3 text-right font-semibold text-recycle-green">
                          {formatCurrency(Number(residuo.qtd_total) * Number(residuo.vlr_total))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-gray-50 font-bold">
                      <td colSpan={2} className="p-3 text-right">TOTAIS:</td>
                      <td className="p-3 text-right">{formatWeight(calculateTotals().totalQuantidade)}</td>
                      <td className="p-3"></td>
                      <td className="p-3 text-right text-recycle-green text-lg">
                        {formatCurrency(calculateTotals().totalValor)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nenhum dado encontrado
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
