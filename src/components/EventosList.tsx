
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Edit, Power, ChevronLeft, ChevronRight, Globe, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Evento {
  id_evento: number;
  nom_evento: string | null;
  des_evento: string | null;
  dat_inicio: string;
  dat_termino: string;
  des_status: string;
  des_locked: string;
  des_visibilidade: string;
  dat_criacao: string;
  dat_atualizacao: string | null;
  id_usuario_criador: number;
  id_usuario_atualizador: number | null;
  usuario_criador?: {
    id_entidade: number;
  };
}

interface EventosListProps {
  onAddNew: () => void;
  onEdit: (evento: Evento) => void;
}

export function EventosList({ onAddNew, onEdit }: EventosListProps) {
  const { user } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();

  const isAdmin = user?.isAdmin || user?.entityId === 1;

  useEffect(() => {
    fetchEventos();
  }, [user]);

  const fetchEventos = async () => {
    if (!user) return;
    
    try {
      // Fetch all events with creator info
      const { data: allEventos, error } = await supabase
        .from('evento')
        .select(`
          *,
          usuario_criador:usuario!id_usuario_criador(id_entidade)
        `)
        .in('des_status', ['A', 'D'])
        .order('dat_inicio', { ascending: false });

      if (error) throw error;

      let filteredEventos = allEventos || [];

      // If not admin, filter by visibility rules
      if (!isAdmin) {
        // Get events where user's entity has access (for private events)
        const { data: eventoEntidades } = await supabase
          .from('evento_entidade')
          .select('id_evento')
          .eq('id_entidade', user.entityId);

        const authorizedEventoIds = new Set((eventoEntidades || []).map(ee => ee.id_evento));

        filteredEventos = filteredEventos.filter(evento => {
          // Public events are visible to all
          if (evento.des_visibilidade === 'P') return true;
          
          // Private events: visible if creator's entity matches user's entity
          const creatorEntityId = evento.usuario_criador?.id_entidade;
          if (creatorEntityId === user.entityId) return true;
          
          // Or if user's entity is in the access list
          if (authorizedEventoIds.has(evento.id_evento)) return true;
          
          return false;
        });
      }

      setEventos(filteredEventos);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de eventos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canEditEvento = (evento: Evento): boolean => {
    if (isAdmin) return true;
    // User can edit if their entity created the event
    const creatorEntityId = evento.usuario_criador?.id_entidade;
    return creatorEntityId === user?.entityId;
  };

  const handleToggleStatus = async (evento: Evento) => {
    if (!canEditEvento(evento)) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para alterar este evento.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newStatus = evento.des_status === 'A' ? 'D' : 'A';
      
      const { error } = await supabase
        .from('evento')
        .update({ 
          des_status: newStatus,
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: user?.id || 1
        })
        .eq('id_evento', evento.id_evento);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Evento ${newStatus === 'A' ? 'ativado' : 'desativado'} com sucesso`,
      });

      fetchEventos();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do evento",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (evento: Evento) => {
    if (!canEditEvento(evento)) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para editar este evento.",
        variant: "destructive",
      });
      return;
    }
    onEdit(evento);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredEventos = eventos.filter(evento =>
    evento.nom_evento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evento.des_evento?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginação
  const totalPages = Math.ceil(filteredEventos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEventos = filteredEventos.slice(startIndex, endIndex);

  // Reset página quando filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Carregando eventos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Eventos de Coleta</CardTitle>
          </div>
          <Button onClick={onAddNew} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        </div>
        <div className="flex gap-4 mt-4">
          <Input
            placeholder="Buscar por nome ou descrição"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredEventos.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? 'Nenhum evento encontrado com os critérios de busca' : 'Nenhum evento cadastrado'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Visibilidade</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Término</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEventos.map((evento) => {
                  const canEdit = canEditEvento(evento);
                  
                  return (
                    <TableRow key={evento.id_evento}>
                      <TableCell className="font-medium">
                        {evento.nom_evento || '-'}
                      </TableCell>
                      <TableCell>{evento.des_evento || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={evento.des_visibilidade === 'P' ? 'default' : 'secondary'}
                          className={`flex items-center gap-1 w-fit ${
                            evento.des_visibilidade === 'P' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          {evento.des_visibilidade === 'P' ? (
                            <>
                              <Globe className="h-3 w-3" />
                              Público
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" />
                              Privado
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(evento.dat_inicio)}</TableCell>
                      <TableCell>{formatDate(evento.dat_termino)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          evento.des_status === 'A' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {evento.des_status === 'A' ? 'Ativo' : 'Inativo'}
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
                                  onClick={() => handleEdit(evento)}
                                  disabled={!canEdit}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{canEdit ? 'Editar' : 'Sem permissão para editar'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleStatus(evento)}
                                  disabled={!canEdit}
                                  className={`h-8 w-8 p-0 ${
                                    canEdit
                                      ? evento.des_status === 'A' 
                                        ? 'hover:bg-red-50 hover:text-red-600' 
                                        : 'hover:bg-green-50 hover:text-green-600'
                                      : 'opacity-50'
                                  }`}
                                >
                                  <Power className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{canEdit 
                                  ? (evento.des_status === 'A' ? 'Desativar' : 'Ativar')
                                  : 'Sem permissão'
                                }</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Paginação */}
        {filteredEventos.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Exibindo {startIndex + 1} a {Math.min(endIndex, filteredEventos.length)} de {filteredEventos.length} eventos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
