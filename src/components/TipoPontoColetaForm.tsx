
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface TipoPontoColeta {
  id_tipo_ponto_coleta: number;
  des_tipo_ponto_coleta: string;
  des_status: string;
  des_locked: string;
  id_usuario_criador: number;
  dat_criacao: string;
  id_usuario_atualizador?: number;
  dat_atualizacao?: string;
}

interface TipoPontoColetaFormProps {
  editingTipoPontoColeta?: TipoPontoColeta;
  onBack: () => void;
  onSuccess: () => void;
}

const formSchema = z.object({
  des_tipo_ponto_coleta: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

export function TipoPontoColetaForm({ editingTipoPontoColeta, onBack, onSuccess }: TipoPontoColetaFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!editingTipoPontoColeta;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      des_tipo_ponto_coleta: "",
    },
  });

  useEffect(() => {
    if (editingTipoPontoColeta) {
      form.reset({
        des_tipo_ponto_coleta: editingTipoPontoColeta.des_tipo_ponto_coleta,
      });
    }
  }, [editingTipoPontoColeta, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('Saving tipo ponto coleta:', data, 'isEditing:', isEditing);
      
      if (isEditing) {
        const { data: result, error } = await supabase
          .from('tipo_ponto_coleta')
          .update({
            des_tipo_ponto_coleta: data.des_tipo_ponto_coleta.trim(),
            dat_atualizacao: new Date().toISOString(),
            id_usuario_atualizador: 1,
          })
          .eq('id_tipo_ponto_coleta', editingTipoPontoColeta.id_tipo_ponto_coleta)
          .select();

        if (error) {
          console.error('Erro ao atualizar:', error);
          throw error;
        }
        console.log('Atualizado com sucesso:', result);
      } else {
        const { data: result, error } = await supabase
          .from('tipo_ponto_coleta')
          .insert({
            des_tipo_ponto_coleta: data.des_tipo_ponto_coleta.trim(),
            des_status: 'A',
            des_locked: 'D',
            id_usuario_criador: 1,
            dat_criacao: new Date().toISOString(),
          })
          .select();

        if (error) {
          console.error('Erro ao criar:', error);
          throw error;
        }
        console.log('Criado com sucesso:', result);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-ponto-coleta'] });
      toast({
        title: isEditing ? "Tipo atualizado" : "Tipo criado",
        description: `Tipo de ponto de coleta ${isEditing ? "atualizado" : "criado"} com sucesso.`,
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('Erro ao salvar tipo de ponto de coleta:', error);
      toast({
        title: "Erro",
        description: `Erro ao ${isEditing ? "atualizar" : "criar"} tipo de ponto de coleta.`,
        variant: "destructive",
      });
    },
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
              {isEditing ? 'Editar Tipo de Ponto de Coleta' : 'Novo Tipo de Ponto de Coleta'}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Atualize as informações do tipo de ponto de coleta'
                : 'Preencha as informações para criar um novo tipo de ponto de coleta'
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
              name="des_tipo_ponto_coleta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Tipo de Ponto de Coleta *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Ponto de Entrega Voluntária"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
