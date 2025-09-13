
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, MapPin, Edit, Power } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCep } from "@/lib/cpf-cnpj-utils";

interface PontoColeta {
  id_ponto_coleta: number;
  nom_ponto_coleta: string;
  des_logradouro: string;
  des_bairro: string;
  num_cep: string;
  des_locked: string;
  des_status: string;
  id_entidade_gestora: number;
  id_municipio: number;
  id_unidade_federativa: number;
  id_tipo_ponto_coleta: number;
  id_tipo_situacao: number;
  num_latitude: number | null;
  num_longitude: number | null;
  dat_criacao: string;
  dat_atualizacao: string | null;
  id_usuario_criador: number;
  id_usuario_atualizador: number | null;
}

interface PontosColetaListProps {
  onAddNew: () => void;
  onEdit: (pontoColeta: PontoColeta) => void;
}

export function PontosColetaList({ onAddNew, onEdit }: PontosColetaListProps) {
  const [pontosColeta, setPontosColeta] = useState<PontoColeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPontosColeta();
  }, []);

  const fetchPontosColeta = async () => {
    try {
      const { data, error } = await supabase
        .from('ponto_coleta')
        .select('*')
        .in('des_status', ['A', 'D'])
        .order('nom_ponto_coleta');

      if (error) throw error;
      setPontosColeta(data || []);
    } catch (error) {
      console.error('Erro ao buscar pontos de coleta:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de pontos de coleta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (pontoColeta: PontoColeta) => {
    try {
      const newStatus = pontoColeta.des_status === 'A' ? 'D' : 'A';
      
      const { error } = await supabase
        .from('ponto_coleta')
        .update({ des_status: newStatus })
        .eq('id_ponto_coleta', pontoColeta.id_ponto_coleta);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Ponto de coleta ${newStatus === 'A' ? 'ativado' : 'desativado'} com sucesso`,
      });

      fetchPontosColeta();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do ponto de coleta",
        variant: "destructive",
      });
    }
  };

  const filteredPontosColeta = pontosColeta.filter(ponto =>
    ponto.nom_ponto_coleta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ponto.des_logradouro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ponto.des_bairro?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Carregando pontos de coleta...</div>
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
            <CardTitle>Pontos de Coleta</CardTitle>
          </div>
          <Button onClick={onAddNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Ponto de Coleta
          </Button>
        </div>
        <div className="flex gap-4 mt-4">
          <Input
            placeholder="Buscar por nome, logradouro ou bairro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredPontosColeta.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? 'Nenhum ponto de coleta encontrado com os critérios de busca' : 'Nenhum ponto de coleta cadastrado'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Logradouro</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead>CEP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPontosColeta.map((pontoColeta) => (
                  <TableRow key={pontoColeta.id_ponto_coleta}>
                    <TableCell className="font-medium">
                      {pontoColeta.nom_ponto_coleta}
                    </TableCell>
                    <TableCell>{pontoColeta.des_logradouro}</TableCell>
                    <TableCell>{pontoColeta.des_bairro}</TableCell>
                    <TableCell>{formatCep(pontoColeta.num_cep)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        pontoColeta.des_status === 'A' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {pontoColeta.des_status === 'A' ? 'Ativo' : 'Inativo'}
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
                                onClick={() => onEdit(pontoColeta)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar ponto de coleta</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(pontoColeta)}
                                className={`h-8 w-8 p-0 ${
                                  pontoColeta.des_status === 'A' 
                                    ? 'hover:bg-red-50 hover:text-red-600' 
                                    : 'hover:bg-green-50 hover:text-green-600'
                                }`}
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{pontoColeta.des_status === 'A' ? 'Desativar ponto de coleta' : 'Ativar ponto de coleta'}</p>
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
