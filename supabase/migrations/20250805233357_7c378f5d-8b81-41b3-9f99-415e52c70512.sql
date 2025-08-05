
-- Função temporária para debugar os dados no banco
CREATE OR REPLACE FUNCTION debug_user_data()
RETURNS TABLE (
  cpf_cnpj TEXT,
  senha TEXT,
  status CHARACTER(1),
  locked CHARACTER(1),
  user_id INTEGER,
  entity_id INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.num_cpf_cnpj::TEXT,
    u.des_senha::TEXT,
    u.des_status,
    u.des_locked,
    u.id_usuario,
    u.id_entidade
  FROM usuario u
  INNER JOIN entidade e ON u.id_entidade = e.id_entidade
  WHERE e.num_cpf_cnpj LIKE '01.704.986%'
     OR e.num_cpf_cnpj LIKE '01704986%';
END;
$$;

-- Função melhorada para debugar a autenticação step by step
CREATE OR REPLACE FUNCTION debug_authenticate_user(cpf_cnpj_param TEXT, senha_param TEXT)
RETURNS TABLE (
  step TEXT,
  found_entities INTEGER,
  found_users INTEGER,
  cpf_cnpj_db TEXT,
  senha_db TEXT,
  status_db CHARACTER(1),
  locked_db CHARACTER(1)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  entity_count INTEGER;
  user_count INTEGER;
BEGIN
  -- Step 1: Check entities with matching CPF/CNPJ
  SELECT COUNT(*)::INTEGER INTO entity_count
  FROM entidade e
  WHERE e.num_cpf_cnpj = cpf_cnpj_param;
  
  RETURN QUERY SELECT 'Step 1: Entities found'::TEXT, entity_count, 0::INTEGER, ''::TEXT, ''::TEXT, ''::CHARACTER(1), ''::CHARACTER(1);
  
  -- Step 2: Check users linked to those entities
  SELECT COUNT(*)::INTEGER INTO user_count
  FROM usuario u
  INNER JOIN entidade e ON u.id_entidade = e.id_entidade
  WHERE e.num_cpf_cnpj = cpf_cnpj_param;
  
  RETURN QUERY SELECT 'Step 2: Users found'::TEXT, entity_count, user_count, ''::TEXT, ''::TEXT, ''::CHARACTER(1), ''::CHARACTER(1);
  
  -- Step 3: Show actual data for debugging
  RETURN QUERY
  SELECT 
    'Step 3: User data'::TEXT,
    0::INTEGER,
    0::INTEGER,
    e.num_cpf_cnpj::TEXT,
    u.des_senha::TEXT,
    u.des_status,
    u.des_locked
  FROM usuario u
  INNER JOIN entidade e ON u.id_entidade = e.id_entidade
  WHERE e.num_cpf_cnpj = cpf_cnpj_param;
  
END;
$$;
