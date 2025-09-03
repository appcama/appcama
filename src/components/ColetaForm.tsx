import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ColetaResiduoForm } from './ColetaResiduoForm';

interface PontoColeta {
  id_ponto_coleta: number;
  nom_ponto_coleta: string;
}

interface Entidade {
  id_entidade: number;
  nom_entidade: string;
}

interface Evento {
  id_evento: number;
  nom_evento: string;
}

interface ColetaResiduo {
  id?: number;
  id_residuo: number;
  nom_residuo: string;
  tipo_residuo: string;
  qtd_total: number;
  vlr_total: number;
  subtotal: number;
}

interface ColetaFormProps {
  onBack: () => void;
  onSuccess: () => void;
  editingColeta?: any;
}

export function ColetaForm({ onBack, onSuccess, editingColeta }: ColetaFormProps) {
  const [pontosColeta, setPontosColeta] = useState<PontoColeta[]>([]);
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [coletaResiduos, setColetaResiduos] = useState<ColetaResiduo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResiduoForm, setShowResiduoForm] = useState(false);
  const [editingResiduo, setEditingResiduo] = useState<ColetaResiduo | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    id_ponto_coleta: '',
    id_entidade_geradora: '',
    id_evento: '',
    dat_coleta: new Date().toISOString().split('T')[0],
    cod_coleta: '',
  });

  useEffect(() => {
    console.log('[ColetaForm] useEffect triggered with editingColeta:', editingColeta);
    loadFormData();
    if (editingColeta) {
      console.log('[ColetaForm] editingColeta exists, calling loadColetaData');
      loadColetaData();
    } else {
      console.log('[ColetaForm] No editingColeta, generating new codigo');
      generateCodigoColeta();
    }
  }, [editingColeta]);

  const loadFormData = async () => {
    try {
      console.log('[ColetaForm] Loading form data...');
      
      // Carregar pontos de coleta
      console.log('[ColetaForm] Loading pontos de coleta...');
      const { data: pontosData, error: pontosError } = await supabase
        .from('ponto_coleta')
        .select('id_ponto_coleta, nom_ponto_coleta')
        .eq('des_status', 'A')
        .order('nom_ponto_coleta');

      if (pontosError) {
        console.error('[ColetaForm] Error loading pontos de coleta:', pontosError);
        toast({
          title: "Erro",
          description: "Erro ao carregar pontos de coleta: " + pontosError.message,
          variant: "destructive"
        });
      } else {
        console.log('[ColetaForm] Pontos de coleta loaded:', pontosData?.length || 0);
        setPontosColeta(pontosData || []);
      }

      // Carregar entidades geradoras (simplificar query para evitar problemas com JOIN)
      console.log('[ColetaForm] Loading entidades geradoras...');
      const { data: entidadesData, error: entidadesError } = await supabase
        .from('entidade')
        .select(`
          id_entidade, 
          nom_entidade,
          id_tipo_entidade
        `)
        .eq('des_status', 'A')
        .order('nom_entidade');

      if (entidadesError) {
        console.error('[ColetaForm] Error loading entidades:', entidadesError);
        toast({
          title: "Erro",
          description: "Erro ao carregar entidades: " + entidadesError.message,
          variant: "destructive"
        });
      } else {
        // Carregar tipos de entidade separadamente para fazer o filtro
        const { data: tiposEntidadeData, error: tiposError } = await supabase
          .from('tipo_entidade')
          .select('id_tipo_entidade, des_geradora_residuo')
          .eq('des_status', 'A');

        if (tiposError) {
          console.error('[ColetaForm] Error loading tipos entidade:', tiposError);
          // Usar todas as entidades se não conseguir carregar os tipos
          setEntidades(entidadesData || []);
        } else {
          // Filtrar entidades geradoras
          const tiposGeradoras = new Set(
            tiposEntidadeData
              .filter(tipo => tipo.des_geradora_residuo === 'A')
              .map(tipo => tipo.id_tipo_entidade)
          );
          
          const entidadesGeradoras = (entidadesData || []).filter(
            (entidade: any) => tiposGeradoras.has(entidade.id_tipo_entidade)
          );
          
          console.log('[ColetaForm] Entidades geradoras loaded:', entidadesGeradoras.length);
          setEntidades(entidadesGeradoras);
        }
      }

      // Carregar eventos
      console.log('[ColetaForm] Loading eventos...');
      const { data: eventosData, error: eventosError } = await supabase
        .from('evento')
        .select('id_evento, nom_evento')
        .eq('des_status', 'A')
        .order('nom_evento');

      if (eventosError) {
        console.error('[ColetaForm] Error loading eventos:', eventosError);
        toast({
          title: "Erro",
          description: "Erro ao carregar eventos: " + eventosError.message,
          variant: "destructive"
        });
      } else {
        console.log('[ColetaForm] Eventos loaded:', eventosData?.length || 0);
        setEventos(eventosData || []);
      }

      console.log('[ColetaForm] Form data loading completed');
    } catch (error) {
      console.error('[ColetaForm] Error loading form data:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados do formulário",
        variant: "destructive"
      });
    }
  };

  const loadColetaData = async () => {
    if (!editingColeta) return;

    try {
      console.log('[ColetaForm] Loading coleta data for editing:', editingColeta);
      console.log('[ColetaForm] FK fields:', {
        id_ponto_coleta: editingColeta.id_ponto_coleta,
        id_entidade_geradora: editingColeta.id_entidade_geradora,
        id_evento: editingColeta.id_evento
      });

      // Carregar dados da coleta
      const newFormData = {
        id_ponto_coleta: editingColeta.id_ponto_coleta?.toString() || '',
        id_entidade_geradora: editingColeta.id_entidade_geradora?.toString() || '',
        id_evento: editingColeta.id_evento?.toString() || '',
        dat_coleta: editingColeta.dat_coleta ? editingColeta.dat_coleta.split('T')[0] : '',
        cod_coleta: editingColeta.cod_coleta || '',
      };

      console.log('[ColetaForm] Setting form data:', newFormData);
      setFormData(newFormData);

      // Carregar resíduos da coleta
      const { data: residuosData } = await supabase
        .from('coleta_residuo')
        .select(`
          id_coleta_residuo,
          id_residuo,
          qtd_total,
          vlr_total,
          residuo:id_residuo (
            nom_residuo,
            tipo_residuo:id_tipo_residuo (
              des_tipo_residuo
            )
          )
        `)
        .eq('id_coleta', editingColeta.id_coleta)
        .eq('des_status', 'A');

      if (residuosData) {
        const residuosFormatted = residuosData.map((item: any) => ({
          id: item.id_coleta_residuo,
          id_residuo: item.id_residuo,
          nom_residuo: item.residuo?.nom_residuo || '',
          tipo_residuo: item.residuo?.tipo_residuo?.des_tipo_residuo || '',
          qtd_total: item.qtd_total,
          vlr_total: item.vlr_total,
          subtotal: item.qtd_total * item.vlr_total,
        }));
        setColetaResiduos(residuosFormatted);
      }
    } catch (error) {
      console.error('[ColetaForm] Error loading coleta data:', error);
    }
  };

  const generateCodigoColeta = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    
    const codigo = `COL-${year}${month}${day}-${time}`;
    setFormData(prev => ({ ...prev, cod_coleta: codigo }));
  };

  const handleAddResiduo = (residuo: ColetaResiduo) => {
    if (editingResiduo) {
      setColetaResiduos(prev => prev.map(r => 
        r.id_residuo === editingResiduo.id_residuo ? residuo : r
      ));
    } else {
      setColetaResiduos(prev => [...prev, residuo]);
    }
    setShowResiduoForm(false);
    setEditingResiduo(null);
  };

  const handleEditResiduo = (residuo: ColetaResiduo) => {
    setEditingResiduo(residuo);
    setShowResiduoForm(true);
  };

  const handleRemoveResiduo = (id_residuo: number) => {
    setColetaResiduos(prev => prev.filter(r => r.id_residuo !== id_residuo));
  };

  const calculateTotals = () => {
    const totalQuantidade = coletaResiduos.reduce((sum, r) => sum + r.qtd_total, 0);
    const totalValor = coletaResiduos.reduce((sum, r) => sum + r.subtotal, 0);
    return { totalQuantidade, totalValor };
  };

  // Função para recalcular indicadores após operações na coleta
  const recalculateIndicators = async (coletaId: number) => {
    try {
      console.log('[ColetaForm] Recalculando indicadores para coleta:', coletaId);
      
      // Chamar a função do banco que calcula os indicadores automaticamente
      const { error } = await supabase.rpc('calculate_and_insert_indicators', {
        p_id_coleta: coletaId
      });

      if (error) {
        console.error('[ColetaForm] Erro ao recalcular indicadores:', error);
        throw error;
      }

      console.log('[ColetaForm] Indicadores recalculados com sucesso para coleta:', coletaId);
    } catch (error) {
      console.error('[ColetaForm] Erro ao recalcular indicadores:', error);
      // Não interrumpemos o fluxo principal, apenas logamos o erro
      toast({
        title: 'Aviso',
        description: 'Coleta salva, mas houve um problema ao calcular os indicadores ambientais.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id_ponto_coleta || !formData.dat_coleta || coletaResiduos.length === 0) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios e adicione pelo menos um resíduo',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { totalValor } = calculateTotals();

      const coletaData = {
        cod_coleta: formData.cod_coleta,
        id_ponto_coleta: parseInt(formData.id_ponto_coleta),
        id_entidade_geradora: formData.id_entidade_geradora ? parseInt(formData.id_entidade_geradora) : null,
        id_evento: formData.id_evento ? parseInt(formData.id_evento) : null,
        dat_coleta: formData.dat_coleta,
        vlr_total: totalValor,
        id_tipo_situacao: 1, // Assumindo situação padrão
        id_usuario_criador: 1, // Usuário logado
        dat_criacao: new Date().toISOString(),
      };

      let coletaId: number;

      if (editingColeta) {
        // Atualizar coleta existente
        const { error } = await supabase
          .from('coleta')
          .update({
            ...coletaData,
            id_usuario_atualizador: 1,
            dat_atualizacao: new Date().toISOString(),
          })
          .eq('id_coleta', editingColeta.id_coleta);

        if (error) throw error;
        coletaId = editingColeta.id_coleta;

        // Remover resíduos existentes (os indicadores serão removidos automaticamente pelo trigger)
        await supabase
          .from('coleta_residuo')
          .delete()
          .eq('id_coleta', coletaId);
      } else {
        // Criar nova coleta
        const { data, error } = await supabase
          .from('coleta')
          .insert(coletaData)
          .select('id_coleta')
          .single();

        if (error) throw error;
        coletaId = data.id_coleta;
      }

      // Inserir resíduos da coleta (os indicadores serão calculados automaticamente pelo trigger)
      const residuosData = coletaResiduos.map(residuo => ({
        id_coleta: coletaId,
        id_residuo: residuo.id_residuo,
        qtd_total: residuo.qtd_total,
        vlr_total: residuo.vlr_total,
        id_tipo_situacao: 1,
        id_usuario_criador: 1,
        dat_criacao: new Date().toISOString(),
      }));

      const { error: residuosError } = await supabase
        .from('coleta_residuo')
        .insert(residuosData);

      if (residuosError) throw residuosError;

      // Os indicadores serão calculados automaticamente pelo trigger do banco
      // Mas vamos também chamar a função manualmente para garantir que funcionou
      await recalculateIndicators(coletaId);

      toast({
        title: 'Sucesso',
        description: editingColeta 
          ? 'Coleta atualizada com sucesso! Indicadores ambientais recalculados.' 
          : 'Coleta cadastrada com sucesso! Indicadores ambientais calculados.',
      });

      onSuccess();
    } catch (error) {
      console.error('[ColetaForm] Error saving coleta:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar coleta',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const { totalQuantidade, totalValor } = calculateTotals();

  if (showResiduoForm) {
    return (
      <ColetaResiduoForm
        onBack={() => {
          setShowResiduoForm(false);
          setEditingResiduo(null);
        }}
        onAdd={handleAddResiduo}
        existingResiduos={coletaResiduos}
        editingResiduo={editingResiduo}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {editingColeta ? 'Editar Coleta' : 'Nova Coleta'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Coleta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cod_coleta">Código da Coleta *</Label>
                <Input
                  id="cod_coleta"
                  value={formData.cod_coleta}
                  onChange={(e) => setFormData(prev => ({ ...prev, cod_coleta: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dat_coleta">Data da Coleta *</Label>
                <Input
                  id="dat_coleta"
                  type="date"
                  value={formData.dat_coleta}
                  onChange={(e) => setFormData(prev => ({ ...prev, dat_coleta: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="id_ponto_coleta">Ponto de Coleta *</Label>
              <Select
                value={formData.id_ponto_coleta}
                onValueChange={(value) => setFormData(prev => ({ ...prev, id_ponto_coleta: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ponto de coleta" />
                </SelectTrigger>
                <SelectContent>
                  {pontosColeta.map((ponto) => (
                    <SelectItem key={ponto.id_ponto_coleta} value={ponto.id_ponto_coleta.toString()}>
                      {ponto.nom_ponto_coleta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="id_entidade_geradora">Entidade Geradora (Opcional)</Label>
              <Select
                value={formData.id_entidade_geradora}
                onValueChange={(value) => setFormData(prev => ({ ...prev, id_entidade_geradora: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a entidade geradora" />
                </SelectTrigger>
                <SelectContent>
                  {entidades.map((entidade) => (
                    <SelectItem key={entidade.id_entidade} value={entidade.id_entidade.toString()}>
                      {entidade.nom_entidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="id_evento">Evento (Opcional)</Label>
              <Select
                value={formData.id_evento}
                onValueChange={(value) => setFormData(prev => ({ ...prev, id_evento: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o evento" />
                </SelectTrigger>
                <SelectContent>
                  {eventos.map((evento) => (
                    <SelectItem key={evento.id_evento} value={evento.id_evento.toString()}>
                      {evento.nom_evento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Resíduos da Coleta</CardTitle>
              <Button
                type="button"
                onClick={() => setShowResiduoForm(true)}
                className="bg-recycle-green hover:bg-recycle-green-dark"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Resíduo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {coletaResiduos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum resíduo adicionado. Clique em "Adicionar Resíduo" para começar.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Resíduo</th>
                        <th className="text-left p-2 font-semibold">Tipo</th>
                        <th className="text-right p-2 font-semibold">Quantidade (kg)</th>
                        <th className="text-right p-2 font-semibold">Valor Unitário</th>
                        <th className="text-right p-2 font-semibold">Subtotal</th>
                        <th className="text-center p-2 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coletaResiduos.map((residuo) => (
                        <tr key={residuo.id_residuo} className="border-b">
                          <td className="p-2">{residuo.nom_residuo}</td>
                          <td className="p-2">{residuo.tipo_residuo}</td>
                          <td className="p-2 text-right">{residuo.qtd_total.toFixed(2)}</td>
                          <td className="p-2 text-right">
                            R$ {residuo.vlr_total.toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-semibold text-recycle-green">
                            R$ {residuo.subtotal.toFixed(2)}
                          </td>
                          <td className="p-2">
                            <div className="flex justify-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditResiduo(residuo)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveResiduo(residuo.id_residuo)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end space-y-2">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total de Quantidade:</span>
                        <span className="font-semibold">{totalQuantidade.toFixed(2)} kg</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span>Total de Valor:</span>
                        <span className="font-bold text-recycle-green">
                          R$ {totalValor.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading || coletaResiduos.length === 0}
            className="bg-recycle-green hover:bg-recycle-green-dark"
          >
            {loading ? 'Salvando...' : (editingColeta ? 'Atualizar' : 'Salvar')} Coleta
          </Button>
        </div>
      </form>
    </div>
  );
}
