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
      
      console.log('Tentativa de login com:', { cpfCnpj, password: '***' });
      
      // Chamar função de autenticação customizada
      const { data, error } = await supabase
        .rpc('authenticate_user', {
          cpf_cnpj: cpfCnpj,
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
      
      // Criar sessão fictícia para o Supabase (necessária para as políticas RLS)
      const { error: signInError } = await supabase.auth.signInAnonymously();
      
      if (signInError) {
        console.error('Erro ao criar sessão anônima:', signInError);
        return { success: false, error: 'Erro ao criar sessão' };
      }

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
