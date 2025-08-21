
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Indicador {
  id_indicador: number;
  nom_indicador: string;
  id_unidade_medida: number;
  qtd_referencia: number | null;
  des_status: string;
}

interface UnidadeMedida {
  id_unidade_medida: number;
  des_unidade_medida: string;
  cod_unidade_medida: string;
}

interface IndicadorFormProps {
  editingIndicador?: Indicador;
  onBack: () => void;
  onSave: () => void;
}

export function IndicadorForm({ editingIndicador, onBack, onSave }: IndicadorFormProps) {
  const [formData, setFormData] = useState({
    nom_indicador: "",
    id_unidade_medida: 0,
    qtd_referencia: null as number | null,
  });
  
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadeMedida[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUnidadesMedida();
  }, []);

  useEffect(() => {
    if (editingIndicador) {
      setFormData({
        nom_indicador: editingIndicador.nom_indicador || "",
        id_unidade_medida: editingIndicador.id_unidade_medida || 0,
        qtd_referencia: editingIndicador.qtd_referencia,
      });
    }
  }, [editingIndicador]);

  const fetchUnidadesMedida = async () => {
    try {
      const { data, error } = await supabase
        .from('unidade_medida')
        .select('*')
        .order('des_unidade_medida');

      if (error) throw error;
      setUnidadesMedida(data || []);
    } catch (error) {
      console.error('Erro ao buscar unidades de medida:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar unidades de medida",
        variant: "destructive",
      });
    } finally {
      setLoadingUnidades(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom_indicador.trim()) {
      toast({
        title: "Erro",
        description: "Nome do indicador é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!formData.id_unidade_medida || formData.id_unidade_medida === 0) {
      toast({
        title: "Erro",
        description: "Unidade de medida é obrigatória",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const dataToSubmit = {
        nom_indicador: formData.nom_indicador.trim(),
        id_unidade_medida: formData.id_unidade_medida,
        qtd_referencia: formData.qtd_referencia,
        id_usuario_criador: 1,
        dat_criacao: new Date().toISOString(),
        des_status: 'A',
        des_locked: 'D'
      };

      let result;
      if (editingIndicador) {
        result = await supabase
          .from('indicador')
          .update({
            ...dataToSubmit,
            id_usuario_atualizador: 1,
            dat_atualizacao: new Date().toISOString(),
          })
          .eq('id_indicador', editingIndicador.id_indicador);
      } else {
        result = await supabase
          .from('indicador')
          .insert([dataToSubmit]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Sucesso",
        description: editingIndicador 
          ? "Indicador atualizado com sucesso!" 
          : "Indicador cadastrado com sucesso!",
      });

      onSave();
    } catch (error) {
      console.error('Erro ao salvar indicador:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar indicador",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {editingIndicador ? "Editar Indicador" : "Novo Indicador"}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom_indicador">Nome do Indicador *</Label>
              <Input
                id="nom_indicador"
                value={formData.nom_indicador}
                onChange={(e) => handleInputChange('nom_indicador', e.target.value)}
                placeholder="Digite o nome do indicador"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_unidade_medida">Unidade de Medida *</Label>
              {loadingUnidades ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando unidades...
                </div>
              ) : (
                <Select 
                  value={formData.id_unidade_medida.toString()} 
                  onValueChange={(value) => handleInputChange('id_unidade_medida', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma unidade de medida" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesMedida.map((unidade) => (
                      <SelectItem key={unidade.id_unidade_medida} value={unidade.id_unidade_medida.toString()}>
                        {unidade.des_unidade_medida} ({unidade.cod_unidade_medida})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qtd_referencia">Quantidade de Referência</Label>
              <Input
                id="qtd_referencia"
                type="number"
                step="0.01"
                value={formData.qtd_referencia || ""}
                onChange={(e) => handleInputChange('qtd_referencia', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Digite a quantidade de referência"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
