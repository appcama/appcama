-- Permitir que o campo id_ponto_coleta seja opcional na tabela coleta
ALTER TABLE public.coleta 
ALTER COLUMN id_ponto_coleta DROP NOT NULL;