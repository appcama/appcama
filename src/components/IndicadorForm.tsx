import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOfflineForm } from "@/hooks/useOfflineForm";

interface Indicador {
  id_indicador: number;
  nom_indicador: string;
  id_unidade_medida: number;
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
  });
  
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadeMedida[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const { toast } = useToast();

  // Hook offline para formulário
  const { submitForm, isSubmitting } = useOfflineForm({
    table: 'indicador',
    onlineSubmit: async (data) => {
      if (editingIndicador) {
        return await supabase
          .from('indicador')
          .update({
            ...data,
            id_usuario_atualizador: 1,
            dat_atualizacao: new Date().toISOString(),
          })
          .eq('id_indicador', editingIndicador.id_indicador);
      } else {
        return await supabase
          .from('indicador')
          .insert([data]);
      }
    },
    onSuccess: onSave
  });

  useEffect(() => {
    fetchUnidadesMedida();
  }, []);

  useEffect(() => {
    if (editingIndicador) {
      setFormData({
        nom_indicador: editingIndicador.nom_indicador || "",
        id_unidade_medida: editingIndicador.id_unidade_medida || 0,
      });
    }
  }, [editingIndicador]);

  const fetchUnidadesMedida = async () => {
    try {
      console.log("[IndicadorForm] Fetching unidades de medida...");
      
      const { data, error } = await supabase
        .from('unidade_medida')
        .select('id_unidade_medida, des_unidade_medida, cod_unidade_medida')
        .order('des_unidade_medida');

      console.log("[IndicadorForm] Unidades response:", { data, error });

      if (error) {
        console.error('[IndicadorForm] Error fetching unidades:', error);
        toast({
          title: "Erro",
          description: `Erro ao carregar unidades de medida: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log("[IndicadorForm] Successfully loaded unidades:", data?.length || 0);
      setUnidadesMedida(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhuma unidade de medida encontrada",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[IndicadorForm] Erro ao buscar unidades de medida:', error);
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

    const dataToSubmit = {
      nom_indicador: formData.nom_indicador.trim(),
      id_unidade_medida: formData.id_unidade_medida,
      id_usuario_criador: 1,
      dat_criacao: new Date().toISOString(),
      des_status: 'A',
      des_locked: 'D'
    };

    try {
      await submitForm(dataToSubmit, !!editingIndicador, editingIndicador?.id_indicador);
    } catch (error) {
      console.error('Erro ao salvar indicador:', error);
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


            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
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
