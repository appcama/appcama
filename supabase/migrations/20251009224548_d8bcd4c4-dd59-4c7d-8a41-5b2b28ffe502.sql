-- Add latitude and longitude columns to entidade table
ALTER TABLE public.entidade 
ADD COLUMN num_latitude NUMERIC(10, 8),
ADD COLUMN num_longitude NUMERIC(11, 8);

-- Add comments to columns
COMMENT ON COLUMN public.entidade.num_latitude IS 'Latitude da localização da entidade';
COMMENT ON COLUMN public.entidade.num_longitude IS 'Longitude da localização da entidade';