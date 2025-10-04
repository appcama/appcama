import { useState, useEffect } from 'react';
import { FileCheck, CheckSquare, Square, X, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CertificadoPreviewDialog } from './CertificadoPreviewDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Coleta {
  id_coleta: number;
  cod_coleta: string;
  dat_coleta: string;
  vlr_total: number;
  id_entidade_geradora?: number;
  id_certificado?: number;
  entidade?: {
    nom_entidade: string;
    num_cpf_cnpj: string;
  };
  ponto_coleta?: {
    nom_ponto_coleta: string;
  };
}

export function GerarCertificado() {
  const [coletas, setColetas] = useState<Coleta[]>([]);
  const [selectedColetas, setSelectedColetas] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();
  const [entidadeId, setEntidadeId] = useState<string>('');
  const [entidades, setEntidades] = useState<Array<{ id_entidade: number; nom_entidade: string }>>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadColetas = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setColetas([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('coleta')
        .select(`
          id_coleta,
          cod_coleta,
          dat_coleta,
          vlr_total,
          id_entidade_geradora,
          id_certificado,
          entidade:id_entidade_geradora (
            nom_entidade,
            num_cpf_cnpj
          ),
          ponto_coleta:id_ponto_coleta (
            nom_ponto_coleta
          )
        `)
        .eq('des_status', 'A')
        .is('id_certificado', null); // Apenas coletas não certificadas

      // Filtrar por entidade se não for admin
      if (!user.isAdmin && user.entityId) {
        query = query.eq('id_entidade_geradora', user.entityId);
      }

      const { data, error } = await query.order('dat_coleta', { ascending: false });

      if (error) {
        console.error('[GerarCertificado] Error loading coletas:', error);
        throw error;
      }

      setColetas(data || []);
    } catch (error) {
      console.error('[GerarCertificado] Unexpected error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar coletas disponíveis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColetas();
    loadEntidades();
  }, [user]);

  const loadEntidades = async () => {
    try {
      const { data, error } = await supabase
        .from('entidade')
        .select('id_entidade, nom_entidade')
        .eq('des_status', 'A')
        .order('nom_entidade');

      if (error) throw error;
      setEntidades(data || []);
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
    }
  };

  const filteredColetas = coletas.filter(coleta => {
    // Filtro por texto
    const matchesSearch = !searchTerm ||
      coleta.cod_coleta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coleta.entidade?.nom_entidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coleta.entidade?.num_cpf_cnpj?.includes(searchTerm) ||
      coleta.ponto_coleta?.nom_ponto_coleta?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por data inicial
    const matchesDataInicio = !dataInicio || 
      new Date(coleta.dat_coleta) >= new Date(dataInicio.setHours(0, 0, 0, 0));

    // Filtro por data final
    const matchesDataFim = !dataFim || 
      new Date(coleta.dat_coleta) <= new Date(dataFim.setHours(23, 59, 59, 999));

    // Filtro por entidade
    const matchesEntidade = !entidadeId || 
      coleta.id_entidade_geradora?.toString() === entidadeId;

    return matchesSearch && matchesDataInicio && matchesDataFim && matchesEntidade;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleSelectColeta = (coletaId: number) => {
    setSelectedColetas(prev => {
      if (prev.includes(coletaId)) {
        return prev.filter(id => id !== coletaId);
      } else {
        return [...prev, coletaId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedColetas.length === filteredColetas.length) {
      setSelectedColetas([]);
    } else {
      setSelectedColetas(filteredColetas.map(c => c.id_coleta));
    }
  };

  // Validar se todas as coletas selecionadas são da mesma entidade
  const validateSelection = () => {
    if (selectedColetas.length === 0) {
      return { valid: false, message: 'Selecione ao menos uma coleta' };
    }

    const selectedColetasData = coletas.filter(c => selectedColetas.includes(c.id_coleta));
    const entidadeIds = [...new Set(selectedColetasData.map(c => c.id_entidade_geradora))];

    if (entidadeIds.length > 1) {
      return { 
        valid: false, 
        message: 'Todas as coletas devem ser da mesma entidade geradora' 
      };
    }

    return { valid: true, message: '' };
  };

  const handleGenerateCertificate = () => {
    const validation = validateSelection();
    
    if (!validation.valid) {
      toast({
        title: 'Seleção Inválida',
        description: validation.message,
        variant: 'destructive',
      });
      return;
    }

    setShowPreview(true);
  };

  const validation = validateSelection();
  const allSelected = filteredColetas.length > 0 && selectedColetas.length === filteredColetas.length;

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
        <h1 className="text-3xl font-bold text-gray-900">Gerar Certificado</h1>
        <Button 
          onClick={handleGenerateCertificate}
          disabled={!validation.valid}
          className="bg-green-600 hover:bg-green-700"
        >
          <FileCheck className="w-4 h-4 mr-2" />
          Gerar Certificado ({selectedColetas.length})
        </Button>
      </div>

      {!validation.valid && selectedColetas.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
          ⚠️ {validation.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Selecione as Coletas</CardTitle>
          <div className="flex flex-col gap-4 mt-4">
            <Input
              placeholder="Buscar por código, entidade ou CPF/CNPJ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !dataInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataInicio}
                      onSelect={setDataInicio}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {dataInicio && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDataInicio(undefined)}
                    className="w-[200px]"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !dataFim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataFim}
                      onSelect={setDataFim}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {dataFim && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDataFim(undefined)}
                    className="w-[200px]"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Entidade Geradora</label>
                <Select value={entidadeId} onValueChange={setEntidadeId}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Todas as entidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as entidades</SelectItem>
                    {entidades.map((entidade) => (
                      <SelectItem key={entidade.id_entidade} value={entidade.id_entidade.toString()}>
                        {entidade.nom_entidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {entidadeId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEntidadeId('')}
                    className="w-[250px]"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredColetas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {coletas.length === 0 
                ? 'Nenhuma coleta disponível para certificação'
                : 'Nenhuma coleta encontrada com os filtros aplicados'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todas"
                      />
                    </th>
                    <th className="text-left p-4 font-semibold">Código</th>
                    <th className="text-left p-4 font-semibold">Data</th>
                    <th className="text-left p-4 font-semibold">Entidade Geradora</th>
                    <th className="text-left p-4 font-semibold">CPF/CNPJ</th>
                    <th className="text-left p-4 font-semibold">Ponto de Coleta</th>
                    <th className="text-right p-4 font-semibold">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredColetas.map((coleta) => (
                    <tr 
                      key={coleta.id_coleta} 
                      className={`border-b hover:bg-gray-50 cursor-pointer ${
                        selectedColetas.includes(coleta.id_coleta) ? 'bg-green-50' : ''
                      }`}
                      onClick={() => handleSelectColeta(coleta.id_coleta)}
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={selectedColetas.includes(coleta.id_coleta)}
                          onCheckedChange={() => handleSelectColeta(coleta.id_coleta)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="p-4">{coleta.cod_coleta}</td>
                      <td className="p-4">{formatDate(coleta.dat_coleta)}</td>
                      <td className="p-4">{coleta.entidade?.nom_entidade || '-'}</td>
                      <td className="p-4">{coleta.entidade?.num_cpf_cnpj || '-'}</td>
                      <td className="p-4">{coleta.ponto_coleta?.nom_ponto_coleta || '-'}</td>
                      <td className="p-4 text-right font-semibold text-recycle-green">
                        {formatCurrency(coleta.vlr_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showPreview && (
        <CertificadoPreviewDialog
          selectedColetaIds={selectedColetas}
          coletas={coletas}
          onClose={() => setShowPreview(false)}
          onSuccess={() => {
            setShowPreview(false);
            setSelectedColetas([]);
            loadColetas();
          }}
        />
      )}
    </div>
  );
}
