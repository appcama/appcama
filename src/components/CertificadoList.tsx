import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRelatorioExport } from '@/hooks/useRelatorioExport';
import { CertificadoResiduosDialog } from './CertificadoResiduosDialog';
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
  cod_validador: string;
  dat_periodo_inicio: string;
  dat_periodo_fim: string;
  qtd_total_certificado: number;
  vlr_total_certificado: number;
  num_cpf_cnpj_gerador: string;
  id_entidade?: number;
  id_usuario_criador: number;
  entidade?: {
    nom_entidade: string;
    num_cpf_cnpj: string;
  };
  coletas?: Array<{
    cod_coleta: string;
  }>;
}

interface CertificadoListProps {
  onAddNew: () => void;
  onEdit: (certificado: Certificado) => void;
}

export function CertificadoList({ onAddNew, onEdit }: CertificadoListProps) {
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCertificadoId, setSelectedCertificadoId] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { exportCertificadoPDF, isExporting } = useRelatorioExport();

  const loadCertificados = async () => {
    try {
      setLoading(true);
      console.log('[CertificadoList] Loading certificados...');
      console.log('User data:', user);
      console.log('User entityId:', user?.entityId);
      console.log('User isAdmin:', user?.isAdmin);
      
      if (!user) {
        console.log('No user found, not loading certificados');
        setCertificados([]);
        setLoading(false);
        return;
      }

      // Query com relacionamentos
      let queryText = `
        id_certificado,
        cod_validador,
        dat_periodo_inicio,
        dat_periodo_fim,
        qtd_total_certificado,
        vlr_total_certificado,
        num_cpf_cnpj_gerador,
        id_entidade,
        id_usuario_criador,
        observacoes,
        dat_criacao,
        entidade:id_entidade (
          nom_entidade,
          num_cpf_cnpj
        )
      `;

      let query = (supabase as any)
        .from('certificado')
        .select(queryText)
        .eq('des_status', 'A')
        .eq('des_locked', 'D');

      // Se não é administrador, filtrar pela entidade do usuário
      if (!user.isAdmin && user.entityId) {
        console.log('Non-admin user, filtering by entityId:', user.entityId);
        query = query.eq('id_entidade', user.entityId);
      } else if (user.isAdmin) {
        console.log('Admin user, showing all certificados');
      } else {
        console.log('No entityId found and not admin, not loading certificados');
        setCertificados([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query.order('id_certificado', { ascending: false });

      console.log('[CertificadoList] Query completed');
      console.log('[CertificadoList] Error:', error);
      console.log('[CertificadoList] Data:', data);
      console.log('[CertificadoList] Data length:', data?.length);

      if (error) {
        console.error('[CertificadoList] Error loading certificados:', error);
        toast({
          title: 'Erro ao carregar',
          description: `Erro: ${error.message}`,
          variant: 'destructive',
        });
        throw error;
      }

      console.log('[CertificadoList] Raw data from query:', data);

      // Buscar informações das entidades e coletas separadamente
      const processedData: Certificado[] = [];
      if (data && data.length > 0) {
        const certificadoIds = data.map((cert: any) => cert.id_certificado);
        const entidadeIds = [...new Set(data.map((cert: any) => cert.id_entidade).filter(Boolean))];
        
        // Buscar entidades
        let entidadesMap = new Map();
        if (entidadeIds.length > 0) {
          const { data: entidadesData } = await (supabase as any)
            .from('entidade')
            .select('id_entidade, nom_entidade, num_cpf_cnpj')
            .in('id_entidade', entidadeIds);

          if (entidadesData) {
            entidadesData.forEach((ent: any) => {
              entidadesMap.set(ent.id_entidade, { 
                nom_entidade: ent.nom_entidade,
                num_cpf_cnpj: ent.num_cpf_cnpj 
              });
            });
          }
        }

        // Buscar coletas vinculadas
        let coletasMap = new Map<number, Array<{cod_coleta: string}>>();
        const { data: coletasData } = await (supabase as any)
          .from('coleta')
          .select('id_certificado, cod_coleta')
          .in('id_certificado', certificadoIds)
          .eq('des_status', 'A');

        if (coletasData) {
          coletasData.forEach((coleta: any) => {
            if (!coletasMap.has(coleta.id_certificado)) {
              coletasMap.set(coleta.id_certificado, []);
            }
            coletasMap.get(coleta.id_certificado)?.push({ cod_coleta: coleta.cod_coleta });
          });
        }

        data.forEach((cert: any) => {
          processedData.push({
            ...cert,
            entidade: cert.id_entidade ? entidadesMap.get(cert.id_entidade) : cert.entidade,
            coletas: coletasMap.get(cert.id_certificado) || []
          });
        });
      }

      console.log('[CertificadoList] Processed certificados:', processedData);
      setCertificados(processedData);
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
    if (certificado.id_usuario_criador === user.id) return true;
    return false;
  };

  const handleViewResiduos = (certificadoId: number) => {
    setSelectedCertificadoId(certificadoId);
  };

  const handleExportPDF = async (certificado: Certificado) => {
    try {
      await exportCertificadoPDF(certificado);
      toast({
        title: 'Sucesso',
        description: 'PDF exportado com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao exportar PDF',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCertificado = async (certificado: Certificado) => {
    try {
      console.log('🗑️ Excluindo certificado:', certificado.cod_validador);
      
      // 1️⃣ Liberar as coletas associadas ao certificado
      console.log('📋 Liberando coletas associadas...');
      const { error: coletaError } = await (supabase as any)
        .from('coleta')
        .update({ 
          id_certificado: null,
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: user?.id || 1
        })
        .eq('id_certificado', certificado.id_certificado);

      if (coletaError) {
        console.error('❌ Erro ao liberar coletas:', coletaError);
        toast({
          title: 'Erro',
          description: 'Erro ao liberar coletas do certificado',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('✅ Coletas liberadas com sucesso');

      // 2️⃣ Marcar certificado como locked
      console.log('🔒 Marcando certificado como locked...');
      const { error: certError } = await (supabase as any)
        .from('certificado')
        .update({ 
          des_locked: 'A',
          dat_atualizacao: new Date().toISOString(),
          id_usuario_atualizador: user?.id || 1
        })
        .eq('id_certificado', certificado.id_certificado);

      if (certError) {
        console.error('❌ Erro ao excluir certificado:', certError);
        toast({
          title: 'Erro',
          description: 'Erro ao excluir certificado',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('✅ Certificado excluído com sucesso');

      toast({
        title: 'Sucesso',
        description: 'Certificado excluído e coletas liberadas com sucesso',
      });

      loadCertificados();
    } catch (error) {
      console.error('❌ Erro inesperado ao excluir certificado:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">Certificados Gerados</h1>
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
                    <th className="text-left p-4 font-semibold">Código</th>
                    <th className="text-left p-4 font-semibold">Período</th>
                    <th className="text-left p-4 font-semibold">Entidade</th>
                    <th className="text-left p-4 font-semibold">Coletas</th>
                    <th className="text-right p-4 font-semibold">Quantidade Total</th>
                    <th className="text-right p-4 font-semibold">Valor Total</th>
                    <th className="text-center p-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificados.map((certificado) => (
                    <tr key={certificado.id_certificado} className="border-b hover:bg-gray-50">
                      <td className="p-4">{certificado.cod_validador}</td>
                      <td className="p-4">
                        {formatDate(certificado.dat_periodo_inicio)} - {formatDate(certificado.dat_periodo_fim)}
                      </td>
                      <td className="p-4">
                        <div>{certificado.entidade?.nom_entidade || '-'}</div>
                        <div className="text-xs text-gray-500">{certificado.entidade?.num_cpf_cnpj || certificado.num_cpf_cnpj_gerador || '-'}</div>
                      </td>
                      <td className="p-4">
                        {certificado.coletas && certificado.coletas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {certificado.coletas.slice(0, 3).map((coleta, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {coleta.cod_coleta}
                              </span>
                            ))}
                            {certificado.coletas.length > 3 && (
                              <span className="text-xs text-gray-500">+{certificado.coletas.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {new Intl.NumberFormat('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }).format(certificado.qtd_total_certificado)} kg
                      </td>
                      <td className="p-4 text-right font-semibold text-recycle-green">
                        {formatCurrency(certificado.vlr_total_certificado)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResiduos(certificado.id_certificado)}
                            title="Ver Resíduos"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportPDF(certificado)}
                            title="Exportar PDF"
                            disabled={isExporting}
                          >
                            <Download className="w-4 h-4" />
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

      <CertificadoResiduosDialog 
        certificadoId={selectedCertificadoId}
        onClose={() => setSelectedCertificadoId(null)}
      />
    </div>
  );
}
