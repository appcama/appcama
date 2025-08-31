
-- Adicionar políticas RLS para permitir operações CRUD na tabela tipo_residuo__indicador
CREATE POLICY "Allow insert access to tipo_residuo__indicador table" 
  ON public.tipo_residuo__indicador 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update access to tipo_residuo__indicador table" 
  ON public.tipo_residuo__indicador 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete access to tipo_residuo__indicador table" 
  ON public.tipo_residuo__indicador 
  FOR DELETE 
  USING (true);
