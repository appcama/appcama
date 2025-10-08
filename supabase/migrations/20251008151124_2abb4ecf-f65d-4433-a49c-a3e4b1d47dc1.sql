-- Políticas RLS para o bucket logos-entidades

-- Permitir que usuários autenticados façam upload de logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos-entidades');

-- Permitir leitura pública das logos
CREATE POLICY "Public can read logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos-entidades');

-- Permitir que usuários autenticados atualizem logos
CREATE POLICY "Authenticated users can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'logos-entidades')
WITH CHECK (bucket_id = 'logos-entidades');

-- Permitir que usuários autenticados deletem logos
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'logos-entidades');