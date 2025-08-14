
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Search, Plus, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PontoColeta {
  id_ponto_coleta: number;
  des_logradouro: string;
  des_bairro: string;
}

interface Entidade {
  id_entidade: number;
  nom_entidade: string;
  num_cpf_cnpj: string;
  id_tipo_entidade: number;
}

interface Evento {
  id_evento: number;
  nom_evento: string;
  dat_inicio: string;
  dat_termino: string;
}

interface TipoResiduo {
  id_tipo_residuo: number;
  des_tipo_residuo: string;
}

interface TipoSituacao {
  id_tipo_situacao: number;
  des_tipo_situacao: string;
}

interface ResiduoColeta {
  id_tipo_residuo: number;
  nom_residuo: string;
  qtd_total: number;
  vlr_unitario: number;
  vlr_total: number;
}

interface ColetaFormProps {
  editingColeta?: any;
  onBack: () => void;
  onSuccess: () => void;
}

export function ColetaForm({ editingColeta, onBack, onSuccess }: ColetaFormProps) {
  const [formData, setFormData] = useState({
    cod_coleta: "",
    dat_coleta: format(new Date(), 'yyyy-MM-dd'),
    id_ponto_coleta: "",
    id_entidade_geradora: "",
    id_evento: "",
    id_tipo_situacao: "",
    vlr_total: 0,
    des_status: "A"
  });

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [cpfCnpjSearch, setCpfCnpjSearch] = useState("");
  const [pontosColeta, setPontosColeta] = useState<PontoColeta[]>([]);
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [tiposResiduos, setTiposResiduos] = useState<TipoResiduo[]>([]);
  const [tiposSituacao, setTiposSituacao] = useState<TipoSituacao[]>([]);
  const [residuosColeta, setResiduosColeta] = useState<ResiduoColeta[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entidade | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
    if (editingColeta) {
      populateFormData();
    } else {
      generateCodigoColeta();
    }
  }, [editingColeta]);

  useEffect(() => {
    if (formData.dat_coleta) {
      fetchEventosDisponives();
    }
  }, [formData.dat_coleta]);

  const fetchInitialData = async () => {
    try {
      // Buscar pontos de coleta
      const { data: pontosData } = await supabase
        .from('ponto_coleta')
        .select('id_ponto_coleta, des_logradouro, des_bairro')
        .eq('des_status', 'A');

      // Buscar tipos de resíduos
      const { data: tiposResiduosData } = await supabase
        .from('tipo_residuo')
        .select('id_tipo_residuo, des_tipo_residuo')
        .eq('des_status', 'A');

      // Buscar tipos de situação
      const { data: tiposSituacaoData } = await supabase
        .from('tipo_situacao')
        .select('id_tipo_situacao, des_tipo_situacao');

      setPontosColeta(pontosData || []);
      setTiposResiduos(tiposResiduosData || []);
      setTiposSituacao(tiposSituacaoData || []);
    } catch (error) {
      console.error('Erro ao buscar dados iniciais:', error);
    }
  };

  const fetchEventosDisponives = async () => {
    try {
      const dataColeta = new Date(formData.dat_coleta);
      
      const { data: eventosData } = await supabase
        .from('evento')
        .select('id_evento, nom_evento, dat_inicio, dat_termino')
        .eq('des_status', 'A')
        .lte('dat_inicio', dataColeta.toISOString())
        .gte('dat_termino', dataColeta.toISOString());

      setEventos(eventosData || []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    }
  };

  const generateCodigoColeta = () => {
    const timestamp = Date.now().toString().slice(-8);
    const codigo = `COL${timestamp}`;
    setFormData(prev => ({ ...prev, cod_coleta: codigo }));
  };

  const populateFormData = () => {
    if (editingColeta) {
      setFormData({
        cod_coleta: editingColeta.cod_coleta,
        dat_coleta: editingColeta.dat_coleta,
        id_ponto_coleta: editingColeta.id_ponto_coleta?.toString() || "",
        id_entidade_geradora: editingColeta.id_entidade_geradora?.toString() || "",
        id_evento: editingColeta.id_evento?.toString() || "",
        id_tipo_situacao: editingColeta.id_tipo_situacao?.toString() || "",
        vlr_total: editingColeta.vlr_total || 0,
        des_status: editingColeta.des_status
      });
      setIsAnonymous(!editingColeta.id_entidade_geradora);
    }
  };

  const searchEntity = async () => {
    if (!cpfCnpjSearch.trim()) {
      toast({
        title: "Atenção",
        description: "Digite um CPF ou CNPJ para buscar",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Remover formatação do CPF/CNPJ
      const cleanCpfCnpj = cpfCnpjSearch.replace(/\D/g, '');
      
      const { data: entidadeData } = await supabase
        .from('entidade')
        .select(`
          id_entidade,
          nom_entidade,
          num_cpf_cnpj,
          id_tipo_entidade,
          tipo_entidade!id_tipo_entidade (
            des_tipo_entidade,
            des_geradora_residuo
          )
        `)
        .eq('num_cpf_cnpj', cleanCpfCnpj)
        .eq('des_status', 'A')
        .single();

      if (entidadeData) {
        // RN001 - Verificar se não é do tipo Empresa
        const tipoEntidade = entidadeData.tipo_entidade as any;
        if (tipoEntidade?.des_tipo_entidade?.toLowerCase().includes('empresa')) {
          toast({
            title: "Regra de Negócio Violada",
            description: "RN001: O cadastro de entidades só pode ser feito por pessoas físicas ou jurídicas que não sejam do tipo Empresa.",
            variant: "destructive",
          });
          return;
        }

        setSelectedEntity(entidadeData);
        setFormData(prev => ({
          ...prev,
          id_entidade_geradora: entidadeData.id_entidade.toString()
        }));
        
        toast({
          title: "Sucesso",
          description: `Entidade encontrada: ${entidadeData.nom_entidade}`,
        });
      } else {
        toast({
          title: "Não encontrado",
          description: "Entidade não encontrada com este CPF/CNPJ",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao buscar entidade:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar entidade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addResiduo = () => {
    const novoResiduo: ResiduoColeta = {
      id_tipo_residuo: 0,
      nom_residuo: "",
      qtd_total: 0,
      vlr_unitario: 0,
      vlr_total: 0
    };
    setResiduosColeta([...residuosColeta, novoResiduo]);
  };

  const updateResiduo = (index: number, field: keyof ResiduoColeta, value: any) => {
    const updated = [...residuosColeta];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalcular valor total do resíduo
    if (field === 'qtd_total' || field === 'vlr_unitario') {
      updated[index].vlr_total = updated[index].qtd_total * updated[index].vlr_unitario;
    }
    
    // Atualizar nome do resíduo
    if (field === 'id_tipo_residuo') {
      const tipoResiduo = tiposResiduos.find(t => t.id_tipo_residuo === parseInt(value));
      updated[index].nom_residuo = tipoResiduo?.des_tipo_residuo || "";
    }
    
    setResiduosColeta(updated);
    
    // Recalcular valor total da coleta
    const valorTotal = updated.reduce((sum, r) => sum + r.vlr_total, 0);
    setFormData(prev => ({ ...prev, vlr_total: valorTotal }));
  };

  const removeResiduo = (index: number) => {
    const updated = residuosColeta.filter((_, i) => i !== index);
    setResiduosColeta(updated);
    
    // Recalcular valor total da coleta
    const valorTotal = updated.reduce((sum, r) => sum + r.vlr_total, 0);
    setFormData(prev => ({ ...prev, vlr_total: valorTotal }));
  };

  const validateForm = (): boolean => {
    // RN008 - Verificar se há resíduos duplicados
    const tiposUtilizados = residuosColeta.map(r => r.id_tipo_residuo);
    const tiposUnicos = new Set(tiposUtilizados);
    
    if (tiposUtilizados.length !== tiposUnicos.size) {
      toast({
        title: "Regra de Negócio Violada",
        description: "RN008: Não é permitido cadastrar o mesmo resíduo mais de uma vez no mesmo dia.",
        variant: "destructive",
      });
      return false;
    }

    // Validações básicas
    if (!formData.cod_coleta || !formData.dat_coleta || !formData.id_ponto_coleta) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return false;
    }

    if (residuosColeta.length === 0) {
      toast({
        title: "Resíduos obrigatórios",
        description: "Adicione pelo menos um tipo de resíduo à coleta",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      const coletaData = {
        ...formData,
        id_ponto_coleta: parseInt(formData.id_ponto_coleta),
        id_entidade_geradora: isAnonymous ? null : parseInt(formData.id_entidade_geradora) || null,
        id_evento: formData.id_evento ? parseInt(formData.id_evento) : null,
        id_tipo_situacao: parseInt(formData.id_tipo_situacao),
        dat_criacao: new Date().toISOString(),
        id_usuario_criador: 1 // TODO: Pegar do contexto de autenticação
      };

      let coletaId: number;

      if (editingColeta) {
        const { error } = await supabase
          .from('coleta')
          .update({
            ...coletaData,
            dat_atualizacao: new Date().toISOString(),
            id_usuario_atualizador: 1
          })
          .eq('id_coleta', editingColeta.id_coleta);

        if (error) throw error;
        coletaId = editingColeta.id_coleta;
      } else {
        const { data, error } = await supabase
          .from('coleta')
          .insert([coletaData])
          .select()
          .single();

        if (error) throw error;
        coletaId = data.id_coleta;
      }

      // Salvar resíduos da coleta (em uma implementação completa, seria necessário criar a tabela coleta_residuo)
      // Por enquanto, apenas exibir sucesso

      toast({
        title: "Sucesso",
        description: `Coleta ${editingColeta ? 'atualizada' : 'cadastrada'} com sucesso`,
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar coleta:', error);
      toast({
        title: "Erro",
        description: `Erro ao ${editingColeta ? 'atualizar' : 'cadastrar'} coleta`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>
            {editingColeta ? 'Editar Coleta' : 'Nova Coleta'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* RN004 - Aviso sobre dados autodeclaratórios */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">Dados Autodeclaratórios</h4>
            <p className="text-sm text-amber-700 mt-1">
              RN004: Os dados informados neste cadastro são de responsabilidade do declarante e têm caráter autodeclaratório.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados básicos da coleta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cod_coleta">Código da Coleta *</Label>
              <Input
                id="cod_coleta"
                name="cod_coleta"
                value={formData.cod_coleta}
                onChange={(e) => setFormData(prev => ({ ...prev, cod_coleta: e.target.value }))}
                required
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="dat_coleta">Data da Coleta *</Label>
              <Input
                id="dat_coleta"
                name="dat_coleta"
                type="date"
                value={formData.dat_coleta}
                onChange={(e) => setFormData(prev => ({ ...prev, dat_coleta: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="id_ponto_coleta">Ponto de Coleta *</Label>
              <Select
                value={formData.id_ponto_coleta}
                onValueChange={(value) => setFormData(prev => ({ ...prev, id_ponto_coleta: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ponto de coleta" />
                </SelectTrigger>
                <SelectContent>
                  {pontosColeta.map((ponto) => (
                    <SelectItem key={ponto.id_ponto_coleta} value={ponto.id_ponto_coleta.toString()}>
                      {ponto.des_logradouro} - {ponto.des_bairro}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* RN006 - Tipo de coleta (anônima ou identificada) */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous">Coleta Anônima</Label>
            </div>

            {!isAnonymous ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cpf_cnpj_search">CPF/CNPJ da Entidade Geradora</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cpf_cnpj_search"
                        placeholder="Digite o CPF ou CNPJ"
                        value={cpfCnpjSearch}
                        onChange={(e) => setCpfCnpjSearch(e.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={searchEntity}
                        disabled={loading}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Ou</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAnonymous(true)}
                      className="w-full"
                    >
                      Pular Busca da Entidade (Coleta Anônima)
                    </Button>
                  </div>
                </div>

                {selectedEntity && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="font-medium text-green-800">{selectedEntity.nom_entidade}</p>
                    <p className="text-sm text-green-600">CPF/CNPJ: {selectedEntity.num_cpf_cnpj}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Coleta anônima selecionada - não será vinculada a nenhuma entidade geradora.
              </p>
            )}
          </div>

          {/* RN005 - Eventos disponíveis */}
          <div>
            <Label htmlFor="id_evento">Evento (opcional)</Label>
            <Select
              value={formData.id_evento}
              onValueChange={(value) => setFormData(prev => ({ ...prev, id_evento: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um evento (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum evento</SelectItem>
                {eventos.map((evento) => (
                  <SelectItem key={evento.id_evento} value={evento.id_evento.toString()}>
                    {evento.nom_evento}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              RN005: São listados apenas os eventos ativos no período da data da coleta informada.
            </p>
          </div>

          {/* RN007 - Resíduos de diferentes tipos */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Resíduos Coletados</h3>
              <Button type="button" onClick={addResiduo} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Resíduo
              </Button>
            </div>

            {residuosColeta.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum resíduo adicionado. Clique em "Adicionar Resíduo" para começar.
              </p>
            ) : (
              <div className="space-y-3">
                {residuosColeta.map((residuo, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded">
                    <div>
                      <Label>Tipo de Resíduo *</Label>
                      <Select
                        value={residuo.id_tipo_residuo.toString()}
                        onValueChange={(value) => updateResiduo(index, 'id_tipo_residuo', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposResiduos.map((tipo) => (
                            <SelectItem key={tipo.id_tipo_residuo} value={tipo.id_tipo_residuo.toString()}>
                              {tipo.des_tipo_residuo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={residuo.qtd_total}
                        onChange={(e) => updateResiduo(index, 'qtd_total', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Valor Unitário (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={residuo.vlr_unitario}
                        onChange={(e) => updateResiduo(index, 'vlr_unitario', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Valor Total (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={residuo.vlr_total}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeResiduo(index)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Situação e valor total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="id_tipo_situacao">Situação *</Label>
              <Select
                value={formData.id_tipo_situacao}
                onValueChange={(value) => setFormData(prev => ({ ...prev, id_tipo_situacao: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a situação" />
                </SelectTrigger>
                <SelectContent>
                  {tiposSituacao.map((situacao) => (
                    <SelectItem key={situacao.id_tipo_situacao} value={situacao.id_tipo_situacao.toString()}>
                      {situacao.des_tipo_situacao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vlr_total">Valor Total da Coleta (R$)</Label>
              <Input
                id="vlr_total"
                type="number"
                step="0.01"
                value={formData.vlr_total}
                readOnly
                className="bg-muted text-lg font-medium"
              />
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : editingColeta ? 'Atualizar Coleta' : 'Salvar Coleta'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
