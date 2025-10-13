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

        // Não derrubar sessão customizada em reload (INITIAL_SESSION sem sessão)
        // Apenas limpar no SIGNED_OUT explícito
        if (event === 'SIGNED_OUT') {
          console.log('[Auth] Usuário saiu, limpando sessão local');
          setUser(null);
          localStorage.removeItem('recicla_e_user');
          return;
        }

        // Se houver usuário Supabase, sincroniza com dados do localStorage
        if (session?.user) {
          const storedUser = localStorage.getItem('recicla_e_user');
          if (storedUser) {
            console.log('[Auth] Recuperando dados do usuário do localStorage');
            setUser(JSON.parse(storedUser));
          }
          return;
        }

        // Sem sessão Supabase: manter usuário custom-auth se existir no localStorage
        const storedUser = localStorage.getItem('recicla_e_user');
        if (storedUser) {
          console.log('[Auth] Mantendo usuário custom-auth do localStorage');
          setUser(JSON.parse(storedUser));
        }
        // Caso não exista, loadSession fará a tentativa de recuperar depois
      }
    );

    // Função para verificar e carregar a sessão
    const loadSession = async () => {
      try {
        // Verificar sessão existente ao iniciar
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Auth] Verificando sessão existente:', !!session);
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        
        // Primeiro, tentar recuperar dados do usuário do localStorage
        const storedUser = localStorage.getItem('recicla_e_user');
        
        if (storedUser) {
          console.log('[Auth] Dados do usuário encontrados no localStorage');
          setUser(JSON.parse(storedUser));
        } else if (session?.user) {
          // Se não tiver no localStorage mas tiver sessão, tentar recuperar do Supabase
          console.log('[Auth] Tentando recuperar dados do usuário do Supabase');
          
          // Recuperar metadados do usuário da sessão
          const userData = session.user.user_metadata;
          
          if (userData && userData.user_id) {
            // Tentar buscar dados completos do usuário
            const { data } = await supabase
              .from('usuario')
              .select('id_usuario, id_entidade, id_perfil, des_senha_validada, des_status, des_email')
              .eq('id_usuario', userData.user_id)
              .single();
              
            if (data) {
              const isAdmin = await checkIsAdmin(data.id_perfil);
              
              const authUser: AuthUser = {
                id: data.id_usuario,
                entityId: data.id_entidade,
                profileId: data.id_perfil,
                passwordValidated: data.des_senha_validada,
                status: data.des_status,
                email: data.des_email,
                isAdmin
              };
              
              // Salvar no localStorage para futuras recuperações
              localStorage.setItem('recicla_e_user', JSON.stringify(authUser));
              setUser(authUser);
              console.log('[Auth] Dados do usuário recuperados do Supabase');
            }
          }
        }
      } catch (error) {
        console.error('[Auth] Erro ao carregar sessão:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSession();

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
        console.log('[Auth] Credenciais inválidas ou senha não validada');
        return { 
          success: false, 
          error: 'CPF/CNPJ ou senha inválidos. Se você ainda não validou sua senha, verifique seu e-mail.' 
        };
      }

      const userData = data[0];
      console.log('[Auth] Dados do usuário autenticado:', userData);

      // Verificar se precisa validar senha ANTES de criar sessão Supabase
      if (userData.password_validated === 'D') {
        console.log('[Auth] Senha não validada - redirecionando para validação');
        
        const isAdmin = await checkIsAdmin(userData.profile_id);
        
        // Salvar dados do usuário no estado e localStorage (sem criar sessão Supabase ainda)
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
        localStorage.setItem('recicla_e_user', JSON.stringify(authUser));
        
        return {
          success: true,
          needsValidation: true
        };
      }

      // Senha validada - prosseguir com login completo
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
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailForAuth,
          password: password
        });

        // Se o usuário não existe no Supabase Auth, criar
        if (signInError?.message?.includes('Invalid login credentials')) {
          console.log('[Auth] Usuário não existe no Supabase Auth, criando...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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
            
            // Atualizar metadados do usuário para facilitar recuperação após F5
            if (signUpData?.user) {
              await supabase.auth.updateUser({
                data: {
                  user_id: userData.user_id,
                  entity_id: userData.entity_id,
                  profile_id: userData.profile_id,
                  email: userData.email,
                  status: userData.user_status,
                  password_validated: userData.password_validated
                }
              });
            }
          }
        } else if (signInError) {
          console.warn('[Auth] Erro ao fazer login no Supabase Auth:', signInError);
          // Continuar mesmo com erro - a autenticação customizada já funcionou
        } else {
          console.log('[Auth] Sessão Supabase criada com sucesso');
          
          // Atualizar metadados do usuário para facilitar recuperação após F5
          if (signInData?.user) {
            await supabase.auth.updateUser({
              data: {
                user_id: userData.user_id,
                entity_id: userData.entity_id,
                profile_id: userData.profile_id,
                email: userData.email,
                status: userData.user_status,
                password_validated: userData.password_validated
              }
            });
          }
        }
      } catch (authError) {
        console.warn('[Auth] Erro ao gerenciar sessão Supabase:', authError);
        // Continuar mesmo com erro - a autenticação customizada já funcionou
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
      console.log('[Auth] Validando senha para usuário:', userId);
      
      const { data, error } = await supabase
        .rpc('validate_user_password', {
          user_id: userId,
          new_password: newPassword
        });

      if (error) {
        console.error('[Auth] Erro ao validar senha:', error);
        return { success: false, error: 'Erro ao validar senha' };
      }

      if (data) {
        console.log('[Auth] Senha validada com sucesso');
        
        // Atualizar o usuário no estado com senha validada
        if (user) {
          const updatedUser = { ...user, passwordValidated: 'A' };
          setUser(updatedUser);
          localStorage.setItem('recicla_e_user', JSON.stringify(updatedUser));
          
          // Agora criar a sessão Supabase com o email do usuário
          if (user.email) {
            console.log('[Auth] Criando sessão Supabase após validação');
            const emailForAuth = user.email;
            
            try {
              // Tentar fazer login com Supabase Auth
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: emailForAuth,
                password: newPassword
              });

              // Se o usuário não existe no Supabase Auth, criar
              if (signInError?.message?.includes('Invalid login credentials')) {
                console.log('[Auth] Usuário não existe no Supabase Auth, criando...');
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                  email: emailForAuth,
                  password: newPassword,
                  options: {
                    data: {
                      user_id: user.id,
                      entity_id: user.entityId,
                      profile_id: user.profileId
                    }
                  }
                });
                
                if (signUpError) {
                  console.warn('[Auth] Erro ao criar usuário no Supabase Auth:', signUpError);
                } else {
                  console.log('[Auth] Usuário criado no Supabase Auth com sucesso');
                  
                  if (signUpData?.user) {
                    await supabase.auth.updateUser({
                      data: {
                        user_id: user.id,
                        entity_id: user.entityId,
                        profile_id: user.profileId,
                        email: user.email,
                        status: user.status,
                        password_validated: 'A'
                      }
                    });
                  }
                }
              } else if (!signInError) {
                console.log('[Auth] Sessão Supabase criada com sucesso');
                
                if (signInData?.user) {
                  await supabase.auth.updateUser({
                    data: {
                      user_id: user.id,
                      entity_id: user.entityId,
                      profile_id: user.profileId,
                      email: user.email,
                      status: user.status,
                      password_validated: 'A'
                    }
                  });
                }
              }
            } catch (authError) {
              console.warn('[Auth] Erro ao gerenciar sessão Supabase:', authError);
            }
          }
        }
        
        return { success: true };
      }

      return { success: false, error: 'Falha na validação' };
    } catch (error) {
      console.error('[Auth] Erro inesperado:', error);
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
