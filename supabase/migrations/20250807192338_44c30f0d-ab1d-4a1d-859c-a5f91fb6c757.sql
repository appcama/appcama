
-- Create RLS policies for perfil table
ALTER TABLE public.perfil ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles
DROP POLICY IF EXISTS "Allow read access to perfil table" ON public.perfil;
CREATE POLICY "Allow read access to perfil table" 
  ON public.perfil 
  FOR SELECT 
  USING (true);

-- Allow users to insert profiles
DROP POLICY IF EXISTS "Allow insert access to perfil table" ON public.perfil;
CREATE POLICY "Allow insert access to perfil table" 
  ON public.perfil 
  FOR INSERT 
  WITH CHECK (true);

-- Allow users to update profiles
DROP POLICY IF EXISTS "Allow update access to perfil table" ON public.perfil;
CREATE POLICY "Allow update access to perfil table" 
  ON public.perfil 
  FOR UPDATE 
  USING (true);
