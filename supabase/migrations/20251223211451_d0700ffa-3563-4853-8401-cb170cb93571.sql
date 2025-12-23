-- Adicionar campo de visibilidade na tabela evento
ALTER TABLE evento 
ADD COLUMN des_visibilidade CHAR(1) NOT NULL DEFAULT 'R';

-- Criar tabela de controle de acesso para eventos privados
CREATE TABLE evento_entidade (
  id_evento_entidade SERIAL PRIMARY KEY,
  id_evento INTEGER NOT NULL REFERENCES evento(id_evento) ON DELETE CASCADE,
  id_entidade INTEGER NOT NULL REFERENCES entidade(id_entidade) ON DELETE CASCADE,
  dat_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
  id_usuario_criador INTEGER NOT NULL REFERENCES usuario(id_usuario),
  UNIQUE(id_evento, id_entidade)
);

-- Habilitar RLS na tabela evento_entidade
ALTER TABLE evento_entidade ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para evento_entidade
CREATE POLICY "Allow authenticated users to read evento_entidade"
ON evento_entidade FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to insert evento_entidade"
ON evento_entidade FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update evento_entidade"
ON evento_entidade FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated users to delete evento_entidade"
ON evento_entidade FOR DELETE
USING (true);

-- Comentários para documentação
COMMENT ON COLUMN evento.des_visibilidade IS 'P = Público, R = Privado (Restrito)';
COMMENT ON TABLE evento_entidade IS 'Controle de acesso para eventos privados - máximo 15 entidades por evento';