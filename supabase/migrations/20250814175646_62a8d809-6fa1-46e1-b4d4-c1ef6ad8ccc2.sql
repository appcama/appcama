
-- Primeiro, vamos verificar se a funcionalidade já existe e remover se necessário
DELETE FROM public.perfil__funcionalidade 
WHERE id_funcionalidade IN (
  SELECT id_funcionalidade FROM public.funcionalidade 
  WHERE nom_funcionalidade = 'Tipos de Ponto de Coleta'
);

DELETE FROM public.funcionalidade 
WHERE nom_funcionalidade = 'Tipos de Ponto de Coleta';

-- Agora inserir corretamente a funcionalidade "Tipos de Ponto de Coleta"
INSERT INTO public.funcionalidade (nom_funcionalidade, des_status, des_locked, id_usuario_criador, dat_criacao)
VALUES ('Tipos de Ponto de Coleta', 'A', 'D', 1, now());

-- Vincular a nova funcionalidade aos perfis existentes (vamos adicionar para todos os perfis ativos)
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT p.id_perfil, f.id_funcionalidade 
FROM public.perfil p, public.funcionalidade f
WHERE f.nom_funcionalidade = 'Tipos de Ponto de Coleta'
  AND p.des_status = 'A';
