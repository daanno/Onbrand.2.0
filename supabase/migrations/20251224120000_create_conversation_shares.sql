-- Create conversation_shares table for selective sharing with specific team members
-- This replaces the "share with all brand members" model with selective user sharing

CREATE TABLE public.conversation_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT, -- Optional message from the sharer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent duplicate shares
  UNIQUE(conversation_id, shared_with)
);

-- Indexes for performance
CREATE INDEX idx_conversation_shares_conversation ON public.conversation_shares(conversation_id);
CREATE INDEX idx_conversation_shares_shared_by ON public.conversation_shares(shared_by);
CREATE INDEX idx_conversation_shares_shared_with ON public.conversation_shares(shared_with);
CREATE INDEX idx_conversation_shares_brand ON public.conversation_shares(brand_id);
CREATE INDEX idx_conversation_shares_status ON public.conversation_shares(status);
CREATE INDEX idx_conversation_shares_pending ON public.conversation_shares(shared_with, status) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.conversation_shares ENABLE ROW LEVEL SECURITY;

-- Users can create shares for conversations they own
CREATE POLICY "Users can share their own conversations"
  ON public.conversation_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    shared_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

-- Users can view shares they created or received
CREATE POLICY "Users can view their shares"
  ON public.conversation_shares FOR SELECT
  TO authenticated
  USING (
    shared_by = auth.uid() OR shared_with = auth.uid()
  );

-- Users can update shares they received (accept/decline)
CREATE POLICY "Users can update shares they received"
  ON public.conversation_shares FOR UPDATE
  TO authenticated
  USING (shared_with = auth.uid())
  WITH CHECK (shared_with = auth.uid());

-- Users can delete shares they created
CREATE POLICY "Users can delete shares they created"
  ON public.conversation_shares FOR DELETE
  TO authenticated
  USING (shared_by = auth.uid());

-- Update conversations RLS to include shared conversations
DROP POLICY IF EXISTS "Users can view own and shared brand conversations" ON public.conversations;

CREATE POLICY "Users can view own and shared conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    -- User's own conversations
    (user_id = auth.uid())
    OR
    -- Conversations shared with user (accepted shares)
    EXISTS (
      SELECT 1 FROM public.conversation_shares cs
      WHERE cs.conversation_id = id
        AND cs.shared_with = auth.uid()
        AND cs.status = 'accepted'
    )
  );

-- Function to get pending share invitations count for a user
CREATE OR REPLACE FUNCTION public.get_pending_share_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.conversation_shares 
    WHERE shared_with = user_uuid AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.conversation_shares IS 'Tracks selective sharing of conversations with specific team members';
COMMENT ON COLUMN public.conversation_shares.status IS 'pending = awaiting response, accepted = user can view, declined = user rejected';

