
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { useOfflineForm } from "@/hooks/useOfflineForm";

const formSchema = z.object({
  des_tipo_entidade: z.string().min(2, "Nome do tipo deve ter pelo menos 2 caracteres"),
  des_geradora_residuo: z.boolean().default(false),
  des_coletora_residuo: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface TipoEntidade {
  id_tipo_entidade: number;
  des_tipo_entidade: string;
  des_geradora_residuo: string;
  des_coletora_residuo: string;
  des_status: string;
  des_locked: string;
}

interface TipoEntidadeFormProps {
  onBack: () => void;
  onSuccess: () => void;
  editingTipoEntidade?: TipoEntidade | null;
}

export function TipoEntidadeForm({ onBack, onSuccess, editingTipoEntidade }: TipoEntidadeFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingTipoEntidade;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      des_tipo_entidade: "",
      des_geradora_residuo: false,
      des_coletora_residuo: false,
    },
  });
  
  const { submitForm, isSubmitting } = useOfflineForm({
    table: 'tipo_entidade',
    onlineSubmit: async (data) => {
      if (isEditing) {
        const { data: result, error } = await supabase
          .from('tipo_entidade')
          .update(data)
          .eq('id_tipo_entidade', editingTipoEntidade.id_tipo_entidade)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('tipo_entidade')
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
    if (editingTipoEntidade) {
      form.reset({
        des_tipo_entidade: editingTipoEntidade.des_tipo_entidade || "",
        des_geradora_residuo: editingTipoEntidade.des_geradora_residuo === 'A',
        des_coletora_residuo: editingTipoEntidade.des_coletora_residuo === 'A',
      });
    }
  }, [editingTipoEntidade, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('Saving tipo entidade:', data);
      
      const tipoEntidadeData = {
        des_tipo_entidade: data.des_tipo_entidade,
        des_geradora_residuo: data.des_geradora_residuo ? 'A' : 'D',
        des_coletora_residuo: data.des_coletora_residuo ? 'A' : 'D',
        des_status: 'A',
        des_locked: 'D',
        dat_atualizacao: new Date().toISOString(),
        id_usuario_atualizador: 1, // TODO: get from auth context
      };

      if (isEditing) {
        const { error } = await supabase
          .from('tipo_entidade')
          .update(tipoEntidadeData)
          .eq('id_tipo_entidade', editingTipoEntidade.id_tipo_entidade);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tipo_entidade')
          .insert([{
            ...tipoEntidadeData,
            dat_criacao: new Date().toISOString(),
            id_usuario_criador: 1, // TODO: get from auth context
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-entidade'] });
      toast.success(
        isEditing 
          ? 'Tipo de entidade atualizado com sucesso!'
          : 'Tipo de entidade criado com sucesso!'
      );
      onSuccess();
    },
    onError: (error) => {
      console.error('Error saving tipo entidade:', error);
      toast.error('Erro ao salvar tipo de entidade');
    }
  });

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    saveMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>
              {isEditing ? 'Editar Tipo de Entidade' : 'Novo Tipo de Entidade'}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Atualize as informações do tipo de entidade'
                : 'Preencha as informações para criar um novo tipo de entidade'
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="des_tipo_entidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Tipo *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Cooperativa de Reciclagem" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="des_geradora_residuo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Geradora de Resíduos
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Este tipo de entidade pode gerar resíduos
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="des_coletora_residuo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Coletora de Resíduos
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Este tipo de entidade pode coletar resíduos
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {saveMutation.isPending
                  ? 'Salvando...'
                  : isEditing
                  ? 'Atualizar'
                  : 'Criar'
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
