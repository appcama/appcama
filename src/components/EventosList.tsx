
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, Plus, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Evento {
  id_evento: number;
  nom_evento: string;
  des_evento: string | null;
  dat_inicio: string;
  dat_termino: string;
  des_status: string;
}

interface EventosListProps {
  onEdit: (evento: Evento) => void;
  onNew: () => void;
}

export function EventosList({ onEdit, onNew }: EventosListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: eventos, isLoading, error } = useQuery({
    queryKey: ["eventos"],
    queryFn: async () => {
      console.log("Buscando eventos...");
      const { data, error } = await supabase
        .from("evento")
        .select("*")
        .order("dat_criacao", { ascending: false });

      if (error) {
        console.error("Erro ao buscar eventos:", error);
        throw error;
      }

      console.log("Eventos encontrados:", data);
      return data as Evento[];
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: number; currentStatus: string }) => {
      const newStatus = currentStatus === "A" ? "I" : "A";
      console.log(`Alterando status do evento ${id} de ${currentStatus} para ${newStatus}`);
      
      const { error } = await supabase
        .from("evento")
        .update({
          des_status: newStatus,
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: 1
        })
        .eq("id_evento", id);

      if (error) {
        console.error("Erro ao alterar status:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      toast({
        title: "Status alterado",
        description: "O status do evento foi alterado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do evento.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Erro ao carregar eventos: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-recycle-green" />
          <h2 className="text-xl font-semibold">Eventos de Coleta</h2>
        </div>
        <Button onClick={onNew} className="bg-recycle-green hover:bg-recycle-green-dark">
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Carregando eventos...</div>
          </div>
        ) : !eventos || eventos.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Nenhum evento encontrado</p>
            <p className="text-sm">Comece criando seu primeiro evento de coleta.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Evento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Término</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventos.map((evento) => (
                  <TableRow key={evento.id_evento}>
                    <TableCell className="font-medium">{evento.nom_evento}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {evento.des_evento || "-"}
                    </TableCell>
                    <TableCell>{formatDate(evento.dat_inicio)}</TableCell>
                    <TableCell>{formatDate(evento.dat_termino)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={evento.des_status === "A" ? "default" : "secondary"}
                        className={
                          evento.des_status === "A" 
                            ? "bg-green-100 text-green-800 hover:bg-green-200" 
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }
                      >
                        {evento.des_status === "A" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(evento)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatusMutation.mutate({
                            id: evento.id_evento,
                            currentStatus: evento.des_status
                          })}
                          disabled={toggleStatusMutation.isPending}
                          className="h-8 w-8 p-0"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
