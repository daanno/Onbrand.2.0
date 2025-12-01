-- Create brand_users table for user-brand-role mapping
CREATE TABLE IF NOT EXISTS public.brand_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'editor', 'reviewer', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, brand_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brand_users_user_id ON public.brand_users(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_users_brand_id ON public.brand_users(brand_id);

-- Enable RLS
ALTER TABLE public.brand_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own brand memberships
CREATE POLICY "Users can view their own brand memberships"
  ON public.brand_users FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Brand admins can manage users in their brand
CREATE POLICY "Brand admins can manage brand users"
  ON public.brand_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brand_users bu
      WHERE bu.user_id = auth.uid()
        AND bu.brand_id = brand_users.brand_id
        AND bu.role IN ('admin', 'owner')
    )
  );
