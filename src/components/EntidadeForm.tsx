import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCpfCnpj, validateCpfOrCnpj } from '@/lib/cpf-cnpj-utils';

interface Entidade {
  id_entidade: number;
  num_cpf_cnpj: string;
  nom_entidade: string;
  nom_razao_social: string | null;
  id_tipo_pessoa: number;
  id_tipo_entidade: number;        // ✅ ADICIONAR
  id_tipo_situacao: number;       // ✅ ADICIONAR
  id_municipio?: number;          // ✅ ADICIONAR (opcional)
  des_logradouro: string;
  des_bairro: string;
  num_cep: string;
  num_telefone: string | null;
}

interface TipoEntidade {
  id_tipo_entidade: number;
  des_tipo_entidade: string;
}

interface TipoSituacao {
  id_tipo_situacao: number;
  des_tipo_situacao: string;
}

interface EntidadeFormProps {
  entidade?: Entidade | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EntidadeForm({ entidade, onSuccess, onCancel }: EntidadeFormProps) {
  const [formData, setFormData] = useState({
    num_cpf_cnpj: '',
    id_tipo_entidade: '',
    id_tipo_pessoa: '',
    nom_entidade: '',
    nom_razao_social: '',
    id_tipo_situacao: '',
    des_logradouro: '',
    des_bairro: '',
    num_cep: '',
    id_municipio: '',
    num_telefone: '',
  });

  const [tiposEntidade, setTiposEntidade] = useState<TipoEntidade[]>([]);
  const [tiposSituacao, setTiposSituacao] = useState<TipoSituacao[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadSelectOptions();
    if (entidade) {
      setFormData({
        num_cpf_cnpj: entidade.num_cpf_cnpj,
        id_tipo_entidade: entidade.id_tipo_entidade.toString(), // ✅ Agora existe
        id_tipo_pessoa: entidade.id_tipo_pessoa.toString(),
        nom_entidade: entidade.nom_entidade,
        nom_razao_social: entidade.nom_razao_social || '',
        id_tipo_situacao: entidade.id_tipo_situacao.toString(), // ✅ Agora existe
        des_logradouro: entidade.des_logradouro,
        des_bairro: entidade.des_bairro,
        num_cep: entidade.num_cep,
        id_municipio: entidade.id_municipio?.toString() || '',
        num_telefone: entidade.num_telefone || '',
      });
    }
  }, [entidade]);

