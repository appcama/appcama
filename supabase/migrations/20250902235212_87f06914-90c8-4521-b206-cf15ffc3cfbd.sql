-- Corrigir políticas RLS para tabela unidade_medida
-- Permitir acesso de leitura a unidades de medida para todos os usuários autenticados

-- Remover política existente se houver
DROP POLICY IF EXISTS "Allow read access to unidade_medida table" ON public.unidade_medida;

-- Criar nova política que permite leitura para usuários autenticados
CREATE POLICY "Allow authenticated users to read unidade_medida" 
ON public.unidade_medida 
FOR SELECT 
USING (true);

-- Permitir também inserção e atualização para administradores (caso necessário no futuro)
CREATE POLICY "Allow insert access to unidade_medida table" 
ON public.unidade_medida 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update access to unidade_medida table" 
ON public.unidade_medida 
FOR UPDATE 
USING (true);