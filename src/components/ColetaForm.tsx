import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, Package, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOfflineForm } from '@/hooks/useOfflineForm';
import { ColetaResiduoForm } from './ColetaResiduoForm';
import { useAuth } from '@/hooks/useAuth';
import { ptBR } from 'date-fns/locale';

interface PontoColeta {
  id_ponto_coleta: number;
  nom_ponto_coleta: string;
}

interface Entidade {
  id_entidade: number;
  nom_entidade: string;
}

interface Evento {
  id_evento: number;
  nom_evento: string;
}

interface ColetaResiduo {
  id?: number;
  id_residuo: number;
  nom_residuo: string;
  tipo_residuo: string;
  qtd_total: number;
  vlr_total: number;
  subtotal: number;
}

interface ColetaFormProps {
  onBack: () => void;
  onSuccess: () => void;
  editingColeta?: any;
}

export function ColetaForm({ onBack, onSuccess, editingColeta }: ColetaFormProps) {
  const { user } = useAuth();
  const [pontosColeta, setPontosColeta] = useState<PontoColeta[]>([]);
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [coletaResiduos, setColetaResiduos] = useState<ColetaResiduo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResiduoForm, setShowResiduoForm] = useState(false);
  const [editingResiduo, setEditingResiduo] = useState<ColetaResiduo | null>(null);
  
  const { submitForm, isSubmitting } = useOfflineForm({
    table: 'coleta',
    onlineSubmit: async (data) => {
      if (editingColeta) {
        const { data: result, error } = await supabase
          .from('coleta')
          .update(data)
          .eq('id_coleta', editingColeta.id_coleta)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('coleta')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess
  });
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    id_ponto_coleta: '',
    id_entidade_geradora: '',
    id_evento: '',
    dat_coleta: new Date().toISOString().split('T')[0],
    cod_coleta: '',
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Estados e utilitários para máscara/validação de data (DD/MM/AAAA)
  const today = new Date();
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const [displayDate, setDisplayDate] = useState(
    `${pad2(today.getDate())}/${pad2(today.getMonth() + 1)}/${today.getFullYear()}`
  );
  const [dateError, setDateError] = useState<string | null>(null);

  const maskBRDate = (input: string) => {
    const digits = input.replace(/\D/g, '').slice(0, 8);
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);
    let out = dd;
    if (mm) out += `/${mm}`;
    if (yyyy) out += `/${yyyy}`;
    return out;
  };

  const parseBRDate = (str: string): Date | null => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
    if (!m) return null;
    const d = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const y = Number(m[3]);
    const date = new Date(y, mo, d);
    if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return null;
    return date;
  };

  const toISO = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const validateBRDate = (str: string): string | null => {
    if (!str) return 'Informe a data';
    const date = parseBRDate(str);
    if (!date) return 'Formato inválido (DD/MM/AAAA)';
    const today0 = new Date();
    today0.setHours(0, 0, 0, 0);
    const min = new Date(today0);
    min.setDate(min.getDate() - 2);
    if (date > today0) return 'Data não pode ser futura';
    if (date < min) return 'Data deve estar nos últimos 2 dias';
    return null;
  };

  useEffect(() => {
    console.log('[ColetaForm] useEffect triggered with editingColeta:', editingColeta);
    initializeForm();
  }, [editingColeta]);

  const initializeForm = async () => {
    try {
      setIsDataLoaded(false);
      
      // Aguardar o carregamento de todos os dados simultaneamente
      await loadAllFormData();
      
      if (editingColeta) {
        console.log('[ColetaForm] editingColeta exists, setting form values');
        await loadColetaEditingData();
      } else {
        console.log('[ColetaForm] No editingColeta, generating new codigo');
        generateCodigoColeta();
      }
      
      setIsDataLoaded(true);
    } catch (error) {
      console.error('[ColetaForm] Error initializing form:', error);
      setIsDataLoaded(true);
    }
  };

  const loadAllFormData = async () => {
    console.log('[ColetaForm] Loading all form data in parallel...');
    
    try {
      // Verificar se o usuário está logado
      if (!user) {
        console.error('[ColetaForm] Usuário não está logado');
        toast({
          title: "Erro",
          description: "Usuário não está logado",
          variant: "destructive"
        });
        return;
      }

      console.log('[ColetaForm] User data:', { id: user.id, email: user.email });

      // Usar os dados do usuário já disponíveis no hook useAuth
      const isAdmin = user.isAdmin || false;
      const userEntityId = user.entityId;

      console.log('[ColetaForm] User entity data:', { isAdmin, userEntityId });

      // Preparar query para pontos de coleta com filtro de entidade
      let pontosQuery = supabase
        .from('ponto_coleta')
        .select('id_ponto_coleta, nom_ponto_coleta')
        .eq('des_status', 'A');

      // Se não for admin, filtrar pela entidade do usuário
      if (!isAdmin && userEntityId) {
        console.log('[ColetaForm] Filtering pontos de coleta by entity:', userEntityId);
        pontosQuery = pontosQuery.eq('id_entidade_gestora', userEntityId);
      } else if (isAdmin) {
        console.log('[ColetaForm] Admin user - loading all pontos de coleta');
      }

      pontosQuery = pontosQuery.order('nom_ponto_coleta');

      // Usar Promise.all para carregar dados principais
      const [pontosResult, eventosResult] = await Promise.all([
        // Carregar pontos de coleta (com filtro de entidade se necessário)
        pontosQuery,
        
        // Carregar eventos
        supabase
          .from('evento')
          .select('id_evento, nom_evento')
          .eq('des_status', 'A')
          .order('nom_evento')
      ]);

      // Carregar entidades e tipos para todos os usuários
      const [entResult, tiposResult] = await Promise.all([
        supabase
          .from('entidade')
          .select('id_entidade, nom_entidade, id_tipo_entidade')
          .eq('des_status', 'A')
          .order('nom_entidade'),
        
        supabase
          .from('tipo_entidade')
          .select('id_tipo_entidade, des_geradora_residuo')
          .eq('des_status', 'A')
      ]);

      // Processar pontos de coleta
      if (pontosResult.error) {
        console.error('[ColetaForm] Error loading pontos de coleta:', pontosResult.error);
        toast({
          title: "Erro",
          description: "Erro ao carregar pontos de coleta: " + pontosResult.error.message,
          variant: "destructive"
        });
        setPontosColeta([]);
      } else {
        console.log('[ColetaForm] Pontos de coleta loaded:', pontosResult.data?.length || 0, 'items');
        if (!isAdmin && userEntityId) {
          console.log('[ColetaForm] Pontos filtered by entity:', userEntityId);
        }
        setPontosColeta(pontosResult.data || []);
      }

      // Processar entidades geradoras (disponível para todos os usuários)
      if (entResult?.error || tiposResult?.error) {
        console.error('[ColetaForm] Error loading entidades/tipos:', entResult?.error || tiposResult?.error);
        toast({
          title: "Erro",
          description: "Erro ao carregar entidades geradoras",
          variant: "destructive"
        });
        setEntidades([]);
      } else {
        // Filtrar entidades geradoras
        const tiposGeradoras = new Set(
          (tiposResult?.data || [])
            .filter((tipo: any) => tipo.des_geradora_residuo === 'A')
            .map((tipo: any) => tipo.id_tipo_entidade)
        );
        
        const entidadesGeradoras = (entResult?.data || []).filter(
          (entidade: any) => tiposGeradoras.has(entidade.id_tipo_entidade)
        );
        
        console.log('[ColetaForm] Entidades geradoras loaded for all users:', entidadesGeradoras.length);
        setEntidades(entidadesGeradoras);

        // Para usuários não-admin, ainda definir automaticamente a entidade do usuário como padrão
        if (!isAdmin && userEntityId) {
          console.log('[ColetaForm] Non-admin user - setting entity as default:', userEntityId);
          setFormData(prev => ({ 
            ...prev, 
            id_entidade_geradora: userEntityId.toString() 
          }));
        }
      }

      // Processar eventos
      if (eventosResult.error) {
        console.error('[ColetaForm] Error loading eventos:', eventosResult.error);
        toast({
          title: "Erro",
          description: "Erro ao carregar eventos: " + eventosResult.error.message,
          variant: "destructive"
        });
        setEventos([]);
      } else {
        console.log('[ColetaForm] Eventos loaded:', eventosResult.data?.length || 0);
        setEventos(eventosResult.data || []);
      }

      console.log('[ColetaForm] All form data loaded successfully');
    } catch (error) {
      console.error('[ColetaForm] Error loading form data:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados do formulário",
        variant: "destructive"
      });
    }
  };

  const loadColetaEditingData = async () => {
    if (!editingColeta) return;

    try {
      console.log('[ColetaForm] Loading coleta editing data:', editingColeta);

      // Preparar dados do form
      const newFormData = {
        id_ponto_coleta: editingColeta.id_ponto_coleta?.toString() || '',
        id_entidade_geradora: editingColeta.id_entidade_geradora?.toString() || '',
        id_evento: editingColeta.id_evento?.toString() || '',
        dat_coleta: editingColeta.dat_coleta ? editingColeta.dat_coleta.split('T')[0] : '',
        cod_coleta: editingColeta.cod_coleta || '',
      };

      // Para usuários não-admin, garantir que a entidade geradora seja sempre a do usuário
      if (!user?.isAdmin && user?.entityId) {
        newFormData.id_entidade_geradora = user.entityId.toString();
      }

      console.log('[ColetaForm] Setting form data after data load:', newFormData);
      
      // Carregar resíduos da coleta simultaneamente
      const { data: residuosData, error: residuosError } = await supabase
        .from('coleta_residuo')
        .select(`
          id_coleta_residuo,
          id_residuo,
          qtd_total,
          vlr_total,
          residuo:id_residuo (
            nom_residuo,
            tipo_residuo:id_tipo_residuo (
              des_tipo_residuo
            )
          )
        `)
        .eq('id_coleta', editingColeta.id_coleta)
        .eq('des_status', 'A');

      if (residuosError) {
        console.error('[ColetaForm] Error loading residuos:', residuosError);
      } else if (residuosData) {
        const residuosFormatted = residuosData.map((item: any) => ({
          id: item.id_coleta_residuo,
          id_residuo: item.id_residuo,
          nom_residuo: item.residuo?.nom_residuo || '',
          tipo_residuo: item.residuo?.tipo_residuo?.des_tipo_residuo || '',
          qtd_total: item.qtd_total,
          vlr_total: item.vlr_total,
          subtotal: item.qtd_total * item.vlr_total,
        }));
        setColetaResiduos(residuosFormatted);
      }

      // Setar dados do form APÓS carregar os dados dos selects
      setFormData(newFormData);

      // Atualizar exibição da data no formato brasileiro
      if (newFormData.dat_coleta) {
        const [yyyy, mm, dd] = newFormData.dat_coleta.split('-');
        setDisplayDate(`${dd}/${mm}/${yyyy}`);
        setDateError(null);
      }
    } catch (error) {
      console.error('[ColetaForm] Error loading coleta editing data:', error);
    }
  };

  const generateCodigoColeta = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    
    const codigo = `COL-${year}${month}${day}-${time}`;
    setFormData(prev => ({ ...prev, cod_coleta: codigo }));
  };

  const handleAddResiduo = (residuo: ColetaResiduo) => {
    if (editingResiduo) {
      setColetaResiduos(prev => prev.map(r => 
        r.id_residuo === editingResiduo.id_residuo ? residuo : r
      ));
    } else {
      setColetaResiduos(prev => [...prev, residuo]);
    }
    setShowResiduoForm(false);
    setEditingResiduo(null);
  };

  const handleEditResiduo = (residuo: ColetaResiduo) => {
    setEditingResiduo(residuo);
    setShowResiduoForm(true);
  };

  const handleRemoveResiduo = (id_residuo: number) => {
    setColetaResiduos(prev => prev.filter(r => r.id_residuo !== id_residuo));
  };

  const calculateTotals = () => {
    const totalQuantidade = coletaResiduos.reduce((sum, r) => sum + r.qtd_total, 0);
    const totalValor = coletaResiduos.reduce((sum, r) => sum + r.subtotal, 0);
    return { totalQuantidade, totalValor };
  };

  // Função para recalcular indicadores apenas quando necessário
  const recalculateIndicators = async (coletaId: number) => {
    try {
      console.log('[ColetaForm] Recalculando indicadores para coleta:', coletaId);
      
      // Chamar a função melhorada que previne duplicações
      const { error } = await supabase.rpc('calculate_and_insert_indicators', {
        p_id_coleta: coletaId
      });

      if (error) {
        console.error('[ColetaForm] Erro ao recalcular indicadores:', error);
        throw error;
      }

      console.log('[ColetaForm] Indicadores recalculados com sucesso para coleta:', coletaId);
    } catch (error) {
      console.error('[ColetaForm] Erro ao recalcular indicadores:', error);
      // Não interrumpemos o fluxo principal, apenas logamos o erro
      toast({
        title: 'Aviso',
        description: 'Coleta salva, mas houve um problema ao calcular os indicadores ambientais.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação específica da regra: DD/MM/AAAA e último 10 dias, sem futuro
    const validationErr = validateBRDate(displayDate);
    if (validationErr || !formData.dat_coleta || coletaResiduos.length === 0) {
      const msg = validationErr
        ? validationErr
        : 'Preencha a data da coleta e adicione pelo menos um resíduo';
      toast({
        title: 'Erro',
        description: msg,
        variant: 'destructive',
      });
      setDateError(validationErr || 'Informe a data');
      return;
    }

    setLoading(true);

    try {
      const { totalValor } = calculateTotals();

      const coletaData = {
        cod_coleta: formData.cod_coleta,
        id_ponto_coleta: formData.id_ponto_coleta ? parseInt(formData.id_ponto_coleta) : null,
        id_entidade_geradora: formData.id_entidade_geradora ? parseInt(formData.id_entidade_geradora) : null,
        id_evento: formData.id_evento ? parseInt(formData.id_evento) : null,
        dat_coleta: formData.dat_coleta,
        vlr_total: totalValor,
        id_tipo_situacao: 1, // Assumindo situação padrão
        id_usuario_criador: user?.id || 1, // Usar ID do usuário logado
        dat_criacao: new Date().toISOString(),
      };

      let coletaId: number;

      if (editingColeta) {
        // Atualizar coleta existente
        const { error } = await supabase
          .from('coleta')
          .update({
            ...coletaData,
            id_usuario_atualizador: user?.id || 1,
            dat_atualizacao: new Date().toISOString(),
          })
          .eq('id_coleta', editingColeta.id_coleta);

        if (error) throw error;
        coletaId = editingColeta.id_coleta;

        // Remover resíduos existentes - primeiro buscar os IDs e remover indicadores
        const { data: coletaResiduoIds } = await supabase
          .from('coleta_residuo')
          .select('id_coleta_residuo')
          .eq('id_coleta', coletaId);

        if (coletaResiduoIds && coletaResiduoIds.length > 0) {
          // Primeiro deletar os indicadores
          await supabase
            .from('coleta_residuo_indicador')
            .delete()
            .in('id_coleta_residuo', coletaResiduoIds.map(r => r.id_coleta_residuo));

          // Depois deletar os resíduos
          await supabase
            .from('coleta_residuo')
            .delete()
            .eq('id_coleta', coletaId);
        }
      } else {
        // Criar nova coleta
        const { data, error } = await supabase
          .from('coleta')
          .insert(coletaData)
          .select('id_coleta')
          .single();

        if (error) throw error;
        coletaId = data.id_coleta;
      }

      // Inserir resíduos da coleta
      const residuosData = coletaResiduos.map(residuo => ({
        id_coleta: coletaId,
        id_residuo: residuo.id_residuo,
        qtd_total: residuo.qtd_total,
        vlr_total: residuo.vlr_total,
        id_tipo_situacao: 1,
        id_usuario_criador: user?.id || 1,
        dat_criacao: new Date().toISOString(),
      }));

      const { error: residuosError } = await supabase
        .from('coleta_residuo')
        .insert(residuosData);

      if (residuosError) throw residuosError;

      // Agora chamar a função de indicadores uma única vez para garantir cálculo correto
      await recalculateIndicators(coletaId);

      toast({
        title: 'Sucesso',
        description: editingColeta 
          ? 'Coleta atualizada com sucesso! Indicadores ambientais recalculados.' 
          : 'Coleta cadastrada com sucesso! Indicadores ambientais calculados.',
      });

      onSuccess();
    } catch (error) {
      console.error('[ColetaForm] Error saving coleta:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar coleta',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const { totalQuantidade, totalValor } = calculateTotals();

  if (showResiduoForm) {
    return (
      <ColetaResiduoForm
        onBack={() => {
          setShowResiduoForm(false);
          setEditingResiduo(null);
        }}
        onAdd={handleAddResiduo}
        existingResiduos={coletaResiduos}
        editingResiduo={editingResiduo}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="mr-4 h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <div>
                <h2 className="text-xl font-semibold">
                  {editingColeta ? 'Editar Coleta' : 'Nova Coleta'}
                </h2>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold">Dados da Coleta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cod_coleta">Código da Coleta *</Label>
                <Input
                  id="cod_coleta"
                  value={formData.cod_coleta}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dat_coleta">Data da Coleta *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Input
                      id="dat_coleta"
                      type="text"
                      inputMode="numeric"
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      value={displayDate}
                      onChange={(e) => {
                        const formatted = maskBRDate(e.target.value);
                        setDisplayDate(formatted);
                        const err = validateBRDate(formatted);
                        setDateError(err);
                        if (!err) {
                          const d = parseBRDate(formatted)!;
                          setFormData(prev => ({ ...prev, dat_coleta: toISO(d) }));
                        } else {
                          setFormData(prev => ({ ...prev, dat_coleta: '' }));
                        }
                      }}
                      required
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Selecione a data da coleta</span>
                      </div>
                      <Calendar
                        mode="single"
                        selected={(() => {
                          if (!formData.dat_coleta) return undefined;
                          const [y, m, d] = formData.dat_coleta.split('-').map(Number);
                          return new Date(y, m - 1, d);
                        })()}
                        onSelect={(date) => {
                          if (!date) return;
                          const dd = String(date.getDate()).padStart(2, '0');
                          const mm = String(date.getMonth() + 1).padStart(2, '0');
                          const yyyy = date.getFullYear();
                          const br = `${dd}/${mm}/${yyyy}`;
                          const err = validateBRDate(br);
                          setDisplayDate(br);
                          setDateError(err);
                          if (!err) {
                            setFormData(prev => ({ ...prev, dat_coleta: toISO(date) }));
                          } else {
                            setFormData(prev => ({ ...prev, dat_coleta: '' }));
                          }
                        }}
                        initialFocus
                        locale={ptBR}
                        disabled={(date) => {
                          const today0 = new Date();
                          today0.setHours(0, 0, 0, 0);
                          const min = new Date(today0);
                          min.setDate(min.getDate() - 2);
                          return date > today0 || date < min;
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                {dateError && (
                  <p className="text-red-600 text-sm mt-1">{dateError}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="id_ponto_coleta">Ponto de Coleta (Opcional)</Label>
              <Select
                value={formData.id_ponto_coleta}
                onValueChange={(value) => setFormData(prev => ({ ...prev, id_ponto_coleta: value }))}
                disabled={!isDataLoaded}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isDataLoaded ? "Selecione o ponto de coleta (opcional)" : "Carregando..."} />
                </SelectTrigger>
                <SelectContent>
                  {pontosColeta.map((ponto) => (
                    <SelectItem key={ponto.id_ponto_coleta} value={ponto.id_ponto_coleta.toString()}>
                      {ponto.nom_ponto_coleta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="id_entidade_geradora">Entidade Geradora (Opcional)</Label>
              <Select
                value={formData.id_entidade_geradora}
                onValueChange={(value) => setFormData(prev => ({ ...prev, id_entidade_geradora: value }))}
                disabled={!isDataLoaded}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isDataLoaded ? "Selecione a entidade geradora" : "Carregando..."} />
                </SelectTrigger>
                <SelectContent>
                  {entidades.map((entidade) => (
                    <SelectItem key={entidade.id_entidade} value={entidade.id_entidade.toString()}>
                      {entidade.nom_entidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="id_evento">Evento (Opcional)</Label>
              <Select
                value={formData.id_evento}
                onValueChange={(value) => setFormData(prev => ({ ...prev, id_evento: value }))}
                disabled={!isDataLoaded}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isDataLoaded ? "Selecione o evento" : "Carregando..."} />
                </SelectTrigger>
                <SelectContent>
                  {eventos.map((evento) => (
                    <SelectItem key={evento.id_evento} value={evento.id_evento.toString()}>
                      {evento.nom_evento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Resíduos da Coleta</CardTitle>
              <Button
                type="button"
                onClick={() => setShowResiduoForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {coletaResiduos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum resíduo adicionado. Clique em "Adicionar Resíduo" para começar.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Resíduo</th>
                        <th className="text-left p-2 font-semibold">Tipo</th>
                        <th className="text-right p-2 font-semibold">Quantidade (kg)</th>
                        <th className="text-right p-2 font-semibold">Valor Unitário</th>
                        <th className="text-right p-2 font-semibold">Subtotal</th>
                        <th className="text-center p-2 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coletaResiduos.map((residuo) => (
                        <tr key={residuo.id_residuo} className="border-b">
                          <td className="p-2">{residuo.nom_residuo}</td>
                          <td className="p-2">{residuo.tipo_residuo}</td>
                          <td className="p-2 text-right">{residuo.qtd_total.toFixed(2)}</td>
                          <td className="p-2 text-right">
                            R$ {residuo.vlr_total.toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-semibold text-recycle-green">
                            R$ {residuo.subtotal.toFixed(2)}
                          </td>
                          <td className="p-2">
                            <div className="flex justify-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditResiduo(residuo)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRemoveResiduo(residuo.id_residuo)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remover</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end space-y-2">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total de Quantidade:</span>
                        <span className="font-semibold">{totalQuantidade.toFixed(2)} kg</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span>Total de Valor:</span>
                        <span className="font-bold text-recycle-green">
                          R$ {totalValor.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading || coletaResiduos.length === 0 || !!dateError || !formData.dat_coleta}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? 'Salvando...' : (editingColeta ? 'Atualizar' : 'Salvar')}
          </Button>
        </div>
      </form>
    </div>
  );
}