  const loadSelectOptions = async () => {
    console.log('🔍 Iniciando carregamento das opções...');
    
    try {
      // Carregar tipos de entidade com logs detalhados
      console.log('📋 Buscando tipos de entidade...');
      const { data: tiposEntidadeData, error: errorTiposEntidade } = await supabase
        .from('tipo_entidade')
        .select('id_tipo_entidade, des_tipo_entidade')
        .order('des_tipo_entidade');
    
      console.log('✅ Resposta tipos de entidade:', { data: tiposEntidadeData, error: errorTiposEntidade });
    
      if (errorTiposEntidade) {
        console.error('❌ Erro ao buscar tipos de entidade:', errorTiposEntidade);
        toast({
          title: 'Erro',
          description: `Erro ao carregar tipos de entidade: ${errorTiposEntidade.message}`,
          variant: 'destructive',
        });
      }
    
      // Carregar tipos de situação com logs detalhados
      console.log('📋 Buscando tipos de situação...');
      const { data: tiposSituacaoData, error: errorTiposSituacao } = await supabase
        .from('tipo_situacao')
        .select('id_tipo_situacao, des_tipo_situacao')
        .order('des_tipo_situacao');
    
      console.log('✅ Resposta tipos de situação:', { data: tiposSituacaoData, error: errorTiposSituacao });
    
      if (errorTiposSituacao) {
        console.error('❌ Erro ao buscar tipos de situação:', errorTiposSituacao);
        toast({
          title: 'Erro',
          description: `Erro ao carregar tipos de situação: ${errorTiposSituacao.message}`,
          variant: 'destructive',
        });
      }
    
      // Definir os dados nos states
      const tiposEntidadeFinal = tiposEntidadeData || [];
      const tiposSituacaoFinal = tiposSituacaoData || [];
      
      console.log('📊 Definindo estados:', {
        tiposEntidade: tiposEntidadeFinal.length,
        tiposSituacao: tiposSituacaoFinal.length
      });
      
      setTiposEntidade(tiposEntidadeFinal);
      setTiposSituacao(tiposSituacaoFinal);
      
      // Verificar se as tabelas estão vazias
      if (tiposEntidadeFinal.length === 0) {
        console.warn('⚠️ Tabela tipo_entidade está vazia!');
        toast({
          title: 'Aviso',
          description: 'Nenhum tipo de entidade encontrado. A tabela pode estar vazia.',
          variant: 'destructive',
        });
      }
      
      if (tiposSituacaoFinal.length === 0) {
        console.warn('⚠️ Tabela tipo_situacao está vazia!');
        toast({
          title: 'Aviso',
          description: 'Nenhum tipo de situação encontrado. A tabela pode estar vazia.',
          variant: 'destructive',
        });
      }
      
    } catch (error) {
      console.error('💥 Erro geral ao carregar opções:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao carregar opções do formulário',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!formData.id_tipo_entidade) {
      toast({
        title: 'Erro',
        description: 'Selecione o tipo de entidade',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.id_tipo_situacao) {
      toast({
        title: 'Erro',
        description: 'Selecione a situação da entidade',
        variant: 'destructive',
      });
      return;
    }
    
    if (!validateCpfOrCnpj(formData.num_cpf_cnpj)) {
      toast({
        title: 'Erro',
        description: 'CPF/CNPJ inválido',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const entidadeData = {
        num_cpf_cnpj: formData.num_cpf_cnpj,
        id_tipo_entidade: parseInt(formData.id_tipo_entidade), // Agora garantido que não é vazio
        id_tipo_pessoa: parseInt(formData.id_tipo_pessoa),
        nom_entidade: formData.nom_entidade,
        nom_razao_social: formData.nom_razao_social || null,
        id_tipo_situacao: parseInt(formData.id_tipo_situacao), // Agora garantido que não é vazio
        des_logradouro: formData.des_logradouro,
        des_bairro: formData.des_bairro,
        num_cep: formData.num_cep,
        id_municipio: parseInt(formData.id_municipio) || 1,
        id_unidade_federativa: 1,
        num_telefone: formData.num_telefone || null,
        id_usuario_criador: user?.id || 1,
        dat_criacao: new Date().toISOString(),
      };

      let error;
      if (entidade) {
        // Atualizar entidade existente
        const result = await supabase
          .from('entidade')
          .update({
            ...entidadeData,
            dat_atualizacao: new Date().toISOString(),
            id_usuario_atualizador: user?.id || 1,
          })
          .eq('id_entidade', entidade.id_entidade);
        error = result.error;
      } else {
        // Criar nova entidade
        const result = await supabase
          .from('entidade')
          .insert([entidadeData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Entidade ${entidade ? 'atualizada' : 'criada'} com sucesso`,
      });
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar entidade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar entidade',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {entidade ? 'Editar Entidade' : 'Nova Entidade'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Entidade</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="num_cpf_cnpj">CPF/CNPJ *</Label>
                <Input
                  id="num_cpf_cnpj"
                  value={formData.num_cpf_cnpj}
                  onChange={(e) => handleInputChange('num_cpf_cnpj', formatCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="id_tipo_entidade">Tipo Entidade *</Label>
                <Select
                  value={formData.id_tipo_entidade}
                  onValueChange={(value) => handleInputChange('id_tipo_entidade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEntidade.map((tipo) => (
                      <SelectItem key={tipo.id_tipo_entidade} value={tipo.id_tipo_entidade.toString()}>
                        {tipo.des_tipo_entidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="id_tipo_pessoa">Tipo Pessoa *</Label>
                <Select
                  value={formData.id_tipo_pessoa}
                  onValueChange={(value) => handleInputChange('id_tipo_pessoa', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Pessoa Física</SelectItem>
                    <SelectItem value="2">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nom_entidade">Nome *</Label>
                <Input
                  id="nom_entidade"
                  value={formData.nom_entidade}
                  onChange={(e) => handleInputChange('nom_entidade', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="nom_razao_social">Razão Social</Label>
                <Input
                  id="nom_razao_social"
                  value={formData.nom_razao_social}
                  onChange={(e) => handleInputChange('nom_razao_social', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="id_tipo_situacao">Tipo Situação *</Label>
                <Select
                  value={formData.id_tipo_situacao}
                  onValueChange={(value) => handleInputChange('id_tipo_situacao', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a situação" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposSituacao.map((tipo) => (
                      <SelectItem key={tipo.id_tipo_situacao} value={tipo.id_tipo_situacao.toString()}>
                        {tipo.des_tipo_situacao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="des_logradouro">Logradouro *</Label>
                <Input
                  id="des_logradouro"
                  value={formData.des_logradouro}
                  onChange={(e) => handleInputChange('des_logradouro', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="des_bairro">Bairro *</Label>
                <Input
                  id="des_bairro"
                  value={formData.des_bairro}
                  onChange={(e) => handleInputChange('des_bairro', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="num_cep">CEP *</Label>
                <Input
                  id="num_cep"
                  value={formData.num_cep}
                  onChange={(e) => handleInputChange('num_cep', e.target.value)}
                  placeholder="00000-000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="num_telefone">Telefone</Label>
                <Input
                  id="num_telefone"
                  value={formData.num_telefone}
                  onChange={(e) => handleInputChange('num_telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-recycle-green hover:bg-recycle-green/90"
              >
                {loading ? 'Salvando...' : entidade ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}