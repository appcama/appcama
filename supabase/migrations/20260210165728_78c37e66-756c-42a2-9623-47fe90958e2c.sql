-- Adicionar coluna des_custo na tabela coleta
ALTER TABLE public.coleta ADD COLUMN des_custo char(1) NOT NULL DEFAULT 'D';

-- Adicionar coluna vlr_custo na tabela coleta_residuo
ALTER TABLE public.coleta_residuo ADD COLUMN vlr_custo numeric(10,2) NULL;