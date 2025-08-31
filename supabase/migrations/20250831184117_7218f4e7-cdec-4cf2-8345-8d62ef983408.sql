
-- Verificar se precisamos de alguma configuração adicional nas tabelas de coleta
-- Vamos adicionar uma funcionalidade "Coletas" na tabela funcionalidade se não existir
INSERT INTO public.funcionalidade (nom_funcionalidade, des_status, des_locked, id_usuario_criador, dat_criacao)
SELECT 'Coletas', 'A', 'D', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.funcionalidade WHERE nom_funcionalidade = 'Coletas');

-- Garantir que as tabelas coleta e coleta_residuo tenham RLS habilitado
ALTER TABLE public.coleta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coleta_residuo ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para a tabela coleta
CREATE POLICY "Allow read access to coleta table" 
ON public.coleta 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert access to coleta table" 
ON public.coleta 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update access to coleta table" 
ON public.coleta 
FOR UPDATE 
USING (true);

-- Criar políticas RLS para a tabela coleta_residuo
CREATE POLICY "Allow read access to coleta_residuo table" 
ON public.coleta_residuo 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert access to coleta_residuo table" 
ON public.coleta_residuo 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update access to coleta_residuo table" 
ON public.coleta_residuo 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete access to coleta_residuo table" 
ON public.coleta_residuo 
FOR DELETE 
USING (true);
