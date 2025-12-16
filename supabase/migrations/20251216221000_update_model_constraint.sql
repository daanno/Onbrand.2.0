-- Update the model constraint to include new model names
-- for Claude 4.5, GPT 5.2, and Gemini 3.1

-- Drop the old constraint and add a new one with more model options
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS valid_model;

ALTER TABLE public.conversations ADD CONSTRAINT valid_model CHECK (
  model IN (
    -- Legacy models (for backward compatibility)
    'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 
    'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku',
    -- New model IDs
    'claude-4.5', 'gpt-5.2', 'gemini-3.1',
    'gpt-4o', 'gpt-4o-mini', 'gemini-pro'
  )
);
