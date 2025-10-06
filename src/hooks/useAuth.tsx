import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: number;
  entityId: number;
  profileId: number;
  passwordValidated: string;
  status: string;
  email: string;
  isAdmin?: boolean; // Adicionar campo para identificar admin
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
        console.log('[Auth] Estado mudou:', event, 'Sessão:', !!session);
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        
        // Recuperar dados do usuário do localStorage quando tiver sessão
        if (session?.user) {
          const storedUser = localStorage.getItem('recicla_e_user');
          if (storedUser) {
            console.log('[Auth] Recuperando dados do usuário do localStorage');
            setUser(JSON.parse(storedUser));
          }
        } else {
          // Limpar usuário quando não houver sessão
          console.log('[Auth] Sessão removida, limpando usuário');
          setUser(null);
          localStorage.removeItem('recicla_e_user');
        }
      }
    );

    // Verificar sessão existente ao iniciar
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Verificando sessão existente:', !!session);
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      // Recuperar dados do usuário se houver sessão
      if (session?.user) {
        const storedUser = localStorage.getItem('recicla_e_user');
        if (storedUser) {
          console.log('[Auth] Sessão existente encontrada, carregando usuário');
          setUser(JSON.parse(storedUser));
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkIsAdmin = async (profileId: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('perfil')
        .select('nom_perfil')
        .eq('id_perfil', profileId)
        .single();
      
      if (error || !data) return false;
      
      return data.nom_perfil?.toLowerCase().includes('admin') || 
             data.nom_perfil?.toLowerCase().includes('administrador') ||
             profileId === 1 || profileId === 2; // IDs conhecidos de admin
    } catch {
      return false;
    }
  };

  const login = async (cpfCnpj: string, password: string) => {
    try {
      setLoading(true);
      console.log('[Auth] Iniciando login...');
      
      // Remover formatação do CPF/CNPJ (manter apenas números)
      const cpfCnpjLimpo = cpfCnpj.replace(/[^\d]/g, '');
      
      // Chamar função de autenticação customizada
      const { data, error } = await supabase
        .rpc('authenticate_user', {
          cpf_cnpj: cpfCnpjLimpo,
          senha: password
        });

      if (error) {
        console.error('[Auth] Erro na RPC:', error);
        return { success: false, error: 'Erro interno do servidor' };
      }

      if (!data || data.length === 0) {
        console.log('[Auth] Credenciais inválidas');
        return { success: false, error: 'CPF/CNPJ ou senha inválidos' };
      }

      const userData = data[0];
      const isAdmin = await checkIsAdmin(userData.profile_id);

      const authUser: AuthUser = {
        id: userData.user_id,
        entityId: userData.entity_id,
        profileId: userData.profile_id,
        passwordValidated: userData.password_validated,
        status: userData.user_status,
        email: userData.email,
        isAdmin
      };

      // Armazenar dados do usuário no localStorage para persistência
      localStorage.setItem('recicla_e_user', JSON.stringify(authUser));
      console.log('[Auth] Dados do usuário salvos no localStorage');

      setUser(authUser);

      // Criar sessão Supabase real para persistência após F5
      // Usar email como identificador (ou CPF se não tiver email)
      const emailForAuth = userData.email || `${cpfCnpjLimpo}@recicla-e.local`;
      
      try {
        console.log('[Auth] Criando sessão Supabase...');
        // Tentar fazer login com Supabase Auth
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailForAuth,
          password: password
        });

        // Se o usuário não existe no Supabase Auth, criar
        if (signInError?.message?.includes('Invalid login credentials')) {
          console.log('[Auth] Usuário não existe no Supabase Auth, criando...');
          const { error: signUpError } = await supabase.auth.signUp({
            email: emailForAuth,
            password: password,
            options: {
              data: {
                user_id: userData.user_id,
                entity_id: userData.entity_id,
                profile_id: userData.profile_id
              }
            }
          });
          
          if (signUpError) {
            console.warn('[Auth] Erro ao criar usuário no Supabase Auth:', signUpError);
            // Continuar mesmo com erro - a autenticação customizada já funcionou
          } else {
            console.log('[Auth] Usuário criado no Supabase Auth com sucesso');
          }
        } else if (signInError) {
          console.warn('[Auth] Erro ao fazer login no Supabase Auth:', signInError);
          // Continuar mesmo com erro - a autenticação customizada já funcionou
        } else {
          console.log('[Auth] Sessão Supabase criada com sucesso');
        }
      } catch (authError) {
        console.warn('[Auth] Erro ao gerenciar sessão Supabase:', authError);
        // Continuar mesmo com erro - a autenticação customizada já funcionou
      }

      // Verificar se precisa validar senha
      if (userData.password_validated === 'D') {
        console.log('[Auth] Senha precisa ser validada');
        return { success: true, needsValidation: true };
      }

      console.log('[Auth] Login bem-sucedido');
      return { success: true };
    } catch (error) {
      console.error('[Auth] Erro inesperado:', error);
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
      return { success: false, error: 'Erro inesperado' };
    }
  };

  const logout = async () => {
    console.log('[Auth] Fazendo logout...');
    await supabase.auth.signOut();
    localStorage.removeItem('recicla_e_user');
    setUser(null);
    console.log('[Auth] Logout concluído');
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
