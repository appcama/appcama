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
      
      // Remover formatação do CPF/CNPJ (manter apenas números)
      const cpfCnpjLimpo = cpfCnpj.replace(/[^\d]/g, '');
      
      // Chamar função de autenticação
      const { data, error } = await supabase
        .rpc('authenticate_user', {
          cpf_cnpj: cpfCnpjLimpo,
          senha: password
        });

      if (error) {
        return { success: false, error: 'Erro interno do servidor' };
      }

      if (!data || data.length === 0) {
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

      setUser(authUser);

      // Verificar se precisa validar senha
      if (userData.password_validated === 'D') {
        return { success: true, needsValidation: true };
      }

      return { success: true };
    } catch (error) {
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
