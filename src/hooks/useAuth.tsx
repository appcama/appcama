import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: number;
  entityId: number;
  profileId: number;
  passwordValidated: string;
  status: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  supabaseUser: User | null;
  login: (cpfCnpj: string, password: string) => Promise<{ success: boolean; error?: string; needsValidation?: boolean }>;
  logout: () => Promise<void>;
  validatePassword: (userId: number, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (cpfCnpj: string, password: string) => {
    try {
      setLoading(true);
      
      // Remover formatação do CPF/CNPJ (manter apenas números)
      const cpfCnpjLimpo = cpfCnpj.replace(/[^\d]/g, '');
      
      console.log('=== INÍCIO DO PROCESSO DE LOGIN ===');
      console.log('CPF/CNPJ fornecido:', cpfCnpj);
      console.log('CPF/CNPJ limpo:', cpfCnpjLimpo);
      console.log('Senha fornecida:', password ? '***' : 'VAZIA');
      
      // Primeiro, vamos testar se conseguimos chamar uma função simples
      console.log('=== TESTANDO CONEXÃO COM SUPABASE ===');
      try {
        const { data: testData, error: testError } = await supabase
          .from('usuario')
          .select('count')
          .limit(1);
        console.log('Teste de conexão:', { testData, testError });
      } catch (err) {
        console.error('Erro na conexão:', err);
      }
      
      // DEBUG: Verificar dados específicos no banco
      console.log('=== VERIFICANDO DADOS NO BANCO ===');
      try {
        const { data: allUsers, error: allUsersError } = await supabase
          .from('usuario')
          .select(`
            id_usuario,
            des_senha,
            des_status,
            des_locked,
            entidade!inner (
              num_cpf_cnpj,
              nom_entidade
            )
          `)
          .limit(5);
        
        console.log('Primeiros 5 usuários do banco:', { allUsers, allUsersError });
        
        // Buscar especificamente pela entidade com o CPF informado
        const { data: specificEntity, error: entityError } = await supabase
          .from('entidade')
          .select('*')
          .eq('num_cpf_cnpj', cpfCnpj);
        
        console.log('Entidade específica encontrada:', { specificEntity, entityError });
        
        if (specificEntity && specificEntity.length > 0) {
          const { data: usersFromEntity, error: usersError } = await supabase
            .from('usuario')
            .select('*')
            .eq('id_entidade', specificEntity[0].id_entidade);
          
          console.log('Usuários da entidade encontrada:', { usersFromEntity, usersError });
        }
        
      } catch (err) {
        console.error('Erro ao buscar dados do banco:', err);
      }
      
      // Agora testar as funções de debug
      console.log('=== TESTANDO FUNÇÕES DE DEBUG ===');
      try {
        const { data: debugData, error: debugError } = await supabase
          .rpc('debug_user_data');
        console.log('Resultado debug_user_data:', { debugData, debugError });
      } catch (err) {
        console.error('Erro ao chamar debug_user_data:', err);
      }
      
      try {
        const { data: debugAuth, error: debugAuthError } = await supabase
          .rpc('debug_authenticate_user', {
            cpf_cnpj_param: cpfCnpjLimpo,
            senha_param: password
          });
        console.log('Resultado debug_authenticate_user:', { debugAuth, debugAuthError });
      } catch (err) {
        console.error('Erro ao chamar debug_authenticate_user:', err);
      }
      
      // Chamar função de autenticação original
      console.log('=== CHAMANDO FUNÇÃO DE AUTENTICAÇÃO ===');
      const { data, error } = await supabase
        .rpc('authenticate_user', {
          cpf_cnpj: cpfCnpjLimpo,
          senha: password
        });

      console.log('Resposta da função authenticate_user:', { data, error });

      if (error) {
        console.error('Erro na função authenticate_user:', error);
        return { success: false, error: 'Erro interno do servidor' };
      }

      if (!data || data.length === 0) {
        console.log('Nenhum usuário encontrado com as credenciais fornecidas');
        return { success: false, error: 'CPF/CNPJ ou senha inválidos' };
      }

      const userData = data[0];
      console.log('Dados do usuário retornados:', userData);

      const authUser: AuthUser = {
        id: userData.user_id,
        entityId: userData.entity_id,
        profileId: userData.profile_id,
        passwordValidated: userData.password_validated,
        status: userData.user_status,
        email: userData.email
      };

      console.log('Usuário autenticado com sucesso:', authUser);
      setUser(authUser);

      // Verificar se precisa validar senha
      if (userData.password_validated === 'D') {
        console.log('Usuário precisa validar senha');
        return { success: true, needsValidation: true };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro durante login:', error);
      return { success: false, error: 'Erro inesperado' };
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = async (userId: number, newPassword: string) => {
    try {
      const { data, error } = await supabase
        .rpc('validate_user_password', {
          user_id: userId,
          new_password: newPassword
        });

      if (error) {
        return { success: false, error: 'Erro ao validar senha' };
      }

      if (data) {
        // Atualizar o usuário local
        setUser(prev => prev ? { ...prev, passwordValidated: 'A' } : null);
        return { success: true };
      }

      return { success: false, error: 'Falha na validação' };
    } catch (error) {
      console.error('Erro durante validação:', error);
      return { success: false, error: 'Erro inesperado' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      supabaseUser,
      login,
      logout,
      validatePassword,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
