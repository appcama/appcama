
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  des_tipo_residuo: z.string().min(2, "Nome do tipo deve ter pelo menos 2 caracteres"),
  des_recurso_natural: z.string().optional(),
  indicadores: z.array(z.number()).min(1, "Pelo menos um indicador deve ser selecionado"),
});

type FormData = z.infer<typeof formSchema>;

interface TipoResiduo {
  id_tipo_residuo: number;
  des_tipo_residuo: string;
  des_recurso_natural: string;
  des_status: string;
  des_locked: string;
}

interface Indicador {
  id_indicador: number;
  nom_indicador: string;
  des_status: string;
}

interface TipoResiduoFormProps {
  onBack: () => void;
  onSuccess: () => void;
  editingTipoResiduo?: TipoResiduo | null;
}

export function TipoResiduoForm({ onBack, onSuccess, editingTipoResiduo }: TipoResiduoFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingTipoResiduo;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      des_tipo_residuo: "",
      des_recurso_natural: "",
      indicadores: [],
    },
  });

  // Query para carregar indicadores disponíveis
  const { data: indicadores = [] } = useQuery({
    queryKey: ['indicadores-ativos'],
    queryFn: async () => {
      console.log('Buscando indicadores ativos...');
      const { data, error } = await supabase
        .from('indicador')
        .select('id_indicador, nom_indicador, des_status')
        .eq('des_status', 'A')
        .order('nom_indicador');
      
      if (error) {
        console.error('Error fetching indicadores:', error);
        throw error;
      }
      
      console.log('Indicadores ativos encontrados:', data);
      return data as Indicador[];
    }
  });

  // Query para carregar indicadores já vinculados (quando editando)
  const { data: indicadoresVinculados = [] } = useQuery({
    queryKey: ['indicadores-vinculados', editingTipoResiduo?.id_tipo_residuo],
    queryFn: async () => {
      if (!editingTipoResiduo) return [];
      
      console.log('Buscando indicadores vinculados para tipo:', editingTipoResiduo.id_tipo_residuo);
      const { data, error } = await supabase
        .from('tipo_residuo__indicador')
        .select('id_indicador')
        .eq('id_tipo_residuo', editingTipoResiduo.id_tipo_residuo);
      
      if (error) {
        console.error('Error fetching indicadores vinculados:', error);
        throw error;
      }
      
      const ids = data.map(item => item.id_indicador);
      console.log('Indicadores vinculados encontrados:', ids);
      return ids;
    },
    enabled: !!editingTipoResiduo
  });

  useEffect(() => {
    if (editingTipoResiduo) {
      console.log('Carregando dados para edição:', editingTipoResiduo);
      console.log('Indicadores vinculados:', indicadoresVinculados);
      
      form.reset({
        des_tipo_residuo: editingTipoResiduo.des_tipo_residuo || "",
        des_recurso_natural: editingTipoResiduo.des_recurso_natural || "",
        indicadores: indicadoresVinculados,
      });
    }
  }, [editingTipoResiduo, indicadoresVinculados, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('Salvando tipo residuo:', data);
      
      const tipoResiduoData = {
        des_tipo_residuo: data.des_tipo_residuo,
        des_recurso_natural: data.des_recurso_natural || null,
        dat_atualizacao: new Date().toISOString(),
        id_usuario_atualizador: 1, // TODO: get from auth context
      };

      let tipoResiduoId: number;

      if (isEditing && editingTipoResiduo) {
        console.log('Atualizando tipo residuo existente:', editingTipoResiduo.id_tipo_residuo);
        console.log('Dados para atualização:', tipoResiduoData);
        
        const { error } = await supabase
          .from('tipo_residuo')
          .update(tipoResiduoData)
          .eq('id_tipo_residuo', editingTipoResiduo.id_tipo_residuo);

        if (error) {
          console.error('Erro ao atualizar tipo residuo:', error);
          throw error;
        }
        
        tipoResiduoId = editingTipoResiduo.id_tipo_residuo;

        // Remover vinculações existentes
        console.log('Removendo vinculações existentes para tipo:', tipoResiduoId);
        const { error: deleteError } = await supabase
          .from('tipo_residuo__indicador')
          .delete()
          .eq('id_tipo_residuo', tipoResiduoId);

        if (deleteError) {
          console.error('Erro ao remover vinculações existentes:', deleteError);
          throw deleteError;
        }
      } else {
        console.log('Criando novo tipo residuo com dados:', tipoResiduoData);
        const { data: result, error } = await supabase
          .from('tipo_residuo')
          .insert([{
            ...tipoResiduoData,
            des_status: 'A',
            des_locked: 'D',
            dat_criacao: new Date().toISOString(),
            id_usuario_criador: 1, // TODO: get from auth context
          }])
          .select();

        if (error) {
          console.error('Erro ao criar tipo residuo:', error);
          throw error;
        }
        if (!result || result.length === 0) {
          console.error('Nenhum resultado retornado ao criar tipo residuo');
          throw new Error('Erro ao criar tipo de resíduo');
        }
        
        tipoResiduoId = result[0].id_tipo_residuo;
        console.log('Novo tipo residuo criado com ID:', tipoResiduoId);
      }

      // Inserir novas vinculações com indicadores
      console.log('Criando vinculações para indicadores:', data.indicadores);
      const indicadorVinculacoes = data.indicadores.map(idIndicador => ({
        id_tipo_residuo: tipoResiduoId,
        id_indicador: idIndicador,
      }));

      console.log('Dados das vinculações a serem inseridas:', indicadorVinculacoes);

      if (indicadorVinculacoes.length > 0) {
        const { error: vincularError } = await supabase
          .from('tipo_residuo__indicador')
          .insert(indicadorVinculacoes);

        if (vincularError) {
          console.error('Erro ao criar vinculações:', vincularError);
          throw vincularError;
        }
        
        console.log('Vinculações criadas com sucesso!');
      }
    },
    onSuccess: () => {
      console.log('Mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['tipos-residuo'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores-vinculados'] });
      toast.success(
        isEditing 
          ? 'Tipo de resíduo atualizado com sucesso!'
          : 'Tipo de resíduo criado com sucesso!'
      );
      onSuccess();
    },
    onError: (error) => {
      console.error('Error saving tipo residuo:', error);
      toast.error('Erro ao salvar tipo de resíduo: ' + (error.message || 'Erro desconhecido'));
    }
  });

  const onSubmit = (data: FormData) => {
    console.log('Form submitted com dados:', data);
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Editar Tipo de Resíduo' : 'Novo Tipo de Resíduo'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-recycle-green" />
            <div>
              <CardTitle>Dados do Tipo de Resíduo</CardTitle>
              <CardDescription>
                {isEditing 
                  ? 'Atualize as informações do tipo de resíduo'
                  : 'Preencha as informações para criar um novo tipo de resíduo'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="des_tipo_residuo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Tipo *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Plástico PET" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="des_recurso_natural"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurso Natural</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Petróleo" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="indicadores"
                render={() => (
                  <FormItem>
                    <FormLabel>Indicadores *</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {indicadores.length === 0 ? (
                          <div className="text-sm text-muted-foreground p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            ⚠️ Nenhum indicador encontrado. É necessário cadastrar indicadores antes de criar tipos de resíduos.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {indicadores.map((indicador) => (
                              <FormField
                                key={indicador.id_indicador}
                                control={form.control}
                                name="indicadores"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={indicador.id_indicador}
                                      className="flex flex-row items-start space-x-3 space-y-0 border rounded-md p-3"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(indicador.id_indicador)}
                                          onCheckedChange={(checked) => {
                                            const currentValue = field.value || [];
                                            if (checked) {
                                              field.onChange([...currentValue, indicador.id_indicador]);
                                            } else {
                                              field.onChange(
                                                currentValue.filter((value) => value !== indicador.id_indicador)
                                              );
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer">
                                        {indicador.nom_indicador}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Selecione pelo menos um indicador para permitir o cálculo de indicadores ambientais.
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending || indicadores.length === 0}
                >
                  {saveMutation.isPending
                    ? 'Salvando...'
                    : isEditing
                    ? 'Atualizar'
                    : 'Salvar'
                  }
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
