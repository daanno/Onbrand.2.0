-- Create lora_training_jobs table for tracking model training
CREATE TABLE IF NOT EXISTS public.lora_training_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Job metadata
  name TEXT NOT NULL,
  description TEXT,
  
  -- Training configuration
  model_type TEXT NOT NULL CHECK (model_type IN ('flux', 'sdxl', 'sd15', 'custom')),
  training_config JSONB NOT NULL, -- Steps, learning rate, etc.
  
  -- Training data
  training_asset_ids UUID[], -- References to brand_assets
  training_images_count INTEGER DEFAULT 0,
  
  -- Job status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'training', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0, -- 0-100
  
  -- Results
  model_url TEXT, -- URL to trained LoRA weights
  sample_images_urls TEXT[], -- Generated sample images
  training_logs TEXT,
  error_message TEXT,
  
  -- Replicate/training provider metadata
  provider TEXT DEFAULT 'replicate', -- 'replicate', 'runpod', 'custom'
  provider_job_id TEXT, -- External job ID for tracking
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Cost tracking
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lora_jobs_brand_id ON public.lora_training_jobs(brand_id);
CREATE INDEX IF NOT EXISTS idx_lora_jobs_status ON public.lora_training_jobs(status);
CREATE INDEX IF NOT EXISTS idx_lora_jobs_user_id ON public.lora_training_jobs(user_id);

-- Enable RLS
ALTER TABLE public.lora_training_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view training jobs from their brands"
  ON public.lora_training_jobs FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create training jobs for their brands"
  ON public.lora_training_jobs FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own training jobs"
  ON public.lora_training_jobs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete brand training jobs"
  ON public.lora_training_jobs FOR DELETE
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );
