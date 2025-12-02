-- Create conversations and messages tables for AI chat storage

-- Conversations table: stores chat sessions
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gpt-4',
  system_prompt TEXT,
  settings JSONB DEFAULT '{
    "temperature": 0.7,
    "max_tokens": 2000,
    "top_p": 1.0
  }'::jsonb,
  total_tokens_used INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10, 6) DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_model CHECK (
    model IN ('gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku')
  ),
  CONSTRAINT positive_tokens CHECK (total_tokens_used >= 0),
  CONSTRAINT positive_cost CHECK (total_cost_usd >= 0)
);

-- Messages table: stores individual messages in conversations
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_role CHECK (role IN ('system', 'user', 'assistant', 'function')),
  CONSTRAINT positive_message_tokens CHECK (tokens_used >= 0),
  CONSTRAINT non_empty_content CHECK (LENGTH(content) > 0)
);

-- Indexes for performance
CREATE INDEX idx_conversations_brand_id ON public.conversations(brand_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_brand_user ON public.conversations(brand_id, user_id);
CREATE INDEX idx_conversations_archived ON public.conversations(archived) WHERE NOT archived;
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_role ON public.messages(role);

-- Trigger to update conversation's updated_at and last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    updated_at = NOW(),
    last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

-- Trigger to update conversation's total tokens when message is added
CREATE OR REPLACE FUNCTION public.update_conversation_tokens()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET total_tokens_used = total_tokens_used + NEW.tokens_used
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_tokens
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_tokens();

-- Function to create a conversation with quota check
CREATE OR REPLACE FUNCTION public.create_conversation_with_quota_check(
  p_brand_id TEXT,
  p_user_id UUID,
  p_title TEXT,
  p_model TEXT DEFAULT 'gpt-4',
  p_system_prompt TEXT DEFAULT NULL,
  p_settings JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Create the conversation
  INSERT INTO public.conversations (
    brand_id,
    user_id,
    title,
    model,
    system_prompt,
    settings
  ) VALUES (
    p_brand_id,
    p_user_id,
    p_title,
    p_model,
    p_system_prompt,
    COALESCE(p_settings, '{
      "temperature": 0.7,
      "max_tokens": 2000,
      "top_p": 1.0
    }'::jsonb)
  ) RETURNING id INTO v_conversation_id;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a message and deduct quota
CREATE OR REPLACE FUNCTION public.add_message_with_quota(
  p_conversation_id UUID,
  p_role TEXT,
  p_content TEXT,
  p_tokens_used INTEGER,
  p_model TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_brand_id TEXT;
  v_quota_available BOOLEAN;
BEGIN
  -- Get brand_id from conversation
  SELECT brand_id INTO v_brand_id
  FROM public.conversations
  WHERE id = p_conversation_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  -- Check and use quota (only for assistant messages)
  IF p_role = 'assistant' AND p_tokens_used > 0 THEN
    SELECT check_and_use_quota(v_brand_id, 'prompt_tokens', p_tokens_used)
    INTO v_quota_available;

    IF NOT v_quota_available THEN
      RAISE EXCEPTION 'Insufficient quota for brand %', v_brand_id;
    END IF;
  END IF;

  -- Insert the message
  INSERT INTO public.messages (
    conversation_id,
    role,
    content,
    tokens_used,
    model,
    metadata
  ) VALUES (
    p_conversation_id,
    p_role,
    p_content,
    p_tokens_used,
    p_model,
    p_metadata
  ) RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations from their brands
CREATE POLICY "Users can view their brand conversations"
  ON public.conversations FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid()
    )
  );

-- Users can create conversations for their brands
CREATE POLICY "Users can create conversations for their brands"
  ON public.conversations FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Users can update their own conversations in their brands
CREATE POLICY "Users can update their own conversations"
  ON public.conversations FOR UPDATE
  USING (
    user_id = auth.uid() AND
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid()
    )
  );

-- Only conversation owners can delete
CREATE POLICY "Users can delete their own conversations"
  ON public.conversations FOR DELETE
  USING (
    user_id = auth.uid() AND
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages from conversations in their brands
CREATE POLICY "Users can view messages from their brand conversations"
  ON public.messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE brand_id IN (
        SELECT brand_id FROM public.brand_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create messages in their brand conversations
CREATE POLICY "Users can create messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE brand_id IN (
        SELECT brand_id FROM public.brand_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update messages in their conversations
CREATE POLICY "Users can update messages in their conversations"
  ON public.messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE brand_id IN (
        SELECT brand_id FROM public.brand_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can delete messages in their conversations
CREATE POLICY "Users can delete messages in their conversations"
  ON public.messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE brand_id IN (
        SELECT brand_id FROM public.brand_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
