-- Fix RLS to allow trigger to insert brand_users during signup
-- The trigger runs before session is established, so auth.uid() is NULL

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own memberships" ON public.brand_users;
DROP POLICY IF EXISTS "Users can insert own memberships" ON public.brand_users;
DROP POLICY IF EXISTS "Service role has full access" ON public.brand_users;

-- Policy 1: Users can view their own brand memberships
CREATE POLICY "Users can view own memberships"
  ON public.brand_users FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Allow inserts from authenticated context OR trigger
-- This allows both user self-registration AND trigger-based assignment
CREATE POLICY "Allow brand user creation"
  ON public.brand_users FOR INSERT
  WITH CHECK (
    -- Either the user is creating their own record
    auth.uid() = user_id
    OR
    -- Or this is being called from a trigger/function (auth.uid() is NULL during trigger)
    auth.uid() IS NULL
  );

-- Policy 3: Service role can do everything
CREATE POLICY "Service role full access"
  ON public.brand_users FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Add helpful comment
COMMENT ON TABLE public.brand_users IS 
'User-brand-role mapping. Users can view their own memberships. Inserts allowed from user context or triggers (when auth.uid() is NULL).';
