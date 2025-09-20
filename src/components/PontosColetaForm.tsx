
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useViaCep } from "@/hooks/useViaCep";
import { applyCepMask } from "@/lib/cpf-cnpj-utils";
import { useOfflineForm } from "@/hooks/useOfflineForm";
import { useAuth } from "@/hooks/useAuth";

interface PontoColeta {
  id_ponto_coleta: number;
  nom_ponto_coleta: string;
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

interface Entidade {
  id_entidade: number;
  nom_entidade: string;
  nom_razao_social: string | null;
  tipo_entidade: {
    des_tipo_entidade: string;
  };
}

interface TipoPontoColeta {
  id_tipo_ponto_coleta: number;
  des_tipo_ponto_coleta: string;
}

interface PontosColetaFormProps {
  editingPontoColeta?: PontoColeta;
  onBack: () => void;
  onSuccess: () => void;
}

export function PontosColetaForm({ editingPontoColeta, onBack, onSuccess }: PontosColetaFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nom_ponto_coleta: '',
    num_cep: '',
    des_logradouro: '',
    des_bairro: '',
    id_entidade_gestora: null as number | null,
    id_municipio: 1,
    id_unidade_federativa: 1,
    id_tipo_ponto_coleta: null as number | null,
    id_tipo_situacao: 1,
    num_latitude: null as number | null,
    num_longitude: null as number | null
  });
  
  const [entidadesGestoras, setEntidadesGestoras] = useState<Entidade[]>([]);
  const [tiposPontoColeta, setTiposPontoColeta] = useState<TipoPontoColeta[]>([]);
  const [loadingEntidades, setLoadingEntidades] = useState(true);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [cepValid, setCepValid] = useState(true);
  const [cepError, setCepError] = useState('');
  const { toast } = useToast();
  const { searchCep, loading: cepLoading } = useViaCep();
  
  const { submitForm, isSubmitting } = useOfflineForm({
    table: 'ponto_coleta',
    onlineSubmit: async (data) => {
      if (editingPontoColeta) {
        const { data: result, error } = await supabase
          .from('ponto_coleta')
          .update(data)
          .eq('id_ponto_coleta', editingPontoColeta.id_ponto_coleta)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('ponto_coleta')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess
  });

  useEffect(() => {
    if (user) {
      fetchEntidadesGestoras();
    }
    fetchTiposPontoColeta();
  }, [user]);

  useEffect(() => {
    if (editingPontoColeta) {
      setFormData({
        nom_ponto_coleta: editingPontoColeta.nom_ponto_coleta,
        num_cep: applyCepMask(editingPontoColeta.num_cep),
        des_logradouro: editingPontoColeta.des_logradouro,
        des_bairro: editingPontoColeta.des_bairro,
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

  const fetchEntidadesGestoras = async () => {
    try {
      console.log('User data in form:', user);
      console.log('User entityId in form:', user?.entityId);
      console.log('User isAdmin in form:', user?.isAdmin);
      
      if (!user) {
        console.log('No user found, not loading entities');
        setEntidadesGestoras([]);
        setLoadingEntidades(false);
        return;
      }
  
      let query = supabase
        .from('entidade')
        .select(`
          id_entidade,
          nom_entidade,
          nom_razao_social,
          tipo_entidade:tipo_entidade!inner(
            des_tipo_entidade
          )
        `)
        .eq('des_status', 'A');
  
      // Se não é administrador, filtrar pela entidade do usuário
      if (!user.isAdmin && user.entityId) {
        console.log('Non-admin user, filtering entities by entityId:', user.entityId);
        query = query.eq('id_entidade', user.entityId);
      } else if (user.isAdmin) {
        console.log('Admin user, showing all entities');
      } else {
        console.log('No entityId found and not admin, not loading entities');
        setEntidadesGestoras([]);
        setLoadingEntidades(false);
        return;
      }
  
      const { data, error } = await query.order('nom_entidade');
  
      console.log('Entities query result:', { data, error });
      
      if (error) throw error;
      setEntidadesGestoras(data || []);
      
      // Se estamos criando um novo ponto de coleta e não é admin, definir automaticamente a entidade
      if (!editingPontoColeta && data && data.length > 0 && !user.isAdmin) {
        setFormData(prev => ({
          ...prev,
          id_entidade_gestora: data[0].id_entidade
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar entidades gestoras:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar entidades gestoras",
        variant: "destructive",
      });
    } finally {
      setLoadingEntidades(false);
    }
  };

  const fetchTiposPontoColeta = async () => {
    try {
      const { data, error } = await supabase
        .from('tipo_ponto_coleta')
        .select('id_tipo_ponto_coleta, des_tipo_ponto_coleta')
        .eq('des_status', 'A')
        .order('des_tipo_ponto_coleta');

      if (error) throw error;
      setTiposPontoColeta(data || []);
    } catch (error) {
      console.error('Erro ao buscar tipos de ponto de coleta:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de ponto de coleta",
        variant: "destructive",
      });
    } finally {
      setLoadingTipos(false);
    }
  };

  const handleCepChange = async (cep: string) => {
    const formattedCep = applyCepMask(cep);
    
    setFormData(prev => ({
      ...prev,
      num_cep: formattedCep
    }));

    // Reset validation state
    setCepValid(true);
    setCepError('');

    if (formattedCep.replace(/\D/g, '').length === 8) {
      const cepData = await searchCep(formattedCep);
      if (cepData) {
        setFormData(prev => ({
          ...prev,
          des_logradouro: cepData.logradouro,
          des_bairro: cepData.bairro
        }));
        setCepValid(true);
        setCepError('');
      } else {
        // CEP não encontrado
        setCepValid(false);
        setCepError('CEP não encontrado ou inválido');
        setFormData(prev => ({
          ...prev,
          des_logradouro: '',
          des_bairro: ''
        }));
      }
    } else if (formattedCep.replace(/\D/g, '').length > 0) {
      // CEP incompleto
      setCepValid(false);
      setCepError('CEP deve ter 8 dígitos');
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

    if (!formData.num_cep.trim() || formData.num_cep.replace(/\D/g, '').length !== 8) {
      toast({
        title: "Erro",
        description: "CEP é obrigatório e deve ter 8 dígitos",
        variant: "destructive",
      });
      return;
    }

    if (!cepValid) {
      toast({
        title: "Erro",
        description: "CEP inválido. Verifique o CEP informado",
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

    if (!formData.id_entidade_gestora) {
      toast({
        title: "Erro",
        description: "Entidade gestora é obrigatória",
        variant: "destructive",
      });
      return;
    }

    if (!formData.id_tipo_ponto_coleta) {
      toast({
        title: "Erro",
        description: "Tipo de ponto de coleta é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      const pontoData: any = {
        nom_ponto_coleta: formData.nom_ponto_coleta,
        des_logradouro: formData.des_logradouro || '',
        des_bairro: formData.des_bairro || '',
        num_cep: formData.num_cep.replace(/\D/g, ''),
        id_entidade_gestora: formData.id_entidade_gestora,
        id_municipio: formData.id_municipio,
        id_unidade_federativa: formData.id_unidade_federativa,
        id_tipo_ponto_coleta: formData.id_tipo_ponto_coleta,
        id_tipo_situacao: formData.id_tipo_situacao,
        num_latitude: formData.num_latitude,
        num_longitude: formData.num_longitude,
        des_status: 'A',
        des_locked: 'D',
        dat_atualizacao: new Date().toISOString(),
        id_usuario_atualizador: 1
      };

      // Adicionar campos específicos para criação
      if (!editingPontoColeta) {
        pontoData.dat_criacao = new Date().toISOString();
        pontoData.id_usuario_criador = 1;
      }

      await submitForm(pontoData, !!editingPontoColeta, editingPontoColeta?.id_ponto_coleta);
    } catch (error) {
      console.error('Erro ao salvar ponto de coleta:', error);
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
          <div className="space-y-2">
            <Label htmlFor="nom_ponto_coleta">Nome do Ponto de Coleta *</Label>
            <Input
              id="nom_ponto_coleta"
              value={formData.nom_ponto_coleta}
              onChange={(e) => handleInputChange('nom_ponto_coleta', e.target.value)}
              placeholder="Nome do ponto de coleta"
              maxLength={60}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_entidade_gestora">Entidade Gestora *</Label>
            {loadingEntidades ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando entidades...
              </div>
            ) : (
              <Select 
                value={formData.id_entidade_gestora?.toString() || ""} 
                onValueChange={(value) => handleInputChange('id_entidade_gestora', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma entidade gestora" />
                </SelectTrigger>
                <SelectContent>
                  {entidadesGestoras.map((entidade) => (
                    <SelectItem key={entidade.id_entidade} value={entidade.id_entidade.toString()}>
                      {entidade.nom_entidade} 
                      {entidade.nom_razao_social && ` (${entidade.nom_razao_social})`}
                      <span className="text-muted-foreground ml-2">
                        - {entidade.tipo_entidade.des_tipo_entidade}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_tipo_ponto_coleta">Tipo de Ponto de Coleta *</Label>
            {loadingTipos ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando tipos...
              </div>
            ) : (
              <Select 
                value={formData.id_tipo_ponto_coleta?.toString() || ""} 
                onValueChange={(value) => handleInputChange('id_tipo_ponto_coleta', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo de ponto de coleta" />
                </SelectTrigger>
                <SelectContent>
                  {tiposPontoColeta.map((tipo) => (
                    <SelectItem key={tipo.id_tipo_ponto_coleta} value={tipo.id_tipo_ponto_coleta.toString()}>
                      {tipo.des_tipo_ponto_coleta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="num_cep">CEP *</Label>
            <div className="relative">
              <Input
                id="num_cep"
                value={formData.num_cep}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                required
                className={!cepValid && formData.num_cep ? 'border-red-500 focus:border-red-500' : ''}
              />
              {cepLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
            {!cepValid && cepError && (
              <p className="text-sm text-red-600">{cepError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="des_logradouro">Logradouro *</Label>
              <Input
                id="des_logradouro"
                value={formData.des_logradouro}
                onChange={(e) => handleInputChange('des_logradouro', e.target.value)}
                placeholder="Rua, Avenida, etc."
                maxLength={60}
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
                maxLength={50}
              />
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
