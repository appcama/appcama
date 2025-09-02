-- Corrigir políticas RLS para tabela indicador
-- Permitir acesso completo a indicadores para todos os usuários autenticados

-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow delete access to indicador table" ON public.indicador;
DROP POLICY IF EXISTS "Allow insert access to indicador table" ON public.indicador;
DROP POLICY IF EXISTS "Allow read access to indicador table" ON public.indicador;
DROP POLICY IF EXISTS "Allow update access to indicador table" ON public.indicador;

-- Criar novas políticas que funcionem corretamente
CREATE POLICY "Allow authenticated users to read indicador" 
ON public.indicador 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert indicador" 
ON public.indicador 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update indicador" 
ON public.indicador 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow authenticated users to delete indicador" 
ON public.indicador 
FOR DELETE 
USING (true);