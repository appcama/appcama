
-- Create function to reset user password
CREATE OR REPLACE FUNCTION public.reset_user_password(user_id_param integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.usuario 
  SET 
    des_senha = '123456789',
    des_senha_validada = 'D',
    dat_atualizacao = now(),
    id_usuario_atualizador = 1 -- Replace with actual logged user id
  WHERE id_usuario = user_id_param;
  
  RETURN FOUND;
END;
$$;

-- Update RLS policies for usuario table to allow admin operations
DROP POLICY IF EXISTS "Allow read access to usuario table" ON public.usuario;
CREATE POLICY "Allow read access to usuario table" 
  ON public.usuario 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow insert access to usuario table" ON public.usuario;
CREATE POLICY "Allow insert access to usuario table" 
  ON public.usuario 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to usuario table" ON public.usuario;
CREATE POLICY "Allow update access to usuario table" 
  ON public.usuario 
  FOR UPDATE 
  USING (true);
