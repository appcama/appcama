
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Shield, Edit, Power, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Perfil {
  id_perfil: number;
  nom_perfil: string;
  des_status: string;
  des_locked: string;
  dat_criacao: string;
  dat_atualizacao?: string;
  id_usuario_criador: number;
  id_usuario_atualizador?: number;
}

interface PerfilListProps {
  onAddNew: () => void;
  onEdit: (perfil: Perfil) => void;
  onViewUsers?: (perfil: Perfil) => void;
}

export function PerfilList({ onAddNew, onEdit, onViewUsers }: PerfilListProps) {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPerfis();
  }, []);

  const fetchPerfis = async () => {
    try {
      const { data, error } = await supabase
        .from('perfil')
        .select('*')
        .in('des_status', ['A', 'D'])
        .order('nom_perfil');

      if (error) throw error;

      setPerfis(data || []);
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de perfis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (perfil: Perfil) => {
    try {
      const newStatus = perfil.des_status === 'A' ? 'D' : 'A';
      
      const { error } = await supabase
        .from('perfil')
        .update({ 
          des_status: newStatus,
          dat_atualizacao: new Date().toISOString()
        })
        .eq('id_perfil', perfil.id_perfil);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Perfil ${newStatus === 'A' ? 'ativado' : 'desativado'} com sucesso`,
      });

      fetchPerfis();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do perfil",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPerfis = perfis.filter(perfil =>
    perfil.nom_perfil?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Carregando perfis...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Perfis</CardTitle>
          </div>
          <Button onClick={onAddNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Perfil
          </Button>
        </div>
        <div className="flex gap-4 mt-4">
          <Input
            placeholder="Buscar por nome do perfil..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredPerfis.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? 'Nenhum perfil encontrado com os critérios de busca' : 'Nenhum perfil cadastrado'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Perfil</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPerfis.map((perfil) => (
                  <TableRow key={perfil.id_perfil}>
                    <TableCell className="font-medium">
                      {perfil.nom_perfil || 'Nome não informado'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(perfil.dat_criacao)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {perfil.dat_atualizacao ? formatDate(perfil.dat_atualizacao) : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        perfil.des_status === 'A' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {perfil.des_status === 'A' ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewUsers?.(perfil)}
                          className="h-8 w-8 p-0"
                          title="Ver usuários deste perfil"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(perfil)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(perfil)}
                          className={`h-8 w-8 p-0 ${
                            perfil.des_status === 'A' 
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
