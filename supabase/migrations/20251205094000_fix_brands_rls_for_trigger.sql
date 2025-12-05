-- Fix brands table RLS to allow trigger to insert new brands
-- The trigger runs with SECURITY_DEFINER but RLS still blocks it

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Brands are modifiable by service role only" ON public.brands;

-- New policy: Allow inserts for auto-brand creation
-- The trigger function runs as SECURITY DEFINER so it has elevated privileges
CREATE POLICY "Allow brand creation via trigger"
  ON public.brands FOR INSERT
  WITH CHECK (true);  -- Allow all inserts (trigger will handle validation)

-- New policy: Only authenticated users or service role can update brands
CREATE POLICY "Brands are updatable by admins"
  ON public.brands FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM public.brand_users bu
      WHERE bu.brand_id = brands.id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('owner', 'admin')
    )
  );

-- New policy: Only service role can delete brands
CREATE POLICY "Brands are deletable by service role only"
  ON public.brands FOR DELETE
  USING (auth.jwt()->>'role' = 'service_role');

-- Add comment
COMMENT ON TABLE public.brands IS 
'Multi-brand support with RLS. Brands can be created via trigger during signup. Only admins can update, only service role can delete.';
