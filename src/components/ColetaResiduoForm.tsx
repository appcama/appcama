
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
import { cn } from '@/lib/utils';

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
}

interface ColetaResiduoFormProps {
  onBack: () => void;
  onAdd: (residuo: ColetaResiduo) => void;
  existingResiduos: ColetaResiduo[];
  editingResiduo?: ColetaResiduo | null;
}

export function ColetaResiduoForm({ onBack, onAdd, existingResiduos, editingResiduo }: ColetaResiduoFormProps) {
  const [tiposResiduos, setTiposResiduos] = useState<TipoResiduo[]>([]);
  const [residuos, setResiduos] = useState<Residuo[]>([]);
  const [filteredResiduos, setFilteredResiduos] = useState<Residuo[]>([]);
  const [selectedTipoResiduo, setSelectedTipoResiduo] = useState('');
  const [selectedResiduo, setSelectedResiduo] = useState<Residuo | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [valorUnitario, setValorUnitario] = useState('');
  const [openResiduoCombo, setOpenResiduoCombo] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (editingResiduo) {
      // Encontrar o resíduo que está sendo editado
      const residuo = residuos.find(r => r.id_residuo === editingResiduo.id_residuo);
      if (residuo) {
        setSelectedResiduo(residuo);
        setQuantidade(editingResiduo.qtd_total.toString());
        setValorUnitario(editingResiduo.vlr_total.toString());
        // Definir o tipo de resíduo automaticamente
        setSelectedTipoResiduo(residuo.id_tipo_residuo.toString());
      }
    }
  }, [editingResiduo, residuos]);

  useEffect(() => {
    filterResiduos();
  }, [residuos, selectedTipoResiduo]);

  const loadData = async () => {
    try {
      // Carregar tipos de resíduos
      const { data: tiposData } = await supabase
        .from('tipo_residuo')
        .select('id_tipo_residuo, des_tipo_residuo')
        .eq('des_status', 'A')
        .order('des_tipo_residuo');

      setTiposResiduos(tiposData || []);

      // Carregar resíduos com join correto usando id_tipo_residuo
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
        .order('nom_residuo');

      console.log('[ColetaResiduoForm] Residuos loaded:', residuosData);
      setResiduos(residuosData || []);
    } catch (error) {
      console.error('[ColetaResiduoForm] Error loading data:', error);
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

    setFilteredResiduos(filtered);
  };

  const handleSelectResiduo = (residuo: Residuo) => {
    setSelectedResiduo(residuo);
    setOpenResiduoCombo(false);
  };

  const calculateSubtotal = () => {
    const qtd = parseFloat(quantidade) || 0;
    const valor = parseFloat(valorUnitario) || 0;
    return qtd * valor;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedResiduo || !quantidade || !valorUnitario) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    const qtd = parseFloat(quantidade);
    const valor = parseFloat(valorUnitario);

    if (qtd <= 0 || valor <= 0) {
      toast({
        title: 'Erro',
        description: 'Quantidade e valor devem ser maiores que zero',
        variant: 'destructive',
      });
      return;
    }

    const coletaResiduo: ColetaResiduo = {
      id: editingResiduo?.id,
      id_residuo: selectedResiduo.id_residuo,
      nom_residuo: selectedResiduo.nom_residuo,
      tipo_residuo: selectedResiduo.tipo_residuo?.des_tipo_residuo || '',
      qtd_total: qtd,
      vlr_total: valor,
      subtotal: qtd * valor,
    };

    onAdd(coletaResiduo);
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
                <Select value={selectedTipoResiduo} onValueChange={setSelectedTipoResiduo}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um tipo de resíduo" />
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
            </div>

            <div>
              <Label>Selecionar Resíduo</Label>
              <Popover open={openResiduoCombo} onOpenChange={setOpenResiduoCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openResiduoCombo}
                    className="w-full justify-between"
                    disabled={!selectedTipoResiduo}
                  >
                    {selectedResiduo
                      ? selectedResiduo.nom_residuo
                      : selectedTipoResiduo 
                        ? "Selecione um resíduo..."
                        : "Primeiro selecione um tipo de resíduo"
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar resíduo..." />
                    <CommandEmpty>
                      {selectedTipoResiduo 
                        ? "Nenhum resíduo encontrado."
                        : "Selecione um tipo de resíduo primeiro."
                      }
                    </CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {filteredResiduos.map((residuo) => (
                        <CommandItem
                          key={residuo.id_residuo}
                          value={residuo.nom_residuo}
                          onSelect={() => handleSelectResiduo(residuo)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedResiduo?.id_residuo === residuo.id_residuo ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{residuo.nom_residuo}</span>
                            <span className="text-sm text-gray-500">
                              {residuo.tipo_residuo?.des_tipo_residuo}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {selectedTipoResiduo && filteredResiduos.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Nenhum resíduo disponível para este tipo ou todos já foram adicionados.
                </p>
              )}
              
              {!selectedTipoResiduo && (
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
                  <Input
                    id="quantidade"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="valor">Valor Unitário (R$) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valorUnitario}
                    onChange={(e) => setValorUnitario(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                {quantidade && valorUnitario && (
                  <div className="p-3 bg-recycle-green-light rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Subtotal:</span>
                      <span className="text-lg font-bold text-recycle-green">
                        R$ {calculateSubtotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={onBack}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-recycle-green hover:bg-recycle-green-dark"
                  >
                    {editingResiduo ? 'Atualizar' : 'Adicionar'} Resíduo
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Selecione um tipo de resíduo e depois um resíduo específico
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
