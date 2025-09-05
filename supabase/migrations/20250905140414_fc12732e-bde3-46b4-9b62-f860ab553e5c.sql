-- Criar funcionalidade "Resíduos"
INSERT INTO public.funcionalidade (nom_funcionalidade, des_status, des_locked, dat_criacao, id_usuario_criador)
VALUES ('Resíduos', 'A', 'D', now(), 1);

-- Atualizar RLS policies da tabela residuo para permitir todas as operações
DROP POLICY IF EXISTS "Allow read access to residuo table" ON public.residuo;

CREATE POLICY "Allow read access to residuo table" 
ON public.residuo 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert access to residuo table" 
ON public.residuo 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update access to residuo table" 
ON public.residuo 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete access to residuo table" 
ON public.residuo 
FOR DELETE 
USING (true);

-- Adicionar constraint UNIQUE para nom_residuo
ALTER TABLE public.residuo 
ADD CONSTRAINT uk_residuo_nom_residuo UNIQUE (nom_residuo);