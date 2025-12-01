-- Create content table as an example of brand-isolated data
CREATE TABLE IF NOT EXISTS public.content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_brand_id ON public.content(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_user_id ON public.content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON public.content(status);

-- Enable RLS
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view content from their brands
CREATE POLICY "Users can view content from their brands"
  ON public.content FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can create content for their brands
CREATE POLICY "Users can create content for their brands"
  ON public.content FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update their own content
CREATE POLICY "Users can update their own content"
  ON public.content FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policy: Admins can delete content in their brand
CREATE POLICY "Admins can delete brand content"
  ON public.content FOR DELETE
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );
