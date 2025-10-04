-- Adicionar campo id_certificado na tabela coleta para vincular coletas a certificados
ALTER TABLE coleta 
ADD COLUMN id_certificado INTEGER REFERENCES certificado(id_certificado);

-- Criar índice para melhorar performance nas consultas
CREATE INDEX idx_coleta_certificado ON coleta(id_certificado);

-- Comentário explicativo
COMMENT ON COLUMN coleta.id_certificado IS 'Referência ao certificado gerado a partir desta coleta';