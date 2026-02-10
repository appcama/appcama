
import { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCurrencyMask } from '@/hooks/useInputMask';

interface Residuo {
  id_residuo: number;
  nom_residuo: string;
}

interface TabelaPrecoResiduo {
  id_residuo: number;
  nom_residuo: string;
  vlr_total: number;
}

interface TabelaPrecosFormProps {
  onBack: () => void;
  onSuccess: () => void;
  editingTabelaPrecos?: any;
}

export function TabelaPrecosForm({ onBack, onSuccess, editingTabelaPrecos }: TabelaPrecosFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = !!editingTabelaPrecos;

  const [nome, setNome] = useState('');
  const [residuos, setResiduos] = useState<Residuo[]>([]);
  const [selectedResiduos, setSelectedResiduos] = useState<TabelaPrecoResiduo[]>([]);
  const [selectedResiduoId, setSelectedResiduoId] = useState('');
  const [loading, setLoading] = useState(false);

  const valorResiduo = useCurrencyMask('', 99999.99);

  useEffect(() => {
    loadResiduos();
    if (editingTabelaPrecos) {
      loadEditingData();
    }
  }, [editingTabelaPrecos]);

  const loadResiduos = async () => {
    try {
      const { data, error } = await supabase
        .from('residuo')
        .select('id_residuo, nom_residuo')
        .eq('des_status', 'A')
        .order('nom_residuo');

      if (error) throw error;
      setResiduos(data || []);
    } catch (error) {
      console.error('Erro ao carregar resíduos:', error);
    }
  };

  const loadEditingData = async () => {
    if (!editingTabelaPrecos) return;

    setNome(editingTabelaPrecos.des_tabela_precos || '');

    try {
      const { data, error } = await supabase
        .from('tabela_precos_residuo')
        .select('id_residuo, vlr_total')
        .eq('id_tabela_preco', editingTabelaPrecos.id_tabela_precos);

      if (error) throw error;

      if (data) {
        // Fetch residuo names
        const { data: residuosData } = await supabase
          .from('residuo')
          .select('id_residuo, nom_residuo')
          .in('id_residuo', data.map(d => d.id_residuo));

        const residuoMap = new Map((residuosData || []).map(r => [r.id_residuo, r.nom_residuo]));

        setSelectedResiduos(data.map(d => ({
          id_residuo: d.id_residuo,
          nom_residuo: residuoMap.get(d.id_residuo) || `Resíduo ${d.id_residuo}`,
          vlr_total: d.vlr_total,
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar dados da tabela de preços:', error);
    }
  };

  const handleAddResiduo = () => {
    if (!selectedResiduoId || !valorResiduo.value) {
      toast({
        title: 'Erro',
        description: 'Selecione um resíduo e informe o valor.',
        variant: 'destructive',
      });
      return;
    }

    const residuoId = parseInt(selectedResiduoId);
    if (selectedResiduos.some(r => r.id_residuo === residuoId)) {
      toast({
        title: 'Erro',
        description: 'Este resíduo já foi adicionado.',
        variant: 'destructive',
      });
      return;
    }

    const valor = valorResiduo.getNumericValue();
    if (valor <= 0) {
      toast({
        title: 'Erro',
        description: 'O valor deve ser maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    const residuo = residuos.find(r => r.id_residuo === residuoId);
    if (!residuo) return;

    setSelectedResiduos(prev => [...prev, {
      id_residuo: residuoId,
      nom_residuo: residuo.nom_residuo,
      vlr_total: valor,
    }]);

    setSelectedResiduoId('');
    valorResiduo.setValue('');
  };

  const handleRemoveResiduo = (id_residuo: number) => {
    setSelectedResiduos(prev => prev.filter(r => r.id_residuo !== id_residuo));
  };

  const availableResiduos = residuos.filter(
    r => !selectedResiduos.some(sr => sr.id_residuo === r.id_residuo)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast({ title: 'Erro', description: 'Informe o nome da tabela.', variant: 'destructive' });
      return;
    }

    if (selectedResiduos.length === 0) {
      toast({ title: 'Erro', description: 'Adicione pelo menos um resíduo com preço.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      let tabelaId: number;

      if (isEditing) {
        const { error } = await supabase
          .from('tabela_precos')
          .update({
            des_tabela_precos: nome.trim(),
            dat_atualizacao: new Date().toISOString(),
            id_usuario_atualizador: user?.id || 1,
          })
          .eq('id_tabela_precos', editingTabelaPrecos.id_tabela_precos);

        if (error) throw error;
        tabelaId = editingTabelaPrecos.id_tabela_precos;

        // Delete existing residuos
        await supabase
          .from('tabela_precos_residuo')
          .delete()
          .eq('id_tabela_preco', tabelaId);
      } else {
        const { data, error } = await supabase
          .from('tabela_precos')
          .insert({
            des_tabela_precos: nome.trim(),
            id_usuario_criador: user?.id || 1,
            dat_criacao: new Date().toISOString(),
          })
          .select('id_tabela_precos')
          .single();

        if (error) throw error;
        tabelaId = data.id_tabela_precos;
      }

      // Insert residuos
      const residuosInsert = selectedResiduos.map(r => ({
        id_tabela_preco: tabelaId,
        id_residuo: r.id_residuo,
        vlr_total: r.vlr_total,
      }));

      const { error: residuosError } = await supabase
        .from('tabela_precos_residuo')
        .insert(residuosInsert);

      if (residuosError) throw residuosError;

      toast({
        title: 'Sucesso',
        description: `Tabela de preços ${isEditing ? 'atualizada' : 'criada'} com sucesso.`,
      });
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar tabela de preços:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar tabela de preços.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <Button variant="ghost" onClick={onBack} className="mr-4 h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Editar Tabela de Preços' : 'Nova Tabela de Preços'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Preencha as informações para criar uma nova tabela de preço
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="nome">Nome da Tabela *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome da tabela de preços"
              maxLength={255}
              required
            />
          </div>

          {/* Add residuo section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Resíduos e Preços
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-1">
                <Label>Resíduo</Label>
                <Select value={selectedResiduoId} onValueChange={setSelectedResiduoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um resíduo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableResiduos.map((residuo) => (
                      <SelectItem key={residuo.id_residuo} value={residuo.id_residuo.toString()}>
                        {residuo.nom_residuo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    type="text"
                    value={valorResiduo.value}
                    onChange={(e) => valorResiduo.handleChange(e.target.value)}
                    placeholder="0,00"
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="button" onClick={handleAddResiduo} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {selectedResiduos.length > 0 ? (
              <div className="space-y-2">
                {selectedResiduos.map((residuo) => (
                  <div
                    key={residuo.id_residuo}
                    className="flex items-center justify-between p-3 border rounded-lg bg-background"
                  >
                    <div>
                      <span className="font-medium">{residuo.nom_residuo}</span>
                      <Badge variant="secondary" className="ml-2">
                        R$ {residuo.vlr_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveResiduo(residuo.id_residuo)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Adicione pelo menos um resíduo com seu preço de referência.
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
