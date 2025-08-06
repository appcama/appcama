import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Entidade {
  id_entidade: number;
  nom_entidade: string;
  num_cpf_cnpj: string;
  nom_razao_social: string | null;
  des_logradouro: string;
  des_bairro: string;
  num_cep: string;
  num_telefone: string | null;
  id_tipo_pessoa: number;
  des_tipo_entidade?: string;
  des_tipo_situacao?: string;
}

interface EntidadesListProps {
  onAddNew: () => void;
}

export function EntidadesList({ onAddNew }: EntidadesListProps) {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEntidades();
  }, []);

  const fetchEntidades = async () => {
    try {
      const { data, error } = await supabase
        .from('entidade')
        .select(`
          *,
          tipo_entidade:id_tipo_entidade (
            des_tipo_entidade
          ),
          tipo_situacao:id_tipo_situacao (
            des_tipo_situacao
          )
        `)
        .eq('des_status', 'A')
        .order('nom_entidade');

      if (error) throw error;

      const formattedData = data.map((item: any) => ({
        ...item,
        des_tipo_entidade: item.tipo_entidade?.des_tipo_entidade || 'N/A',
        des_tipo_situacao: item.tipo_situacao?.des_tipo_situacao || 'N/A'
      }));

      setEntidades(formattedData);
    } catch (error) {
      console.error('Erro ao buscar entidades:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de entidades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCpfCnpj = (value: string) => {
    if (value.length === 11) {
      // CPF: 000.000.000-00
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (value.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const getTipoPessoa = (tipo: number) => {
    return tipo === 1 ? 'Pessoa Física' : 'Pessoa Jurídica';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Carregando entidades...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>Cooperativas/Catadores</CardTitle>
        </div>
        <Button onClick={onAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Entidade
        </Button>
      </CardHeader>
      <CardContent>
        {entidades.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhuma entidade cadastrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entidades.map((entidade) => (
                  <TableRow key={entidade.id_entidade}>
                    <TableCell className="font-medium">
                      {entidade.nom_entidade}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatCpfCnpj(entidade.num_cpf_cnpj)}
                        <div className="text-xs text-muted-foreground">
                          {getTipoPessoa(entidade.id_tipo_pessoa)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{entidade.des_tipo_entidade}</TableCell>
                    <TableCell>{entidade.nom_razao_social || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {entidade.des_logradouro}, {entidade.des_bairro}
                      <div className="text-xs text-muted-foreground">
                        CEP: {entidade.num_cep}
                      </div>
                    </TableCell>
                    <TableCell>{entidade.num_telefone || '-'}</TableCell>
                    <TableCell>{entidade.des_tipo_situacao}</TableCell>
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