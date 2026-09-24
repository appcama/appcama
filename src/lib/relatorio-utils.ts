import { supabase } from "@/integrations/supabase/client";

/**
 * Busca a URL do logotipo da entidade do usuário logado
 * para uso na exportação e impressão de relatórios.
 */
export async function getUserEntityLogo(): Promise<string | undefined> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return undefined;

    const storedUser = localStorage.getItem('recicla_e_user');
    if (!storedUser) return undefined;

    const userData = JSON.parse(storedUser);
    if (!userData.entityId) return undefined;

    const { data: entidadeData, error } = await supabase
      .from('entidade')
      .select('des_logo_url')
      .eq('id_entidade', userData.entityId)
      .maybeSingle();

    if (error) {
      console.warn('Não foi possível obter logo da entidade:', error);
      return undefined;
    }

    return entidadeData?.des_logo_url || undefined;
  } catch (error) {
    console.warn('Erro ao carregar logotipo da entidade:', error);
    return undefined;
  }
}
