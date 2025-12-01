-- Create brand_assets table for images, logos, and LoRA training data
CREATE TABLE IF NOT EXISTS public.brand_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Asset metadata
  name TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'image', 'font', 'color_palette', 'training_image', 'other')),
  file_url TEXT NOT NULL, -- Storage URL
  file_type TEXT, -- 'png', 'jpg', 'svg', 'ttf', etc.
  file_size INTEGER,
  
  -- Dimensions (for images)
  width INTEGER,
  height INTEGER,
  
  -- Training metadata (for LoRA)
  is_training_data BOOLEAN DEFAULT false,
  training_caption TEXT, -- Caption/prompt for training
  training_metadata JSONB, -- Additional training parameters
  
  -- Tags for organization
  tags TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_assets_brand_id ON public.brand_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_type ON public.brand_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_brand_assets_training ON public.brand_assets(is_training_data);
CREATE INDEX IF NOT EXISTS idx_brand_assets_tags ON public.brand_assets USING gin(tags);

-- Enable RLS
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view assets from their brands"
  ON public.brand_assets FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload assets to their brands"
  ON public.brand_assets FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own assets"
  ON public.brand_assets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete brand assets"
  ON public.brand_assets FOR DELETE
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );
