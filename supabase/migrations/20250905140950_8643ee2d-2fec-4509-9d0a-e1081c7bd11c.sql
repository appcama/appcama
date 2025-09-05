-- Garantir que o perfil administrador (id 1) tenha acesso à funcionalidade Resíduos
INSERT INTO public.perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 1, 44
WHERE NOT EXISTS (
  SELECT 1 FROM public.perfil__funcionalidade 
  WHERE id_perfil = 1 AND id_funcionalidade = 44
);