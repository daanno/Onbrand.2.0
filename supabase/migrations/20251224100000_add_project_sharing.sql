-- Add visibility column to projects for team sharing
-- Allows project owners to share entire projects with their brand team

ALTER TABLE public.projects 
ADD COLUMN visibility TEXT DEFAULT 'private' 
CHECK (visibility IN ('private', 'shared'));

-- Create index for efficient filtering
CREATE INDEX idx_projects_visibility ON public.projects(visibility);

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view projects in their brand" ON public.projects;

-- Create new SELECT policy with visibility logic
-- Users can see:
-- 1. Their own projects (any visibility)
-- 2. Shared projects from their brand
CREATE POLICY "Users can view own and shared brand projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    -- User's own projects (private or shared)
    (user_id = auth.uid())
    OR
    -- Shared projects from their brand
    (
      visibility = 'shared'
      AND brand_id IN (
        SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
      )
    )
  );

-- Add comment for documentation
COMMENT ON COLUMN public.projects.visibility IS 'private = only owner can see, shared = all brand users can see';

