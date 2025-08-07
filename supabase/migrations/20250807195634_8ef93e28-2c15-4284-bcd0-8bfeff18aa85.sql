
-- Create table for user validation tokens
CREATE TABLE public.usuario_token (
  id_token SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL,
  token VARCHAR(8) NOT NULL,
  tipo_token VARCHAR(50) NOT NULL DEFAULT 'VALIDACAO_INICIAL',
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_expiracao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  dat_criacao TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  id_usuario_criador INTEGER NOT NULL DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.usuario_token ENABLE ROW LEVEL SECURITY;

-- Create policy for reading tokens
CREATE POLICY "Allow read access to usuario_token table" 
  ON public.usuario_token 
  FOR SELECT 
  USING (true);

-- Create policy for inserting tokens
CREATE POLICY "Allow insert access to usuario_token table" 
  ON public.usuario_token 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy for updating tokens
CREATE POLICY "Allow update access to usuario_token table" 
  ON public.usuario_token 
  FOR UPDATE 
  USING (true);

-- Function to generate and save validation token
CREATE OR REPLACE FUNCTION public.generate_user_token(user_id_param integer)
RETURNS VARCHAR(8)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token VARCHAR(8);
BEGIN
  -- Generate 6-digit random token
  new_token := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Insert token into table
  INSERT INTO public.usuario_token (
    id_usuario, 
    token, 
    tipo_token,
    data_expiracao,
    id_usuario_criador
  ) VALUES (
    user_id_param, 
    new_token, 
    'VALIDACAO_INICIAL',
    now() + INTERVAL '24 hours',
    1
  );
  
  RETURN new_token;
END;
$$;

-- Function to validate token
CREATE OR REPLACE FUNCTION public.validate_user_token(user_id_param integer, token_param varchar)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_valid boolean := false;
BEGIN
  -- Check if token exists, is not used, and not expired
  UPDATE public.usuario_token 
  SET usado = true
  WHERE id_usuario = user_id_param 
    AND token = token_param 
    AND tipo_token = 'VALIDACAO_INICIAL'
    AND usado = false 
    AND data_expiracao > now();
  
  token_valid := FOUND;
  
  RETURN token_valid;
END;
$$;
