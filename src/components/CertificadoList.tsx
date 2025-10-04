import { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Certificado {
  id_certificado: number;
  cod_validador?: string;
  qtd_total_certificado?: number;
  vlr_total_certificado?: number;
  num_cpf_cnpj_gerador?: string;
  id_entidade?: number;
  observacoes?: string;
  dat_periodo_fim?: string;
  dat_periodo_inicio?: string;
  entidade?: {
    nom_entidade: string;
  };
}

interface CertificadoListProps {
  onAddNew: () => void;
  onEdit: (certificado: Certificado) => void;
}

export function CertificadoList({ onAddNew, onEdit }: CertificadoListProps) {
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const loadCertificados = async () => {
    try {
      setLoading(true);
      console.log('[CertificadoList] Loading certificados...');
      
      if (!user) {
        console.log('No user found, not loading certificados');
        setCertificados([]);
        setLoading(false);
        return;
      }

      const queryBuilder = supabase
        .from('certificado')
        .select('*')
        .eq('des_status', 'A')
        .eq('des_locked', 'D');

      // Se não é administrador, filtrar pela entidade do usuário
      if (!user.isAdmin && user.entityId) {
        console.log('Non-admin user, filtering by entityId:', user.entityId);
        queryBuilder.eq('id_entidade', user.entityId);
      }

      const { data: certData, error } = await queryBuilder.order('id_certificado', { ascending: false });

      if (error) {
        console.error('[CertificadoList] Error loading certificados:', error);
        throw error;
      }

      // Buscar entidades separadamente
      if (certData && certData.length > 0) {
        const entidadeIds = certData.map((c: any) => c.id_entidade).filter(Boolean);
        const { data: entidadesData } = await supabase
          .from('entidade')
          .select('id_entidade, nom_entidade')
          .in('id_entidade', entidadeIds);

        const entidadesMap = new Map();
        entidadesData?.forEach((e: any) => {
          entidadesMap.set(e.id_entidade, e);
        });

        const certWithEntidades = certData.map((cert: any) => ({
          ...cert,
          entidade: entidadesMap.get(cert.id_entidade)
        }));

        console.log('[CertificadoList] Certificados loaded:', certWithEntidades);
        setCertificados(certWithEntidades);
      } else {
        setCertificados([]);
      }
    } catch (error) {
      console.error('[CertificadoList] Unexpected error:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao carregar certificados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificados();
  }, [user]);

  const filteredCertificados = certificados.filter(cert =>
    cert.cod_validador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.entidade?.nom_entidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.num_cpf_cnpj_gerador?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const canDeleteCertificado = (certificado: Certificado) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    if (certificado.id_entidade === user.entityId) return true;
    return false;
  };

  const handleDeleteCertificado = async (certificado: Certificado) => {
    try {
      const { error } = await supabase
        .from('certificado')
        .update({ 
          des_locked: 'A',
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: user?.id || 1
        })
        .eq('id_certificado', certificado.id_certificado);

      if (error) {
        console.error('Erro ao excluir certificado:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao excluir certificado',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Certificado excluído com sucesso',
      });

      loadCertificados();
    } catch (error) {
      console.error('Erro inesperado ao excluir certificado:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao excluir certificado',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-recycle-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Certificados</h1>
        <Button onClick={onAddNew} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Certificados</CardTitle>
          <div className="flex gap-4 mt-4">
            <Input
              placeholder="Buscar por código, entidade ou CPF/CNPJ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredCertificados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum certificado encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Código Validador</th>
                    <th className="text-left p-4 font-semibold">Período</th>
                    <th className="text-left p-4 font-semibold">Entidade</th>
                    <th className="text-right p-4 font-semibold">Quantidade Total</th>
                    <th className="text-right p-4 font-semibold">Valor Total</th>
                    <th className="text-center p-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificados.map((certificado) => (
                    <tr key={certificado.id_certificado} className="border-b hover:bg-gray-50">
                      <td className="p-4">{certificado.cod_validador || '-'}</td>
                      <td className="p-4">
                        {certificado.dat_periodo_inicio && certificado.dat_periodo_fim 
                          ? `${formatDate(certificado.dat_periodo_inicio)} - ${formatDate(certificado.dat_periodo_fim)}`
                          : '-'}
                      </td>
                      <td className="p-4">{certificado.entidade?.nom_entidade || '-'}</td>
                      <td className="p-4 text-right">
                        {certificado.qtd_total_certificado 
                          ? new Intl.NumberFormat('pt-BR').format(certificado.qtd_total_certificado) + ' kg'
                          : '-'}
                      </td>
                      <td className="p-4 text-right font-semibold text-recycle-green">
                        {certificado.vlr_total_certificado 
                          ? formatCurrency(certificado.vlr_total_certificado)
                          : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(certificado)}
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canDeleteCertificado(certificado) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Excluir"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o certificado <strong>{certificado.cod_validador}</strong>?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCertificado(certificado)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
