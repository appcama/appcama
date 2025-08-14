
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PontoColeta {
  id_ponto_coleta: number;
  des_logradouro: string;
  des_bairro: string;
  num_cep: string;
  des_locked: string;
  des_status: string;
  id_entidade_gestora: number;
  id_municipio: number;
  id_unidade_federativa: number;
  id_tipo_ponto_coleta: number;
  id_tipo_situacao: number;
  num_latitude: number | null;
  num_longitude: number | null;
  dat_criacao: string;
  dat_atualizacao: string | null;
  id_usuario_criador: number;
  id_usuario_atualizador: number | null;
}

interface PontosColetaFormProps {
  editingPontoColeta?: PontoColeta;
  onBack: () => void;
  onSuccess: () => void;
}

export function PontosColetaForm({ editingPontoColeta, onBack, onSuccess }: PontosColetaFormProps) {
  const [formData, setFormData] = useState({
    des_logradouro: '',
    des_bairro: '',
    num_cep: '',
    des_status: 'A',
    id_entidade_gestora: 1, // Default value - should be from logged user's entity
    id_municipio: 1, // Default value
    id_unidade_federativa: 1, // Default value
    id_tipo_ponto_coleta: 1, // Default value
    id_tipo_situacao: 1, // Default value
    num_latitude: null as number | null,
    num_longitude: null as number | null
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingPontoColeta) {
      setFormData({
        des_logradouro: editingPontoColeta.des_logradouro,
        des_bairro: editingPontoColeta.des_bairro,
        num_cep: editingPontoColeta.num_cep,
        des_status: editingPontoColeta.des_status,
        id_entidade_gestora: editingPontoColeta.id_entidade_gestora,
        id_municipio: editingPontoColeta.id_municipio,
        id_unidade_federativa: editingPontoColeta.id_unidade_federativa,
        id_tipo_ponto_coleta: editingPontoColeta.id_tipo_ponto_coleta,
        id_tipo_situacao: editingPontoColeta.id_tipo_situacao,
        num_latitude: editingPontoColeta.num_latitude,
        num_longitude: editingPontoColeta.num_longitude
      });
    }
  }, [editingPontoColeta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.des_logradouro.trim()) {
      toast({
        title: "Erro",
        description: "Logradouro é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const dataToSave = {
        des_logradouro: formData.des_logradouro.trim(),
        des_bairro: formData.des_bairro.trim(),
        num_cep: formData.num_cep.trim(),
        des_status: formData.des_status,
        id_entidade_gestora: formData.id_entidade_gestora,
        id_municipio: formData.id_municipio,
        id_unidade_federativa: formData.id_unidade_federativa,
        id_tipo_ponto_coleta: formData.id_tipo_ponto_coleta,
        id_tipo_situacao: formData.id_tipo_situacao,
        num_latitude: formData.num_latitude,
        num_longitude: formData.num_longitude,
        dat_criacao: new Date().toISOString(),
        id_usuario_criador: 1 // Should be from logged user
      };

      if (editingPontoColeta) {
        const { error } = await supabase
          .from('ponto_coleta')
          .update({
            ...dataToSave,
            dat_atualizacao: new Date().toISOString(),
            id_usuario_atualizador: 1 // Should be from logged user
          })
          .eq('id_ponto_coleta', editingPontoColeta.id_ponto_coleta);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Ponto de coleta atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('ponto_coleta')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Ponto de coleta cadastrado com sucesso",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar ponto de coleta:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar ponto de coleta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <CardTitle>
            {editingPontoColeta ? 'Editar Ponto de Coleta' : 'Novo Ponto de Coleta'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="des_logradouro">Logradouro *</Label>
              <Input
                id="des_logradouro"
                value={formData.des_logradouro}
                onChange={(e) => handleInputChange('des_logradouro', e.target.value)}
                placeholder="Rua, Avenida, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="des_bairro">Bairro</Label>
              <Input
                id="des_bairro"
                value={formData.des_bairro}
                onChange={(e) => handleInputChange('des_bairro', e.target.value)}
                placeholder="Nome do bairro"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="num_cep">CEP</Label>
              <Input
                id="num_cep"
                value={formData.num_cep}
                onChange={(e) => handleInputChange('num_cep', e.target.value)}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="des_status">Status</Label>
              <Select value={formData.des_status} onValueChange={(value) => handleInputChange('des_status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Ativo</SelectItem>
                  <SelectItem value="D">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="num_latitude">Latitude</Label>
              <Input
                id="num_latitude"
                type="number"
                step="any"
                value={formData.num_latitude || ''}
                onChange={(e) => handleInputChange('num_latitude', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Ex: -23.5505"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="num_longitude">Longitude</Label>
              <Input
                id="num_longitude"
                type="number"
                step="any"
                value={formData.num_longitude || ''}
                onChange={(e) => handleInputChange('num_longitude', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Ex: -46.6333"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={onBack}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
