-- Add logo URL column to evento table
ALTER TABLE evento ADD COLUMN IF NOT EXISTS des_logo_url TEXT;

-- Create storage bucket for event logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos-eventos', 'logos-eventos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for event logo uploads
CREATE POLICY "Event logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'logos-eventos');

CREATE POLICY "Authenticated users can upload event logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'logos-eventos');

CREATE POLICY "Authenticated users can update event logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'logos-eventos');

CREATE POLICY "Authenticated users can delete event logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'logos-eventos');