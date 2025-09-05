-- Garantir que o perfil Administrador (id 2) tenha acesso à funcionalidade Resíduos
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 2, 44
WHERE NOT EXISTS (
  SELECT 1 FROM public.perfil__funcionalidade 
  WHERE id_perfil = 2 AND id_funcionalidade = 44
);

-- Verificar se o perfil Administrador tem todas as funcionalidades principais
-- Dashboard
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 2, f.id_funcionalidade
FROM funcionalidade f
WHERE f.nom_funcionalidade = 'Dashboard'
  AND NOT EXISTS (
    SELECT 1 FROM public.perfil__funcionalidade pf 
    WHERE pf.id_perfil = 2 AND pf.id_funcionalidade = f.id_funcionalidade
  );

-- Entidades
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 2, f.id_funcionalidade
FROM funcionalidade f
WHERE f.nom_funcionalidade = 'Entidades'
  AND NOT EXISTS (
    SELECT 1 FROM public.perfil__funcionalidade pf 
    WHERE pf.id_perfil = 2 AND pf.id_funcionalidade = f.id_funcionalidade
  );

-- Pontos de Coleta
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 2, f.id_funcionalidade
FROM funcionalidade f
WHERE f.nom_funcionalidade = 'Pontos de Coleta'
  AND NOT EXISTS (
    SELECT 1 FROM public.perfil__funcionalidade pf 
    WHERE pf.id_perfil = 2 AND pf.id_funcionalidade = f.id_funcionalidade
  );

-- Eventos de Coleta
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 2, f.id_funcionalidade
FROM funcionalidade f
WHERE f.nom_funcionalidade = 'Eventos de Coleta'
  AND NOT EXISTS (
    SELECT 1 FROM public.perfil__funcionalidade pf 
    WHERE pf.id_perfil = 2 AND pf.id_funcionalidade = f.id_funcionalidade
  );

-- Coletas
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 2, f.id_funcionalidade
FROM funcionalidade f
WHERE f.nom_funcionalidade = 'Coletas'
  AND NOT EXISTS (
    SELECT 1 FROM public.perfil__funcionalidade pf 
    WHERE pf.id_perfil = 2 AND pf.id_funcionalidade = f.id_funcionalidade
  );

-- Tipos de Ponto de Coleta
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 2, f.id_funcionalidade
FROM funcionalidade f
WHERE f.nom_funcionalidade = 'Tipos de Ponto de Coleta'
  AND NOT EXISTS (
    SELECT 1 FROM public.perfil__funcionalidade pf 
    WHERE pf.id_perfil = 2 AND pf.id_funcionalidade = f.id_funcionalidade
  );

-- Tipos de Entidades
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 2, f.id_funcionalidade
FROM funcionalidade f
WHERE f.nom_funcionalidade = 'Tipos de Entidades'
  AND NOT EXISTS (
    SELECT 1 FROM public.perfil__funcionalidade pf 
    WHERE pf.id_perfil = 2 AND pf.id_funcionalidade = f.id_funcionalidade
  );

-- Tipos de Resíduos
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 2, f.id_funcionalidade
FROM funcionalidade f
WHERE f.nom_funcionalidade = 'Tipos de Resíduos'
  AND NOT EXISTS (
    SELECT 1 FROM public.perfil__funcionalidade pf 
    WHERE pf.id_perfil = 2 AND pf.id_funcionalidade = f.id_funcionalidade
  );

-- Indicadores
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 2, f.id_funcionalidade
FROM funcionalidade f
WHERE f.nom_funcionalidade = 'Indicadores'
  AND NOT EXISTS (
    SELECT 1 FROM public.perfil__funcionalidade pf 
    WHERE pf.id_perfil = 2 AND pf.id_funcionalidade = f.id_funcionalidade
  );

-- Perfis
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 2, f.id_funcionalidade
FROM funcionalidade f
WHERE f.nom_funcionalidade = 'Perfis'
  AND NOT EXISTS (
    SELECT 1 FROM public.perfil__funcionalidade pf 
    WHERE pf.id_perfil = 2 AND pf.id_funcionalidade = f.id_funcionalidade
  );

-- Usuários
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 2, f.id_funcionalidade
FROM funcionalidade f
WHERE f.nom_funcionalidade = 'Usuários'
  AND NOT EXISTS (
    SELECT 1 FROM public.perfil__funcionalidade pf 
    WHERE pf.id_perfil = 2 AND pf.id_funcionalidade = f.id_funcionalidade
  );