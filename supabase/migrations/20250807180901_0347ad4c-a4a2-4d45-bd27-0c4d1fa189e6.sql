
-- Add des_status field to tipo_entidade table
ALTER TABLE public.tipo_entidade 
ADD COLUMN IF NOT EXISTS des_status character(1) NOT NULL DEFAULT 'A';

-- Add des_locked field to tipo_entidade table if it doesn't exist
ALTER TABLE public.tipo_entidade 
ADD COLUMN IF NOT EXISTS des_locked character(1) NOT NULL DEFAULT 'D';

-- Create RLS policies for tipo_entidade table
DROP POLICY IF EXISTS "Allow insert access to tipo_entidade table" ON public.tipo_entidade;
CREATE POLICY "Allow insert access to tipo_entidade table" 
  ON public.tipo_entidade 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to tipo_entidade table" ON public.tipo_entidade;
CREATE POLICY "Allow update access to tipo_entidade table" 
  ON public.tipo_entidade 
  FOR UPDATE 
  USING (true);

-- Update existing records to have proper status
UPDATE public.tipo_entidade 
SET des_status = 'A', des_locked = 'D' 
WHERE des_status IS NULL OR des_locked IS NULL;
