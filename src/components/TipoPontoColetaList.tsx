
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Plus, Power, MapPin } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tiposPontoColeta = [], isLoading, error } = useQuery({
    queryKey: ['tipos-ponto-coleta'],
    queryFn: async () => {
      console.log('Fetching tipos de ponto de coleta...');
      const { data, error } = await supabase
        .from('tipo_ponto_coleta')
        .select('*')
        .order('des_tipo_ponto_coleta');
      
      if (error) {
        console.error('Error fetching tipos de ponto de coleta:', error);
        throw error;
      }
      
      console.log('Tipos de ponto de coleta fetched:', data);
      return data as TipoPontoColeta[];
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: number; currentStatus: string }) => {
      const newStatus = currentStatus === 'A' ? 'I' : 'A';
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
      console.error('Error updating tipo ponto coleta status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do tipo de ponto de coleta.",
        variant: "destructive",
      });
    },
  });

  const handleToggleStatus = (tipoPontoColeta: TipoPontoColeta) => {
    toggleStatusMutation.mutate({
      id: tipoPontoColeta.id_tipo_ponto_coleta,
      currentStatus: tipoPontoColeta.des_status
    });
  };

  const filteredTiposPontoColeta = tiposPontoColeta.filter(tipo =>
    tipo.des_tipo_ponto_coleta?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Carregando tipos de ponto de coleta...</div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    console.error('Query error:', error);
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-red-500">
            Erro ao carregar tipos de ponto de coleta: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <CardTitle>Tipos de Ponto de Coleta</CardTitle>
          </div>
          <Button onClick={onAddNew} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        </div>
        <div className="flex gap-4 mt-4">
          <Input
            placeholder="Buscar por nome do tipo"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredTiposPontoColeta.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? 'Nenhum tipo de ponto de coleta encontrado com os critérios de busca' : 'Nenhum tipo de ponto de coleta encontrado'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTiposPontoColeta.map((tipo) => (
                  <TableRow key={tipo.id_tipo_ponto_coleta}>
                    <TableCell className="font-medium">
                      {tipo.des_tipo_ponto_coleta}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tipo.des_status === 'A' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {tipo.des_status === 'A' ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(tipo)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(tipo)}
                                disabled={toggleStatusMutation.isPending}
                                className={`h-8 w-8 p-0 ${
                                  tipo.des_status === 'A' 
                                    ? 'hover:bg-red-50 hover:text-red-600' 
                                    : 'hover:bg-green-50 hover:text-green-600'
                                }`}
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{tipo.des_status === 'A' ? 'Desativar' : 'Ativar'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
