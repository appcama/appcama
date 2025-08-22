
-- Adicionar políticas RLS para unidade_medida (permitir leitura para todos os usuários autenticados)
CREATE POLICY "Allow read access to unidade_medida table" 
ON public.unidade_medida 
FOR SELECT 
TO authenticated 
USING (true);

-- Adicionar políticas RLS para indicador (permitir acesso completo para usuários autenticados)
CREATE POLICY "Allow read access to indicador table" 
ON public.indicador 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow insert access to indicador table" 
ON public.indicador 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow update access to indicador table" 
ON public.indicador 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow delete access to indicador table" 
ON public.indicador 
FOR DELETE 
TO authenticated 
USING (true);
