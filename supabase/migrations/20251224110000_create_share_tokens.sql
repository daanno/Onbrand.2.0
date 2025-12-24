-- Create share_tokens table for public sharing via unique links
-- This enables sharing conversations and projects with anyone (not just brand members)

-- Enable pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Use multiple UUIDs concatenated for a longer, more secure token
  token TEXT UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  
  -- What's being shared
  resource_type TEXT NOT NULL CHECK (resource_type IN ('conversation', 'project')),
  resource_id UUID NOT NULL,
  
  -- Sharing settings
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE,
  password_hash TEXT, -- Optional password protection (bcrypt hash)
  view_count INTEGER DEFAULT 0,
  max_views INTEGER, -- Optional view limit (null = unlimited)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_share_tokens_token ON public.share_tokens(token);
CREATE INDEX idx_share_tokens_resource ON public.share_tokens(resource_type, resource_id);
CREATE INDEX idx_share_tokens_brand ON public.share_tokens(brand_id);
CREATE INDEX idx_share_tokens_created_by ON public.share_tokens(created_by);
CREATE INDEX idx_share_tokens_expires ON public.share_tokens(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can create tokens for their own resources
CREATE POLICY "Users can create share tokens for own resources"
  ON public.share_tokens FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Users can view their own share tokens
CREATE POLICY "Users can view their own share tokens"
  ON public.share_tokens FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Users can update their own share tokens
CREATE POLICY "Users can update their own share tokens"
  ON public.share_tokens FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can delete their own share tokens
CREATE POLICY "Users can delete their own share tokens"
  ON public.share_tokens FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Service role can access all tokens (for validation)
CREATE POLICY "Service role full access to share tokens"
  ON public.share_tokens FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to validate a share token
CREATE OR REPLACE FUNCTION public.validate_share_token(token_input TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  resource_type TEXT,
  resource_id UUID,
  brand_id TEXT,
  requires_password BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      -- Token exists
      WHEN st.id IS NULL THEN FALSE
      -- Token hasn't expired
      WHEN st.expires_at IS NOT NULL AND st.expires_at < NOW() THEN FALSE
      -- View limit not exceeded
      WHEN st.max_views IS NOT NULL AND st.view_count >= st.max_views THEN FALSE
      ELSE TRUE
    END as is_valid,
    st.resource_type,
    st.resource_id,
    st.brand_id,
    (st.password_hash IS NOT NULL) as requires_password
  FROM public.share_tokens st
  WHERE st.token = token_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_share_token_view(token_input TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.share_tokens
  SET 
    view_count = view_count + 1,
    last_accessed_at = NOW()
  WHERE token = token_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.share_tokens IS 'Shareable public links for conversations and projects. Anyone with the token can access the resource (subject to expiry, password, view limits).';
COMMENT ON COLUMN public.share_tokens.token IS 'Unique random token used in share URLs (/s/{token})';
COMMENT ON COLUMN public.share_tokens.resource_type IS 'Type of resource being shared: conversation or project';
COMMENT ON COLUMN public.share_tokens.expires_at IS 'Optional expiration date. NULL = never expires';
COMMENT ON COLUMN public.share_tokens.password_hash IS 'Optional bcrypt hash for password protection. NULL = no password required';
COMMENT ON COLUMN public.share_tokens.max_views IS 'Optional view limit. NULL = unlimited views';

