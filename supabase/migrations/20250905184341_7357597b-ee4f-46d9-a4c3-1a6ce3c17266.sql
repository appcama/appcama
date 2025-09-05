-- Melhorar a função calculate_and_insert_indicators para evitar duplicações e adicionar logs
CREATE OR REPLACE FUNCTION public.calculate_and_insert_indicators(p_id_coleta integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  deleted_count INTEGER;
  inserted_count INTEGER;
BEGIN
  -- Log início da operação
  RAISE NOTICE 'Iniciando cálculo de indicadores para coleta %', p_id_coleta;
  
  -- Deletar indicadores existentes da coleta de forma mais específica
  -- Usar uma transação implícita para garantir atomicidade
  DELETE FROM coleta_residuo_indicador 
  WHERE id_coleta_residuo IN (
    SELECT cr.id_coleta_residuo 
    FROM coleta_residuo cr
    WHERE cr.id_coleta = p_id_coleta
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deletados % indicadores existentes para coleta %', deleted_count, p_id_coleta;
  
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
    AND i.des_status = 'A'
    AND tri.qtd_referencia IS NOT NULL
    AND tri.qtd_referencia > 0;
    
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Inseridos % novos indicadores para coleta %', inserted_count, p_id_coleta;
  
  -- Verificar se houve inserções
  IF inserted_count = 0 THEN
    RAISE NOTICE 'ATENÇÃO: Nenhum indicador foi inserido para a coleta %. Verifique se existem tipo_residuo__indicador configurados.', p_id_coleta;
  END IF;
  
  RAISE NOTICE 'Cálculo de indicadores concluído para coleta %', p_id_coleta;
END;
$function$