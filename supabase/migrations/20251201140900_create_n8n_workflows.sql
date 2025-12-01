-- Create n8n_workflows table for brand-specific workflow tracking
CREATE TABLE IF NOT EXISTS public.n8n_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Workflow metadata
  workflow_id TEXT NOT NULL, -- n8n workflow ID
  workflow_name TEXT NOT NULL,
  description TEXT,
  
  -- Workflow configuration
  webhook_url TEXT, -- Webhook endpoint for triggering
  webhook_method TEXT DEFAULT 'POST' CHECK (webhook_method IN ('GET', 'POST', 'PUT', 'DELETE')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,
  
  -- Workflow type/category
  workflow_type TEXT CHECK (workflow_type IN ('content_generation', 'brand_analysis', 'social_posting', 'email_campaign', 'data_processing', 'custom')),
  
  -- Metadata
  tags TEXT[],
  config JSONB, -- Additional workflow configuration
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_brand_id ON public.n8n_workflows(brand_id);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_workflow_id ON public.n8n_workflows(workflow_id);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_type ON public.n8n_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_active ON public.n8n_workflows(is_active);

-- Enable RLS
ALTER TABLE public.n8n_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view workflows from their brands"
  ON public.n8n_workflows FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workflows for their brands"
  ON public.n8n_workflows FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own workflows"
  ON public.n8n_workflows FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete brand workflows"
  ON public.n8n_workflows FOR DELETE
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Create workflow execution logs table
CREATE TABLE IF NOT EXISTS public.n8n_workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES public.n8n_workflows(id) ON DELETE CASCADE,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  
  -- Execution metadata
  n8n_execution_id TEXT, -- n8n's execution ID
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'success', 'error', 'waiting', 'canceled')),
  
  -- Execution data
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER, -- Execution duration in milliseconds
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_n8n_executions_workflow_id ON public.n8n_workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_brand_id ON public.n8n_workflow_executions(brand_id);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_status ON public.n8n_workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_started_at ON public.n8n_workflow_executions(started_at DESC);

-- Enable RLS
ALTER TABLE public.n8n_workflow_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view executions from their brands"
  ON public.n8n_workflow_executions FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert executions"
  ON public.n8n_workflow_executions FOR INSERT
  WITH CHECK (true); -- n8n webhooks will use service role
