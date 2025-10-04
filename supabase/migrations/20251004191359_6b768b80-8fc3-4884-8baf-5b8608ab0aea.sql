-- Permitir leitura pública de certificados ativos para validação
CREATE POLICY "Allow public read for active certificates"
ON public.certificado
FOR SELECT
USING (des_status = 'A' AND des_locked = 'D');

-- Permitir leitura pública dos resíduos de certificados ativos
CREATE POLICY "Allow public read for certificado_residuo"
ON public.certificado_residuo
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.certificado
    WHERE certificado.id_certificado = certificado_residuo.id_certificado
    AND certificado.des_status = 'A'
    AND certificado.des_locked = 'D'
  )
);

-- Permitir leitura pública das coletas associadas a certificados ativos
CREATE POLICY "Allow public read for coleta with certificate"
ON public.coleta
FOR SELECT
USING (
  id_certificado IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.certificado
    WHERE certificado.id_certificado = coleta.id_certificado
    AND certificado.des_status = 'A'
    AND certificado.des_locked = 'D'
  )
);

-- Permitir leitura pública da entidade associada ao certificado
CREATE POLICY "Allow public read for entidade with certificate"
ON public.entidade
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.certificado
    WHERE certificado.id_entidade = entidade.id_entidade
    AND certificado.des_status = 'A'
    AND certificado.des_locked = 'D'
  )
);