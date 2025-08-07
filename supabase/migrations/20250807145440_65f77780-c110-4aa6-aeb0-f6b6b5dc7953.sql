-- Add UPDATE policy for entidade table
CREATE POLICY "Allow update access to entidade table" 
ON entidade 
FOR UPDATE 
USING (true);