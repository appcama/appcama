
-- Inserir todas as funcionalidades necessárias
INSERT INTO funcionalidade (nom_funcionalidade, id_usuario_criador, dat_criacao) VALUES
('Dashboard', 1, NOW()),
('Entidades', 1, NOW()),
('Pontos de Coleta', 1, NOW()),
('Eventos de Coleta', 1, NOW()),
('Tipos de Entidades', 1, NOW()),
('Tipos de Resíduos', 1, NOW()),
('Perfis', 1, NOW()),
('Usuários', 1, NOW()),
('Funcionalidades', 1, NOW()),
('Geradores de Resíduos', 1, NOW()),
('Recebimento de Resíduos', 1, NOW()),
('Ecoindicadores', 1, NOW()),
('Relatórios', 1, NOW()),
('Reciclômetro', 1, NOW()),
('Configurações', 1, NOW()),
('Ajuda', 1, NOW())
ON CONFLICT (nom_funcionalidade) DO NOTHING;

-- Vincular todas as funcionalidades ao perfil Administrador (assumindo que seja o ID 1)
-- Primeiro, vamos verificar se existe um perfil com nome 'Administrador' ou similar
INSERT INTO perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 
    p.id_perfil,
    f.id_funcionalidade
FROM perfil p
CROSS JOIN funcionalidade f
WHERE UPPER(p.nom_perfil) LIKE '%ADMIN%' 
   OR UPPER(p.nom_perfil) LIKE '%ADMINISTRADOR%'
ON CONFLICT (id_perfil, id_funcionalidade) DO NOTHING;

-- Se não encontrou perfil admin, vamos vincular ao perfil ID 1 (assumindo que seja admin)
INSERT INTO perfil__funcionalidade (id_perfil, id_funcionalidade)
SELECT 
    1 as id_perfil,
    f.id_funcionalidade
FROM funcionalidade f
WHERE NOT EXISTS (
    SELECT 1 FROM perfil__funcionalidade pf 
    WHERE pf.id_perfil = 1 AND pf.id_funcionalidade = f.id_funcionalidade
);
