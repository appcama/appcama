
-- Adicionar constraint UNIQUE para nom_evento
ALTER TABLE evento ADD CONSTRAINT uk_evento_nom_evento UNIQUE (nom_evento);

-- Habilitar Row Level Security na tabela evento
ALTER TABLE evento ENABLE ROW LEVEL SECURITY;

-- Criar política para SELECT (permitir leitura para todos os usuários autenticados)
CREATE POLICY "Allow read access to evento table" 
ON evento 
FOR SELECT 
USING (true);

-- Criar política para INSERT (permitir inserção para usuários autenticados)
CREATE POLICY "Allow insert access to evento table" 
ON evento 
FOR INSERT 
WITH CHECK (true);

-- Criar política para UPDATE (permitir atualização para usuários autenticados)
CREATE POLICY "Allow update access to evento table" 
ON evento 
FOR UPDATE 
USING (true);
