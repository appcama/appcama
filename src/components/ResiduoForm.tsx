import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";


const residuoSchema = z.object({
  nom_residuo: z
    .string()
    .min(1, "Nome do resíduo é obrigatório")
    .max(30, "Nome do resíduo deve ter no máximo 30 caracteres"),
  id_tipo_residuo: z.number({ required_error: "Tipo de resíduo é obrigatório" }),
});

type FormData = z.infer<typeof residuoSchema>;

interface TipoResiduo {
  id_tipo_residuo: number;
  des_tipo_residuo: string;
}

interface Residuo {
  id_residuo: number;
  nom_residuo: string;
  id_tipo_residuo: number;
  des_status: string;
  des_locked: string;
}

interface ResiduoFormProps {
  onBack: () => void;
  onSuccess: () => void;
  editingResiduo?: Residuo | null;
}

export function ResiduoForm({ onBack, onSuccess, editingResiduo }: ResiduoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(residuoSchema),
    defaultValues: {
      nom_residuo: "",
      id_tipo_residuo: undefined,
    },
  });
  

  // Load tipos de resíduo
  const { data: tiposResiduo = [] } = useQuery({
    queryKey: ['tipos-residuo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipo_residuo')
        .select('id_tipo_residuo, des_tipo_residuo')
        .eq('des_status', 'A')
        .order('des_tipo_residuo');

      if (error) throw error;
      return data as TipoResiduo[];
    },
  });

  // Load data when editing
  useEffect(() => {
    if (editingResiduo) {
      form.reset({
        nom_residuo: editingResiduo.nom_residuo,
        id_tipo_residuo: editingResiduo.id_tipo_residuo,
      });
    }
  }, [editingResiduo, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editingResiduo) {
        // Update
        const { error } = await supabase
          .from('residuo')
          .update({
            nom_residuo: data.nom_residuo,
            id_tipo_residuo: data.id_tipo_residuo,
            dat_atualizacao: new Date().toISOString(),
            id_usuario_atualizador: 1, // TODO: get from auth context
          })
          .eq('id_residuo', editingResiduo.id_residuo);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('residuo')
          .insert({
            nom_residuo: data.nom_residuo,
            id_tipo_residuo: data.id_tipo_residuo,
            des_status: 'A',
            des_locked: 'D',
            dat_criacao: new Date().toISOString(),
            id_usuario_criador: 1, // TODO: get from auth context
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residuos'] });
      toast({
        title: "Sucesso",
        description: editingResiduo 
          ? "Resíduo atualizado com sucesso!"
          : "Resíduo cadastrado com sucesso!",
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Erro ao salvar resíduo:', error);
      
      let errorMessage = "Erro interno do servidor.";
      
      if (error?.code === '23505') { // Unique constraint violation
        errorMessage = "Este nome de resíduo já existe. Escolha um nome diferente.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <CardTitle className="flex items-center gap-2">
            {editingResiduo ? "Editar Resíduo" : "Novo Resíduo"}
          </CardTitle>
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nom_residuo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Resíduo *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite o nome do resíduo" 
                          maxLength={25}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="id_tipo_residuo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Resíduo *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de resíduo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposResiduo.map((tipo) => (
                            <SelectItem 
                              key={tipo.id_tipo_residuo} 
                              value={tipo.id_tipo_residuo.toString()}
                            >
                              {tipo.des_tipo_residuo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending
                    ? "Salvando..."
                    : editingResiduo
                    ? "Atualizar"
                    : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}