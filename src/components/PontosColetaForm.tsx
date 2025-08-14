
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PontoColeta {
  id_ponto_coleta: number;
  nom_ponto_coleta: string;
  des_ponto_coleta: string | null;
  des_logradouro: string;
  des_bairro: string;
  num_cep: string;
  des_referencia: string | null;
  des_status: string;
  id_municipio: number;
}

interface Municipio {
  id_municipio: number;
  nom_municipio: string;
  sig_uf: string;
}

interface PontosColetaFormProps {
  editingPontoColeta?: PontoColeta;
  onBack: () => void;
  onSuccess: () => void;
}

export function PontosColetaForm({ editingPontoColeta, onBack, onSuccess }: PontosColetaFormProps) {
  const [formData, setFormData] = useState({
    nom_ponto_coleta: '',
    des_ponto_coleta: '',
    des_logradouro: '',
    des_bairro: '',
    num_cep: '',
    des_referencia: '',
    des_status: 'A',
    id_municipio: 0
  });
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMunicipios();
    if (editingPontoColeta) {
      setFormData({
        nom_ponto_coleta: editingPontoColeta.nom_ponto_coleta,
        des_ponto_coleta: editingPontoColeta.des_ponto_coleta || '',
        des_logradouro: editingPontoColeta.des_logradouro,
        des_bairro: editingPontoColeta.des_bairro,
        num_cep: editingPontoColeta.num_cep,
        des_referencia: editingPontoColeta.des_referencia || '',
        des_status: editingPontoColeta.des_status,
        id_municipio: editingPontoColeta.id_municipio
      });
    }
  }, [editingPontoColeta]);

  const fetchMunicipios = async () => {
    try {
      const { data, error } = await supabase
        .from('municipio')
        .select('id_municipio, nom_municipio, sig_uf')
        .eq('des_status', 'A')
        .order('nom_municipio');

      if (error) throw error;
      setMunicipios(data || []);
    } catch (error) {
      console.error('Erro ao buscar municípios:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar municípios",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom_ponto_coleta.trim()) {
      toast({
        title: "Erro",
        description: "Nome do ponto de coleta é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!formData.des_logradouro.trim()) {
      toast({
        title: "Erro",
        description: "Logradouro é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (formData.id_municipio === 0) {
      toast({
        title: "Erro",
        description: "Município é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const dataToSave = {
        nom_ponto_coleta: formData.nom_ponto_coleta.trim(),
        des_ponto_coleta: formData.des_ponto_coleta.trim() || null,
        des_logradouro: formData.des_logradouro.trim(),
        des_bairro: formData.des_bairro.trim(),
        num_cep: formData.num_cep.trim(),
        des_referencia: formData.des_referencia.trim() || null,
        des_status: formData.des_status,
        id_municipio: formData.id_municipio
      };

      if (editingPontoColeta) {
        const { error } = await supabase
          .from('ponto_coleta')
          .update(dataToSave)
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
      
      if (error.code === '23505') {
        toast({
          title: "Erro",
          description: "Já existe um ponto de coleta com este nome",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao salvar ponto de coleta",
          variant: "destructive",
        });
      }
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
              <Label htmlFor="nom_ponto_coleta">Nome *</Label>
              <Input
                id="nom_ponto_coleta"
                value={formData.nom_ponto_coleta}
                onChange={(e) => handleInputChange('nom_ponto_coleta', e.target.value)}
                placeholder="Nome do ponto de coleta"
                required
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

          <div className="space-y-2">
            <Label htmlFor="des_ponto_coleta">Descrição</Label>
            <Textarea
              id="des_ponto_coleta"
              value={formData.des_ponto_coleta}
              onChange={(e) => handleInputChange('des_ponto_coleta', e.target.value)}
              placeholder="Descrição do ponto de coleta"
              rows={3}
            />
          </div>

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
              <Label htmlFor="id_municipio">Município *</Label>
              <Select value={formData.id_municipio.toString()} onValueChange={(value) => handleInputChange('id_municipio', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um município" />
                </SelectTrigger>
                <SelectContent>
                  {municipios.map((municipio) => (
                    <SelectItem key={municipio.id_municipio} value={municipio.id_municipio.toString()}>
                      {municipio.nom_municipio} - {municipio.sig_uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="des_referencia">Ponto de Referência</Label>
            <Input
              id="des_referencia"
              value={formData.des_referencia}
              onChange={(e) => handleInputChange('des_referencia', e.target.value)}
              placeholder="Ponto de referência próximo"
            />
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
