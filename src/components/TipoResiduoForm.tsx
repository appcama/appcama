
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2, Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { TipoResiduoIndicadorForm } from "./TipoResiduoIndicadorForm";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const formSchema = z.object({
  des_tipo_residuo: z.string().min(2, "Nome do tipo deve ter pelo menos 2 caracteres"),
  des_recurso_natural: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TipoResiduo {
  id_tipo_residuo: number;
  des_tipo_residuo: string;
  des_recurso_natural: string;
  des_status: string;
  des_locked: string;
}

interface TipoResiduoIndicador {
  id?: number;
  id_indicador: number;
  nom_indicador: string;
  qtd_referencia: number | null;
}

interface TipoResiduoFormProps {
  onBack: () => void;
  onSuccess: () => void;
  editingTipoResiduo?: TipoResiduo | null;
}

export function TipoResiduoForm({ onBack, onSuccess, editingTipoResiduo }: TipoResiduoFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingTipoResiduo;
  
  const [showIndicadorForm, setShowIndicadorForm] = useState(false);
  const [indicadores, setIndicadores] = useState<TipoResiduoIndicador[]>([]);
  const [editingIndicador, setEditingIndicador] = useState<TipoResiduoIndicador | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      des_tipo_residuo: "",
      des_recurso_natural: "",
    },
  });
  

  // Carregar indicadores vinculados quando editando
  useEffect(() => {
    if (editingTipoResiduo) {
      loadIndicadoresVinculados();
    }
  }, [editingTipoResiduo]);

  const loadIndicadoresVinculados = async () => {
    if (!editingTipoResiduo) return;
    
    try {
      console.log('Buscando indicadores vinculados para tipo:', editingTipoResiduo.id_tipo_residuo);
      
      // Buscar indicadores vinculados com suas informações
      const { data: vinculacoes, error: vinculacoesError } = await supabase
        .from('tipo_residuo__indicador')
        .select('id_indicador, qtd_referencia')
        .eq('id_tipo_residuo', editingTipoResiduo.id_tipo_residuo);
      
      if (vinculacoesError) {
        console.error('Error fetching vinculacoes:', vinculacoesError);
        throw vinculacoesError;
      }

      if (!vinculacoes || vinculacoes.length === 0) {
        console.log('Nenhuma vinculação encontrada');
        setIndicadores([]);
        return;
      }

      // Buscar informações dos indicadores
      const indicadorIds = (vinculacoes as any[]).map(v => v.id_indicador);
      const { data: indicadoresData, error: indicadoresError } = await supabase
        .from('indicador')
        .select('id_indicador, nom_indicador')
        .in('id_indicador', indicadorIds);
      
      if (indicadoresError) {
        console.error('Error fetching indicadores data:', indicadoresError);
        throw indicadoresError;
      }

      // Combinar os dados
      const indicadoresVinculados = (vinculacoes as any[]).map(vinculacao => {
        const indicadorData = indicadoresData?.find(i => i.id_indicador === vinculacao.id_indicador);
        return {
          id_indicador: vinculacao.id_indicador,
          nom_indicador: indicadorData?.nom_indicador || 'Indicador não encontrado',
          qtd_referencia: vinculacao.qtd_referencia,
        };
      });
      
      console.log('Indicadores vinculados carregados:', indicadoresVinculados);
      setIndicadores(indicadoresVinculados);
    } catch (error) {
      console.error('Erro ao carregar indicadores vinculados:', error);
      toast.error('Erro ao carregar indicadores vinculados');
    }
  };

  // Carregar dados do formulário para edição
  useEffect(() => {
    if (editingTipoResiduo) {
      console.log('Carregando dados para edição:', editingTipoResiduo);
      
      form.reset({
        des_tipo_residuo: editingTipoResiduo.des_tipo_residuo || "",
        des_recurso_natural: editingTipoResiduo.des_recurso_natural || "",
      });
    }
  }, [editingTipoResiduo, form]);

  // Gerenciamento de indicadores
  const handleAddIndicador = (indicador: TipoResiduoIndicador) => {
    if (editingIndicador) {
      // Atualizar indicador existente
      setIndicadores(prev => prev.map(i => 
        i.id_indicador === editingIndicador.id_indicador ? indicador : i
      ));
    } else {
      // Adicionar novo indicador
      setIndicadores(prev => [...prev, indicador]);
    }
    setEditingIndicador(null);
    setShowIndicadorForm(false);
  };

  const handleEditIndicador = (indicador: TipoResiduoIndicador) => {
    setEditingIndicador(indicador);
    setShowIndicadorForm(true);
  };

  const handleRemoveIndicador = (idIndicador: number) => {
    setIndicadores(prev => prev.filter(i => i.id_indicador !== idIndicador));
  };

  const handleBackFromIndicadorForm = () => {
    setEditingIndicador(null);
    setShowIndicadorForm(false);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('Salvando tipo residuo:', data);
      console.log('Indicadores vinculados:', indicadores);
      
      if (indicadores.length === 0) {
        throw new Error('Pelo menos um indicador deve ser vinculado');
      }
      
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
      console.log('Criando vinculações para indicadores:', indicadores);
      const indicadorVinculacoes = indicadores.map(indicador => ({
        id_tipo_residuo: tipoResiduoId,
        id_indicador: indicador.id_indicador,
        qtd_referencia: indicador.qtd_referencia,
      }));

      console.log('Dados das vinculações a serem inseridas:', indicadorVinculacoes);

      const { error: vincularError } = await supabase
        .from('tipo_residuo__indicador')
        .insert(indicadorVinculacoes);

      if (vincularError) {
        console.error('Erro ao criar vinculações:', vincularError);
        throw vincularError;
      }
      
      console.log('Vinculações criadas com sucesso!');
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
    console.log('Indicadores selecionados:', indicadores);
    saveMutation.mutate(data);
  };

  // Renderizar formulário de indicador se necessário
  if (showIndicadorForm) {
    return (
      <TipoResiduoIndicadorForm
        onBack={handleBackFromIndicadorForm}
        onAdd={handleAddIndicador}
        existingIndicadores={indicadores}
        editingIndicador={editingIndicador}
      />
    );
  }

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

              {/* Lista de Indicadores Vinculados */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Indicadores Vinculados *</FormLabel>
                  <Button
                    type="button"
                    onClick={() => setShowIndicadorForm(true)}
                    className="bg-recycle-green hover:bg-recycle-green-dark"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                {indicadores.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">
                      Nenhum indicador vinculado. Clique em "Adicionar Indicador" para vincular indicadores a este tipo de resíduo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {indicadores.map((indicador) => (
                      <Card key={indicador.id_indicador} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{indicador.nom_indicador}</h4>
                            <p className="text-sm text-gray-600">
                              Quantidade de Referência: {
                                indicador.qtd_referencia 
                                  ? indicador.qtd_referencia.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })
                                  : 'Não definida'
                              }
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditIndicador(indicador)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveIndicador(indicador.id_indicador)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Excluir</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  É necessário vincular pelo menos um indicador para permitir o cálculo de indicadores ambientais.
                </div>
              </div>

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
                  className="bg-green-600 hover:bg-green-700"
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
