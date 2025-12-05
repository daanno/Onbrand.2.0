-- Fix RLS policies for brand_users table to allow trigger inserts and user queries

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own brand memberships" ON public.brand_users;
DROP POLICY IF EXISTS "Brand admins can manage brand users" ON public.brand_users;

-- Policy 1: Users can view their own brand memberships
CREATE POLICY "Users can view their own brand memberships"
  ON public.brand_users FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Allow authenticated users to insert their own brand memberships
-- This is needed for the trigger to work when creating new users
CREATE POLICY "Users can insert their own brand memberships"
  ON public.brand_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Brand admins and owners can view all users in their brands
CREATE POLICY "Brand admins can view brand users"
  ON public.brand_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brand_users bu
      WHERE bu.user_id = auth.uid()
        AND bu.brand_id = brand_users.brand_id
        AND bu.role IN ('admin', 'owner')
    )
  );

-- Policy 4: Brand admins and owners can manage users in their brand
CREATE POLICY "Brand admins can manage brand users"
  ON public.brand_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.brand_users bu
      WHERE bu.user_id = auth.uid()
        AND bu.brand_id = brand_users.brand_id
        AND bu.role IN ('admin', 'owner')
    )
  );

-- Policy 5: Brand owners can delete users from their brand
CREATE POLICY "Brand owners can delete brand users"
  ON public.brand_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.brand_users bu
      WHERE bu.user_id = auth.uid()
        AND bu.brand_id = brand_users.brand_id
        AND bu.role = 'owner'
    )
  );

-- Add comment
COMMENT ON TABLE public.brand_users IS 
'User-brand-role mapping with RLS policies. Users can view and insert their own memberships. Admins/owners can manage their brand users.';
