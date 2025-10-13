-- Modificar função authenticate_user para bloquear usuários não validados
CREATE OR REPLACE FUNCTION public.authenticate_user(cpf_cnpj text, senha text)
RETURNS TABLE(user_id integer, entity_id integer, profile_id integer, password_validated character, user_status character, email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    AND u.des_locked = 'D'
    AND u.des_senha_validada = 'A';
END;
$function$;