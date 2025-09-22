
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!editingTipoPontoColeta;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      des_tipo_ponto_coleta: "",
    },
  });
  
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        const updateData = {
          des_tipo_ponto_coleta: data.des_tipo_ponto_coleta.trim(),
          des_status: 'A' as const,
          des_locked: 'D' as const,
          id_usuario_atualizador: user?.id,
          dat_atualizacao: new Date().toISOString()
        };

        const { data: result, error } = await supabase
          .from('tipo_ponto_coleta')
          .update(updateData)
          .eq('id_tipo_ponto_coleta', editingTipoPontoColeta.id_tipo_ponto_coleta)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const insertData = {
          des_tipo_ponto_coleta: data.des_tipo_ponto_coleta.trim(),
          des_status: 'A' as const,
          des_locked: 'D' as const,
          id_usuario_criador: user?.id || 1,
          dat_criacao: new Date().toISOString()
        };

        const { data: result, error } = await supabase
          .from('tipo_ponto_coleta')
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: `Tipo de ponto de coleta ${isEditing ? "atualizado" : "criado"} com sucesso!`,
      });
      queryClient.invalidateQueries({ queryKey: ['tipos-ponto-coleta'] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Erro ao salvar tipo de ponto de coleta:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar tipo de ponto de coleta.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (editingTipoPontoColeta) {
      form.reset({
        des_tipo_ponto_coleta: editingTipoPontoColeta.des_tipo_ponto_coleta,
      });
    }
  }, [editingTipoPontoColeta, form]);

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? "Editar Tipo de Ponto de Coleta" : "Novo Tipo de Ponto de Coleta"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Editar Tipo de Ponto de Coleta" : "Novo Tipo de Ponto de Coleta"}
          </CardTitle>
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
                        placeholder="Digite o nome do tipo de ponto de coleta"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {mutation.isPending ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
