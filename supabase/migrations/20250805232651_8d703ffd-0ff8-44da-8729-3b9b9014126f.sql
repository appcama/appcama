
-- Corrigir a função authenticate_user para resolver o erro de tipos
CREATE OR REPLACE FUNCTION authenticate_user(cpf_cnpj TEXT, senha TEXT)
RETURNS TABLE (
  user_id INTEGER,
  entity_id INTEGER, 
  profile_id INTEGER,
  password_validated CHARACTER(1),
  user_status CHARACTER(1),
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id_usuario::INTEGER,
    u.id_entidade::INTEGER,
    u.id_perfil::INTEGER, 
    u.des_senha_validada,
    u.des_status,
    COALESCE(u.des_email, '')::TEXT
  FROM usuario u
  INNER JOIN entidade e ON u.id_entidade = e.id_entidade
  WHERE e.num_cpf_cnpj = cpf_cnpj
    AND u.des_senha = senha
    AND u.des_status = 'A'
    AND u.des_locked = 'D';
END;
$$;
