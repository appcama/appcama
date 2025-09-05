-- Corrigir a função calculate_and_insert_indicators para usar qtd_referencia da tabela tipo_residuo__indicador
CREATE OR REPLACE FUNCTION public.calculate_and_insert_indicators(p_id_coleta integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Deletar indicadores existentes da coleta (em caso de edição)
  DELETE FROM coleta_residuo_indicador 
  WHERE id_coleta_residuo IN (
    SELECT id_coleta_residuo 
    FROM coleta_residuo 
    WHERE id_coleta = p_id_coleta
  );
  
  -- Inserir novos indicadores calculados
  INSERT INTO coleta_residuo_indicador (id_coleta_residuo, id_indicador, qtd_total)
  SELECT 
    cr.id_coleta_residuo,
    tri.id_indicador,
    (cr.qtd_total / 1000.0) * tri.qtd_referencia as qtd_total_calculada
  FROM coleta_residuo cr
  INNER JOIN residuo r ON cr.id_residuo = r.id_residuo
  INNER JOIN tipo_residuo__indicador tri ON r.id_tipo_residuo = tri.id_tipo_residuo
  INNER JOIN indicador i ON tri.id_indicador = i.id_indicador
  WHERE cr.id_coleta = p_id_coleta
    AND cr.des_status = 'A'
    AND i.des_status = 'A';
    
  -- Log da operação
  RAISE NOTICE 'Indicadores calculados para coleta %', p_id_coleta;
END;
$function$