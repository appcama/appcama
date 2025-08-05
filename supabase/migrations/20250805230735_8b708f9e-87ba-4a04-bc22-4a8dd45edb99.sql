
-- Habilitar RLS na tabela usuario
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seu próprio registro
CREATE POLICY "Users can view their own record" 
  ON public.usuario 
  FOR SELECT 
  USING (auth.uid()::text = id_usuario::text);

-- Política para permitir que usuários atualizem apenas seu próprio registro
CREATE POLICY "Users can update their own record" 
  ON public.usuario 
  FOR UPDATE 
  USING (auth.uid()::text = id_usuario::text);

-- Política para permitir inserção de novos usuários (para o sistema de cadastro)
CREATE POLICY "Allow insert for new users" 
  ON public.usuario 
  FOR INSERT 
  WITH CHECK (true);

-- Função para autenticação customizada com CPF/CNPJ
CREATE OR REPLACE FUNCTION public.authenticate_user(
  cpf_cnpj text,
  senha text
) 
RETURNS TABLE (
  user_id integer,
  entity_id integer,
  profile_id integer,
  password_validated character,
  user_status character,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id_usuario,
    u.id_entidade,
    u.id_perfil,
    u.des_senha_validada,
    u.des_status,
    u.des_email
  FROM public.usuario u
  INNER JOIN public.entidade e ON u.id_entidade = e.id_entidade
  WHERE e.num_cpf_cnpj = REPLACE(REPLACE(REPLACE(cpf_cnpj, '.', ''), '/', ''), '-', '')
    AND u.des_senha = senha
    AND u.des_status = 'A'
    AND u.des_locked = 'D';
END;
$$;

-- Função para atualizar senha validada
CREATE OR REPLACE FUNCTION public.validate_user_password(
  user_id integer,
  new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.usuario 
  SET 
    des_senha = new_password,
    des_senha_validada = 'A',
    dat_atualizacao = now(),
    id_usuario_atualizador = user_id
  WHERE id_usuario = user_id;
  
  RETURN FOUND;
END;
$$;
