-- Inserir funcionalidade Certificados se não existir
INSERT INTO public.funcionalidade (nom_funcionalidade, des_status, des_locked, id_usuario_criador, dat_criacao)
SELECT 'Certificados', 'A', 'D', 1, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.funcionalidade WHERE nom_funcionalidade = 'Certificados'
);

-- Associar a funcionalidade Certificados aos perfis de administrador (IDs 1 e 2)
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT p.id_perfil, f.id_funcionalidade
FROM public.perfil p
CROSS JOIN public.funcionalidade f
WHERE f.nom_funcionalidade = 'Certificados'
  AND p.id_perfil IN (1, 2)
  AND NOT EXISTS (
    SELECT 1 
    FROM public.perfil__funcionalidade pf 
    WHERE pf.id_perfil = p.id_perfil 
      AND pf.id_funcionalidade = f.id_funcionalidade
  );