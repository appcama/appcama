
CREATE OR REPLACE FUNCTION public.get_dashboard_data(
  p_data_inicial text,
  p_data_final text,
  p_entidade_id integer DEFAULT NULL,
  p_tipo_entidade_id integer DEFAULT NULL,
  p_evento_id integer DEFAULT NULL,
  p_usuario_ids integer[] DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  residuos_json json;
  indicadores_json json;
BEGIN
  -- Aggregate residuos by tipo_residuo
  SELECT json_agg(r) INTO residuos_json
  FROM (
    SELECT 
      tr.id_tipo_residuo,
      tr.des_tipo_residuo,
      SUM(cr.qtd_total) as total_quantidade,
      SUM(cr.qtd_total * cr.vlr_total) as total_valor
    FROM coleta_residuo cr
    INNER JOIN coleta c ON cr.id_coleta = c.id_coleta
    INNER JOIN residuo res ON cr.id_residuo = res.id_residuo
    INNER JOIN tipo_residuo tr ON res.id_tipo_residuo = tr.id_tipo_residuo
    WHERE c.dat_coleta >= p_data_inicial::date
      AND c.dat_coleta <= p_data_final::date
      AND c.des_status = 'A'
      AND cr.des_status = 'A'
      AND (p_entidade_id IS NULL OR c.id_entidade_geradora = p_entidade_id)
      AND (p_tipo_entidade_id IS NULL OR c.id_entidade_geradora IN (
        SELECT e.id_entidade FROM entidade e WHERE e.id_tipo_entidade = p_tipo_entidade_id AND e.des_status = 'A'
      ))
      AND (p_evento_id IS NULL OR c.id_evento = p_evento_id)
      AND (p_usuario_ids IS NULL OR c.id_usuario_criador = ANY(p_usuario_ids))
    GROUP BY tr.id_tipo_residuo, tr.des_tipo_residuo
  ) r;

  -- Aggregate indicators grouped by indicador + tipo_residuo
  SELECT json_agg(i) INTO indicadores_json
  FROM (
    SELECT 
      ind.id_indicador,
      ind.nom_indicador,
      um.des_unidade_medida,
      um.cod_unidade_medida,
      tr.des_tipo_residuo,
      SUM(cri.qtd_total) as total
    FROM coleta_residuo_indicador cri
    INNER JOIN coleta_residuo cr ON cri.id_coleta_residuo = cr.id_coleta_residuo
    INNER JOIN coleta c ON cr.id_coleta = c.id_coleta
    INNER JOIN residuo res ON cr.id_residuo = res.id_residuo
    INNER JOIN tipo_residuo tr ON res.id_tipo_residuo = tr.id_tipo_residuo
    INNER JOIN indicador ind ON cri.id_indicador = ind.id_indicador
    INNER JOIN unidade_medida um ON ind.id_unidade_medida = um.id_unidade_medida
    WHERE c.dat_coleta >= p_data_inicial::date
      AND c.dat_coleta <= p_data_final::date
      AND c.des_status = 'A'
      AND cr.des_status = 'A'
      AND (p_entidade_id IS NULL OR c.id_entidade_geradora = p_entidade_id)
      AND (p_tipo_entidade_id IS NULL OR c.id_entidade_geradora IN (
        SELECT e.id_entidade FROM entidade e WHERE e.id_tipo_entidade = p_tipo_entidade_id AND e.des_status = 'A'
      ))
      AND (p_evento_id IS NULL OR c.id_evento = p_evento_id)
      AND (p_usuario_ids IS NULL OR c.id_usuario_criador = ANY(p_usuario_ids))
    GROUP BY ind.id_indicador, ind.nom_indicador, um.des_unidade_medida, um.cod_unidade_medida, tr.des_tipo_residuo
  ) i;

  result := json_build_object(
    'residuos', COALESCE(residuos_json, '[]'::json),
    'indicadores', COALESCE(indicadores_json, '[]'::json)
  );

  RETURN result;
END;
$$;
