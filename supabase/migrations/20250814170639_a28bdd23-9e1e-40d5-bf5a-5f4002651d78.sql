
-- Adicionar campo nome na tabela ponto_coleta
ALTER TABLE ponto_coleta 
ADD COLUMN nom_ponto_coleta VARCHAR(60) NOT NULL DEFAULT '';

-- Remover o valor padrão após adicionar a coluna
ALTER TABLE ponto_coleta 
ALTER COLUMN nom_ponto_coleta DROP DEFAULT;

-- Adicionar RLS policies para o campo nome se necessário
CREATE POLICY "Allow insert access to ponto_coleta table" 
ON ponto_coleta 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow read access to ponto_coleta table" 
ON ponto_coleta 
FOR SELECT 
USING (true);

CREATE POLICY "Allow update access to ponto_coleta table" 
ON ponto_coleta 
FOR UPDATE 
USING (true);

-- Habilitar RLS na tabela se ainda não estiver habilitado
ALTER TABLE ponto_coleta ENABLE ROW LEVEL SECURITY;
