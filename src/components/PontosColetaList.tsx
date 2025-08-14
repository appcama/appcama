
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, MapPin, Edit, Power } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PontoColeta {
  id_ponto_coleta: number;
  nom_ponto_coleta: string;
  des_ponto_coleta: string | null;
  des_logradouro: string;
  des_bairro: string;
  num_cep: string;
  des_referencia: string | null;
  des_status: string;
  id_municipio: number;
}

interface PontosColetaListProps {
  onAddNew: () => void;
  onEdit: (pontoColeta: PontoColeta) => void;
}

export function PontosColetaList({ onAddNew, onEdit }: PontosColetaListProps) {
  const [pontosColeta, setPontosColeta] = useState<PontoColeta[]>([]);
  const [loading, setLoading] = useState(true);
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <CardTitle>Pontos de Coleta</CardTitle>
        </div>
        <Button onClick={onAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Ponto de Coleta
        </Button>
      </CardHeader>
      <CardContent>
        {pontosColeta.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhum ponto de coleta cadastrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead>CEP</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pontosColeta.map((pontoColeta) => (
                  <TableRow key={pontoColeta.id_ponto_coleta}>
                    <TableCell className="font-medium">
                      {pontoColeta.nom_ponto_coleta}
                    </TableCell>
                    <TableCell>{pontoColeta.des_ponto_coleta || '-'}</TableCell>
                    <TableCell>{pontoColeta.des_logradouro}</TableCell>
                    <TableCell>{pontoColeta.des_bairro}</TableCell>
                    <TableCell>{pontoColeta.num_cep}</TableCell>
                    <TableCell>{pontoColeta.des_referencia || '-'}</TableCell>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(pontoColeta)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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
