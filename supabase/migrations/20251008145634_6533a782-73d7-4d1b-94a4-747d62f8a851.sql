-- Criar bucket para logomarcas
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos-entidades', 'logos-entidades', true)
ON CONFLICT (id) DO NOTHING;

-- Adicionar coluna para armazenar URL da logo na tabela entidade
ALTER TABLE public.entidade 
ADD COLUMN IF NOT EXISTS des_logo_url TEXT;

-- Criar políticas de acesso ao bucket
CREATE POLICY "Logos são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos-entidades');

CREATE POLICY "Usuários autenticados podem fazer upload de logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos-entidades' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logos-entidades' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'logos-entidades' AND auth.role() = 'authenticated');