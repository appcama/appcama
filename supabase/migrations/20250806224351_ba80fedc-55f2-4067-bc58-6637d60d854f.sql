-- Insert basic situation types
INSERT INTO tipo_situacao (id_tipo_situacao, des_tipo_situacao, id_usuario_criador, dat_criacao) VALUES
(1, 'Ativo', 1, now()),
(2, 'Inativo', 1, now()),
(3, 'Pendente', 1, now())
ON CONFLICT (id_tipo_situacao) DO NOTHING;