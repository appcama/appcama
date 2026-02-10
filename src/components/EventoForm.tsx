
import { useState, useEffect, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Calendar as CalendarIcon, Globe, Lock, X, AlertTriangle, Users, MapPin, DollarSign } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EventoLogoUploadArea } from "@/components/EventoLogoUploadArea";
import { useAuth } from "@/hooks/useAuth";

const eventoSchema = z.object({
  nom_evento: z.string().min(1, "Nome do evento é obrigatório").max(60, "Nome deve ter no máximo 60 caracteres"),
  des_evento: z.string().max(250, "Descrição deve ter no máximo 250 caracteres").optional(),
  dat_inicio: z.string().min(1, "Data de início é obrigatória"),
  dat_termino: z.string().min(1, "Data de término é obrigatória"),
  des_visibilidade: z.enum(['P', 'R']),
}).refine((data) => {
  const [yi, mi, di] = data.dat_inicio.split('-').map(Number);
  const [yt, mt, dt] = data.dat_termino.split('-').map(Number);
  const inicio = new Date(yi, mi - 1, di);
  const termino = new Date(yt, mt - 1, dt);
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
  des_logo_url?: string | null;
  des_visibilidade?: string;
  id_usuario_criador?: number;
  des_ponto_coleta?: string;
  id_tabela_precos?: number | null;
  des_tabela_preco_restrita?: string;
}

interface TabelaPrecos {
  id_tabela_precos: number;
  des_tabela_precos: string;
}

interface Entidade {
  id_entidade: number;
  nom_entidade: string;
}

interface EventoEntidade {
  id_entidade: number;
  hasColetas: boolean;
}

interface PontoColeta {
  id_ponto_coleta: number;
  nom_ponto_coleta: string;
  id_entidade_gestora: number;
}

interface EventoFormProps {
  evento?: Evento;
  onBack: () => void;
}

const MAX_ENTIDADES_PRIVADO = 15;

export function EventoForm({ evento, onBack }: EventoFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!evento;
  const [openInicio, setOpenInicio] = useState(false);
  const [openTermino, setOpenTermino] = useState(false);
  
  // Logo states
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);

  // Visibility and access control states
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [selectedEntidades, setSelectedEntidades] = useState<EventoEntidade[]>([]);
  const [similarEvents, setSimilarEvents] = useState<string[]>([]);
  const [loadingEntidades, setLoadingEntidades] = useState(false);

  // Pontos de Coleta states
  const [pontosColetaEnabled, setPontosColetaEnabled] = useState(false);
  const [pontosColeta, setPontosColeta] = useState<PontoColeta[]>([]);
  const [selectedPontosColeta, setSelectedPontosColeta] = useState<number[]>([]);
  const [loadingPontos, setLoadingPontos] = useState(false);

  // Tabela de Preços states
  const [compraResiduosEnabled, setCompraResiduosEnabled] = useState(false);
  const [tabelasPrecos, setTabelasPrecos] = useState<TabelaPrecos[]>([]);
  const [selectedTabelaPrecos, setSelectedTabelaPrecos] = useState<string>('');
  const [tabelaPrecoRestrita, setTabelaPrecoRestrita] = useState<string>('D');

  const isAdmin = user?.isAdmin || user?.entityId === 1;

  const form = useForm<EventoFormData>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      nom_evento: "",
      des_evento: "",
      dat_inicio: "",
      dat_termino: "",
      des_visibilidade: isAdmin ? "P" : "R",
    },
  });

  const visibilidade = form.watch("des_visibilidade");
  const nomEvento = form.watch("nom_evento");

  // Load entidades for access control
  useEffect(() => {
    const loadEntidades = async () => {
      setLoadingEntidades(true);
      try {
        const { data, error } = await supabase
          .from('entidade')
          .select('id_entidade, nom_entidade')
          .eq('des_status', 'A')
          .order('nom_entidade');

        if (error) throw error;
        setEntidades(data || []);
      } catch (error) {
        console.error('Erro ao carregar entidades:', error);
      } finally {
        setLoadingEntidades(false);
      }
    };

    loadEntidades();
  }, []);

  // Load pontos de coleta
  useEffect(() => {
    const loadPontosColeta = async () => {
      setLoadingPontos(true);
      try {
        const { data, error } = await supabase
          .from('ponto_coleta')
          .select('id_ponto_coleta, nom_ponto_coleta, id_entidade_gestora')
          .eq('des_status', 'A')
          .order('nom_ponto_coleta');

        if (error) throw error;
        setPontosColeta(data || []);
      } catch (error) {
        console.error('Erro ao carregar pontos de coleta:', error);
      } finally {
        setLoadingPontos(false);
      }
    };

    loadPontosColeta();
  }, []);

  // Load tabelas de precos
  useEffect(() => {
    const loadTabelasPrecos = async () => {
      try {
        const { data, error } = await supabase
          .from('tabela_precos')
          .select('id_tabela_precos, des_tabela_precos')
          .eq('des_status', 'A')
          .order('des_tabela_precos');

        if (error) throw error;
        setTabelasPrecos(data || []);
      } catch (error) {
        console.error('Erro ao carregar tabelas de preços:', error);
      }
    };

    loadTabelasPrecos();
  }, []);

  // Load existing access control when editing
  useEffect(() => {
    const loadEventoEntidades = async () => {
      if (!evento?.id_evento) return;

      try {
        // Load entidades with access
        const { data: eventoEntidades, error } = await supabase
          .from('evento_entidade')
          .select('id_entidade')
          .eq('id_evento', evento.id_evento);

        if (error) throw error;

        // Check which entidades have coletas associated
        const entidadesWithColetas: EventoEntidade[] = [];
        
        for (const ee of eventoEntidades || []) {
          const { count } = await supabase
            .from('coleta')
            .select('id_coleta', { count: 'exact', head: true })
            .eq('id_evento', evento.id_evento)
            .eq('id_entidade_geradora', ee.id_entidade);

          entidadesWithColetas.push({
            id_entidade: ee.id_entidade,
            hasColetas: (count || 0) > 0
          });
        }

        setSelectedEntidades(entidadesWithColetas);
      } catch (error) {
        console.error('Erro ao carregar entidades do evento:', error);
      }
    };

    loadEventoEntidades();
  }, [evento?.id_evento]);

  // Load existing pontos de coleta when editing
  useEffect(() => {
    const loadEventoPontosColeta = async () => {
      if (!evento?.id_evento) return;

      try {
        // Load des_ponto_coleta from evento
        const { data: eventoData } = await supabase
          .from('evento')
          .select('des_ponto_coleta')
          .eq('id_evento', evento.id_evento)
          .maybeSingle();

        if (eventoData?.des_ponto_coleta === 'A') {
          setPontosColetaEnabled(true);

          // Load associated pontos
          const { data: eventoPontos, error } = await supabase
            .from('evento_ponto_coleta')
            .select('id_ponto_coleta')
            .eq('id_evento', evento.id_evento);

          if (error) throw error;
          setSelectedPontosColeta((eventoPontos || []).map(p => p.id_ponto_coleta));
        }
      } catch (error) {
        console.error('Erro ao carregar pontos de coleta do evento:', error);
      }
    };

    loadEventoPontosColeta();
  }, [evento?.id_evento]);

  // Load tabela de precos when editing
  useEffect(() => {
    const loadEventoTabelaPrecos = async () => {
      if (!evento?.id_evento) return;

      try {
        const { data: eventoData } = await supabase
          .from('evento')
          .select('id_tabela_precos, des_tabela_preco_restrita')
          .eq('id_evento', evento.id_evento)
          .maybeSingle();

        if (eventoData?.id_tabela_precos) {
          setCompraResiduosEnabled(true);
          setSelectedTabelaPrecos(eventoData.id_tabela_precos.toString());
          setTabelaPrecoRestrita(eventoData.des_tabela_preco_restrita || 'D');
        }
      } catch (error) {
        console.error('Erro ao carregar tabela de preços do evento:', error);
      }
    };

    loadEventoTabelaPrecos();
  }, [evento?.id_evento]);

  // Check for similar event names (debounced)
  useEffect(() => {
    const checkSimilarEvents = async () => {
      if (!nomEvento || nomEvento.length < 3) {
        setSimilarEvents([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('evento')
          .select('nom_evento')
          .ilike('nom_evento', `%${nomEvento}%`)
          .neq('id_evento', evento?.id_evento || 0)
          .limit(5);

        if (error) throw error;
        setSimilarEvents((data || []).map(e => e.nom_evento || '').filter(Boolean));
      } catch (error) {
        console.error('Erro ao verificar eventos similares:', error);
      }
    };

    const debounceTimer = setTimeout(checkSimilarEvents, 500);
    return () => clearTimeout(debounceTimer);
  }, [nomEvento, evento?.id_evento]);

  useEffect(() => {
    if (evento) {
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      form.reset({
        nom_evento: evento.nom_evento,
        des_evento: evento.des_evento || "",
        dat_inicio: formatDateForInput(evento.dat_inicio),
        dat_termino: formatDateForInput(evento.dat_termino),
        des_visibilidade: (evento.des_visibilidade as 'P' | 'R') || 'R',
      });
      
      if (evento.des_logo_url) {
        setExistingLogoUrl(evento.des_logo_url);
      }
    }
  }, [evento, form]);

  const handleLogoChange = (file: File | null, preview: string | null) => {
    setNewLogoFile(file);
    setNewLogoPreview(preview);
    setLogoRemoved(false);
  };

  const handleLogoRemove = () => {
    setNewLogoFile(null);
    setNewLogoPreview(null);
    setExistingLogoUrl(null);
    setLogoRemoved(true);
  };

  const handleAddEntidade = (entidadeId: string) => {
    if (entidadeId === "all" || !entidadeId) return;
    
    const id = parseInt(entidadeId);
    if (selectedEntidades.some(e => e.id_entidade === id)) return;
    if (selectedEntidades.length >= MAX_ENTIDADES_PRIVADO) {
      toast({
        title: "Limite atingido",
        description: `Máximo de ${MAX_ENTIDADES_PRIVADO} entidades permitidas.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedEntidades(prev => [...prev, { id_entidade: id, hasColetas: false }]);
  };

  const handleRemoveEntidade = (entidadeId: number) => {
    const entidade = selectedEntidades.find(e => e.id_entidade === entidadeId);
    if (entidade?.hasColetas) {
      toast({
        title: "Não é possível remover",
        description: "Esta entidade possui coletas associadas a este evento.",
        variant: "destructive",
      });
      return;
    }
    setSelectedEntidades(prev => prev.filter(e => e.id_entidade !== entidadeId));
  };

  // Pontos de coleta handlers
  const handleAddPontoColeta = (pontoId: string) => {
    if (!pontoId) return;
    const id = parseInt(pontoId);
    if (selectedPontosColeta.includes(id)) return;
    setSelectedPontosColeta(prev => [...prev, id]);
  };

  const handleRemovePontoColeta = (pontoId: number) => {
    setSelectedPontosColeta(prev => prev.filter(id => id !== pontoId));
  };

  const handlePontosColetaToggle = (enabled: boolean) => {
    setPontosColetaEnabled(enabled);
    if (!enabled) {
      setSelectedPontosColeta([]);
    }
  };

  // Filter pontos de coleta based on visibility rules
  const getAvailablePontosColeta = () => {
    let filtered = pontosColeta;

    // For private events, filter by creator entity or associated entities
    if (visibilidade === 'R') {
      const allowedEntidades = new Set<number>();
      // Creator entity
      if (user?.entityId) {
        allowedEntidades.add(user.entityId);
      }
      // Associated entities from access control
      selectedEntidades.forEach(e => allowedEntidades.add(e.id_entidade));

      filtered = filtered.filter(p => allowedEntidades.has(p.id_entidade_gestora));
    }

    // Exclude already selected
    return filtered.filter(p => !selectedPontosColeta.includes(p.id_ponto_coleta));
  };

  const getPontoColetaNome = (id: number) => {
    return pontosColeta.find(p => p.id_ponto_coleta === id)?.nom_ponto_coleta || `Ponto ${id}`;
  };

  const uploadLogo = async (eventoId: number): Promise<string | null> => {
    if (!newLogoFile) return null;
    
    const fileExt = newLogoFile.name.split('.').pop();
    const fileName = `evento_${eventoId}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('logos-eventos')
      .upload(fileName, newLogoFile, { upsert: true });
    
    if (uploadError) {
      console.error('Erro ao fazer upload do logo:', uploadError);
      throw uploadError;
    }
    
    const { data: urlData } = supabase.storage
      .from('logos-eventos')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  };

  const saveEventoEntidades = async (eventoId: number) => {
    // Delete existing and insert new
    await supabase
      .from('evento_entidade')
      .delete()
      .eq('id_evento', eventoId);

    if (selectedEntidades.length > 0 && visibilidade === 'R') {
      const inserts = selectedEntidades.map(e => ({
        id_evento: eventoId,
        id_entidade: e.id_entidade,
        id_usuario_criador: user?.id || 1,
      }));

      const { error } = await supabase
        .from('evento_entidade')
        .insert(inserts);

      if (error) {
        console.error('Erro ao salvar entidades do evento:', error);
        throw error;
      }
    }
  };

  const saveEventoPontosColeta = async (eventoId: number) => {
    // Delete existing
    await supabase
      .from('evento_ponto_coleta')
      .delete()
      .eq('id_evento', eventoId);

    if (pontosColetaEnabled && selectedPontosColeta.length > 0) {
      const inserts = selectedPontosColeta.map(pontoId => ({
        id_evento: eventoId,
        id_ponto_coleta: pontoId,
        id_usuario_criador: user?.id || 1,
      }));

      const { error } = await supabase
        .from('evento_ponto_coleta')
        .insert(inserts);

      if (error) {
        console.error('Erro ao salvar pontos de coleta do evento:', error);
        throw error;
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: EventoFormData) => {
      console.log("Criando evento:", data);
      
      const { data: insertedEvento, error } = await supabase.from("evento").insert({
        nom_evento: data.nom_evento,
        des_evento: data.des_evento || null,
        dat_inicio: new Date(data.dat_inicio).toISOString(),
        dat_termino: new Date(data.dat_termino).toISOString(),
        des_visibilidade: data.des_visibilidade,
        des_ponto_coleta: pontosColetaEnabled ? 'A' : 'D',
        id_tabela_precos: compraResiduosEnabled && selectedTabelaPrecos ? parseInt(selectedTabelaPrecos) : null,
        des_tabela_preco_restrita: compraResiduosEnabled ? tabelaPrecoRestrita : 'D',
        des_status: "A",
        des_locked: "D",
        id_usuario_criador: user?.id || 1,
        dat_criacao: new Date().toISOString(),
      }).select('id_evento').single();

      if (error) {
        console.error("Erro ao criar evento:", error);
        if (error.code === '23505') {
          throw new Error("Já existe um evento com este nome. Por favor, escolha outro nome.");
        }
        throw error;
      }

      // Upload logo if selected
      if (newLogoFile && insertedEvento) {
        const logoUrl = await uploadLogo(insertedEvento.id_evento);
        if (logoUrl) {
          await supabase
            .from("evento")
            .update({ des_logo_url: logoUrl })
            .eq("id_evento", insertedEvento.id_evento);
        }
      }

      // Save entidades for private events
      if (insertedEvento && data.des_visibilidade === 'R') {
        await saveEventoEntidades(insertedEvento.id_evento);
      }

      // Save pontos de coleta
      if (insertedEvento) {
        await saveEventoPontosColeta(insertedEvento.id_evento);
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

      let logoUrl = existingLogoUrl;
      if (newLogoFile) {
        logoUrl = await uploadLogo(evento.id_evento);
      } else if (logoRemoved) {
        logoUrl = null;
      }
      
      const { error } = await supabase
        .from("evento")
        .update({
          nom_evento: data.nom_evento,
          des_evento: data.des_evento || null,
          dat_inicio: new Date(data.dat_inicio).toISOString(),
          dat_termino: new Date(data.dat_termino).toISOString(),
          des_visibilidade: data.des_visibilidade,
          des_ponto_coleta: pontosColetaEnabled ? 'A' : 'D',
          id_tabela_precos: compraResiduosEnabled && selectedTabelaPrecos ? parseInt(selectedTabelaPrecos) : null,
          des_tabela_preco_restrita: compraResiduosEnabled ? tabelaPrecoRestrita : 'D',
          des_logo_url: logoUrl,
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: user?.id || 1,
        })
        .eq("id_evento", evento.id_evento);

      if (error) {
        console.error("Erro ao atualizar evento:", error);
        if (error.code === '23505') {
          throw new Error("Já existe um evento com este nome. Por favor, escolha outro nome.");
        }
        throw error;
      }

      // Update entidades for private events
      await saveEventoEntidades(evento.id_evento);

      // Update pontos de coleta
      await saveEventoPontosColeta(evento.id_evento);
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
    // Força visibilidade privada para não-admins
    if (!isAdmin && data.des_visibilidade === 'P') {
      data.des_visibilidade = 'R';
    }
    
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const getEntidadeNome = (id: number) => {
    return entidades.find(e => e.id_entidade === id)?.nom_entidade || `Entidade ${id}`;
  };

  const availableEntidades = entidades.filter(
    e => !selectedEntidades.some(se => se.id_entidade === e.id_entidade)
  );

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

            {/* Similar events alert */}
            {similarEvents.length > 0 && (
              <Alert className="border-amber-500 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Atenção:</strong> Existem eventos com nomes similares: {similarEvents.join(", ")}
                </AlertDescription>
              </Alert>
            )}

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
                  const selectedDate = field.value
                    ? (() => {
                        const [y, m, d] = field.value.split('-').map(Number);
                        return new Date(y, m - 1, d);
                      })()
                    : undefined;

                  const handleSelect = (date?: Date) => {
                    if (!date) return;
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

            {/* Visibility Toggle */}
            <FormField
              control={form.control}
              name="des_visibilidade"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      {field.value === 'P' ? (
                        <Globe className="h-5 w-5 text-green-600" />
                      ) : (
                        <Lock className="h-5 w-5 text-amber-600" />
                      )}
                      <div>
                        <Label className="text-base font-medium">
                          {field.value === 'P' ? 'Evento Público' : 'Evento Privado'}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {field.value === 'P' 
                            ? 'Visível para todas as entidades e pode ser associado a qualquer coleta'
                            : 'Visível apenas para entidades autorizadas'
                          }
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={field.value === 'P'}
                      onCheckedChange={(checked) => field.onChange(checked ? 'P' : 'R')}
                      disabled={!isAdmin}
                    />
                  </div>
                  {!isAdmin && (
                    <p className="text-xs text-muted-foreground">
                      Apenas administradores podem criar eventos públicos.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Access Control Section - Only for private events */}
            {visibilidade === 'R' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Controle de Acesso</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {selectedEntidades.length}/{MAX_ENTIDADES_PRIVADO}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  Selecione as entidades que terão acesso a este evento privado. 
                  Se nenhuma for selecionada, apenas a entidade criadora terá acesso.
                </p>

                <Select onValueChange={handleAddEntidade} value="">
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar entidade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEntidades.map((entidade) => (
                      <SelectItem key={entidade.id_entidade} value={entidade.id_entidade.toString()}>
                        {entidade.nom_entidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedEntidades.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedEntidades.map((entidade) => (
                      <Badge 
                        key={entidade.id_entidade} 
                        variant={entidade.hasColetas ? "secondary" : "outline"}
                        className="flex items-center gap-1 py-1 px-2"
                      >
                        {getEntidadeNome(entidade.id_entidade)}
                        {entidade.hasColetas ? (
                          <span className="text-xs text-muted-foreground ml-1">(possui coletas)</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveEntidade(entidade.id_entidade)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pontos de Coleta Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <MapPin className={`h-5 w-5 ${pontosColetaEnabled ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div>
                  <Label className="text-base font-medium">
                    Pontos de Coleta para Entrega
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Definir pontos de coleta específicos para entrega de resíduos neste evento
                  </p>
                </div>
              </div>
              <Switch
                checked={pontosColetaEnabled}
                onCheckedChange={handlePontosColetaToggle}
              />
            </div>

            {/* Pontos de Coleta Selection - Only when enabled */}
            {pontosColetaEnabled && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Pontos de Coleta</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {selectedPontosColeta.length}
                  </Badge>
                </div>

                <Select onValueChange={handleAddPontoColeta} value="">
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar ponto de coleta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailablePontosColeta().map((ponto) => (
                      <SelectItem key={ponto.id_ponto_coleta} value={ponto.id_ponto_coleta.toString()}>
                        {ponto.nom_ponto_coleta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedPontosColeta.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedPontosColeta.map((pontoId) => (
                      <Badge 
                        key={pontoId} 
                        variant="outline"
                        className="flex items-center gap-1 py-1 px-2"
                      >
                        {getPontoColetaNome(pontoId)}
                        <button
                          type="button"
                          onClick={() => handleRemovePontoColeta(pontoId)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Compra de Resíduos Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <DollarSign className={`h-5 w-5 ${compraResiduosEnabled ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div>
                  <Label className="text-base font-medium">
                    Compra de Resíduos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Vincular tabela de preços a este evento
                  </p>
                </div>
              </div>
              <Switch
                checked={compraResiduosEnabled}
                onCheckedChange={(checked) => {
                  setCompraResiduosEnabled(checked);
                  if (!checked) {
                    setSelectedTabelaPrecos('');
                    setTabelaPrecoRestrita('D');
                  }
                }}
              />
            </div>

            {/* Tabela de Preços Selection */}
            {compraResiduosEnabled && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Tabela de Preços</h3>
                </div>

                <Select value={selectedTabelaPrecos} onValueChange={setSelectedTabelaPrecos}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar tabela de preços..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tabelasPrecos.map((tabela) => (
                      <SelectItem key={tabela.id_tabela_precos} value={tabela.id_tabela_precos.toString()}>
                        {tabela.des_tabela_precos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Tipo de Tabela:</Label>
                  <RadioGroup
                    value={tabelaPrecoRestrita}
                    onValueChange={setTabelaPrecoRestrita}
                    className="space-y-2"
                  >
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="D" id="irrestrita" />
                      <Label htmlFor="irrestrita" className="font-normal cursor-pointer">
                        <span className="font-medium">Irrestrita</span> - Permite alterar valores na coleta
                      </Label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="A" id="restrita" />
                      <Label htmlFor="restrita" className="font-normal cursor-pointer">
                        <span className="font-medium">Restrita</span> - Não permite alterar valores
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Logo Upload */}
            <EventoLogoUploadArea
              existingLogoUrl={existingLogoUrl}
              newLogoPreview={newLogoPreview}
              newLogoFile={newLogoFile}
              onLogoChange={handleLogoChange}
              onLogoRemove={handleLogoRemove}
            />

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
