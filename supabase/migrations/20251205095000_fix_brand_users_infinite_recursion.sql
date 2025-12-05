-- Fix infinite recursion in brand_users RLS policies
-- The "Brand admins can view brand users" policy was querying brand_users from within brand_users

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own brand memberships" ON public.brand_users;
DROP POLICY IF EXISTS "Users can insert their own brand memberships" ON public.brand_users;
DROP POLICY IF EXISTS "Brand admins can view brand users" ON public.brand_users;
DROP POLICY IF EXISTS "Brand admins can manage brand users" ON public.brand_users;
DROP POLICY IF EXISTS "Brand owners can delete brand users" ON public.brand_users;

-- Simple policy: Users can view their own brand memberships
CREATE POLICY "Users can view own memberships"
  ON public.brand_users FOR SELECT
  USING (auth.uid() = user_id);

-- Simple policy: Users can insert their own brand memberships (needed for trigger)
CREATE POLICY "Users can insert own memberships"
  ON public.brand_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role has full access"
  ON public.brand_users FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Add comment
COMMENT ON TABLE public.brand_users IS 
'User-brand-role mapping with simplified RLS. Users can only view/insert their own memberships. Service role has full access for admin operations.';
