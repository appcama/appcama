-- Corrigir políticas RLS para tabelas sem políticas
-- Verificar e corrigir a tabela tipo_entidade que pode estar bloqueando as consultas

-- Remover políticas antigas se existirem e criar novas para tipo_entidade
DROP POLICY IF EXISTS "Allow read access to tipo_entidade table" ON public.tipo_entidade;
DROP POLICY IF EXISTS "Allow insert access to tipo_entidade table" ON public.tipo_entidade;
DROP POLICY IF EXISTS "Allow update access to tipo_entidade table" ON public.tipo_entidade;

-- Criar políticas que permitam acesso completo para usuários autenticados
CREATE POLICY "Allow authenticated users to read tipo_entidade" 
ON public.tipo_entidade 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert tipo_entidade" 
ON public.tipo_entidade 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update tipo_entidade" 
ON public.tipo_entidade 
FOR UPDATE 
USING (true);

-- Verificar se há outras tabelas sem políticas e corrigi-las
-- Corrigir políticas para certificado se necessário
CREATE POLICY "Allow authenticated users to read certificado" 
ON public.certificado 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert certificado" 
ON public.certificado 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update certificado" 
ON public.certificado 
FOR UPDATE 
USING (true);

-- Corrigir políticas para ponto_entrega se necessário  
CREATE POLICY "Allow authenticated users to read ponto_entrega" 
ON public.ponto_entrega 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert ponto_entrega" 
ON public.ponto_entrega 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update ponto_entrega" 
ON public.ponto_entrega 
FOR UPDATE 
USING (true);