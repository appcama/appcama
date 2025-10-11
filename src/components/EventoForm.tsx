
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const eventoSchema = z.object({
  nom_evento: z.string().min(1, "Nome do evento é obrigatório").max(60, "Nome deve ter no máximo 60 caracteres"),
  des_evento: z.string().max(250, "Descrição deve ter no máximo 250 caracteres").optional(),
  dat_inicio: z.string().min(1, "Data de início é obrigatória"),
  dat_termino: z.string().min(1, "Data de término é obrigatória"),
}).refine((data) => {
  // Comparar datas como locais YYYY-MM-DD para evitar offset de timezone
  const [yi, mi, di] = data.dat_inicio.split('-').map(Number);
  const [yt, mt, dt] = data.dat_termino.split('-').map(Number);
  const inicio = new Date(yi, mi - 1, di);
  const termino = new Date(yt, mt - 1, dt);
  // Permitir mesmo dia: término >= início
  return termino >= inicio;
}, {
  message: "Data de término não pode ser anterior à data de início",
  path: ["dat_termino"],
});

type EventoFormData = z.infer<typeof eventoSchema>;

interface Evento {
  id_evento: number;
  nom_evento: string;
  des_evento: string | null;
  dat_inicio: string;
  dat_termino: string;
  des_status: string;
}

interface EventoFormProps {
  evento?: Evento;
  onBack: () => void;
}

export function EventoForm({ evento, onBack }: EventoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!evento;
  const [openInicio, setOpenInicio] = useState(false);
  const [openTermino, setOpenTermino] = useState(false);

  const form = useForm<EventoFormData>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      nom_evento: "",
      des_evento: "",
      dat_inicio: "",
      dat_termino: "",
    },
  });

  useEffect(() => {
    if (evento) {
      // Converter datas do formato ISO para formato de input date
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      form.reset({
        nom_evento: evento.nom_evento,
        des_evento: evento.des_evento || "",
        dat_inicio: formatDateForInput(evento.dat_inicio),
        dat_termino: formatDateForInput(evento.dat_termino),
      });
    }
  }, [evento, form]);

  const createMutation = useMutation({
    mutationFn: async (data: EventoFormData) => {
      console.log("Criando evento:", data);
      
      const { error } = await supabase.from("evento").insert({
        nom_evento: data.nom_evento,
        des_evento: data.des_evento || null,
        dat_inicio: new Date(data.dat_inicio).toISOString(),
        dat_termino: new Date(data.dat_termino).toISOString(),
        des_status: "A",
        des_locked: "D",
        id_usuario_criador: 1,
        dat_criacao: new Date().toISOString(),
      });

      if (error) {
        console.error("Erro ao criar evento:", error);
        if (error.code === '23505') {
          throw new Error("Já existe um evento com este nome. Por favor, escolha outro nome.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      toast({
        title: "Evento criado",
        description: "O evento foi criado com sucesso.",
      });
      onBack();
    },
    onError: (error) => {
      console.error("Erro ao criar evento:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o evento.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EventoFormData) => {
      if (!evento) return;
      
      console.log("Atualizando evento:", data);
      
      const { error } = await supabase
        .from("evento")
        .update({
          nom_evento: data.nom_evento,
          des_evento: data.des_evento || null,
          dat_inicio: new Date(data.dat_inicio).toISOString(),
          dat_termino: new Date(data.dat_termino).toISOString(),
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: 1,
        })
        .eq("id_evento", evento.id_evento);

      if (error) {
        console.error("Erro ao atualizar evento:", error);
        if (error.code === '23505') {
          throw new Error("Já existe um evento com este nome. Por favor, escolha outro nome.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      toast({
        title: "Evento atualizado",
        description: "O evento foi atualizado com sucesso.",
      });
      onBack();
    },
    onError: (error) => {
      console.error("Erro ao atualizar evento:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o evento.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventoFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mr-4 h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5" />
          <div>
            <h2 className="text-xl font-semibold">
              {isEditing ? "Editar Evento" : "Novo Evento"}
            </h2>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nom_evento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Evento *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Digite o nome do evento"
                      maxLength={60}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="des_evento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite a descrição do evento (opcional)"
                      className="resize-none"
                      rows={3}
                      maxLength={250}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dat_inicio"
                render={({ field }) => {
                  // Converter valor do campo (YYYY-MM-DD) em Date local para seleção
                  const selectedDate = field.value
                    ? (() => {
                        const [y, m, d] = field.value.split('-').map(Number);
                        return new Date(y, m - 1, d);
                      })()
                    : undefined;

                  const handleSelect = (date?: Date) => {
                    if (!date) return;
                    // Formatar para YYYY-MM-DD sem depender de timezone
                    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    field.onChange(isoDate);
                    setOpenInicio(false);
                  };

                  return (
                    <FormItem>
                      <FormLabel>Data de Início *</FormLabel>
                      <Popover open={openInicio} onOpenChange={setOpenInicio}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {selectedDate
                              ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                              : "Selecionar data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleSelect}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="dat_termino"
                render={({ field }) => {
                  const selectedDate = field.value
                    ? (() => {
                        const [y, m, d] = field.value.split('-').map(Number);
                        return new Date(y, m - 1, d);
                      })()
                    : undefined;

                  const handleSelect = (date?: Date) => {
                    if (!date) return;
                    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    // Se já há data de início, impedir seleção anterior a ela, mas permitir igual
                    const inicioStr = form.getValues('dat_inicio');
                    if (inicioStr) {
                      const [yi, mi, di] = inicioStr.split('-').map(Number);
                      const inicio = new Date(yi, mi - 1, di);
                      const termino = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      if (termino < inicio) {
                        form.setError('dat_termino', { message: 'Data de término não pode ser anterior à data de início' });
                        return;
                      } else {
                        form.clearErrors('dat_termino');
                      }
                    }
                    field.onChange(isoDate);
                    setOpenTermino(false);
                  };

                  return (
                    <FormItem>
                      <FormLabel>Data de Término *</FormLabel>
                      <Popover open={openTermino} onOpenChange={setOpenTermino}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {selectedDate
                              ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                              : "Selecionar data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleSelect}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting 
                  ? (isEditing ? "Atualizando..." : "Salvando...") 
                  : (isEditing ? "Atualizar" : "Salvar")
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
