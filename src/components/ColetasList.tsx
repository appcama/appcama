
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Coleta {
  id_coleta: number;
  cod_coleta: string;
  dat_coleta: string;
  vlr_total: number;
  des_status: string;
  des_locked: string;
  id_ponto_coleta: number;
  id_entidade_geradora?: number;
  id_evento?: number;
  id_tipo_situacao: number;
  id_usuario_criador: number;
  id_usuario_atualizador?: number;
  dat_criacao: string;
  dat_atualizacao?: string;
  ponto_coleta?: {
    des_logradouro: string;
    des_bairro: string;
  };
  entidade?: {
    nom_entidade: string;
    num_cpf_cnpj: string;
  };
  evento?: {
    nom_evento: string;
  };
  tipo_situacao?: {
    des_tipo_situacao: string;
  };
}

interface ColetasListProps {
  onAddNew: () => void;
  onEdit: (coleta: Coleta) => void;
}

export function ColetasList({ onAddNew, onEdit }: ColetasListProps) {
  const [coletas, setColetas] = useState<Coleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState("");
  const [searchEntity, setSearchEntity] = useState("");
  const [searchType, setSearchType] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchColetas();
  }, []);

  const fetchColetas = async () => {
    try {
      let query = supabase
        .from('coleta')
        .select(`
          *,
          ponto_coleta!id_ponto_coleta (
            des_logradouro,
            des_bairro
          ),
          entidade!id_entidade_geradora (
            nom_entidade,
            num_cpf_cnpj
          ),
          evento!id_evento (
            nom_evento
          ),
          tipo_situacao!id_tipo_situacao (
            des_tipo_situacao
          )
        `)
        .in('des_status', ['A', 'D'])
        .order('dat_coleta', { ascending: false });

      if (searchDate) {
        query = query.gte('dat_coleta', searchDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData = data.map((item: any) => ({
        ...item,
        ponto_coleta: item.ponto_coleta || {},
        entidade: item.entidade || {},
        evento: item.evento || {},
        tipo_situacao: item.tipo_situacao || {}
      }));

      setColetas(formattedData);
    } catch (error) {
      console.error('Erro ao buscar coletas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de coletas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (coleta: Coleta) => {
    if (!confirm('Tem certeza que deseja excluir esta coleta?')) return;

    try {
      const { error } = await supabase
        .from('coleta')
        .update({ des_status: 'I' })
        .eq('id_coleta', coleta.id_coleta);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Coleta excluída com sucesso",
      });

      fetchColetas();
    } catch (error) {
      console.error('Erro ao excluir coleta:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir coleta",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatCpfCnpj = (value: string) => {
    if (!value) return '';
    if (value.length === 11) {
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (value.length === 14) {
      return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const applyFilters = () => {
    fetchColetas();
  };

  const clearFilters = () => {
    setSearchDate("");
    setSearchEntity("");
    setSearchType("");
    fetchColetas();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Carregando coletas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <CardTitle>Coletas de Resíduos</CardTitle>
        </div>
        <Button onClick={onAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Coleta
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filtros de Pesquisa */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-sm font-medium mb-3">Filtros de Pesquisa</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data da Coleta</label>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Entidade</label>
              <Input
                placeholder="Nome da entidade"
                value={searchEntity}
                onChange={(e) => setSearchEntity(e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo de Coleta</label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="identificada">Identificada</SelectItem>
                  <SelectItem value="anonima">Anônima</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} size="sm" className="h-8">
                <Search className="h-3 w-3 mr-1" />
                Filtrar
              </Button>
              <Button onClick={clearFilters} variant="outline" size="sm" className="h-8">
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {coletas.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhuma coleta cadastrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ponto de Coleta</TableHead>
                  <TableHead>Entidade Geradora</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coletas.map((coleta) => (
                  <TableRow key={coleta.id_coleta}>
                    <TableCell className="font-medium">
                      {coleta.cod_coleta}
                    </TableCell>
                    <TableCell>
                      {format(new Date(coleta.dat_coleta), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {coleta.ponto_coleta?.des_logradouro}
                      {coleta.ponto_coleta?.des_bairro && (
                        <div className="text-xs text-muted-foreground">
                          {coleta.ponto_coleta.des_bairro}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {coleta.entidade?.nom_entidade ? (
                        <div className="text-sm">
                          {coleta.entidade.nom_entidade}
                          <div className="text-xs text-muted-foreground">
                            {formatCpfCnpj(coleta.entidade.num_cpf_cnpj)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Coleta Anônima
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {coleta.evento?.nom_evento || '-'}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(coleta.vlr_total)}
                    </TableCell>
                    <TableCell>
                      {coleta.tipo_situacao?.des_tipo_situacao || '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        coleta.des_status === 'A' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {coleta.des_status === 'A' ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(coleta)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(coleta)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
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
