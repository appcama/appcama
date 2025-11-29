import { useState, useEffect } from 'react';
import { FileCheck, CheckSquare, Square, Filter, Calendar as CalendarIcon, X, RotateCcw, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CertificadoPreviewDialog } from './CertificadoPreviewDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface Coleta {
  id_coleta: number;
  cod_coleta: string;
  dat_coleta: string;
  vlr_total: number;
  id_entidade_geradora?: number;
  id_certificado?: number;
  id_usuario_criador?: number;
  id_evento?: number;
  entidade?: {
    nom_entidade: string;
    num_cpf_cnpj: string;
    num_cep?: string;
    des_logradouro?: string;
    des_bairro?: string;
    id_municipio?: number;
    municipio?: { nom_municipio: string } | null;
  };
  ponto_coleta?: {
    nom_ponto_coleta: string;
  };
  entidade_coletora?: {
    nom_entidade: string;
    num_cpf_cnpj?: string;
    num_cep?: string;
    des_logradouro?: string;
    des_bairro?: string;
    id_municipio?: number;
    municipio?: { nom_municipio: string } | null;
  };
}

interface Entidade {
  id_entidade: number;
  nom_entidade: string;
}

interface Evento {
  id_evento: number;
  nom_evento: string;
  des_status: string;
}

