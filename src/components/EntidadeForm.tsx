import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { applyCpfCnpjMask, validateCpfOrCnpj } from "@/lib/cpf-cnpj-utils";

const formSchema = z.object({
  nom_entidade: z.string().min(2, "Nome é obrigatório"),
  num_cpf_cnpj: z.string().min(11, "CPF/CNPJ é obrigatório")
    .refine((val) => validateCpfOrCnpj(val), "CPF/CNPJ inválido"),
  id_tipo_entidade: z.string().min(1, "Tipo de entidade é obrigatório"),
  id_tipo_pessoa: z.string().min(1, "Tipo de pessoa é obrigatório"),
  nom_razao_social: z.string().optional(),
  id_tipo_situacao: z.string().min(1, "Situação é obrigatória"),
  des_logradouro: z.string().min(5, "Logradouro é obrigatório"),
  des_bairro: z.string().min(2, "Bairro é obrigatório"),
  num_cep: z.string().min(8, "CEP é obrigatório"),
  id_municipio: z.string().min(1, "Município é obrigatório"),
  num_telefone: z.string().optional(),
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
}

export function EntidadeForm({ onBack, onSuccess }: EntidadeFormProps) {
  const [tiposEntidade, setTiposEntidade] = useState<TipoEntidade[]>([]);
  const [tiposSituacao, setTiposSituacao] = useState<TipoSituacao[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom_entidade: "",
      num_cpf_cnpj: "",
      id_tipo_entidade: "",
      id_tipo_pessoa: "1",
      nom_razao_social: "",
      id_tipo_situacao: "",
      des_logradouro: "",
      des_bairro: "",
      num_cep: "",
      id_municipio: "2927408", // Salvador - BA (baseado no dado de exemplo)
      num_telefone: "",
    },
  });

  useEffect(() => {
    fetchSelectData();
  }, []);

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

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Remover formatação do CPF/CNPJ
      const cpfCnpjLimpo = data.num_cpf_cnpj.replace(/[^\d]/g, '');
      
      const insertData: any = {
        nom_entidade: data.nom_entidade,
        num_cpf_cnpj: cpfCnpjLimpo,
        id_tipo_entidade: parseInt(data.id_tipo_entidade),
        id_tipo_pessoa: parseInt(data.id_tipo_pessoa),
        nom_razao_social: data.nom_razao_social || null,
        id_tipo_situacao: parseInt(data.id_tipo_situacao),
        des_logradouro: data.des_logradouro,
        des_bairro: data.des_bairro,
        num_cep: data.num_cep.replace(/[^\d]/g, ''),
        id_municipio: parseInt(data.id_municipio),
        id_unidade_federativa: 29, // Bahia
        num_telefone: data.num_telefone || null,
        id_usuario_criador: user.id,
        dat_criacao: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('entidade')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Entidade cadastrada com sucesso",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar entidade:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar entidade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCpfCnpjChange = (value: string) => {
    const masked = applyCpfCnpjMask(value);
    form.setValue('num_cpf_cnpj', masked);
  };

  const handleCepChange = (value: string) => {
    const masked = value.replace(/[^\d]/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
    form.setValue('num_cep', masked);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>Cadastro de Entidade</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nom_entidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Entidade</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        onChange={(e) => handleCpfCnpjChange(e.target.value)}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
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
                    <FormLabel>Tipo de Entidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
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
                    <FormLabel>Tipo de Pessoa</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
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
                      <Input {...field} />
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
                    <FormLabel>Situação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a situação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposSituacao.map((situacao) => (
                          <SelectItem key={situacao.id_tipo_situacao} value={situacao.id_tipo_situacao.toString()}>
                            {situacao.des_tipo_situacao}
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
                name="des_logradouro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logradouro</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="num_cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                      />
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
                      <Input {...field} placeholder="(00) 00000-0000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}