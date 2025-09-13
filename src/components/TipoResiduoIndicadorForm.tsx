import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDecimalMask } from '@/hooks/useInputMask';
import { useOfflineForm } from '@/hooks/useOfflineForm';

interface Indicador {
  id_indicador: number;
  nom_indicador: string;
  des_status: string;
}

interface TipoResiduoIndicador {
  id?: number;
  id_indicador: number;
  nom_indicador: string;
  qtd_referencia: number | null;
}

interface TipoResiduoIndicadorFormProps {
  onBack: () => void;
  onAdd: (indicador: TipoResiduoIndicador) => void;
  existingIndicadores: TipoResiduoIndicador[];
  editingIndicador?: TipoResiduoIndicador | null;
}

export function TipoResiduoIndicadorForm({ onBack, onAdd, existingIndicadores, editingIndicador }: TipoResiduoIndicadorFormProps) {
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [selectedIndicador, setSelectedIndicador] = useState<Indicador | null>(null);
  const { toast } = useToast();

  // Usando máscara decimal para quantidade de referência
  const quantidadeReferencia = useDecimalMask();

  // Hook offline para consistência, mas é operação local
  const { submitForm, isSubmitting } = useOfflineForm({
    table: 'tipo_residuo_indicador',
    onlineSubmit: async (data) => {
      // Esta é uma adição local, não salva no banco ainda
      return data;
    },
    onSuccess: () => {
      // Callback executado após processar o indicador
      if (selectedIndicador) {
        const qtdRef = quantidadeReferencia.value ? parseFloat(quantidadeReferencia.value) : null;
        
        const tipoResiduoIndicador: TipoResiduoIndicador = {
          id: editingIndicador?.id,
          id_indicador: selectedIndicador.id_indicador,
          nom_indicador: selectedIndicador.nom_indicador,
          qtd_referencia: qtdRef,
        };

        onAdd(tipoResiduoIndicador);
      }
    }
  });

  useEffect(() => {
    loadIndicadores();
  }, []);

  useEffect(() => {
    if (editingIndicador) {
      // Encontrar o indicador que está sendo editado
      const indicador = indicadores.find(i => i.id_indicador === editingIndicador.id_indicador);
      if (indicador) {
        setSelectedIndicador(indicador);
        quantidadeReferencia.setValue(editingIndicador.qtd_referencia?.toFixed(2) || '');
      }
    }
  }, [editingIndicador, indicadores]);

  const loadIndicadores = async () => {
    try {
      const { data, error } = await supabase
        .from('indicador')
        .select('id_indicador, nom_indicador, des_status')
        .eq('des_status', 'A')
        .order('nom_indicador');

      if (error) throw error;

      // Filtrar indicadores já adicionados (exceto se estiver editando)
      let filteredIndicadores = data || [];
      if (!editingIndicador) {
        filteredIndicadores = data?.filter(i => 
          !existingIndicadores.some(ei => ei.id_indicador === i.id_indicador)
        ) || [];
      } else {
        // Se estiver editando, permitir o indicador atual e remover os outros já adicionados
        filteredIndicadores = data?.filter(i => 
          i.id_indicador === editingIndicador.id_indicador || 
          !existingIndicadores.some(ei => ei.id_indicador === i.id_indicador)
        ) || [];
      }

      setIndicadores(filteredIndicadores);
    } catch (error) {
      console.error('Error loading indicadores:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar indicadores.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectIndicador = (idIndicador: string) => {
    const indicador = indicadores.find(i => i.id_indicador.toString() === idIndicador);
    setSelectedIndicador(indicador || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedIndicador) {
      toast({
        title: 'Erro',
        description: 'Selecione um indicador',
        variant: 'destructive',
      });
      return;
    }

    const qtdRef = quantidadeReferencia.value ? parseFloat(quantidadeReferencia.value) : null;

    if (qtdRef !== null && qtdRef <= 0) {
      toast({
        title: 'Erro',
        description: 'Quantidade de referência deve ser maior que zero ou deixada em branco',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Usar o hook offline form que vai processar e chamar onSuccess
      await submitForm({
        id_indicador: selectedIndicador.id_indicador,
        qtd_referencia: qtdRef
      });
    } catch (error) {
      console.error('Erro ao processar indicador:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {editingIndicador ? 'Editar Indicador' : 'Adicionar Indicador ao Tipo de Resíduo'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seleção de Indicador */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Indicador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Indicador</Label>
              <Select 
                value={selectedIndicador?.id_indicador.toString() || ''} 
                onValueChange={handleSelectIndicador}
                disabled={indicadores.length === 0}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      indicadores.length === 0
                        ? "Nenhum indicador disponível"
                        : "Selecione um indicador..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {indicadores.map((indicador) => (
                    <SelectItem key={indicador.id_indicador} value={indicador.id_indicador.toString()}>
                      {indicador.nom_indicador}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {indicadores.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  {editingIndicador 
                    ? "Todos os outros indicadores já foram adicionados."
                    : "Todos os indicadores disponíveis já foram adicionados ou não existem indicadores cadastrados."
                  }
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dados do Indicador */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Indicador</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedIndicador ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Indicador Selecionado</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">{selectedIndicador.nom_indicador}</div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="qtd_referencia">Quantidade de Referência (opcional)</Label>
                  <Input
                    id="qtd_referencia"
                    type="text"
                    value={quantidadeReferencia.value}
                    onChange={(e) => quantidadeReferencia.handleChange(e.target.value)}
                    placeholder="0,00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quantidade de referência para cálculo do indicador. Campo opcional.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={onBack}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-recycle-green hover:bg-recycle-green-dark"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processando...' : `${editingIndicador ? 'Atualizar' : 'Adicionar'} Indicador`}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {indicadores.length === 0 
                  ? "Nenhum indicador disponível para adicionar"
                  : "Selecione um indicador"
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}