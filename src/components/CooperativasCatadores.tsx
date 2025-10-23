import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EntidadeForm } from './EntidadeForm';

interface Entidade {
  id_entidade: number;
  num_cpf_cnpj: string;
  nom_entidade: string;
  nom_razao_social: string | null;
  id_tipo_pessoa: number;
  id_tipo_entidade: number;
  id_tipo_situacao: number;
  id_municipio: number;
  id_unidade_federativa: number;
  des_logradouro: string;
  des_bairro: string;
  num_cep: string;
  num_telefone: string | null;
  num_latitude: number | null;
  num_longitude: number | null;
  des_logo_url: string | null;
  des_status: string;
  des_locked: string;
  dat_criacao: string;
  dat_atualizacao: string | null;
  id_usuario_criador: number;
  id_usuario_atualizador: number | null;
}

export function CooperativasCatadores() {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntidade, setEditingEntidade] = useState<Entidade | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadEntidades();
  }, []);

  const loadEntidades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('entidade')
        .select('*')
        .order('nom_entidade');

      if (error) throw error;
      setEntidades(data || []);
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar lista de entidades',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta entidade?')) return;

    try {
      const { error } = await supabase
        .from('entidade')
        .delete()
        .eq('id_entidade', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Entidade excluída com sucesso',
      });
      loadEntidades();
    } catch (error) {
      console.error('Erro ao excluir entidade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir entidade',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingEntidade(null);
    loadEntidades();
  };

  if (showForm) {
    return (
      <EntidadeForm
        onBack={() => {
          setShowForm(false);
          setEditingEntidade(null);
        }}
        onSuccess={handleFormSuccess}
        editingEntidade={editingEntidade}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cooperativas / Catadores</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-recycle-green hover:bg-recycle-green/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Entidade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entidades Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>Tipo Pessoa</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entidades.map((entidade) => (
                  <TableRow key={entidade.id_entidade}>
                    <TableCell>
                      {entidade.des_logo_url ? (
                        <img 
                          src={entidade.des_logo_url} 
                          alt={`Logo ${entidade.nom_entidade}`}
                          className="h-8 w-8 object-contain rounded"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">-</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{entidade.num_cpf_cnpj}</TableCell>
                    <TableCell>{entidade.nom_entidade}</TableCell>
                    <TableCell>{entidade.nom_razao_social || '-'}</TableCell>
                    <TableCell>
                      {entidade.id_tipo_pessoa === 1 ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </TableCell>
                    <TableCell>{entidade.num_telefone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEntidade(entidade);
                            setShowForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(entidade.id_entidade)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}