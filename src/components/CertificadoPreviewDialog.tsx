import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface Coleta {
  id_coleta: number;
  cod_coleta: string;
  dat_coleta: string;
  vlr_total: number;
  id_entidade_geradora?: number;
  entidade?: {
    nom_entidade: string;
    num_cpf_cnpj: string;
    num_cep?: string;
    des_logradouro?: string;
    des_bairro?: string;
    id_municipio?: number;
    municipio?: { nom_municipio: string } | null;
  };
  entidade_coletora?: {
    nom_entidade: string;
    num_cpf_cnpj?: string;
    num_cep?: string;
    des_logradouro?: string;
    des_bairro?: string;
    id_municipio?: number;
    municipio?: { nom_municipio: string } | null;
  };
}

interface ResiduoConsolidado {
  id_tipo_residuo: number;
  nom_residuo: string;
  qtd_total: number;
  vlr_total: number;
}

interface CertificadoPreviewDialogProps {
  selectedColetaIds: number[];
  coletas: Coleta[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CertificadoPreviewDialog({
  selectedColetaIds,
  coletas,
  onClose,
  onSuccess,
}: CertificadoPreviewDialogProps) {
  const [observacoes, setObservacoes] = useState('');
  const [residuosConsolidados, setResiduosConsolidados] = useState<ResiduoConsolidado[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [nomMunicipioGeradora, setNomMunicipioGeradora] = useState<string | null>(null);
  const [nomMunicipioColetora, setNomMunicipioColetora] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const selectedColetas = coletas.filter(c => selectedColetaIds.includes(c.id_coleta));
  
  // Calcular período
  const dates = selectedColetas.map(c => new Date(c.dat_coleta));
  const datPeriodoInicio = new Date(Math.min(...dates.map(d => d.getTime())));
  const datPeriodoFim = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Calcular totais
  const qtdTotalCertificado = residuosConsolidados.reduce((sum, r) => sum + Number(r.qtd_total), 0);
  const vlrTotalCertificado = selectedColetas.reduce((sum, c) => sum + Number(c.vlr_total), 0);

  // Dados da entidade
  const entidade = selectedColetas[0]?.entidade;
  const entidadeColetora = (selectedColetas[0] as any)?.entidade_coletora;

  useEffect(() => {
    loadResiduos();
    // Carregar nomes de municípios quando IDs estiverem disponíveis
    const ids: number[] = [];
    const geradoraIdMunicipio = selectedColetas[0]?.entidade?.id_municipio;
    const coletoraIdMunicipio = (selectedColetas[0] as any)?.entidade_coletora?.id_municipio;
    if (geradoraIdMunicipio) ids.push(geradoraIdMunicipio);
    if (coletoraIdMunicipio) ids.push(coletoraIdMunicipio);

    if (ids.length > 0) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('municipio')
            .select('id_municipio, nom_municipio')
            .in('id_municipio', ids);
          
          if (!error && data) {
            const map = new Map(data.map((m: any) => [m.id_municipio, m.nom_municipio]));
            if (geradoraIdMunicipio) setNomMunicipioGeradora(map.get(geradoraIdMunicipio) || null);
            if (coletoraIdMunicipio) setNomMunicipioColetora(map.get(coletoraIdMunicipio) || null);
          }
        } catch (error) {
          // Ignore errors silently
        }
      })();
    }
  }, [selectedColetaIds]);

  const loadResiduos = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('coleta_residuo')
        .select(`
          id_tipo_residuo:residuo!inner(id_tipo_residuo),
          nom_residuo:residuo!inner(nom_residuo),
          qtd_total,
          vlr_total
        `)
        .in('id_coleta', selectedColetaIds)
        .eq('des_status', 'A');

      if (error) throw error;

      // Consolidar por tipo de resíduo
      const consolidated: Record<number, ResiduoConsolidado> = {};
      
      (data || []).forEach((item: any) => {
        const tipoId = item.id_tipo_residuo.id_tipo_residuo;
        
        if (!consolidated[tipoId]) {
          consolidated[tipoId] = {
            id_tipo_residuo: tipoId,
            nom_residuo: item.nom_residuo.nom_residuo,
            qtd_total: 0,
            vlr_total: 0,
          };
        }
        
        consolidated[tipoId].qtd_total += Number(item.qtd_total);
        consolidated[tipoId].vlr_total += Number(item.vlr_total);
      });

      setResiduosConsolidados(Object.values(consolidated));
    } catch (error) {
      console.error('Erro ao carregar resíduos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados dos resíduos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCodValidador = () => {
    const dateStr = format(new Date(), 'yyyyMMdd');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CERT-${dateStr}-${randomNum}`;
  };

  const handleGenerate = async () => {
    if (!user) return;

    try {
      setGenerating(true);

      const codValidador = generateCodValidador();

      // 1. Inserir certificado
      const { data: certificado, error: certError } = await supabase
        .from('certificado')
        .insert({
          cod_validador: codValidador,
          dat_periodo_inicio: datPeriodoInicio.toISOString(),
          dat_periodo_fim: datPeriodoFim.toISOString(),
          qtd_total_certificado: qtdTotalCertificado,
          vlr_total_certificado: vlrTotalCertificado,
          num_cpf_cnpj_gerador: entidade?.num_cpf_cnpj || '',
          id_entidade: selectedColetas[0].id_entidade_geradora,
          observacoes: observacoes || null,
          id_usuario_criador: user.id,
          dat_criacao: new Date().toISOString(),
          des_status: 'A',
          des_locked: 'D',
        })
        .select()
        .single();

      if (certError) throw certError;

      // 2. Inserir resíduos do certificado
      const residuosInserts = residuosConsolidados.map(residuo => ({
        id_certificado: certificado.id_certificado,
        id_tipo_residuo: residuo.id_tipo_residuo,
        nom_residuo: residuo.nom_residuo,
        qtd_total: residuo.qtd_total,
        vlr_total: residuo.vlr_total,
        dat_criacao: new Date().toISOString(),
      }));

      const { error: residuosError } = await supabase
        .from('certificado_residuo')
        .insert(residuosInserts);

      if (residuosError) throw residuosError;

      // 3. Vincular coletas ao certificado
      const { error: updateError } = await supabase
        .from('coleta')
        .update({ id_certificado: certificado.id_certificado })
        .in('id_coleta', selectedColetaIds);

      if (updateError) throw updateError;

      // 4. Registrar log
      await supabase
        .from('certificado_log')
        .insert({
          id_certificado: certificado.id_certificado,
          des_acao: 'CRIACAO',
          des_observacao: `Certificado ${codValidador} criado com ${selectedColetas.length} coleta(s)`,
          id_usuario: user.id,
          dat_log: new Date().toISOString(),
        });

      toast({
        title: 'Sucesso!',
        description: `Certificado ${codValidador} gerado com sucesso`,
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar certificado',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    // Se for string no formato YYYY-MM-DD, fazer parse manual para evitar problema de fuso horário
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
    }
    // Para Date ou datetime string, usar parse normal
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview do Certificado</DialogTitle>
          <DialogDescription>
            Revise as informações antes de gerar o certificado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Gerais */}
          <div className="grid grid-cols-2 gap-4">
            {/* Entidade Coletora (à esquerda) */}
            <div>
              <Label className="text-sm font-semibold text-gray-600">Entidade Coletora</Label>
              <p className="text-sm">{entidadeColetora?.nom_entidade || '-'}</p>
              <p className="text-xs text-gray-500">{entidadeColetora?.num_cpf_cnpj || '-'}</p>
              <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                <div>CEP: {entidadeColetora?.num_cep || '-'}</div>
                <div>Logradouro: {entidadeColetora?.des_logradouro || '-'}</div>
                <div>Bairro: {entidadeColetora?.des_bairro || '-'}</div>
                <div>Município: {nomMunicipioColetora || entidadeColetora?.municipio?.nom_municipio || '-'}</div>
              </div>
            </div>
            {/* Entidade Geradora (à direita) */}
            <div>
              <Label className="text-sm font-semibold text-gray-600">Entidade Geradora</Label>
              <p className="text-sm">{entidade?.nom_entidade}</p>
              <p className="text-xs text-gray-500">{entidade?.num_cpf_cnpj}</p>
              <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                <div>CEP: {entidade?.num_cep || '-'}</div>
                <div>Logradouro: {entidade?.des_logradouro || '-'}</div>
                <div>Bairro: {entidade?.des_bairro || '-'}</div>
                <div>Município: {nomMunicipioGeradora || entidade?.municipio?.nom_municipio || '-'}</div>
              </div>
            </div>
            {/* Período abaixo, ocupando largura total */}
            <div className="col-span-2">
              <Label className="text-sm font-semibold text-gray-600">Período</Label>
              <p className="text-sm">{formatDate(datPeriodoInicio)} até {formatDate(datPeriodoFim)}</p>
            </div>
          </div>

          {/* Texto explicativo entre entidades e resíduos */}
          <p className="text-sm text-gray-600">
            A Entidade Coletora acima certifica que recebeu e/ou coletou, do Gerador, no período especificado, os resíduos sólidos listados abaixo, destinados ao tratamento por meio de reciclagem.
          </p>

          {/* Coletas Incluídas */}
          <div>
            <Label className="text-sm font-semibold text-gray-600">Coletas Incluídas ({selectedColetas.length})</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedColetas.map(coleta => (
                <span key={coleta.id_coleta} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {coleta.cod_coleta}
                </span>
              ))}
            </div>
          </div>

          {/* Resíduos Consolidados */}
          <div>
            <Label className="text-sm font-semibold text-gray-600">Resíduos Consolidados</Label>
            {loading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Resíduo</th>
                      <th className="text-right p-2">Quantidade</th>
                      <th className="text-right p-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residuosConsolidados.map((residuo) => (
                      <tr key={residuo.id_tipo_residuo} className="border-b">
                        <td className="p-2">{residuo.nom_residuo}</td>
                        <td className="p-2 text-right">{residuo.qtd_total.toFixed(2)} kg</td>
                        <td className="p-2 text-right font-semibold">{formatCurrency(residuo.vlr_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totais */}
          <div className="grid grid-cols-2 gap-4 bg-green-50 p-4 rounded-md">
            <div>
              <Label className="text-sm font-semibold text-gray-600">Quantidade Total</Label>
              <p className="text-lg font-bold text-recycle-green">{qtdTotalCertificado.toFixed(2)} kg</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-600">Valor Total</Label>
              <p className="text-lg font-bold text-recycle-green">{formatCurrency(vlrTotalCertificado)}</p>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Digite observações adicionais sobre este certificado..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={loading || generating}
            className="bg-green-600 hover:bg-green-700"
          >
            {generating ? 'Gerando...' : 'Confirmar e Gerar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
