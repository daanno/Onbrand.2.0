-- Create brands table for multi-brand support
CREATE TABLE IF NOT EXISTS public.brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  primary_color TEXT DEFAULT '#000000',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default brands (ACME and Globex as examples)
INSERT INTO public.brands (id, name, display_name, primary_color) VALUES
  ('acme', 'acme', 'Acme Labs', '#2563eb'),
  ('globex', 'globex', 'Globex Corp', '#7c3aed')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read brands
CREATE POLICY "Brands are viewable by everyone"
  ON public.brands FOR SELECT
  USING (true);

-- RLS Policy: Only service role can modify brands
CREATE POLICY "Brands are modifiable by service role only"
  ON public.brands FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
