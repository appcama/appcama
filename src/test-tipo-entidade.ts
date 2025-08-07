import { supabase } from '@/integrations/supabase/client';

// Função para ler todos os tipos de entidade
export async function lerTiposEntidade() {
  try {
    const { data, error } = await supabase
      .from('tipo_entidade')
      .select('*')
      .order('des_tipo_entidade');

    if (error) {
      console.error('Erro ao buscar tipos de entidade:', error);
      return null;
    }

    console.log('Tipos de entidade encontrados:', data);
    return data;
  } catch (error) {
    console.error('Erro na consulta:', error);
    return null;
  }
}

// Função para ler apenas os campos necessários
export async function lerTiposEntidadeSimples() {
  try {
    const { data, error } = await supabase
      .from('tipo_entidade')
      .select('id_tipo_entidade, des_tipo_entidade')
      .order('des_tipo_entidade');

    if (error) {
      console.error('Erro ao buscar tipos de entidade:', error);
      return null;
    }

    console.log('Tipos de entidade (simples):', data);
    return data;
  } catch (error) {
    console.error('Erro na consulta:', error);
    return null;
  }
}

// Chamar a função para testar
lerTiposEntidade();
lerTiposEntidadeSimples();