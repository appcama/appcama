
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
import { useOfflineForm } from "@/hooks/useOfflineForm";

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
  
  const { submitForm, isSubmitting } = useOfflineForm({
    table: 'tipo_ponto_coleta',
    onlineSubmit: async (data) => {
      if (isEditing) {
        const { data: result, error } = await supabase
          .from('tipo_ponto_coleta')
          .update(data)
          .eq('id_tipo_ponto_coleta', editingTipoPontoColeta.id_tipo_ponto_coleta)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('tipo_ponto_coleta')
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
    if (editingTipoPontoColeta) {
      form.reset({
        des_tipo_ponto_coleta: editingTipoPontoColeta.des_tipo_ponto_coleta,
      });
    }
  }, [editingTipoPontoColeta, form]);

  const onSubmit = (data: FormData) => {
    const tipoData = {
      des_tipo_ponto_coleta: data.des_tipo_ponto_coleta.trim(),
      des_status: 'A',
      des_locked: 'D',
    };
    
    submitForm(tipoData, isEditing, editingTipoPontoColeta?.id_tipo_ponto_coleta);
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
                <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                  {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
