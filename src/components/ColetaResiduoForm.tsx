
import { useState, useEffect } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TipoResiduo {
  id_tipo_residuo: number;
  des_tipo_residuo: string;
}

interface Residuo {
  id_residuo: number;
  nom_residuo: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResiduo, setSelectedResiduo] = useState<Residuo | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [valorUnitario, setValorUnitario] = useState('');
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
      }
    }
  }, [editingResiduo, residuos]);

  useEffect(() => {
    filterResiduos();
  }, [residuos, selectedTipoResiduo, searchTerm]);

  const loadData = async () => {
    try {
      // Carregar tipos de resíduos
      const { data: tiposData } = await supabase
        .from('tipo_residuo')
        .select('id_tipo_residuo, des_tipo_residuo')
        .eq('des_status', 'A')
        .order('des_tipo_residuo');

      setTiposResiduos(tiposData || []);

      // Carregar resíduos
      const { data: residuosData } = await supabase
        .from('residuo')
        .select(`
          id_residuo,
          nom_residuo,
          tipo_residuo:id_tipo_residuo (
            des_tipo_residuo
          )
        `)
        .eq('des_status', 'A')
        .order('nom_residuo');

      setResiduos(residuosData || []);
    } catch (error) {
      console.error('[ColetaResiduoForm] Error loading data:', error);
    }
  };

  const filterResiduos = () => {
    let filtered = [...residuos];

    // Filtrar por tipo de resíduo
    if (selectedTipoResiduo) {
      filtered = filtered.filter(r => 
        r.tipo_residuo?.des_tipo_residuo === selectedTipoResiduo
      );
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.nom_residuo.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
              <Select value={selectedTipoResiduo} onValueChange={setSelectedTipoResiduo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  {tiposResiduos.map((tipo) => (
                    <SelectItem key={tipo.id_tipo_residuo} value={tipo.des_tipo_residuo}>
                      {tipo.des_tipo_residuo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Buscar Resíduo</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Digite o nome do resíduo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              {filteredResiduos.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Nenhum resíduo disponível
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredResiduos.map((residuo) => (
                    <div
                      key={residuo.id_residuo}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b ${
                        selectedResiduo?.id_residuo === residuo.id_residuo 
                          ? 'bg-recycle-green-light border-recycle-green' 
                          : ''
                      }`}
                      onClick={() => handleSelectResiduo(residuo)}
                    >
                      <div className="font-medium">{residuo.nom_residuo}</div>
                      <div className="text-sm text-gray-500">
                        {residuo.tipo_residuo?.des_tipo_residuo}
                      </div>
                    </div>
                  ))}
                </div>
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
                Selecione um resíduo na lista ao lado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
