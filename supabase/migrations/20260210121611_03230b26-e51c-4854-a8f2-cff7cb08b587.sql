
-- Adicionar coluna des_ponto_coleta na tabela evento
ALTER TABLE evento ADD COLUMN des_ponto_coleta character(1) NOT NULL DEFAULT 'D';

-- Criar tabela evento_ponto_coleta
CREATE TABLE evento_ponto_coleta (
  id_evento_ponto_coleta SERIAL PRIMARY KEY,
  id_evento INTEGER NOT NULL REFERENCES evento(id_evento),
  id_ponto_coleta INTEGER NOT NULL REFERENCES ponto_coleta(id_ponto_coleta),
  id_usuario_criador INTEGER NOT NULL,
  dat_criacao TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(id_evento, id_ponto_coleta)
);

ALTER TABLE evento_ponto_coleta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read evento_ponto_coleta" ON evento_ponto_coleta FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert evento_ponto_coleta" ON evento_ponto_coleta FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete evento_ponto_coleta" ON evento_ponto_coleta FOR DELETE USING (true);
