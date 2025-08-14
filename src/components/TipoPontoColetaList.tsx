
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface TipoPontoColetaListProps {
  onEdit: (tipoPontoColeta: TipoPontoColeta) => void;
  onAddNew: () => void;
}

export function TipoPontoColetaList({ onEdit, onAddNew }: TipoPontoColetaListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tiposPontoColeta, isLoading } = useQuery({
    queryKey: ['tipos-ponto-coleta'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipo_ponto_coleta')
        .select('*')
        .order('des_tipo_ponto_coleta');
      
      if (error) {
        console.error('Erro ao buscar tipos de ponto de coleta:', error);
        throw error;
      }
      
      return data as TipoPontoColeta[];
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: number; newStatus: string }) => {
      const { error } = await supabase
        .from('tipo_ponto_coleta')
        .update({ 
          des_status: newStatus,
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: 1
        })
        .eq('id_tipo_ponto_coleta', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-ponto-coleta'] });
      toast({
        title: "Status atualizado",
        description: "Status do tipo de ponto de coleta atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do tipo de ponto de coleta.",
        variant: "destructive",
      });
    },
  });

  const handleToggleStatus = (tipoPontoColeta: TipoPontoColeta) => {
    const newStatus = tipoPontoColeta.des_status === 'A' ? 'I' : 'A';
    toggleStatusMutation.mutate({ id: tipoPontoColeta.id_tipo_ponto_coleta, newStatus });
  };

  if (isLoading) {
    return <div>Carregando tipos de ponto de coleta...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tipos de Ponto de Coleta</h1>
        <Button onClick={onAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Tipo de Ponto de Coleta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Tipos de Ponto de Coleta</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiposPontoColeta?.map((tipoPontoColeta) => (
                <TableRow key={tipoPontoColeta.id_tipo_ponto_coleta}>
                  <TableCell className="font-medium">
                    {tipoPontoColeta.des_tipo_ponto_coleta}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={tipoPontoColeta.des_status === 'A' ? 'default' : 'secondary'}
                      className={tipoPontoColeta.des_status === 'A' ? 'bg-green-500' : 'bg-red-500'}
                    >
                      {tipoPontoColeta.des_status === 'A' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(tipoPontoColeta.dat_criacao).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(tipoPontoColeta)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(tipoPontoColeta)}
                        disabled={toggleStatusMutation.isPending}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {tiposPontoColeta?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum tipo de ponto de coleta encontrado. Clique em "Novo Tipo de Ponto de Coleta" para adicionar o primeiro.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
