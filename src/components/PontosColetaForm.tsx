
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { MapLocationPicker } from "@/components/MapLocationPicker";

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
  type PontosColetaFormValues = {
    nom_ponto_coleta: string;
    num_cep: string;
    des_logradouro: string;
    des_bairro: string;
    id_entidade_gestora: number | null;
    id_municipio: number;
    id_unidade_federativa: number;
    id_tipo_ponto_coleta: number | null;
    id_tipo_situacao: number;
    num_latitude: number | null;
    num_longitude: number | null;
  };

  const form = useForm<PontosColetaFormValues>({
    defaultValues: {
      nom_ponto_coleta: editingPontoColeta?.nom_ponto_coleta ?? '',
      num_cep: applyCepMask(editingPontoColeta?.num_cep ?? ''),
      des_logradouro: editingPontoColeta?.des_logradouro ?? '',
      des_bairro: editingPontoColeta?.des_bairro ?? '',
      id_entidade_gestora: editingPontoColeta?.id_entidade_gestora ?? null,
      id_municipio: editingPontoColeta?.id_municipio ?? 1,
      id_unidade_federativa: editingPontoColeta?.id_unidade_federativa ?? 1,
      id_tipo_ponto_coleta: editingPontoColeta?.id_tipo_ponto_coleta ?? null,
      id_tipo_situacao: editingPontoColeta?.id_tipo_situacao ?? 1,
      num_latitude: editingPontoColeta?.num_latitude ?? null,
      num_longitude: editingPontoColeta?.num_longitude ?? null,
    }
  });
  
  const [entidadesGestoras, setEntidadesGestoras] = useState<Entidade[]>([]);
  const [tiposPontoColeta, setTiposPontoColeta] = useState<TipoPontoColeta[]>([]);
  const [loadingEntidades, setLoadingEntidades] = useState(true);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [cepValid, setCepValid] = useState(true);
  const [cepError, setCepError] = useState('');
  const { toast } = useToast();
  const { searchCep, loading: cepLoading } = useViaCep();
  // Estados para dividir o logradouro em nome da rua e número
  const [logradouroNome, setLogradouroNome] = useState<string>("");
  const [logradouroNumero, setLogradouroNumero] = useState<string>("");

  // Mapeia siglas de UF para códigos IBGE (ex.: BA -> 29)
  const mapUfToCode = (uf: string | undefined | null): number | null => {
    if (!uf) return null;
    const UF_TO_CODE: Record<string, number> = {
      AC: 12,
      AL: 27,
      AP: 16,
      AM: 13,
      BA: 29,
      CE: 23,
      DF: 53,
      ES: 32,
      GO: 52,
      MA: 21,
      MT: 51,
      MS: 50,
      MG: 31,
      PA: 15,
      PB: 25,
      PR: 41,
      PE: 26,
      PI: 22,
      RJ: 33,
      RN: 24,
      RS: 43,
      RO: 11,
      RR: 14,
      SC: 42,
      SP: 35,
      SE: 28,
      TO: 17,
    };
    return UF_TO_CODE[uf as keyof typeof UF_TO_CODE] ?? null;
  };

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
      form.reset({
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

      // Preencher imediatamente os campos separados de logradouro e número
      const { nome, numero } = parseLogradouro(editingPontoColeta.des_logradouro);
      setLogradouroNome(nome);
      setLogradouroNumero(numero);
    }
  }, [editingPontoColeta]);

  // Funções auxiliares para tratar o logradouro combinado
  const composeLogradouro = (nome: string, numero: string) => {
    const nomeTrim = (nome || "").trim();
    const numeroTrim = (numero || "").trim();
    if (!nomeTrim && !numeroTrim) return "";
    if (!numeroTrim) return nomeTrim;
    return `${nomeTrim}, ${numeroTrim}`;
  };

  const parseLogradouro = (valor: string | undefined | null) => {
    const v = (valor || "").trim();
    if (!v) return { nome: "", numero: "" };
    const parts = v.split(',');
    if (parts.length >= 2) {
      const nome = parts[0].trim();
      const resto = parts.slice(1).join(',').trim();
      const numeroSomenteDigitos = (resto.match(/\d+/)?.[0] || "").trim();
      return { nome, numero: numeroSomenteDigitos };
    }
    // Sem vírgula: tentar extrair dígitos do final (ex.: "Rua X 123")
    const match = v.match(/^(.*?)(?:\s*(\d+))$/);
    if (match) {
      return { nome: match[1].trim(), numero: (match[2] || "").trim() };
    }
    return { nome: v, numero: "" };
  };

  // Inicializar estados de nome e número do logradouro quando o valor carregado mudar
  const watchDesLogradouro = form.watch('des_logradouro');
  useEffect(() => {
    const { nome, numero } = parseLogradouro(watchDesLogradouro);
    setLogradouroNome(nome);
    setLogradouroNumero(numero);
  }, [watchDesLogradouro]);

  // Manter des_logradouro sincronizado com os dois campos, evitando re-render desnecessário
  useEffect(() => {
    const combinado = composeLogradouro(logradouroNome, logradouroNumero);
    const current = form.getValues('des_logradouro');
    if (current !== combinado) {
      form.setValue('des_logradouro', combinado, { shouldDirty: true });
    }
  }, [logradouroNome, logradouroNumero]);

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
        form.setValue('id_entidade_gestora', data[0].id_entidade, { shouldDirty: true });
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
    form.setValue('num_cep', formattedCep, { shouldDirty: true });

    setCepValid(true);
    setCepError('');

    const digits = formattedCep.replace(/\D/g, '');
    if (digits.length === 8) {
      const cepData = await searchCep(formattedCep);
      if (cepData) {
        setLogradouroNome(cepData.logradouro || "");
        form.setValue('des_bairro', cepData.bairro || "", { shouldDirty: true });
        if (cepData.ibge) form.setValue('id_municipio', parseInt(cepData.ibge, 10), { shouldDirty: true });
        const ufCode = mapUfToCode(cepData.uf);
        if (ufCode) form.setValue('id_unidade_federativa', ufCode, { shouldDirty: true });
        setCepValid(true);
        setCepError('');
      } else {
        setCepValid(false);
        setCepError('CEP não encontrado ou inválido');
        setLogradouroNome("");
        form.setValue('des_bairro', '', { shouldDirty: true });
      }
    } else if (digits.length > 0) {
      setCepValid(false);
      setCepError('CEP deve ter 8 dígitos');
    }
  };

  const onSubmit = async (values: PontosColetaFormValues) => {
    if (!values.nom_ponto_coleta.trim()) {
      toast({
        title: "Erro",
        description: "Nome do ponto de coleta é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!values.num_cep.trim() || values.num_cep.replace(/\D/g, '').length !== 8) {
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

    if (!values.des_logradouro.trim()) {
      toast({
        title: "Erro",
        description: "Logradouro é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!values.id_entidade_gestora) {
      toast({
        title: "Erro",
        description: "Entidade gestora é obrigatória",
        variant: "destructive",
      });
      return;
    }

    try {
      const pontoData: any = {
        nom_ponto_coleta: values.nom_ponto_coleta,
        des_logradouro: values.des_logradouro || '',
        des_bairro: values.des_bairro || '',
        num_cep: values.num_cep.replace(/\D/g, ''),
        id_entidade_gestora: values.id_entidade_gestora,
        id_municipio: values.id_municipio,
        id_unidade_federativa: values.id_unidade_federativa,
        id_tipo_ponto_coleta: values.id_tipo_ponto_coleta || null,
        id_tipo_situacao: values.id_tipo_situacao,
        num_latitude: values.num_latitude,
        num_longitude: values.num_longitude,
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

  const handleLocationChange = (lat: number, lng: number) => {
    form.setValue('num_latitude', lat, { shouldDirty: true });
    form.setValue('num_longitude', lng, { shouldDirty: true });
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna esquerda: campos do formulário */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom_ponto_coleta">Nome do Ponto de Coleta *</Label>
                <Input
                  id="nom_ponto_coleta"
                  value={form.watch('nom_ponto_coleta') || ''}
                  onChange={(e) => form.setValue('nom_ponto_coleta', e.target.value, { shouldDirty: true })}
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
                    value={form.watch('id_entidade_gestora')?.toString() || ""} 
                    onValueChange={(value) => form.setValue('id_entidade_gestora', parseInt(value), { shouldDirty: true })}
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
                <Label htmlFor="id_tipo_ponto_coleta">Tipo de Ponto de Coleta (Opcional)</Label>
                {loadingTipos ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando tipos...
                  </div>
                ) : (
                  <Select 
                    value={form.watch('id_tipo_ponto_coleta')?.toString() || ""} 
                    onValueChange={(value) => form.setValue('id_tipo_ponto_coleta', parseInt(value), { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tipo de ponto de coleta (opcional)" />
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
                    value={form.watch('num_cep') || ''}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    required
                    className={!cepValid && (form.watch('num_cep') || '') ? 'border-red-500 focus:border-red-500' : ''}
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

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-3">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Logradouro *</Label>
                    <Input
                      placeholder="Rua, Avenida, etc."
                      maxLength={100}
                      value={logradouroNome}
                      className="h-10"
                      onChange={(e) => {
                        const nome = e.target.value;
                        setLogradouroNome(nome);
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Nº</Label>
                    <Input
                      placeholder="Número"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={logradouroNumero}
                      className="h-10"
                      onChange={(e) => {
                        const numero = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setLogradouroNumero(numero);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="des_bairro">Bairro</Label>
                  <Input
                    id="des_bairro"
                    value={form.watch('des_bairro') || ''}
                    onChange={(e) => form.setValue('des_bairro', e.target.value, { shouldDirty: true })}
                    placeholder="Nome do bairro"
                    maxLength={50}
                  />
                </div>
              </div>
            </div>

            {/* Coluna direita: mapa */}
            <div>
              <MapLocationPicker
                address={`${form.watch('des_logradouro') || ''}, ${form.watch('des_bairro') || ''}, CEP ${form.watch('num_cep') || ''}`}
                latitude={form.watch('num_latitude') || null}
                longitude={form.watch('num_longitude') || null}
                onLocationChange={handleLocationChange}
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
