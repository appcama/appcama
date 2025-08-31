
-- Primeiro, vamos verificar se existe alguma foreign key constraint entre as tabelas
-- e criar as constraints necessárias se não existirem

-- Adicionar foreign key para coleta_residuo_indicador -> coleta_residuo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'coleta_residuo_indicador_id_coleta_residuo_fkey'
  ) THEN
    ALTER TABLE coleta_residuo_indicador 
    ADD CONSTRAINT coleta_residuo_indicador_id_coleta_residuo_fkey 
    FOREIGN KEY (id_coleta_residuo) REFERENCES coleta_residuo(id_coleta_residuo);
  END IF;
END $$;

-- Adicionar foreign key para coleta_residuo_indicador -> indicador
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'coleta_residuo_indicador_id_indicador_fkey'
  ) THEN
    ALTER TABLE coleta_residuo_indicador 
    ADD CONSTRAINT coleta_residuo_indicador_id_indicador_fkey 
    FOREIGN KEY (id_indicador) REFERENCES indicador(id_indicador);
  END IF;
END $$;

-- Adicionar foreign key para tipo_residuo__indicador -> tipo_residuo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tipo_residuo__indicador_id_tipo_residuo_fkey'
  ) THEN
    ALTER TABLE tipo_residuo__indicador 
    ADD CONSTRAINT tipo_residuo__indicador_id_tipo_residuo_fkey 
    FOREIGN KEY (id_tipo_residuo) REFERENCES tipo_residuo(id_tipo_residuo);
  END IF;
END $$;

-- Adicionar foreign key para tipo_residuo__indicador -> indicador
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tipo_residuo__indicador_id_indicador_fkey'
  ) THEN
    ALTER TABLE tipo_residuo__indicador 
    ADD CONSTRAINT tipo_residuo__indicador_id_indicador_fkey 
    FOREIGN KEY (id_indicador) REFERENCES indicador(id_indicador);
  END IF;
END $$;

-- Função para calcular e inserir indicadores automaticamente
CREATE OR REPLACE FUNCTION calculate_and_insert_indicators(p_id_coleta integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    (cr.qtd_total / 1000.0) * i.qtd_referencia as qtd_total_calculada
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
$$;

-- Trigger para calcular indicadores automaticamente após inserir/atualizar coleta_residuo
CREATE OR REPLACE FUNCTION trigger_calculate_indicators()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se for INSERT ou UPDATE, calcular indicadores
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM calculate_and_insert_indicators(NEW.id_coleta);
    RETURN NEW;
  -- Se for DELETE, também recalcular para a coleta
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM calculate_and_insert_indicators(OLD.id_coleta);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Criar o trigger se não existir
DROP TRIGGER IF EXISTS trigger_coleta_residuo_indicators ON coleta_residuo;
CREATE TRIGGER trigger_coleta_residuo_indicators
  AFTER INSERT OR UPDATE OR DELETE ON coleta_residuo
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_indicators();

-- Adicionar políticas RLS para coleta_residuo_indicador se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coleta_residuo_indicador' AND policyname = 'Allow read access to coleta_residuo_indicador table'
  ) THEN
    CREATE POLICY "Allow read access to coleta_residuo_indicador table" 
    ON coleta_residuo_indicador FOR SELECT 
    USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coleta_residuo_indicador' AND policyname = 'Allow insert access to coleta_residuo_indicador table'
  ) THEN
    CREATE POLICY "Allow insert access to coleta_residuo_indicador table" 
    ON coleta_residuo_indicador FOR INSERT 
    WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coleta_residuo_indicador' AND policyname = 'Allow update access to coleta_residuo_indicador table'
  ) THEN
    CREATE POLICY "Allow update access to coleta_residuo_indicador table" 
    ON coleta_residuo_indicador FOR UPDATE 
    USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coleta_residuo_indicador' AND policyname = 'Allow delete access to coleta_residuo_indicador table'
  ) THEN
    CREATE POLICY "Allow delete access to coleta_residuo_indicador table" 
    ON coleta_residuo_indicador FOR DELETE 
    USING (true);
  END IF;
END $$;

-- Habilitar RLS na tabela se não estiver habilitado
ALTER TABLE coleta_residuo_indicador ENABLE ROW LEVEL SECURITY;

-- Adicionar políticas RLS para tipo_residuo__indicador se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tipo_residuo__indicador') THEN
    CREATE POLICY "Allow read access to tipo_residuo__indicador table" 
    ON tipo_residuo__indicador FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Habilitar RLS na tabela tipo_residuo__indicador
ALTER TABLE tipo_residuo__indicador ENABLE ROW LEVEL SECURITY;
