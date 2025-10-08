-- Remover políticas antigas que exigem authenticated
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read logos" ON storage.objects;

-- Criar novas políticas permitindo acesso anon (já que a autenticação é customizada)
CREATE POLICY "Anyone can upload logos"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'logos-entidades');

CREATE POLICY "Anyone can read logos"
ON storage.objects
FOR SELECT
TO anon, public
USING (bucket_id = 'logos-entidades');

CREATE POLICY "Anyone can update logos"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'logos-entidades')
WITH CHECK (bucket_id = 'logos-entidades');

CREATE POLICY "Anyone can delete logos"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'logos-entidades');