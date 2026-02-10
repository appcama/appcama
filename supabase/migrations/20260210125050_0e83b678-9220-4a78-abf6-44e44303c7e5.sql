
-- Criar tabela tabela_precos
CREATE TABLE public.tabela_precos (
  id_tabela_precos SERIAL PRIMARY KEY,
  des_tabela_precos VARCHAR(255) NOT NULL,
  des_status CHAR(1) NOT NULL DEFAULT 'A',
  des_locked CHAR(1) NOT NULL DEFAULT 'D',
  id_usuario_criador INTEGER NOT NULL,
  dat_criacao TIMESTAMP NOT NULL DEFAULT now(),
  id_usuario_atualizador INTEGER,
  dat_atualizacao TIMESTAMP
);

-- Habilitar RLS
ALTER TABLE public.tabela_precos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read tabela_precos" ON public.tabela_precos FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert tabela_precos" ON public.tabela_precos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update tabela_precos" ON public.tabela_precos FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated users to delete tabela_precos" ON public.tabela_precos FOR DELETE USING (true);

-- Criar tabela tabela_precos_residuo
CREATE TABLE public.tabela_precos_residuo (
  id_tabela_preco INTEGER NOT NULL REFERENCES public.tabela_precos(id_tabela_precos) ON DELETE CASCADE,
  id_residuo INTEGER NOT NULL REFERENCES public.residuo(id_residuo),
  vlr_total NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (id_tabela_preco, id_residuo)
);

ALTER TABLE public.tabela_precos_residuo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read tabela_precos_residuo" ON public.tabela_precos_residuo FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert tabela_precos_residuo" ON public.tabela_precos_residuo FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update tabela_precos_residuo" ON public.tabela_precos_residuo FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated users to delete tabela_precos_residuo" ON public.tabela_precos_residuo FOR DELETE USING (true);

-- Adicionar colunas na tabela evento
ALTER TABLE public.evento ADD COLUMN id_tabela_precos INTEGER REFERENCES public.tabela_precos(id_tabela_precos);
ALTER TABLE public.evento ADD COLUMN des_tabela_preco_restrita CHAR(1) NOT NULL DEFAULT 'D';

-- Inserir funcionalidade
INSERT INTO public.funcionalidade (nom_funcionalidade, des_status, des_locked, id_usuario_criador, dat_criacao)
VALUES ('Tabela de Preços', 'A', 'D', 1, now());
