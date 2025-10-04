import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Residuo {
  nom_residuo: string;
  qtd_total: number;
  vlr_total: number;
  id_tipo_residuo: number;
  percentual: number;
}

interface ColetaDetalhe {
  cod_coleta: string;
  dat_coleta: string;
  residuos: {
    nom_residuo: string;
    qtd_total: number;
    vlr_total: number;
  }[];
}

interface CertificadoResiduosDialogProps {
  certificadoId: number | null;
  onClose: () => void;
}

export function CertificadoResiduosDialog({ certificadoId, onClose }: CertificadoResiduosDialogProps) {
  const [loading, setLoading] = useState(false);
  const [residuos, setResiduos] = useState<Residuo[]>([]);
  const [coletasDetalhes, setColetasDetalhes] = useState<ColetaDetalhe[]>([]);
  const [certificado, setCertificado] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (certificadoId) {
      loadCertificadoResiduos();
    }
  }, [certificadoId]);

  const loadCertificadoResiduos = async () => {
    if (!certificadoId) return;
    
    setLoading(true);
    try {
      // Buscar dados do certificado
      const { data: certData, error: certError } = await supabase
        .from('certificado')
        .select('cod_validador, dat_periodo_inicio, dat_periodo_fim, qtd_total_certificado, vlr_total_certificado')
        .eq('id_certificado', certificadoId)
        .single();

      if (certError) throw certError;
      setCertificado(certData);

      // Buscar resíduos consolidados
      const { data: residuosData, error: residuosError } = await supabase
        .from('certificado_residuo')
        .select('nom_residuo, qtd_total, vlr_total, id_tipo_residuo')
        .eq('id_certificado', certificadoId)
        .order('qtd_total', { ascending: false });

      if (residuosError) throw residuosError;

      // Calcular percentuais
      const residuosComPercentual = (residuosData || []).map(r => ({
        ...r,
        percentual: certData?.qtd_total_certificado 
          ? (r.qtd_total / certData.qtd_total_certificado) * 100 
          : 0
      }));

      setResiduos(residuosComPercentual);

      // Buscar detalhamento por coleta
      const { data: coletasData, error: coletasError } = await supabase
        .from('coleta')
        .select(`
          cod_coleta,
          dat_coleta,
          id_coleta
        `)
        .eq('id_certificado', certificadoId)
        .eq('des_status', 'A')
        .order('dat_coleta', { ascending: false });

      if (coletasError) throw coletasError;

      // Buscar resíduos de cada coleta
      const coletasComResiduos: ColetaDetalhe[] = [];
      for (const coleta of coletasData || []) {
        const { data: residuosColeta } = await supabase
          .from('coleta_residuo')
          .select(`
            qtd_total,
            vlr_total,
            residuo:id_residuo(nom_residuo)
          `)
          .eq('id_coleta', coleta.id_coleta)
          .eq('des_status', 'A');

        coletasComResiduos.push({
          cod_coleta: coleta.cod_coleta,
          dat_coleta: coleta.dat_coleta,
          residuos: (residuosColeta || []).map((r: any) => ({
            nom_residuo: r.residuo?.nom_residuo || 'N/A',
            qtd_total: r.qtd_total,
            vlr_total: r.vlr_total
          }))
        });
      }

      setColetasDetalhes(coletasComResiduos);

    } catch (error: any) {
      console.error('Erro ao carregar resíduos do certificado:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar dados',
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

  const formatQuantity = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <Dialog open={certificadoId !== null} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhamento de Resíduos</DialogTitle>
          <DialogDescription>
            {certificado && (
              <>
                Certificado <strong>{certificado.cod_validador}</strong> - 
                Período: {formatDate(certificado.dat_periodo_inicio)} a {formatDate(certificado.dat_periodo_fim)}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tabela de Resíduos Consolidados */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Resíduos Consolidados</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-semibold">Tipo de Resíduo</th>
                      <th className="text-right p-3 font-semibold">Quantidade (kg)</th>
                      <th className="text-right p-3 font-semibold">Valor (R$)</th>
                      <th className="text-right p-3 font-semibold">% do Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residuos.map((residuo, index) => (
                      <tr key={index} className="border-t hover:bg-muted/50">
                        <td className="p-3">{residuo.nom_residuo}</td>
                        <td className="p-3 text-right">{formatQuantity(residuo.qtd_total)}</td>
                        <td className="p-3 text-right">{formatCurrency(residuo.vlr_total)}</td>
                        <td className="p-3 text-right font-semibold text-primary">
                          {residuo.percentual.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                    {residuos.length > 0 && certificado && (
                      <tr className="border-t bg-muted font-semibold">
                        <td className="p-3">TOTAL</td>
                        <td className="p-3 text-right">{formatQuantity(certificado.qtd_total_certificado)}</td>
                        <td className="p-3 text-right">{formatCurrency(certificado.vlr_total_certificado)}</td>
                        <td className="p-3 text-right">100%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Distribuição Visual */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Distribuição Visual</h3>
              <div className="space-y-3">
                {residuos.map((residuo, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{residuo.nom_residuo}</span>
                      <span className="text-muted-foreground">{residuo.percentual.toFixed(1)}%</span>
                    </div>
                    <div className="h-6 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
                        style={{ width: `${residuo.percentual}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detalhamento por Coleta */}
            <div>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="details">
                  <AccordionTrigger className="text-lg font-semibold">
                    Ver detalhamento por coleta ({coletasDetalhes.length} coletas)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 mt-2">
                      {coletasDetalhes.map((coleta, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-card">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold">Coleta {coleta.cod_coleta}</h4>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(coleta.dat_coleta)}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {coleta.residuos.map((residuo, rIndex) => (
                              <div key={rIndex} className="flex justify-between text-sm border-t pt-2">
                                <span>{residuo.nom_residuo}</span>
                                <div className="flex gap-4">
                                  <span className="text-muted-foreground">
                                    {formatQuantity(residuo.qtd_total)} kg
                                  </span>
                                  <span className="font-medium text-primary">
                                    {formatCurrency(residuo.vlr_total)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
