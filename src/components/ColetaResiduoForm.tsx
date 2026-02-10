import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDecimalMask, useCurrencyMask } from '@/hooks/useInputMask';
import { cn } from '@/lib/utils';
import { useOfflineForm } from '@/hooks/useOfflineForm';

interface TipoResiduo {
  id_tipo_residuo: number;
  des_tipo_residuo: string;
}

interface Residuo {
  id_residuo: number;
  nom_residuo: string;
  id_tipo_residuo: number;
  tipo_residuo: {
    des_tipo_residuo: string;
  };
}

interface ColetaResiduo {
  id?: number;
  id_residuo: number;
  nom_residuo: string;
  tipo_residuo: string;
  qtd_total: number;
  vlr_total: number;
  subtotal: number;
  vlr_custo?: number;
  subtotal_custo?: number;
}

interface TabelaPrecoResiduo {
  id_residuo: number;
  vlr_total: number;
}

interface ColetaResiduoFormProps {
  onBack: () => void;
  onAdd: (residuo: ColetaResiduo) => void;
  existingResiduos: ColetaResiduo[];
  editingResiduo?: ColetaResiduo | null;
  tabelaPrecos?: TabelaPrecoResiduo[] | null;
  tabelaRestrita?: boolean;
  comCusto?: boolean;
}