export function GerarCertificado() {
  const [coletas, setColetas] = useState<Coleta[]>([]);
  const [selectedColetas, setSelectedColetas] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [openInicio, setOpenInicio] = useState(false);
  const [openFim, setOpenFim] = useState(false);
  const [entidadeId, setEntidadeId] = useState<string>('all');
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [eventoId, setEventoId] = useState<string>('all');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
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
          id_usuario_criador,
          id_evento,
          entidade:id_entidade_geradora (
            nom_entidade,
            num_cpf_cnpj,
            num_cep,
            des_logradouro,
            des_bairro,
            id_municipio
          ),
          ponto_coleta:id_ponto_coleta (
            nom_ponto_coleta
          ),
          usuario:id_usuario_criador (
            entidade:id_entidade (
              nom_entidade,
              num_cpf_cnpj,
              num_cep,
              des_logradouro,
              des_bairro,
              id_municipio
            )
          )
        `)
        .eq('des_status', 'A')
        .is('id_certificado', null); // Apenas coletas não certificadas

      // Filtrar por entidade coletora (usuário criador) se não for admin
      if (!user.isAdmin && user.entityId) {
        console.log('Non-admin user, filtering by collector entityId:', user.entityId);
        
        // Buscar usuários da mesma entidade
        const { data: usuariosDaEntidade } = await supabase
          .from('usuario')
          .select('id_usuario')
          .eq('id_entidade', user.entityId)
          .eq('des_status', 'A');
        
        const userIds = usuariosDaEntidade?.map(u => u.id_usuario) || [];
        
        if (userIds.length > 0) {
          query = query.in('id_usuario_criador', userIds);
        } else {
          console.log('No users found for this entity, not loading coletas');
          setColetas([]);
          setLoading(false);
          return;
        }
      } else if (!user.isAdmin) {
        console.log('No entityId found and not admin, not loading coletas');
        setColetas([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query.order('dat_coleta', { ascending: false });

      if (error) {
        console.error('[GerarCertificado] Error loading coletas:', error);
        throw error;
      }

      // Mapear entidade coletora (a cooperativa vinculada ao usuário criador)
      const processed = (data || []).map((coleta: any) => ({
        ...coleta,
        entidade_coletora: coleta?.usuario?.entidade
          ? { 
              nom_entidade: coleta.usuario.entidade.nom_entidade,
              num_cpf_cnpj: coleta.usuario.entidade.num_cpf_cnpj,
              num_cep: coleta.usuario.entidade.num_cep,
              des_logradouro: coleta.usuario.entidade.des_logradouro,
              des_bairro: coleta.usuario.entidade.des_bairro,
              id_municipio: coleta.usuario.entidade.id_municipio,
              municipio: coleta.usuario.entidade.municipio || null,
            }
          : null,
      }));

      setColetas(processed);
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
      console.error('[GerarCertificado] Error loading entidades:', error);
    }
  };

  const loadEventos = async () => {
    try {
      const { data, error } = await supabase
        .from('evento')
        .select('id_evento, nom_evento, des_status')
        .order('nom_evento');

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error('[GerarCertificado] Error loading eventos:', error);
    }
  };

  useEffect(() => {
    loadColetas();
    loadEntidades();
    loadEventos();
  }, [user]);

  // Função para verificar se uma coleta pode ser selecionada
  const canSelectColeta = (coleta: Coleta) => {
    return coleta.id_entidade_geradora !== null && coleta.id_entidade_geradora !== undefined;
  };

  const filteredColetas = coletas.filter(coleta => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    const termDigits = searchTerm.replace(/\D/g, '');
    const cpfCnpjDigits = (coleta.entidade?.num_cpf_cnpj || '').replace(/\D/g, '');
    const dateStr = formatDate(coleta.dat_coleta) || ''; // dd/mm/aaaa

    // Normalizar valores para evitar chamadas em undefined
    const codeLower = (coleta.cod_coleta || '').toLowerCase();
    const entidadeNomeLower = (coleta.entidade?.nom_entidade || '').toLowerCase();

    const matchesSearch =
      // Código
      codeLower.includes(normalizedTerm) ||
      // Entidade Geradora (nome)
      entidadeNomeLower.includes(normalizedTerm) ||
      // CPF/CNPJ (apenas dígitos)
      (termDigits.length > 0 && cpfCnpjDigits.includes(termDigits)) ||
      // Data (DD/MM/AAAA)
      dateStr.includes(searchTerm);

    const matchesDataInicio = !dataInicio || new Date(coleta.dat_coleta) >= dataInicio;
    const matchesDataFim = !dataFim || new Date(coleta.dat_coleta) <= dataFim;
    const matchesEntidade = entidadeId === 'all' || coleta.id_entidade_geradora?.toString() === entidadeId;
    const matchesEvento = eventoId === 'all' || coleta.id_evento?.toString() === eventoId;
    const matchesAvailability = !showOnlyAvailable || canSelectColeta(coleta);

    return matchesSearch && matchesDataInicio && matchesDataFim && matchesEntidade && matchesEvento && matchesAvailability;
  });

  // Ordenar: coletas COM entidade geradora primeiro, SEM entidade depois
  // Dentro de cada grupo, manter ordem por data decrescente
  const sortedColetas = [...filteredColetas].sort((a, b) => {
    const aHasEntidade = canSelectColeta(a);
    const bHasEntidade = canSelectColeta(b);
    
    // Se um tem entidade e outro não, prioriza o que tem
    if (aHasEntidade && !bHasEntidade) return -1;
    if (!aHasEntidade && bHasEntidade) return 1;
    
    // Se ambos têm ou não têm, ordenar por data decrescente
    return new Date(b.dat_coleta).getTime() - new Date(a.dat_coleta).getTime();
  });

  // Contar coletas disponíveis e indisponíveis
  const selectableColetas = sortedColetas.filter(canSelectColeta);
  const unavailableCount = sortedColetas.length - selectableColetas.length;

  // Paginação
  const totalPages = Math.ceil(sortedColetas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedColetas = sortedColetas.slice(startIndex, endIndex);

  // Reset página quando filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dataInicio, dataFim, entidadeId, showOnlyAvailable]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Usar declaração de função para garantir hoisting dentro do componente
  function formatDate(dateString: string) {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR');
  }

  const handleSelectColeta = (coletaId: number) => {
    const coleta = coletas.find(c => c.id_coleta === coletaId);
    if (!coleta || !canSelectColeta(coleta)) return; // Ignora se não pode selecionar
    
    setSelectedColetas(prev => {
      if (prev.includes(coletaId)) {
        return prev.filter(id => id !== coletaId);
      } else {
        return [...prev, coletaId];
      }
    });
  };

  const handleSelectAll = () => {
    const allSelectableSelected = selectableColetas.length > 0 && 
      selectableColetas.every(c => selectedColetas.includes(c.id_coleta));
    
    if (allSelectableSelected) {
      setSelectedColetas([]);
    } else {
      setSelectedColetas(selectableColetas.map(c => c.id_coleta));
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

  const handleLimparFiltros = () => {
    setDataInicio(undefined);
    setDataFim(undefined);
    setEntidadeId('all');
    setEventoId('all');
    setSearchTerm('');
    setShowOnlyAvailable(false);
  };

  const hasActiveFilters = dataInicio || dataFim || (entidadeId !== 'all') || (eventoId !== 'all') || searchTerm || showOnlyAvailable;

  const validation = validateSelection();
  const allSelected = selectableColetas.length > 0 && 
    selectableColetas.every(c => selectedColetas.includes(c.id_coleta));

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
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Gerar Certificado</h1>
          {unavailableCount > 0 && (
            <Badge variant="secondary" className="bg-gray-200 text-gray-700">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {unavailableCount} indisponível{unavailableCount !== 1 ? 'is' : ''}
            </Badge>
          )}
        </div>
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
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-green-600" />
            <CardTitle>Filtros</CardTitle>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {/* Entidade Geradora */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Entidade</label>
              <Select value={entidadeId} onValueChange={setEntidadeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as entidades</SelectItem>
                  {entidades.map((entidade) => (
                    <SelectItem key={entidade.id_entidade} value={entidade.id_entidade.toString()}>
                      {entidade.nom_entidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Evento */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Evento</label>
              <Select value={eventoId} onValueChange={setEventoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os eventos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os eventos</SelectItem>
                  {eventos.map((evento) => (
                    <SelectItem key={evento.id_evento} value={evento.id_evento.toString()}>
                      {evento.nom_evento} {evento.des_status === 'I' ? '(Inativo)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Inicial */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Popover open={openInicio} onOpenChange={setOpenInicio}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={(date) => { setDataInicio(date); setOpenInicio(false); }}
                    initialFocus
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Final */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Popover open={openFim} onOpenChange={setOpenFim}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={(date) => { setDataFim(date); setOpenFim(false); }}
                    initialFocus
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Botão Limpar Filtros */}
            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Ações</label>
              <Button
                variant="outline"
                onClick={handleLimparFiltros}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <Input
              placeholder="Buscar por código, entidade, CPF/CNPJ ou data"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="flex items-center gap-2 ml-auto">
              <Checkbox 
                id="show-only-available"
                checked={showOnlyAvailable}
                onCheckedChange={(checked) => setShowOnlyAvailable(checked as boolean)}
              />
              <label 
                htmlFor="show-only-available" 
                className="text-sm font-medium cursor-pointer select-none"
              >
                Mostrar apenas disponíveis para certificação
              </label>
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
              <TooltipProvider>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold w-12">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Selecionar todas disponíveis"
                        />
                      </th>
                      <th className="text-left p-4 font-semibold">Código</th>
                      <th className="text-left p-4 font-semibold">Data</th>
                      <th className="text-left p-4 font-semibold">Entidade Geradora</th>
                      <th className="text-left p-4 font-semibold">CPF/CNPJ</th>
                      <th className="text-left p-4 font-semibold">Entidade Coletora</th>
                      <th className="text-left p-4 font-semibold">Ponto de Coleta</th>
                      <th className="text-right p-4 font-semibold">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedColetas.map((coleta) => {
                      const isSelectable = canSelectColeta(coleta);
                      
                      return (
                        <Tooltip key={coleta.id_coleta}>
                          <TooltipTrigger asChild>
                            <tr 
                              className={cn(
                                "border-b transition-colors",
                                isSelectable 
                                  ? `hover:bg-gray-50 cursor-pointer ${selectedColetas.includes(coleta.id_coleta) ? 'bg-green-50' : ''}`
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              )}
                              onClick={() => isSelectable && handleSelectColeta(coleta.id_coleta)}
                            >
                              <td className="p-4">
                                <Checkbox
                                  checked={selectedColetas.includes(coleta.id_coleta)}
                                  onCheckedChange={() => handleSelectColeta(coleta.id_coleta)}
                                  onClick={(e) => e.stopPropagation()}
                                  disabled={!isSelectable}
                                  className={!isSelectable ? 'opacity-50' : ''}
                                />
                              </td>
                              <td className="p-4">{coleta.cod_coleta}</td>
                              <td className="p-4">{formatDate(coleta.dat_coleta)}</td>
                              <td className="p-4">
                                {coleta.entidade?.nom_entidade ? (
                                  coleta.entidade.nom_entidade
                                ) : (
                                  <span className="flex items-center gap-1 italic text-gray-400">
                                    <AlertTriangle className="w-4 h-4" />
                                    Não cadastrada
                                  </span>
                                )}
                              </td>
                              <td className="p-4">{coleta.entidade?.num_cpf_cnpj || '-'}</td>
                              <td className="p-4">{coleta.entidade_coletora?.nom_entidade || '-'}</td>
                              <td className="p-4">{coleta.ponto_coleta?.nom_ponto_coleta || '-'}</td>
                              <td className={cn(
                                "p-4 text-right font-semibold",
                                isSelectable ? 'text-recycle-green' : 'text-gray-400'
                              )}>
                                {formatCurrency(coleta.vlr_total)}
                              </td>
                            </tr>
                          </TooltipTrigger>
                          {!isSelectable && (
                            <TooltipContent side="top">
                              <p>Não é possível gerar certificado sem entidade geradora cadastrada</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </tbody>
                </table>
              </TooltipProvider>
            </div>
          )}

          {/* Paginação */}
          {sortedColetas.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Exibindo {startIndex + 1} a {Math.min(endIndex, sortedColetas.length)} de {sortedColetas.length} coletas
                {unavailableCount > 0 && (
                  <span className="text-gray-400 ml-1">
                    ({selectableColetas.length} disponíveis para certificação)
                  </span>
                )}
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
