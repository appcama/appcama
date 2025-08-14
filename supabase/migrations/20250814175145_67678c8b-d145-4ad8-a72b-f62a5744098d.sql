
-- Inserir a funcionalidade "Tipos de Ponto de Coleta" na tabela funcionalidade
INSERT INTO public.funcionalidade (nom_funcionalidade, des_status, id_usuario_criador, dat_criacao)
VALUES ('Tipos de Ponto de Coleta', 'A', 1, now());

-- Vincular a nova funcionalidade ao perfil de administrador (assumindo que existe um perfil admin com id 1)
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 1, id_funcionalidade 
FROM public.funcionalidade 
WHERE nom_funcionalidade = 'Tipos de Ponto de Coleta';
