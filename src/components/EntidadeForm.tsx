
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOfflineForm } from "@/hooks/useOfflineForm";
import { applyCpfCnpjMask, validateCpfOrCnpj, applyPhoneMask, formatCep } from "@/lib/cpf-cnpj-utils";
import { LogoUploadArea } from "@/components/LogoUploadArea";
import { ImageResizeDialog } from "@/components/ImageResizeDialog";
import { MapLocationPicker } from "@/components/MapLocationPicker";
import { resizeImage, compressImage, getImageDimensions, formatFileSize } from "@/lib/image-utils";

const formSchema = z.object({
  nom_entidade: z.string().min(2, "Nome é obrigatório").max(60, "Nome deve ter no máximo 60 caracteres"),
  num_cpf_cnpj: z.string().min(11, "CPF/CNPJ é obrigatório")
    .max(18, "CPF/CNPJ deve ter no máximo 18 caracteres")
    .refine((val) => validateCpfOrCnpj(val), "CPF/CNPJ inválido"),
  id_tipo_entidade: z.string().min(1, "Tipo de entidade é obrigatório"),
  id_tipo_pessoa: z.string().min(1, "Tipo de pessoa é obrigatório"),
  nom_razao_social: z.string().max(60, "Razão social deve ter no máximo 60 caracteres").optional(),
  id_tipo_situacao: z.string().min(1, "Situação é obrigatória"),
  des_logradouro: z.string().min(5, "Logradouro é obrigatório").max(100, "Logradouro deve ter no máximo 100 caracteres"),
  des_bairro: z.string().min(2, "Bairro é obrigatório").max(50, "Bairro deve ter no máximo 50 caracteres"),
  num_cep: z.string().min(8, "CEP é obrigatório"),
  id_municipio: z.string().min(1, "Município é obrigatório"),
  num_telefone: z.string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Campo opcional
      const numbers = val.replace(/\D/g, '');
      return numbers.length === 10 || numbers.length === 11; // 10 dígitos (fixo) ou 11 dígitos (celular)
    }, "Telefone deve ter 10 dígitos (fixo) ou 11 dígitos (celular)"),
  num_latitude: z.number().optional(),
  num_longitude: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TipoEntidade {
  id_tipo_entidade: number;
  des_tipo_entidade: string;
}

interface TipoSituacao {
  id_tipo_situacao: number;
  des_tipo_situacao: string;
}

interface EntidadeFormProps {
  onBack: () => void;
  onSuccess: () => void;
  editingEntidade?: {
    id_entidade: number;
    nom_entidade: string;
    num_cpf_cnpj: string;
    nom_razao_social: string | null;
    des_logradouro: string;
    des_bairro: string;
    num_cep: string;
    num_telefone: string | null;
    id_tipo_pessoa: number;
    id_tipo_entidade: number;
    id_tipo_situacao: number;
    id_municipio: number;
    des_logo_url?: string | null;
    dat_atualizacao?: string | null;
    num_latitude?: number | null;
    num_longitude?: number | null;
  };
}

