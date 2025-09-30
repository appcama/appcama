-- Expandir tabela certificado com novos campos
ALTER TABLE public.certificado 
ADD COLUMN IF NOT EXISTS dat_periodo_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS dat_periodo_fim DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS num_cpf_cnpj_gerador CHARACTER(18) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS des_status CHARACTER(1) NOT NULL DEFAULT 'A',
ADD COLUMN IF NOT EXISTS vlr_total_certificado NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS qtd_total_certificado NUMERIC(15,3),
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS des_locked CHARACTER(1) NOT NULL DEFAULT 'D';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_certificado_cod_validador ON public.certificado(cod_validador);
CREATE INDEX IF NOT EXISTS idx_certificado_cpf_cnpj ON public.certificado(num_cpf_cnpj_gerador);
CREATE INDEX IF NOT EXISTS idx_certificado_entidade ON public.certificado(id_entidade);
CREATE INDEX IF NOT EXISTS idx_certificado_periodo ON public.certificado(dat_periodo_inicio, dat_periodo_fim);

-- Criar tabela certificado_residuo para detalhamento
CREATE TABLE IF NOT EXISTS public.certificado_residuo (
  id_certificado_residuo SERIAL PRIMARY KEY,
  id_certificado INTEGER NOT NULL,
  id_tipo_residuo INTEGER NOT NULL,
  nom_residuo VARCHAR(255) NOT NULL,
  qtd_total NUMERIC(15,3) NOT NULL DEFAULT 0,
  vlr_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  dat_criacao TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_certificado_residuo_certificado 
    FOREIGN KEY (id_certificado) 
    REFERENCES public.certificado(id_certificado) 
    ON DELETE CASCADE
);

-- Criar índice na tabela certificado_residuo
CREATE INDEX IF NOT EXISTS idx_certificado_residuo_certificado 
  ON public.certificado_residuo(id_certificado);

-- Criar tabela certificado_log para auditoria
CREATE TABLE IF NOT EXISTS public.certificado_log (
  id_log SERIAL PRIMARY KEY,
  id_certificado INTEGER NOT NULL,
  des_acao VARCHAR(50) NOT NULL,
  des_observacao TEXT,
  id_usuario INTEGER NOT NULL,
  dat_log TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_certificado_log_certificado 
    FOREIGN KEY (id_certificado) 
    REFERENCES public.certificado(id_certificado) 
    ON DELETE CASCADE
);

-- Criar índice na tabela certificado_log
CREATE INDEX IF NOT EXISTS idx_certificado_log_certificado 
  ON public.certificado_log(id_certificado);
CREATE INDEX IF NOT EXISTS idx_certificado_log_data 
  ON public.certificado_log(dat_log DESC);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.certificado_residuo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificado_log ENABLE ROW LEVEL SECURITY;

-- Policies para certificado_residuo
CREATE POLICY "Allow authenticated users to read certificado_residuo"
  ON public.certificado_residuo
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert certificado_residuo"
  ON public.certificado_residuo
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update certificado_residuo"
  ON public.certificado_residuo
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated users to delete certificado_residuo"
  ON public.certificado_residuo
  FOR DELETE
  USING (true);

-- Policies para certificado_log
CREATE POLICY "Allow authenticated users to read certificado_log"
  ON public.certificado_log
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert certificado_log"
  ON public.certificado_log
  FOR INSERT
  WITH CHECK (true);