
-- Adicionar política de UPDATE para a tabela tipo_residuo
CREATE POLICY "Allow update access to tipo_residuo table" 
  ON public.tipo_residuo 
  FOR UPDATE 
  USING (true);
