
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

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
    },
  });

  useEffect(() => {
    if (editingTipoResiduo) {
      form.reset({
        des_tipo_residuo: editingTipoResiduo.des_tipo_residuo || "",
        des_recurso_natural: editingTipoResiduo.des_recurso_natural || "",
      });
    }
  }, [editingTipoResiduo, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('Saving tipo residuo:', data);
      
      const tipoResiduoData = {
        des_tipo_residuo: data.des_tipo_residuo,
        des_recurso_natural: data.des_recurso_natural || null,
        des_status: 'A',
        des_locked: 'D',
        dat_atualizacao: new Date().toISOString(),
        id_usuario_atualizador: 1, // TODO: get from auth context
      };

      if (isEditing) {
        const { error } = await supabase
          .from('tipo_residuo')
          .update(tipoResiduoData)
          .eq('id_tipo_residuo', editingTipoResiduo.id_tipo_residuo);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tipo_residuo')
          .insert([{
            ...tipoResiduoData,
            dat_criacao: new Date().toISOString(),
            id_usuario_criador: 1, // TODO: get from auth context
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-residuo'] });
      toast.success(
        isEditing 
          ? 'Tipo de resíduo atualizado com sucesso!'
          : 'Tipo de resíduo criado com sucesso!'
      );
      onSuccess();
    },
    onError: (error) => {
      console.error('Error saving tipo residuo:', error);
      toast.error('Erro ao salvar tipo de resíduo');
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
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-recycle-green" />
            <div>
              <CardTitle>
                {isEditing ? 'Editar Tipo de Resíduo' : 'Novo Tipo de Resíduo'}
              </CardTitle>
              <CardDescription>
                {isEditing 
                  ? 'Atualize as informações do tipo de resíduo'
                  : 'Preencha as informações para criar um novo tipo de resíduo'
                }
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="flex gap-4 pt-6 border-t">
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
  );
}
