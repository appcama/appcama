
-- Inserir o primeiro usuário para login
INSERT INTO public.usuario (
  id_entidade,
  id_perfil,
  des_senha,
  des_senha_validada,
  des_status,
  des_locked,
  des_email,
  dat_criacao,
  dat_atualizacao,
  id_usuario_criador,
  id_usuario_atualizador
) VALUES (
  1, -- id_entidade (Cama)
  2, -- id_perfil (Administrador)
  'appcamaroma', -- des_senha
  'D', -- des_senha_validada (precisa validar no primeiro login)
  'A', -- des_status (ativo)
  'D', -- des_locked (desbloqueado)
  'appcamaong@gmail.com', -- des_email
  now(), -- dat_criacao
  now(), -- dat_atualizacao
  1, -- id_usuario_criador
  1  -- id_usuario_atualizador
);
