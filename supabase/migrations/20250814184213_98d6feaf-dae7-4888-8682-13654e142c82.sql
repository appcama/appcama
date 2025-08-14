
-- Criar política RLS para permitir UPDATE na tabela tipo_ponto_coleta
CREATE POLICY "Allow update access to tipo_ponto_coleta table" 
ON public.tipo_ponto_coleta 
FOR UPDATE 
USING (true);
