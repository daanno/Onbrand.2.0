-- Add style_preset column to conversations table
-- Allows users to select writing styles (Normal, Learning, Concise, Explanatory, Formal)

ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS style_preset TEXT DEFAULT 'normal' 
CHECK (style_preset IN ('normal', 'learning', 'concise', 'explanatory', 'formal'));

CREATE INDEX IF NOT EXISTS idx_conversations_style_preset 
ON public.conversations(style_preset);

COMMENT ON COLUMN public.conversations.style_preset IS 
'Writing style for AI responses: normal, learning, concise, explanatory, formal';

