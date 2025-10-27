-- Tornar id_tipo_ponto_coleta opcional na tabela ponto_coleta
ALTER TABLE public.ponto_coleta 
ALTER COLUMN id_tipo_ponto_coleta DROP NOT NULL;