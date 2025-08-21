
-- 1. Adicionar a funcionalidade "Indicadores" na tabela funcionalidade
INSERT INTO public.funcionalidade (
    nom_funcionalidade,
    des_status,
    des_locked,
    id_usuario_criador,
    dat_criacao
) VALUES (
    'Indicadores',
    'A',
    'D',
    1,
    now()
) ON CONFLICT DO NOTHING;

-- 2. Associar a funcionalidade "Indicadores" ao perfil do usuário
-- Assumindo que existe um perfil com id 1 (geralmente admin)
INSERT INTO public.perfil__funcionalidade (
    id_perfil,
    id_funcionalidade
) 
SELECT 
    1 as id_perfil,
    f.id_funcionalidade
FROM public.funcionalidade f
WHERE f.nom_funcionalidade = 'Indicadores'
ON CONFLICT DO NOTHING;

-- 3. Verificar se também precisamos adicionar para outros perfis ativos
-- Caso haja outros perfis que devem ter acesso aos indicadores
INSERT INTO public.perfil__funcionalidade (
    id_perfil,
    id_funcionalidade
)
SELECT DISTINCT
    p.id_perfil,
    f.id_funcionalidade
FROM public.perfil p
CROSS JOIN public.funcionalidade f
WHERE p.des_status = 'A'
  AND f.nom_funcionalidade = 'Indicadores'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.perfil__funcionalidade pf 
    WHERE pf.id_perfil = p.id_perfil 
      AND pf.id_funcionalidade = f.id_funcionalidade
  );