export function EntidadeForm({ onBack, onSuccess, editingEntidade }: EntidadeFormProps) {
  const [tiposEntidade, setTiposEntidade] = useState<TipoEntidade[]>([]);
  const [tiposSituacao, setTiposSituacao] = useState<TipoSituacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [existingLogoDate, setExistingLogoDate] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showResizeDialog, setShowResizeDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [latitude, setLatitude] = useState<number | null>(editingEntidade?.num_latitude || null);
  const [longitude, setLongitude] = useState<number | null>(editingEntidade?.num_longitude || null);
  // Estados para dividir o logradouro em nome da rua e número
  const [logradouroNome, setLogradouroNome] = useState<string>("");
  const [logradouroNumero, setLogradouroNumero] = useState<string>("");
  const [triggerGeocode, setTriggerGeocode] = useState(false);
  const lastGeocodeTimeRef = useRef<number>(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Função para preparar dados (limpar máscaras) antes de qualquer submissão
  const prepareDataForSubmit = (data: FormData) => {
    return {
      nom_entidade: data.nom_entidade,
      num_cpf_cnpj: data.num_cpf_cnpj.replace(/[^\d]/g, ''), // Remove máscara
      id_tipo_entidade: parseInt(data.id_tipo_entidade),
      id_tipo_pessoa: parseInt(data.id_tipo_pessoa),
      nom_razao_social: data.nom_razao_social || null,
      id_tipo_situacao: parseInt(data.id_tipo_situacao),
      des_logradouro: data.des_logradouro,
      des_bairro: data.des_bairro,
      num_cep: data.num_cep.replace(/[^\d]/g, ''), // Remove máscara
      id_municipio: parseInt(data.id_municipio),
      id_unidade_federativa: 29, // Bahia
      num_telefone: data.num_telefone?.replace(/\D/g, '') || null, // Remove máscara
      num_latitude: latitude,
      num_longitude: longitude,
    };
  };

  // Original submit function for online operations
  const originalSubmit = async (cleanedData: any) => {
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    // Dados já vêm limpos, usar diretamente
    const cpfCnpjLimpo = cleanedData.num_cpf_cnpj;
    
    // Verificar se CPF/CNPJ já existe (excluindo a própria entidade em caso de edição)
    const { data: existingEntity } = await supabase
      .from('entidade')
      .select('id_entidade')
      .eq('num_cpf_cnpj', cpfCnpjLimpo)
      .neq('id_entidade', editingEntidade?.id_entidade || 0);

    if (existingEntity && existingEntity.length > 0) {
      throw new Error("CPF/CNPJ já cadastrado no sistema");
    }
    
    // Upload da logo se houver
    let logoUrl = null;
    if (logoFile) {
      setUploadingLogo(true);
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${cpfCnpjLimpo}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos-entidades')
        .upload(filePath, logoFile, {
          upsert: true
        });

      if (uploadError) {
        console.error('Erro ao fazer upload da logo:', uploadError);
        toast({
          title: "Erro no upload",
          description: "Não foi possível fazer upload da logomarca",
          variant: "destructive",
        });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('logos-entidades')
          .getPublicUrl(filePath);
        logoUrl = publicUrl;
      }
      setUploadingLogo(false);
    }
    
    const insertData: any = {
      ...cleanedData,
      id_usuario_criador: user.id,
      dat_criacao: new Date().toISOString(),
      des_logo_url: logoUrl,
    };

    let result;
    if (editingEntidade) {
      // Atualizar entidade existente
      result = await supabase
        .from('entidade')
        .update({
          ...insertData,
          id_usuario_atualizador: user.id,
          dat_atualizacao: new Date().toISOString(),
        })
        .eq('id_entidade', editingEntidade.id_entidade);
    } else {
      // Inserir nova entidade
      result = await supabase
        .from('entidade')
        .insert(insertData);
    }
    
    const { error } = result;
    if (error) throw error;
    
    return result;
  };

  // Use offline form hook
  const { submitForm, isSubmitting, isOnline } = useOfflineForm({
    table: 'entidade',
    onlineSubmit: originalSubmit,
    onSuccess
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom_entidade: editingEntidade?.nom_entidade || "",
      num_cpf_cnpj: editingEntidade?.num_cpf_cnpj ? applyCpfCnpjMask(editingEntidade.num_cpf_cnpj) : "",
      id_tipo_entidade: editingEntidade?.id_tipo_entidade?.toString() || "",
      id_tipo_pessoa: editingEntidade?.id_tipo_pessoa?.toString() || "1",
      nom_razao_social: editingEntidade?.nom_razao_social || "",
      id_tipo_situacao: editingEntidade?.id_tipo_situacao?.toString() || "1", // REGRA 001: Default "Ativo"
      des_logradouro: editingEntidade?.des_logradouro || "",
      des_bairro: editingEntidade?.des_bairro || "",
      num_cep: editingEntidade?.num_cep ? formatCep(editingEntidade.num_cep) : "",
      id_municipio: editingEntidade?.id_municipio?.toString() || "2927408",
      num_telefone: editingEntidade?.num_telefone ? applyPhoneMask(editingEntidade.num_telefone) : "",
      num_latitude: editingEntidade?.num_latitude || undefined,
      num_longitude: editingEntidade?.num_longitude || undefined,
    },
  });

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
      return { nome: parts[0].trim(), numero: parts.slice(1).join(',').trim() };
    }
    // Se não tiver vírgula, tentar extrair número no final
    const match = v.match(/^(.*?)(?:\s*(\d+))$/);
    if (match) {
      return { nome: match[1].trim(), numero: match[2]?.trim() || "" };
    }
    return { nome: v, numero: "" };
  };

  // Inicializar estados de nome e número do logradouro a partir do valor atual
  useEffect(() => {
    const { nome, numero } = parseLogradouro(form.getValues('des_logradouro'));
    setLogradouroNome(nome);
    setLogradouroNumero(numero);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manter des_logradouro sincronizado com os dois campos
  useEffect(() => {
    const combinado = composeLogradouro(logradouroNome, logradouroNumero);
    form.setValue('des_logradouro', combinado, { shouldValidate: true, shouldDirty: true });
  }, [logradouroNome, logradouroNumero]);

  // Disparar geocodificação automaticamente após digitar número do logradouro
  useEffect(() => {
    if (logradouroNumero && logradouroNumero.trim() && logradouroNome) {
      const timer = setTimeout(() => {
        // Só disparar se passou mais de 2 segundos desde o último geocode (evita double-trigger com CEP)
        const timeSinceLastGeocode = Date.now() - lastGeocodeTimeRef.current;
        if (timeSinceLastGeocode > 2000) {
          setTriggerGeocode(true);
        }
      }, 1500); // Aguardar 1.5 segundos após digitar
      
      return () => clearTimeout(timer);
    }
  }, [logradouroNumero, logradouroNome]);

  useEffect(() => {
    fetchSelectData();
    
    // Carregar logo existente se houver
    if (editingEntidade?.des_logo_url) {
      setExistingLogoUrl(editingEntidade.des_logo_url);
      setExistingLogoDate(editingEntidade.dat_atualizacao || null);
    }
  }, [editingEntidade]);

  const fetchSelectData = async () => {
    try {
      // Buscar tipos de entidade
      const { data: tiposEntidadeData, error: tiposError } = await supabase
        .from('tipo_entidade')
        .select('id_tipo_entidade, des_tipo_entidade')
        .order('des_tipo_entidade');

      if (tiposError) throw tiposError;
      setTiposEntidade(tiposEntidadeData || []);

      // Buscar tipos de situação
      const { data: tiposSituacaoData, error: situacaoError } = await supabase
        .from('tipo_situacao')
        .select('id_tipo_situacao, des_tipo_situacao')
        .order('des_tipo_situacao');

      if (situacaoError) throw situacaoError;
      setTiposSituacao(tiposSituacaoData || []);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do formulário",
        variant: "destructive",
      });
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar se é maior que 2MB
    if (file.size > 2 * 1024 * 1024) {
      setPendingFile(file);
      setShowResizeDialog(true);
      return;
    }

    // Processar diretamente
    processLogoFile(file);
  };

  const processLogoFile = (file: File) => {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Limpar logo existente ao selecionar nova
    setExistingLogoUrl(null);
    setExistingLogoDate(null);
  };

  const handleResizeImage = async () => {
    if (!pendingFile) return;

    try {
      toast({
        title: "Processando imagem...",
        description: "Aguarde enquanto otimizamos sua imagem",
      });

      // Redimensionar para máximo 1000x1000px
      const resizedFile = await resizeImage(pendingFile, 1000, 1000);

      // Comprimir se ainda estiver grande
      let finalFile = resizedFile;
      if (resizedFile.size > 2 * 1024 * 1024) {
        finalFile = await compressImage(resizedFile, 0.8);
      }

      processLogoFile(finalFile);
      setShowResizeDialog(false);
      setPendingFile(null);

      toast({
        title: "Imagem otimizada",
        description: `Tamanho reduzido de ${formatFileSize(pendingFile.size)} para ${formatFileSize(finalFile.size)}`,
      });
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast({
        title: "Erro ao processar imagem",
        description: "Tente selecionar outra imagem",
        variant: "destructive",
      });
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setExistingLogoUrl(null);
    setExistingLogoDate(null);
  };

  const handleCepLookup = async (cep: string) => {
    if (!cep || cep.length < 8) return;

    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        // Clear the fields if CEP is not found
        setLogradouroNome("");
        const combinado = composeLogradouro("", logradouroNumero);
        form.setValue("des_logradouro", combinado, { shouldValidate: true, shouldDirty: true });
        form.setValue("des_bairro", "");
        
        toast({
          title: "CEP não encontrado",
          description: "O CEP informado não foi encontrado. Os campos de endereço foram limpos.",
          variant: "destructive",
        });
        return;
      }

      // Always overwrite the fields with new data
      if (data.logradouro) {
        setLogradouroNome(data.logradouro);
        const combinado = composeLogradouro(data.logradouro, logradouroNumero);
        form.setValue("des_logradouro", combinado, { shouldValidate: true, shouldDirty: true });
      } else {
        setLogradouroNome("");
        const combinado = composeLogradouro("", logradouroNumero);
        form.setValue("des_logradouro", combinado, { shouldValidate: true, shouldDirty: true });
      }

      if (data.bairro) {
        form.setValue("des_bairro", data.bairro);
      } else {
        form.setValue("des_bairro", "");
      }

      // Success toast
      toast({
        title: "CEP encontrado",
        description: `Endereço localizado: ${data.localidade} - ${data.uf}. Os campos foram atualizados.`,
      });

      // Trigger automatic geocoding after successful CEP lookup
      lastGeocodeTimeRef.current = Date.now();
      setTriggerGeocode(true);

    } catch (error) {
      console.error('Erro ao consultar CEP:', error);
      toast({
        title: "Erro na consulta",
        description: "Não foi possível consultar o CEP. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingCep(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    // Limpar máscaras antes de enviar
    const cleanedData = prepareDataForSubmit(data);
    await submitForm(cleanedData, !!editingEntidade, editingEntidade?.id_entidade);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">{editingEntidade ? 'Editar Entidade' : 'Nova Entidade'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Entidade</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nom_entidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Entidade *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome da entidade" maxLength={60} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="num_cpf_cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF/CNPJ *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00 ou 00.000.000/0000-00"
                          maxLength={18}
                          {...field}
                          onChange={(e) => {
                            const value = applyCpfCnpjMask(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="id_tipo_entidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Entidade *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de entidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposEntidade.map((tipo) => (
                            <SelectItem key={tipo.id_tipo_entidade} value={tipo.id_tipo_entidade.toString()}>
                              {tipo.des_tipo_entidade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="id_tipo_pessoa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Pessoa *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de pessoa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Pessoa Física</SelectItem>
                          <SelectItem value="2">Pessoa Jurídica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nom_razao_social"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite a razão social (opcional)" maxLength={60} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="id_tipo_situacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!editingEntidade} // REGRA 002: Desabilitar para novas entidades
                      >
                        <FormControl>
                          <SelectTrigger className={!editingEntidade ? 'bg-muted cursor-not-allowed' : ''}>
                            <SelectValue placeholder="Selecione a situação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposSituacao.map((tipo) => (
                            <SelectItem key={tipo.id_tipo_situacao} value={tipo.id_tipo_situacao.toString()}>
                              {tipo.des_tipo_situacao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!editingEntidade && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Novas entidades são cadastradas automaticamente como "Ativo"
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="num_cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP *</FormLabel>
                      <FormControl>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="00000-000"
                            {...field}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length > 5) {
                                value = value.substring(0, 5) + '-' + value.substring(5, 8);
                              }
                              field.onChange(value);
                            }}
                            onBlur={() => handleCepLookup(field.value)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleCepLookup(field.value)}
                            disabled={loadingCep}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="des_logradouro"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-3 md:gap-3">
                          <div className="md:col-span-2 space-y-2">
                            <FormLabel>Logradouro *</FormLabel>
                            <Input
                              placeholder="Rua, Avenida, etc."
                              maxLength={100}
                              value={logradouroNome}
                              className="h-10"
                              onChange={(e) => {
                                const nome = e.target.value;
                                setLogradouroNome(nome);
                                const combinado = composeLogradouro(nome, logradouroNumero);
                                field.onChange(combinado);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <FormLabel className="font-semibold">Nº</FormLabel>
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
                                const combinado = composeLogradouro(logradouroNome, numero);
                                field.onChange(combinado);
                              }}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="des_bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o bairro" maxLength={50} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="num_telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(00) 00000-0000" 
                          maxLength={15}
                          {...field}
                          onChange={(e) => {
                            const masked = applyPhoneMask(e.target.value);
                            field.onChange(masked);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Logomarca da Entidade</FormLabel>
                  <div className="mt-2">
                    <LogoUploadArea
                      existingLogoUrl={existingLogoUrl}
                      existingLogoDate={existingLogoDate}
                      newLogoPreview={logoPreview}
                      newLogoFile={logoFile}
                      onLogoChange={handleLogoChange}
                      onLogoRemove={handleRemoveLogo}
                    />
                  </div>
                </div>

                <div>
                  <MapLocationPicker
                    address={`${form.watch('des_logradouro')}, ${form.watch('des_bairro')}, CEP ${form.watch('num_cep')}`}
                    latitude={latitude}
                    longitude={longitude}
                    height={300}
                    onLocationChange={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                    triggerGeocode={triggerGeocode}
                    onGeocodeComplete={() => setTriggerGeocode(false)}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Salvando..." : "Salvar"}
                  {!isOnline && " (Offline)"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Dialog de redimensionamento de imagem */}
      <ImageResizeDialog
        open={showResizeDialog}
        onOpenChange={setShowResizeDialog}
        file={pendingFile}
        onResize={handleResizeImage}
        onChooseAnother={() => {
          setShowResizeDialog(false);
          setPendingFile(null);
        }}
      />
    </div>
  );
}