export function ColetaResiduoForm({ onBack, onAdd, existingResiduos, editingResiduo, tabelaPrecos, tabelaRestrita, comCusto }: ColetaResiduoFormProps) {
  const [tiposResiduos, setTiposResiduos] = useState<TipoResiduo[]>([]);
  const [residuos, setResiduos] = useState<Residuo[]>([]);
  const [filteredResiduos, setFilteredResiduos] = useState<Residuo[]>([]);
  const [selectedTipoResiduo, setSelectedTipoResiduo] = useState('');
  const [selectedResiduo, setSelectedResiduo] = useState<Residuo | null>(null);
  const [openResiduoCombo, setOpenResiduoCombo] = useState(false);
  const { toast } = useToast();

  // Usando as máscaras personalizadas com limites
  // REGRA 001: Limitar Quantidade: 9999999999,99
  // REGRA 002: Limitar Valor: 9.999,99
  const quantidade = useDecimalMask('', 9999999999.99);
  const valorUnitario = useCurrencyMask('', 9999.99);
  const valorCusto = useCurrencyMask('', 9999.99);
  
  // Hook offline para manter consistência, mas neste caso é apenas local
  const { submitForm, isSubmitting } = useOfflineForm({
    table: 'coleta_residuo',
    onlineSubmit: async (data) => {
      // Esta é uma adição local, não salva no banco ainda
      return data;
    },
    onSuccess: () => {
      // Callback executado após processar o resíduo
      if (selectedResiduo && quantidade.value && valorUnitario.value) {
        const qtd = parseFloat(quantidade.value);
        const valor = valorUnitario.getNumericValue();
        const custoValue = comCusto ? valorCusto.getNumericValue() : undefined;
        
        const coletaResiduo: ColetaResiduo = {
          id: editingResiduo?.id,
          id_residuo: selectedResiduo.id_residuo,
          nom_residuo: selectedResiduo.nom_residuo,
          tipo_residuo: selectedResiduo.tipo_residuo?.des_tipo_residuo || '',
          qtd_total: qtd,
          vlr_total: valor,
          subtotal: qtd * valor,
          vlr_custo: custoValue,
          subtotal_custo: custoValue !== undefined ? qtd * custoValue : undefined,
        };

        onAdd(coletaResiduo);
        
        toast({
          title: "Sucesso",
          description: `Resíduo ${editingResiduo ? 'atualizado' : 'adicionado'} com sucesso.`,
        });
      }
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (editingResiduo) {
      // Encontrar o resíduo que está sendo editado
      const residuo = residuos.find(r => r.id_residuo === editingResiduo.id_residuo);
      if (residuo) {
        setSelectedResiduo(residuo);
        quantidade.setValue(editingResiduo.qtd_total.toFixed(2));
        valorUnitario.setValue(editingResiduo.vlr_total.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }));
        // Carregar valor de custo se existir
        if (editingResiduo.vlr_custo !== undefined && editingResiduo.vlr_custo !== null) {
          valorCusto.setValue(editingResiduo.vlr_custo.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }));
        }
        // Definir o tipo de resíduo automaticamente
        setSelectedTipoResiduo(residuo.id_tipo_residuo.toString());
      }
    }
  }, [editingResiduo, residuos]);

  useEffect(() => {
    console.log('[ColetaResiduoForm] Filtering residuos. selectedTipoResiduo:', selectedTipoResiduo);
    filterResiduos();
  }, [residuos, selectedTipoResiduo, existingResiduos]);

  const loadData = async () => {
    try {
      // Carregar apenas tipos de resíduos que possuem indicadores configurados
      const { data: tiposData } = await supabase
        .from('tipo_residuo')
        .select(`
          id_tipo_residuo, 
          des_tipo_residuo,
          tipo_residuo__indicador!inner (
            id_indicador
          )
        `)
        .eq('des_status', 'A')
        .order('des_tipo_residuo');

      console.log('[ColetaResiduoForm] Tipos de resíduo com indicadores:', tiposData);

      // Remover duplicatas (um tipo pode ter múltiplos indicadores)
      const tiposUnicos = tiposData?.reduce((acc: TipoResiduo[], current) => {
        const exists = acc.find(item => item.id_tipo_residuo === current.id_tipo_residuo);
        if (!exists) {
          acc.push({
            id_tipo_residuo: current.id_tipo_residuo,
            des_tipo_residuo: current.des_tipo_residuo
          });
        }
        return acc;
      }, []) || [];

      setTiposResiduos(tiposUnicos);

      // Carregar resíduos apenas dos tipos que possuem indicadores
      const tiposComIndicadoresIds = tiposUnicos.map(t => t.id_tipo_residuo);
      
      if (tiposComIndicadoresIds.length > 0) {
        const { data: residuosData } = await supabase
          .from('residuo')
          .select(`
            id_residuo,
            nom_residuo,
            id_tipo_residuo,
            tipo_residuo!id_tipo_residuo (
              des_tipo_residuo
            )
          `)
          .eq('des_status', 'A')
          .in('id_tipo_residuo', tiposComIndicadoresIds)
          .order('nom_residuo');

        console.log('[ColetaResiduoForm] Residuos de tipos com indicadores:', residuosData);
        setResiduos(residuosData || []);
      } else {
        console.log('[ColetaResiduoForm] Nenhum tipo de resíduo com indicadores encontrado');
        setResiduos([]);
      }
    } catch (error) {
      console.error('[ColetaResiduoForm] Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados. Verifique se existem tipos de resíduos com indicadores configurados.',
        variant: 'destructive',
      });
    }
  };

  const filterResiduos = () => {
    let filtered = [...residuos];

    // Filtrar por tipo de resíduo usando ID diretamente
    if (selectedTipoResiduo) {
      const selectedTipoId = parseInt(selectedTipoResiduo);
      filtered = filtered.filter(r => r.id_tipo_residuo === selectedTipoId);
      console.log('[ColetaResiduoForm] Filtered by type:', selectedTipoId, filtered);
    }

    // Remover resíduos já adicionados (exceto se estiver editando)
    if (!editingResiduo) {
      filtered = filtered.filter(r => 
        !existingResiduos.some(er => er.id_residuo === r.id_residuo)
      );
    } else {
      // Se estiver editando, permitir o resíduo atual e remover os outros já adicionados
      filtered = filtered.filter(r => 
        r.id_residuo === editingResiduo.id_residuo || 
        !existingResiduos.some(er => er.id_residuo === r.id_residuo)
      );
    }

    console.log('[ColetaResiduoForm] Final filtered residuos:', filtered);
    setFilteredResiduos(filtered);
  };

  const handleSelectTipoResiduo = (value: string) => {
    console.log('[ColetaResiduoForm] Tipo residuo selected:', value);
    setSelectedTipoResiduo(value);
    setSelectedResiduo(null); // Limpar seleção de resíduo ao mudar tipo
  };

  const handleSelectResiduo = (residuo: Residuo) => {
    setSelectedResiduo(residuo);
    setOpenResiduoCombo(false);
    
    // Check if there's a price table entry for this residuo
    if (tabelaPrecos && tabelaPrecos.length > 0) {
      const precoEntry = tabelaPrecos.find(tp => tp.id_residuo === residuo.id_residuo);
      if (precoEntry) {
        valorUnitario.setValue(precoEntry.vlr_total.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }));
      }
    }
    
    // Se for Rejeito, setar valor automaticamente como 0
    if (residuo.nom_residuo.toLowerCase().includes('rejeito')) {
      valorUnitario.setValue('0,00');
    }
  };

  const calculateSubtotal = () => {
    const qtd = parseFloat(quantidade.value) || 0;
    const valor = valorUnitario.getNumericValue();
    return qtd * valor;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedResiduo || !quantidade.value || !valorUnitario.value) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    // Validar valor de custo quando com custo
    if (comCusto && (!valorCusto.value || valorCusto.getNumericValue() < 0.01)) {
      toast({
        title: 'Erro',
        description: 'Valor Unitário de Custo deve ser no mínimo R$ 0,01',
        variant: 'destructive',
      });
      return;
    }

    const qtd = parseFloat(quantidade.value);
    const valor = valorUnitario.getNumericValue();

    // Verificar se é Rejeito para permitir valor 0
    const isRejeito = selectedResiduo.nom_residuo.toLowerCase().includes('rejeito');

    // REGRA 001: Validar limite de quantidade
    if (qtd <= 0) {
      toast({
        title: 'Erro',
        description: 'Quantidade deve ser maior que zero',
        variant: 'destructive',
      });
      return;
    }

    if (qtd > 9999999999.99) {
      toast({
        title: 'Erro',
        description: 'Quantidade não pode exceder 9.999.999.999,99 kg',
        variant: 'destructive',
      });
      return;
    }

    // REGRA 002: Validar limite de valor
    if (!isRejeito && valor <= 0) {
      toast({
        title: 'Erro',
        description: 'Valor deve ser maior que zero',
        variant: 'destructive',
      });
      return;
    }

    if (valor > 9999.99) {
      toast({
        title: 'Erro',
        description: 'Valor unitário não pode exceder R$ 9.999,99',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Usar o hook offline form que vai processar e chamar onSuccess
      await submitForm({
        id_residuo: selectedResiduo.id_residuo,
        qtd_total: qtd,
        vlr_total: valor
      });
    } catch (error) {
      console.error('Erro ao processar resíduo:', error);
    }
  };

  const clearTipoResiduoFilter = () => {
    setSelectedTipoResiduo('');
    setSelectedResiduo(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {editingResiduo ? 'Editar Resíduo' : 'Adicionar Resíduo à Coleta'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seleção de Resíduo */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Resíduo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tipo_residuo">Filtrar por Tipo de Resíduo</Label>
              <div className="flex gap-2">
                <Select value={selectedTipoResiduo} onValueChange={handleSelectTipoResiduo}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={
                      tiposResiduos.length === 0 
                        ? "Nenhum tipo de resíduo com indicadores disponível" 
                        : "Selecione um tipo de resíduo"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposResiduos.map((tipo) => (
                      <SelectItem key={tipo.id_tipo_residuo} value={tipo.id_tipo_residuo.toString()}>
                        {tipo.des_tipo_residuo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTipoResiduo && (
                  <Button 
                    variant="outline" 
                    onClick={clearTipoResiduoFilter}
                    className="px-3"
                  >
                    Limpar
                  </Button>
                )}
              </div>
              
              {tiposResiduos.length === 0 && (
                <p className="text-sm text-red-500 mt-2">
                  ⚠️ Nenhum tipo de resíduo possui indicadores configurados. 
                  Configure indicadores na tabela tipo_residuo__indicador para poder adicionar resíduos às coletas.
                </p>
              )}
            </div>

            <div>
              <Label>Selecionar Resíduo</Label>
              <Select 
                value={selectedResiduo?.id_residuo.toString() || ''} 
                onValueChange={(value) => {
                  const residuo = filteredResiduos.find(r => r.id_residuo.toString() === value);
                  if (residuo) {
                    handleSelectResiduo(residuo);
                  }
                }}
                disabled={!selectedTipoResiduo || tiposResiduos.length === 0}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      tiposResiduos.length === 0
                        ? "Configure indicadores para tipos de resíduos primeiro"
                        : !selectedTipoResiduo 
                        ? "Primeiro selecione um tipo de resíduo" 
                        : filteredResiduos.length === 0
                        ? "Nenhum resíduo disponível para este tipo"
                        : "Selecione um resíduo..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredResiduos.map((residuo) => (
                    <SelectItem key={residuo.id_residuo} value={residuo.id_residuo.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{residuo.nom_residuo}</span>
                        <span className="text-sm text-gray-500">
                          {residuo.tipo_residuo?.des_tipo_residuo}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedTipoResiduo && filteredResiduos.length === 0 && tiposResiduos.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Nenhum resíduo disponível para este tipo ou todos já foram adicionados.
                </p>
              )}
              
              {!selectedTipoResiduo && tiposResiduos.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Selecione um tipo de resíduo para ver os resíduos disponíveis.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dados do Resíduo */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Resíduo</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedResiduo ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Resíduo Selecionado</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">{selectedResiduo.nom_residuo}</div>
                    <div className="text-sm text-gray-600">
                      {selectedResiduo.tipo_residuo?.des_tipo_residuo}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="quantidade">Quantidade (kg) *</Label>
                  <p className="text-xs text-gray-500 mb-1">
                    Máximo: 9.999.999.999,99 kg
                  </p>
                  <Input
                    id="quantidade"
                    type="text"
                    value={quantidade.value}
                    onChange={(e) => quantidade.handleChange(e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="valor">Previsão de Venda (R$) *</Label>
                  {selectedResiduo?.nom_residuo.toLowerCase().includes('rejeito') ? (
                    <p className="text-sm text-amber-600 mb-1">
                      Rejeito não possui valor comercial
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mb-1">
                      Máximo: R$ 9.999,99
                    </p>
                  )}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <Input
                      id="valor"
                      type="text"
                      value={valorUnitario.value}
                      onChange={(e) => valorUnitario.handleChange(e.target.value)}
                      placeholder="0,00"
                      className="pl-10"
                      required
                      disabled={selectedResiduo?.nom_residuo.toLowerCase().includes('rejeito') || (tabelaRestrita && tabelaPrecos?.some(tp => tp.id_residuo === selectedResiduo?.id_residuo))}
                    />
                  </div>
                </div>

                {comCusto && (
                  <div>
                    <Label htmlFor="valor_custo">Valor Unitário de Custo (R$) *</Label>
                    <p className="text-xs text-gray-500 mb-1">
                      Máximo: R$ 9.999,99
                    </p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        R$
                      </span>
                      <Input
                        id="valor_custo"
                        type="text"
                        value={valorCusto.value}
                        onChange={(e) => valorCusto.handleChange(e.target.value)}
                        placeholder="0,00"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                {quantidade.value && valorUnitario.value && (
                  <div className="p-3 bg-recycle-green-light rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Subtotal Venda:</span>
                      <span className="text-lg font-bold text-recycle-green">
                        R$ {calculateSubtotal().toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    {comCusto && valorCusto.value && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Subtotal Custo:</span>
                        <span className="text-lg font-bold text-orange-600">
                          R$ {((parseFloat(quantidade.value) || 0) * valorCusto.getNumericValue()).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4 pt-4 justify-end">
                  <Button type="button" variant="outline" onClick={onBack}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processando...' : `${editingResiduo ? 'Atualizar' : 'Adicionar'} Resíduo`}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {tiposResiduos.length === 0 
                  ? "Configure indicadores para tipos de resíduos para poder adicionar resíduos às coletas"
                  : "Selecione um tipo de resíduo e depois um resíduo específico"
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
